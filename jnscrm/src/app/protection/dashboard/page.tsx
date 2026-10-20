// src/app/protection/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { authService } from '@/services/auth.service';

// Modular Components Import
import Sidebar from '@/components/dashboard/Sidebar';
import PaneHeader from '@/components/dashboard/PaneHeader';
import OverviewTab from '@/components/dashboard/OverviewTab';
import PagesTab from '@/components/dashboard/PagesTab';
import LeadsTab from '@/components/dashboard/LeadsTab';
import EventsTab from '@/components/dashboard/EventsTab';
import AddEventTab from '@/components/dashboard/AddEventTab';
import RequestsTab from '@/components/dashboard/RequestsTab';
import UsersTab from '@/components/dashboard/UsersTab';
import AllBlogsTab from '@/components/dashboard/AllBlogsTab';
import AddBlogTab from '@/components/dashboard/AddBlogTab';
import BlogCategoriesTab from '@/components/dashboard/BlogCategoriesTab';
import { blogService } from '@/services/blogService';

const API_BASE_URL = '/backend';

interface RequestUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Submission {
  id: number;
  form_type: string;
  region: string;
  source_url: string;
  form_data: string | any;
  parsed_data: Record<string, any>;
  status: string;
  created_at: string;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
}

interface BlogItem {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  status: 'published' | 'draft' | 'trashed';
  category_id: number | null;
  category_name?: string;
  content: string;
  author_name: string;
  author_email: string;
  last_edited_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface PageItem {
  name: string;
  path: string;
  parentPage: string;
  isIndexed: boolean;
  status: string;
  created_at?: string | null;
}

interface EventItem {
  id: number;
  event_name: string;
  day_date: string;
  event_time: string;
  venue: string;
  cover_image: string | null;
  target_page: string;
  status: 'Live' | 'Coming Soon' | 'Past Event';
  created_at: string;
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('Loading...');
  const [userEmail, setUserEmail] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'all-pages' | 'requests' | 'users' | 'submissions' | 'all-blogs' | 'add-blog' | 'blog-categories' | 'all-events' | 'add-event'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isBlogsMenuOpen, setIsBlogsMenuOpen] = useState<boolean>(false);
  const [isEventsMenuOpen, setIsEventsMenuOpen] = useState<boolean>(false);

  const [requests, setRequests] = useState<RequestUser[]>([]);
  const [allUsers, setAllUsers] = useState<RequestUser[]>([]);
  const [approvedUsersCount, setApprovedUsersCount] = useState<number>(0);
  const [totalBlogsCount, setTotalBlogsCount] = useState<number>(0);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [totalPagesSub, setTotalPagesSub] = useState<number>(1);
  const [currentPageSub, setCurrentPageSub] = useState<number>(1);
  const [itemsPerPageSub, setItemsPerPageSub] = useState<number>(10);
  const [goToPageInputSub, setGoToPageInputSub] = useState<string>('1');
  const [isPerPageOpenSub, setIsPerPageOpenSub] = useState<boolean>(false);
  const perPageDropdownRefSub = useRef<HTMLDivElement>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const bulkDropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectOne = useCallback((id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  const isAllCurrentPageSelected = submissions.length > 0 && submissions.every(sub => selectedIds.includes(sub.id));

  const handleSelectAllCurrentPage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = submissions.map(sub => sub.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...allIds])));
    } else {
      const currentPageIds = submissions.map(sub => sub.id);
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  }, [submissions]);

  const handleSoftDeleteSubmission = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'trashed' })
      });
      if (!res.ok) throw new Error('Failed to trash lead');
      setSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: 'trashed' } : sub));
      setMessage({ text: 'Lead moved to trash successfully!', type: 'success' });
    } catch (err) {
      console.error("Error trashing lead:", err);
    }
  };

  const handleRecoverSubmission = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'read' })
      });
      if (!res.ok) throw new Error('Failed to recover lead');
      setSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: 'read' } : sub));
      setMessage({ text: 'Lead recovered successfully!', type: 'success' });
    } catch (err) {
      console.error("Error recovering lead:", err);
    }
  };

  const handlePermanentDeleteSubmission = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this lead?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete lead');
      setSubmissions(prev => prev.filter(sub => sub.id !== id));
      setTotalSubmissions(prev => prev - 1);
      setMessage({ text: 'Lead permanently deleted!', type: 'success' });
    } catch (err) {
      console.error("Error deleting lead:", err);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} leads?`)) {
        return; 
      }
    }

    let targetStatus = 'Read';
    if (action === 'unread') targetStatus = 'Unread';
    else if (action === 'trashed') targetStatus = 'Trashed';
    else if (action === 'recover') targetStatus = 'Read';

    const processingIds = [...selectedIds];
    
    if (action === 'delete') {
      setSubmissions(prev => prev.filter(sub => !processingIds.includes(sub.id)));
      setTotalSubmissions(prev => prev - processingIds.length);
      setMessage({ text: 'Selected leads permanently deleted!', type: 'success' });
    } else {
      setSubmissions(prev => {
        if (leadFilter !== 'All Type' && leadFilter.toLowerCase() !== targetStatus.toLowerCase()) {
          setTotalSubmissions(count => count - processingIds.length);
          return prev.filter(sub => !processingIds.includes(sub.id));
        }
        return prev.map(sub => processingIds.includes(sub.id) ? { ...sub, status: targetStatus } : sub);
      });
      setMessage({ text: `Selected leads successfully marked as ${targetStatus}!`, type: 'success' });
    }

    setSelectedIds([]);
    setIsBulkOpen(false);

    try {
      if (action === 'delete') {
        await Promise.all(processingIds.map(id => fetch(`${API_BASE_URL}/leads/${id}`, { method: 'DELETE', credentials: 'include' })));
      } else {
        await Promise.all(processingIds.map(id => fetch(`${API_BASE_URL}/leads/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: targetStatus })
        })));
      }
    } catch (err) {
      console.error("Error executing bulk action silently:", err);
    }
  };

  const [pagesList, setPagesList] = useState<PageItem[]>([]);
  const [pageSearchQuery, setPageSearchQuery] = useState<string>('');
  const [totalPagesPages, setTotalPagesPages] = useState<number>(1);
  const [totalFilteredPagesCount, setTotalFilteredPagesCount] = useState<number>(0);
  const [currentPagePages, setCurrentPagePages] = useState<number>(1);
  const [itemsPerPagePages, setItemsPerPagePages] = useState<number>(10);
  const [goToPageInputPages, setGoToPageInputPages] = useState<string>('1');
  const [isPerPageOpenPages, setIsPerPageOpenPages] = useState<boolean>(false);
  const perPageDropdownRefPages = useRef<HTMLDivElement>(null);

  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [eventSearchQuery, setEventSearchQuery] = useState<string>('');
  const [eventTableTab, setEventTableTab] = useState<'All' | 'Live' | 'Coming Soon' | 'Past Event'>('All');

  const [eventName, setEventName] = useState('');
  const [eventDayDate, setEventDayDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventCoverImage, setEventCoverImage] = useState('');
  const [eventTargetPage, setEventTargetPage] = useState('');
  const [eventStatus, setEventStatus] = useState<'Live' | 'Coming Soon' | 'Past Event'>('Live');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  
  const [isTargetPageDropdownOpen, setIsTargetPageDropdownOpen] = useState(false);
  const [targetPageSearchQuery, setTargetPageSearchQuery] = useState('');
  const targetPageDropdownRef = useRef<HTMLDivElement>(null);

  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [selectedBlogForEdit, setSelectedBlogForEdit] = useState<any | null>(null);

  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState('');
  const [blogCategoryId, setBlogCategoryId] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [hoveredUrl, setHoveredUrl] = useState<{ url: string; x: number; y: number } | null>(null);

  const [currentPageReq, setCurrentPageReq] = useState(1);
  const [itemsPerPageReq, setItemsPerPageReq] = useState(6);

  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [itemsPerPageUsers, setItemsPerPageUsers] = useState(6);

  const [selectedFormType, setSelectedFormType] = useState<string>('All Forms');
  const [isFormSelectorOpen, setIsFormSelectorOpen] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const formSelectorRef = useRef<HTMLDivElement>(null);

  const [formTypesList, setFormTypesList] = useState<string[]>([]);
  const [leadFilter, setLeadFilter] = useState<string>('All Type');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400); 
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const dateFilterDropdownRef = useRef<HTMLDivElement>(null);

  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [requestSearchQuery, setRequestSearchQuery] = useState<string>('');
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  const filterOptions = useMemo(() => [
    { label: 'All Type', value: 'All Type' },
    { label: 'Read', value: 'read' },
    { label: 'Unread', value: 'unread' },
    { label: 'Trashed', value: 'trashed' },
  ], []);

  const handleApiResponse = async (res: Response) => {
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/protection/login';
      throw new Error('Unauthorized session');
    }
    return res;
  };

  const processSubmissions = useCallback((rawList: any[]): Submission[] => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map((item) => {
      let pData = {};
      try {
        pData = typeof item.form_data === 'string' ? JSON.parse(item.form_data) : (item.form_data || {});
      } catch (e) {
        pData = {};
      }
      return { 
        ...item, 
        status: item.status || 'unread',
        parsed_data: pData 
      };
    });
  }, []);

  const fetchFormTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/leads/form-types`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFormTypesList(Array.isArray(data) ? data : (data.formTypes || []));
      }
    } catch (e) {
      console.error("Error fetching form types:", e);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      
      if (selectedFormType !== 'All Forms') queryParams.append('formType', selectedFormType);
      if (leadFilter !== 'All Type') queryParams.append('status', leadFilter);
      if (debouncedSearchQuery.trim()) queryParams.append('search', debouncedSearchQuery.trim());

      if (dateFilter !== 'All') {
        queryParams.append('dateFilter', dateFilter);
        if (dateFilter === 'Custom' && customStartDate && customEndDate) {
          queryParams.append('startDate', customStartDate);
          queryParams.append('endDate', customEndDate);
        }
      }

      queryParams.append('page', currentPageSub.toString());
      queryParams.append('limit', itemsPerPageSub.toString());
      queryParams.append('_t', Date.now().toString());

      const leadsRes = await fetch(`${API_BASE_URL}/leads?${queryParams.toString()}`, { 
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        cache: 'no-store'
      });
      await handleApiResponse(leadsRes);

      if (leadsRes.ok) {
        const lData = await leadsRes.json();
        const rawList = Array.isArray(lData) ? lData : (lData.data || []);
        
        let processed = processSubmissions(rawList);
        const now = new Date();

        if (dateFilter === 'Today') {
          processed = processed.filter(sub => new Date(sub.created_at).toDateString() === now.toDateString());
        } else if (dateFilter === 'Yesterday') {
          const yest = new Date();
          yest.setDate(now.getDate() - 1);
          processed = processed.filter(sub => new Date(sub.created_at).toDateString() === yest.toDateString());
        } else if (dateFilter === 'Last Week') {
          const lastWeekDate = new Date();
          lastWeekDate.setDate(now.getDate() - 7);
          processed = processed.filter(sub => {
            const d = new Date(sub.created_at);
            return d >= lastWeekDate && d <= now;
          });
        } else if (dateFilter === 'Last Month') {
          const lastMonthDate = new Date();
          lastMonthDate.setMonth(now.getMonth() - 1);
          processed = processed.filter(sub => {
            const d = new Date(sub.created_at);
            return d >= lastMonthDate && d <= now;
          });
        } else if (dateFilter === 'Custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          processed = processed.filter(sub => {
            const d = new Date(sub.created_at);
            return d >= start && d <= end;
          });
        }

        setSubmissions(processed);
        setTotalSubmissions(lData.total || processed.length);
        setTotalPagesSub(lData.totalPages || 1);
      }
    } catch (e) {
      console.error("Error fetching server-side leads:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFormType, leadFilter, debouncedSearchQuery, dateFilter, customStartDate, customEndDate, currentPageSub, itemsPerPageSub, processSubmissions]);

  const dynamicFormKeys = useMemo(() => {
    if (selectedFormType === 'All Forms') return [];
    const keysSet = new Set<string>();
    submissions.forEach((sub) => {
      if (sub.form_type === selectedFormType && sub.parsed_data) {
        Object.keys(sub.parsed_data).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [submissions, selectedFormType]);

  const getPageNameFromUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname === '/' ? 'Home / Root' : parsed.pathname;
    } catch {
      return url || 'N/A';
    }
  }, []);

  const getFormattedExportFilename = useCallback((formType: string, extension: string = 'csv') => {
    const cleanFormName = (formType && formType !== 'All Forms') ? formType.replace(/[^a-zA-Z0-9]/g, '-') : 'All-Leads';
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const day = String(now.getDate()).padStart(2, '0');
    return `${cleanFormName}-${year}-${month}-${day}.${extension}`;
  }, []);

  const exportFilteredCSV = useCallback(() => {
    if (!submissions || submissions.length === 0) {
      alert('No submissions available to export.');
      return;
    }

    const allKeysSet = new Set<string>();
    submissions.forEach(sub => {
      const pData = sub.parsed_data || {};
      Object.keys(pData).forEach(k => allKeysSet.add(k));
    });
    const dynamicKeys = Array.from(allKeysSet);

    const headers = [...dynamicKeys, 'Source URL', 'Submission Date', 'Form Type', 'ID', 'Status'];
    
    const rows = submissions.map(sub => {
      const pData = sub.parsed_data || {};
      return [
        ...dynamicKeys.map(k => `"${String(pData[k] || '').replace(/"/g, '""')}"`),
        `"${sub.source_url || ''}"`,
        `"${sub.created_at || ''}"`,
        `"${sub.form_type || ''}"`,
        sub.id,
        `"${sub.status || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', getFormattedExportFilename(selectedFormType, 'csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  }, [submissions, selectedFormType, getFormattedExportFilename]);

  const exportFilteredExcel = useCallback(() => {
    exportFilteredCSV();
    setIsExportOpen(false);
  }, [exportFilteredCSV]);

  const exportFilteredJSON = useCallback(() => {
    if (!submissions || submissions.length === 0) {
      alert('No submissions available to export.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(submissions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', getFormattedExportFilename(selectedFormType, 'json'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  }, [submissions, selectedFormType, getFormattedExportFilename]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchLeads();
      fetchFormTypes();
    }
  }, [activeTab, currentPageSub, itemsPerPageSub, selectedFormType, leadFilter, debouncedSearchQuery, dateFilter, customStartDate, customEndDate, fetchLeads, fetchFormTypes]);

  const filteredFormSelectorOptions = useMemo(() => {
    const allOptions = [{ name: 'All Forms', unreadCount: 0 }, ...formTypesList.map(ft => ({ name: ft, unreadCount: 0 }))];
    if (!formSearchQuery.trim()) return allOptions;
    return allOptions.filter(opt => opt.name.toLowerCase().includes(formSearchQuery.toLowerCase().trim()));
  }, [formTypesList, formSearchQuery]);

  const fetchPagesList = useCallback(async (page = currentPagePages, itemsLimit = itemsPerPagePages, search = pageSearchQuery, filter = '') => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', filter === 'events' ? '10000' : itemsLimit.toString());
      if (search.trim()) queryParams.append('search', search.trim());
      if (filter) queryParams.append('filter', filter);

      const res = await fetch(`${API_BASE_URL}/admin/pages?${queryParams.toString()}`, { 
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include',
        cache: 'no-store'
      });
      await handleApiResponse(res);
      if (res.ok) {
        const data = await res.json();
        const rawPages = Array.isArray(data.pages) ? data.pages : (Array.isArray(data) ? data : []);
        setPagesList(rawPages);
        setTotalPagesPages(data.totalPages || 1);
        setTotalFilteredPagesCount(data.total !== undefined ? data.total : rawPages.length);
      }
    } catch (e) {
      console.error('Error fetching pages:', e);
      setPagesList([]);
    }
  }, [currentPagePages, itemsPerPagePages, pageSearchQuery]);

  useEffect(() => {
    if (activeTab === 'all-pages') {
      fetchPagesList(currentPagePages, itemsPerPagePages, pageSearchQuery);
    }
  }, [activeTab, currentPagePages, itemsPerPagePages, pageSearchQuery, fetchPagesList]);

  const fetchEventsList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/events`, { credentials: 'include' });
      await handleApiResponse(res);
      if (res.ok) {
        const data = await res.json();
        setEventsList(data.events || []);
      }
    } catch (e) {
      console.error('Error fetching events:', e);
    }
  }, []);

  const hasFetchedInitialRef = useRef(false);

  useEffect(() => {
    if (hasFetchedInitialRef.current) return;
    hasFetchedInitialRef.current = true;

    async function fetchInitialData() {
      try {
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          const uData = JSON.parse(localUserStr);
          const currentRole = uData.role || 'Super-Admin';
          
          setUserRole(currentRole);
          setUserName(uData.full_name || uData.name || 'Muhammad Hamza Amin');
          setUserEmail(uData.email || 'm.hamzaamin90200@gmail.com');
        } else {
          setUserRole('Super-Admin');
          setUserName('Muhammad Hamza Amin');
          setUserEmail('m.hamzaamin90200@gmail.com');
        }

        const usersRes = await fetch(`${API_BASE_URL}/auth/users`, { credentials: 'include' });
        await handleApiResponse(usersRes);
        if (usersRes.ok) {
          const uDataRes = await usersRes.json();
          const formattedUsers = (uDataRes.users || []).map((u: any) => ({
            ...u,
            name: u.full_name || u.name || 'N/A'
          }));
          setAllUsers(formattedUsers);
          setApprovedUsersCount(formattedUsers.length);
        }

        const blogsData = await blogService.getBlogs(1, 10);
        setBlogs(blogsData.blogs || []);
        setTotalBlogsCount(blogsData.total || 0);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    }
    fetchInitialData();
  }, []); 

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) setIsFilterOpen(false);
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) setIsExportOpen(false);
      if (dateFilterDropdownRef.current && !dateFilterDropdownRef.current.contains(event.target as Node)) setIsDateFilterOpen(false);
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(event.target as Node)) setIsBulkOpen(false);
      if (perPageDropdownRefSub.current && !perPageDropdownRefSub.current.contains(event.target as Node)) setIsPerPageOpenSub(false);
      if (perPageDropdownRefPages.current && !perPageDropdownRefPages.current.contains(event.target as Node)) setIsPerPageOpenPages(false);
      if (formSelectorRef.current && !formSelectorRef.current.contains(event.target as Node)) setIsFormSelectorOpen(false);
      if (targetPageDropdownRef.current && !targetPageDropdownRef.current.contains(event.target as Node)) setIsTargetPageDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async (tab: 'overview' | 'all-pages' | 'requests' | 'users' | 'submissions' | 'all-blogs' | 'add-blog' | 'blog-categories' | 'all-events' | 'add-event') => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    setMessage({ text: '', type: '' });
    
    if (tab === 'submissions') {
      setCurrentPageSub(1);
      await Promise.all([fetchLeads(), fetchFormTypes()]);
    } else if (tab === 'all-pages') {
      setCurrentPagePages(1);
      await fetchPagesList(1, itemsPerPagePages);
    } else if (tab === 'all-events') {
      await fetchEventsList();
    } else if (tab === 'add-event') {
      await fetchPagesList(1, itemsPerPagePages, '', 'events');
    } else if (tab === 'all-blogs' || tab === 'add-blog') {
      try {
        const blogsData = await blogService.getBlogs(1, 10);
        setBlogs(blogsData.blogs || []);
        setTotalBlogsCount(blogsData.total || 0);
      } catch (err) {
        console.error("Error fetching blogs:", err);
      }
    } else if (tab === 'requests' && userRole === 'Super-Admin') {
      try {
        const data = await authService.getPendingRequests();
        const formattedRequests = (Array.isArray(data) ? data : (data.requests || [])).map((req: any) => ({
          ...req,
          name: req.full_name || req.name || 'N/A'
        }));
        setRequests(formattedRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    } else if (tab === 'users' && userRole === 'Super-Admin') {
      if (allUsers.length === 0) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/users`, { credentials: 'include' });
          await handleApiResponse(res);
          if (res.ok) {
            const data = await res.json();
            const formattedUsers = (data.users || []).map((u: any) => ({
              ...u,
              name: u.full_name || u.name || 'N/A'
            }));
            setAllUsers(formattedUsers);
            setApprovedUsersCount(formattedUsers.length);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    }
  }, [fetchLeads, fetchFormTypes, fetchPagesList, fetchEventsList, userRole, itemsPerPagePages, allUsers.length]);

  const handleScanPages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/pages/scan`, { credentials: 'include' });
      await handleApiResponse(res);
      if (res.ok) {
        setMessage({ text: 'GitHub repository successfully synchronized with database!', type: 'success' });
        fetchPagesList(currentPagePages, itemsPerPagePages, pageSearchQuery);
      }
    } catch (e) {
      console.error('Error scanning pages:', e);
      setMessage({ text: 'Failed to synchronize with GitHub.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePageToDB = async (page: PageItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pages/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify([{ name: page.name, path: page.path }])
      });
      await handleApiResponse(res);
      if (res.ok) {
        setPagesList(prev => prev.map(p => p.path === page.path ? { ...p, isIndexed: true, status: 'PUBLISHED', created_at: new Date().toISOString() } : p));
        setMessage({ text: `Page "${page.name}" and its hierarchy saved to database successfully!`, type: 'success' });
        fetchPagesList(currentPagePages, itemsPerPagePages, pageSearchQuery);
      }
    } catch (err) {
      console.error("Error saving page to DB:", err);
      setMessage({ text: 'Failed to save page to database.', type: 'error' });
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!eventName.trim() || !eventDayDate.trim() || !eventTargetPage.trim()) {
      setMessage({ text: 'Please fill in Event Name, Day & Date, and Target Page.', type: 'error' });
      return;
    }

    try {
      const payload = {
        id: editingEventId,
        event_name: eventName,
        day_date: eventDayDate,
        event_time: eventTime,
        venue: eventVenue,
        cover_image: eventCoverImage || null,
        target_page: eventTargetPage,
        status: eventStatus
      };

      const res = await fetch(`${API_BASE_URL}/admin/events`, {
        method: editingEventId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      await handleApiResponse(res);

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save event');

      setMessage({ text: editingEventId ? 'Event updated successfully!' : 'Event created successfully!', type: 'success' });
      
      setEditingEventId(null);
      setEventName('');
      setEventDayDate('');
      setEventTime('');
      setEventVenue('');
      setEventCoverImage('');
      setEventTargetPage('');
      setEventStatus('Live');

      fetchEventsList();
      setActiveTab('all-events');
    } catch (err: any) {
      setMessage({ text: err.message || 'Something went wrong', type: 'error' });
    }
  };

  const handleEditEventClick = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setEventName(ev.event_name);
    setEventDayDate(ev.day_date);
    setEventTime(ev.event_time);
    setEventVenue(ev.venue);
    setEventCoverImage(ev.cover_image || '');
    setEventTargetPage(ev.target_page);
    setEventStatus(ev.status);
    setActiveTab('add-event');
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/events?id=${id}`, { method: 'DELETE', credentials: 'include' });
      await handleApiResponse(res);
      if (!res.ok) throw new Error('Failed to delete event');
      setMessage({ text: 'Event deleted successfully!', type: 'success' });
      setEventsList(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      setMessage({ text: err.message || 'Something went wrong', type: 'error' });
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, action }),
      });
      await handleApiResponse(res);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Action failed');
      setMessage({ 
        text: action === 'approve' ? 'Manager approved successfully!' : 'Request rejected and removed.', 
        type: 'success' 
      });
      fetchData('requests');
    } catch (err: any) {
      setMessage({ text: err.message || 'Something went wrong', type: 'error' });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are You sure to Delete this User Permanently")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/delete-user?id=${id}`, { method: 'DELETE', credentials: 'include' });
      await handleApiResponse(res);
      if (!res.ok) throw new Error('Failed to delete user');
      setMessage({ text: 'User deleted successfully from database!', type: 'success' });
      setAllUsers(prev => {
        const updated = prev.filter(u => u.id !== id);
        setApprovedUsersCount(updated.length);
        return updated;
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Something went wrong', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await authService.logout();
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (!userSearchQuery.trim()) return true;
      const query = userSearchQuery.toLowerCase().trim();
      return (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query) || (u.role || '').toLowerCase().includes(query);
    });
  }, [allUsers, userSearchQuery]);

  const currentUsers = useMemo(() => filteredUsers.slice((currentPageUsers - 1) * itemsPerPageUsers, currentPageUsers * itemsPerPageUsers), [filteredUsers, currentPageUsers, itemsPerPageUsers]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (!requestSearchQuery.trim()) return true;
      const query = requestSearchQuery.toLowerCase().trim();
      return (req.name || '').toLowerCase().includes(query) || (req.email || '').toLowerCase().includes(query) || (req.role || '').toLowerCase().includes(query);
    });
  }, [requests, requestSearchQuery]);

  const currentRequests = useMemo(() => filteredRequests.slice((currentPageReq - 1) * itemsPerPageReq, currentPageReq * itemsPerPageReq), [filteredRequests, currentPageReq, itemsPerPageReq]);

  const filteredEvents = useMemo(() => {
    return eventsList.filter((ev) => {
      const status = (ev.status || '').trim();
      let matchesTab = true;
      if (eventTableTab === 'Live') matchesTab = status === 'Live';
      else if (eventTableTab === 'Coming Soon') matchesTab = status === 'Coming Soon';
      else if (eventTableTab === 'Past Event') matchesTab = status === 'Past Event';

      const q = eventSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || (ev.event_name || '').toLowerCase().includes(q) || (ev.venue || '').toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [eventsList, eventTableTab, eventSearchQuery]);

  return (
    <div className="flex bg-gray-50 font-sans">
      
      {/* Sidebar Component */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        fetchData={fetchData}
        userRole={userRole}
        isEventsMenuOpen={isEventsMenuOpen}
        setIsEventsMenuOpen={setIsEventsMenuOpen}
        isBlogsMenuOpen={isBlogsMenuOpen}
        setIsBlogsMenuOpen={setIsBlogsMenuOpen}
        setEditingEventId={setEditingEventId}
        setEventName={setEventName}
        setEventDayDate={setEventDayDate}
        setEventTime={setEventTime}
        setEventVenue={setEventVenue}
        setEventCoverImage={setEventCoverImage}
        setEventTargetPage={setEventTargetPage}
        setEventStatus={setEventStatus}
        setEditingBlogId={(id) => {
          setEditingBlogId(id);
          if (!id) setSelectedBlogForEdit(null);
        }}
        setBlogTitle={setBlogTitle}
        setBlogSlug={setBlogSlug}
        setBlogCoverImage={setBlogCoverImage}
        setBlogCategoryId={setBlogCategoryId}
        editorRef={editorRef}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Pane Header Component */}
        <PaneHeader
          setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab}
          editingBlogId={editingBlogId}
          editingEventId={editingEventId}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />

        {/* Content Pane */}
        <div className="p-4 sm:p-5 lg:p-[20px] flex-1">
          
          {activeTab === 'overview' && (
            <OverviewTab
              userName={userName}
              totalSubmissions={totalSubmissions}
              submissions={submissions}
              allUsers={allUsers}
              approvedUsersCount={approvedUsersCount}
              requests={requests}
              blogs={blogs}
              totalBlogsCount={totalBlogsCount}
              totalFilteredPagesCount={totalFilteredPagesCount}
              pagesList={pagesList}
              userRole={userRole}
              fetchData={fetchData}
              setEditingBlogId={setEditingBlogId}
              setBlogTitle={setBlogTitle}
              setBlogSlug={setBlogSlug}
              setBlogCoverImage={setBlogCoverImage}
              setBlogCategoryId={setBlogCategoryId}
              editorRef={editorRef}
            />
          )}

          {activeTab === 'all-pages' && (
            <PagesTab
              message={message}
              totalFilteredPagesCount={totalFilteredPagesCount}
              handleScanPages={handleScanPages}
              pageSearchQuery={pageSearchQuery}
              setPageSearchQuery={setPageSearchQuery}
              pagesList={pagesList}
              handleSavePageToDB={handleSavePageToDB}
              totalPagesPages={totalPagesPages}
              currentPagePages={currentPagePages}
              setCurrentPagePages={setCurrentPagePages}
              itemsPerPagePages={itemsPerPagePages}
              setItemsPerPagePages={setItemsPerPagePages}
              goToPageInputPages={goToPageInputPages}
              setGoToPageInputPages={setGoToPageInputPages}
              isPerPageOpenPages={isPerPageOpenPages}
              setIsPerPageOpenPages={setIsPerPageOpenPages}
              perPageDropdownRefPages={perPageDropdownRefPages}
              userRole={userRole}
            />
          )}

          {activeTab === 'submissions' && (
            <LeadsTab
              isLoading={isLoading}
              submissions={submissions}
              selectedFormType={selectedFormType}
              isFormSelectorOpen={isFormSelectorOpen}
              setIsFormSelectorOpen={setIsFormSelectorOpen}
              formSearchQuery={formSearchQuery}
              setFormSearchQuery={setFormSearchQuery}
              filteredFormSelectorOptions={filteredFormSelectorOptions}
              setSelectedFormType={setSelectedFormType}
              setCurrentPageSub={setCurrentPageSub}
              leadFilter={leadFilter}
              setLeadFilter={setLeadFilter}
              isFilterOpen={isFilterOpen}
              setIsFilterOpen={setIsFilterOpen}
              filterOptions={filterOptions}
              selectedIds={selectedIds}
              isBulkOpen={isBulkOpen}
              setIsBulkOpen={setIsBulkOpen}
              handleBulkAction={handleBulkAction}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
              isDateFilterOpen={isDateFilterOpen}
              setIsDateFilterOpen={setIsDateFilterOpen}
              dateFilterDropdownRef={dateFilterDropdownRef}
              formSelectorRef={formSelectorRef}
              filterDropdownRef={filterDropdownRef}
              bulkDropdownRef={bulkDropdownRef}
              exportDropdownRef={exportDropdownRef}
              isExportOpen={isExportOpen}
              setIsExportOpen={setIsExportOpen}
              exportFilteredCSV={exportFilteredCSV}
              exportFilteredExcel={exportFilteredExcel}
              exportFilteredJSON={exportFilteredJSON}
              isAllCurrentPageSelected={isAllCurrentPageSelected}
              handleSelectAllCurrentPage={handleSelectAllCurrentPage}
              handleSelectOne={handleSelectOne}
              dynamicFormKeys={dynamicFormKeys}
              handleViewSubmission={setViewingSubmission}
              handleSoftDeleteSubmission={handleSoftDeleteSubmission}
              handleRecoverSubmission={handleRecoverSubmission}
              handlePermanentDeleteSubmission={handlePermanentDeleteSubmission}
              totalSubmissions={totalSubmissions}
              totalPagesSub={totalPagesSub}
              currentPageSub={currentPageSub}
              itemsPerPageSub={itemsPerPageSub}
              setItemsPerPageSub={setItemsPerPageSub}
              goToPageInputSub={goToPageInputSub}
              setGoToPageInputSub={setGoToPageInputSub}
              isPerPageOpenSub={isPerPageOpenSub}
              setIsPerPageOpenSub={setIsPerPageOpenSub}
              perPageDropdownRefSub={perPageDropdownRefSub}
              hoveredUrl={hoveredUrl}
              setHoveredUrl={setHoveredUrl}
              getPageNameFromUrl={getPageNameFromUrl}
            />
          )}

          {activeTab === 'all-blogs' && (
            <AllBlogsTab 
              onEditBlog={(blog) => {
                setEditingBlogId(blog.id);
                setSelectedBlogForEdit(blog);
                setActiveTab('add-blog');
              }} 
            />
          )}

          {activeTab === 'add-blog' && (
            <AddBlogTab 
              editingBlog={selectedBlogForEdit}
              onBlogCreated={() => {
                setEditingBlogId(null);
                setSelectedBlogForEdit(null);
                fetchData('all-blogs');
              }} 
            />
          )}

          {activeTab === 'blog-categories' && <BlogCategoriesTab />}

          {activeTab === 'all-events' && (
            <EventsTab
              message={message}
              eventTableTab={eventTableTab}
              setEventTableTab={setEventTableTab}
              eventSearchQuery={eventSearchQuery}
              setEventSearchQuery={setEventSearchQuery}
              filteredEvents={filteredEvents}
              handleEditEventClick={handleEditEventClick}
              handleDeleteEvent={handleDeleteEvent}
              fetchData={fetchData}
              setEditingEventId={setEditingEventId}
              setEventName={setEventName}
              setEventDayDate={setEventDayDate}
              setEventTime={setEventTime}
              setEventVenue={setEventVenue}
              setEventCoverImage={setEventCoverImage}
              setEventTargetPage={setEventTargetPage}
              setEventStatus={setEventStatus}
            />
          )}

          {activeTab === 'add-event' && (
            <AddEventTab
              message={message}
              handleSaveEvent={handleSaveEvent}
              editingEventId={editingEventId}
              eventName={eventName}
              setEventName={setEventName}
              eventDayDate={eventDayDate}
              setEventDayDate={setEventDayDate}
              eventTime={eventTime}
              setEventTime={setEventTime}
              eventVenue={eventVenue}
              setEventVenue={setEventVenue}
              eventCoverImage={eventCoverImage}
              setEventCoverImage={setEventCoverImage}
              eventTargetPage={eventTargetPage}
              setEventTargetPage={setEventTargetPage}
              eventStatus={eventStatus}
              setEventStatus={setEventStatus}
              isTargetPageDropdownOpen={isTargetPageDropdownOpen}
              setIsTargetPageDropdownOpen={setIsTargetPageDropdownOpen}
              targetPageSearchQuery={targetPageSearchQuery}
              setTargetPageSearchQuery={setTargetPageSearchQuery}
              targetPageDropdownRef={targetPageDropdownRef}
              filteredTargetPages={pagesList}
              fetchData={fetchData}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsTab
              message={message}
              filteredRequests={filteredRequests}
              requestSearchQuery={requestSearchQuery}
              setRequestSearchQuery={setRequestSearchQuery}
              setCurrentPageReq={setCurrentPageReq}
              currentRequests={currentRequests}
              handleAction={handleAction}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              message={message}
              filteredUsers={filteredUsers}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              setCurrentPageUsers={setCurrentPageUsers}
              currentUsers={currentUsers}
              userRole={userRole}
              handleDeleteUser={handleDeleteUser}
            />
          )}

        </div>
      </main>

      {isViewModalOpen && viewingSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Form Entry Details</h2>
                <p className="text-sm text-gray-500">{viewingSubmission.form_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Print
                </button>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}