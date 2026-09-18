import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class PagesService {
  constructor(private readonly dbService: DatabaseService) {}

  // 1. BLINDINGLY FAST: Fetch pages directly from MySQL Database with Perfect Hierarchical Parent-Child Sorting
  async getPagesFromDb(query?: { page?: string; limit?: string; search?: string }) {
    try {
      const pageNum = parseInt(query?.page || '1', 10);
      const limitNum = parseInt(query?.limit || '50', 10);
      const searchQuery = query?.search ? `%${query.search.trim()}%` : null;

      let dataQuery = 'SELECT * FROM pages';
      let queryParams: any[] = [];

      if (searchQuery) {
        dataQuery += ' WHERE title LIKE ? OR slug LIKE ?';
        queryParams = [searchQuery, searchQuery];
      }

      const rows: any = await this.dbService.query(dataQuery, queryParams);
      const allPages = Array.isArray(rows) ? rows : [];

      // Hierarchical Sorting: Ensure every child page appears directly after its parent page
      const parentPages = allPages.filter((p: any) => !p.parent_slug);
      const sortedList: any[] = [];

      parentPages.forEach((parent: any) => {
        sortedList.push(parent);
        const children = allPages.filter((p: any) => p.parent_slug === parent.slug);
        sortedList.push(...children);
      });

      // Catch any remaining pages that didn't match the primary parent-child tree
      const remaining = allPages.filter((p: any) => !sortedList.includes(p));
      sortedList.push(...remaining);

      // Memory-level pagination to keep page limits and offsets working accurately
      const total = sortedList.length;
      const offset = (pageNum - 1) * limitNum;
      const paginatedPages = sortedList.slice(offset, offset + limitNum);

      // Format records for frontend tree/table view
      const formattedPages = paginatedPages.map((p: any) => ({
        name: p.title || p.name || 'Untitled Page',
        path: p.slug || p.path || '',
        parentPage: p.parent_slug || 'None',
        isIndexed: true,
        status: p.status || 'PUBLISHED',
        created_at: p.created_at || null,
      }));

      return {
        success: true,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        pages: formattedPages,
      };
    } catch (error: any) {
      throw new HttpException(
        `Database fetch error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 2. MANUAL SCAN: GitHub Trees API sync with Smart Branch Detection & Auto-Cleanup for Renamed/Deleted Pages
  async scanGitHubPages() {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      throw new HttpException(
        'GitHub credentials are not set in environment variables',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'JnS-CRM-Backend',
    };

    try {
      const repoInfoUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const repoResponse = await fetch(repoInfoUrl, { headers });
      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch || 'main';

      const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!data.tree) {
        return { success: true, message: 'No tree structure found.' };
      }

      const appDirs = data.tree.filter((item: any) => 
        item.type === 'tree' && item.path.startsWith('jnscrm/src/app/')
      );

      // Track all scanned slugs and parent slugs from GitHub to perform cleanup later
      const scannedSlugs = new Set<string>();

      for (const dir of appDirs) {
        const relativeSlug = dir.path.replace('jnscrm/src/app/', '');
        scannedSlugs.add(relativeSlug);
        const pathSegments = relativeSlug.split('/');
        
        if (pathSegments.length > 1) {
          const parentSlug = pathSegments.slice(0, -1).join('/');
          scannedSlugs.add(parentSlug);
          const parentFolderName = pathSegments[pathSegments.length - 2];
          const parentTitle = parentFolderName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          const grandParentSlug = pathSegments.length > 2 ? pathSegments.slice(0, -2).join('/') : null;

          const existingParent: any = await this.dbService.query(
            'SELECT id FROM pages WHERE slug = ? AND (parent_slug <=> ?)',
            [parentSlug, grandParentSlug]
          );

          if (!existingParent || (Array.isArray(existingParent) && existingParent.length === 0)) {
            await this.dbService.query(
              `INSERT INTO pages (title, slug, parent_slug, status) VALUES (?, ?, ?, 'PUBLISHED')`,
              [parentTitle, parentSlug, grandParentSlug]
            );
          }
        }

        const pageTitle = pathSegments[pathSegments.length - 1].replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const parentSlug = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') : null;

        const existingPage: any = await this.dbService.query(
          'SELECT id FROM pages WHERE slug = ? AND (parent_slug <=> ?)',
          [relativeSlug, parentSlug]
        );

        if (!existingPage || (Array.isArray(existingPage) && existingPage.length === 0)) {
          await this.dbService.query(
            `INSERT INTO pages (title, slug, parent_slug, status) VALUES (?, ?, ?, 'PUBLISHED')`,
            [pageTitle, relativeSlug, parentSlug]
          );
        }
      }

      // AUTO-CLEANUP: Remove pages from DB that no longer exist in the GitHub repository (e.g. renamed or deleted)
      if (scannedSlugs.size > 0) {
        const slugsArray = Array.from(scannedSlugs);
        const placeholders = slugsArray.map(() => '?').join(',');
        const deleteQuery = `DELETE FROM pages WHERE slug NOT IN (${placeholders})`;
        await this.dbService.query(deleteQuery, slugsArray);
      }

      return {
        success: true,
        message: 'GitHub repository scanned, synchronized, and auto-cleaned successfully!',
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to scan GitHub pages: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async savePage(body: any) {
    const pages = Array.isArray(body) ? body : [body];
    return this.savePagesToDb(pages);
  }

  // 3. Database mein pages save karne ka secure function with Parent-Slug validation
  async savePagesToDb(pages: { name: string; path: string }[]) {
    if (!pages || pages.length === 0) {
      return { success: false, message: 'No pages provided to save.' };
    }

    try {
      let savedCount = 0;
      let skippedCount = 0;

      for (const page of pages) {
        const relativeSlug = page.path.startsWith('jnscrm/src/app/') 
          ? page.path.replace('jnscrm/src/app/', '') 
          : page.path;

        const pathSegments = relativeSlug.split('/');
        const parentSlug = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') : null;
        
        if (pathSegments.length > 1) {
          const parentFolderName = pathSegments[pathSegments.length - 2];
          const parentTitle = parentFolderName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          const grandParentSlug = pathSegments.length > 2 ? pathSegments.slice(0, -2).join('/') : null;

          const existingParent: any = await this.dbService.query(
            'SELECT id FROM pages WHERE slug = ? AND (parent_slug <=> ?)',
            [parentSlug, grandParentSlug]
          );

          if (!existingParent || (Array.isArray(existingParent) && existingParent.length === 0)) {
            await this.dbService.query(
              `INSERT INTO pages (title, slug, parent_slug, status) VALUES (?, ?, ?, 'PUBLISHED')`,
              [parentTitle, parentSlug, grandParentSlug]
            );
          }
        }

        const pageTitle = page.name 
          ? page.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) 
          : pathSegments[pathSegments.length - 1].replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

        const existingRows: any = await this.dbService.query(
          'SELECT id FROM pages WHERE slug = ? AND (parent_slug <=> ?)',
          [relativeSlug, parentSlug]
        );

        if (existingRows && Array.isArray(existingRows) && existingRows.length > 0) {
          skippedCount++;
          continue; 
        }

        await this.dbService.query(
          `INSERT INTO pages (title, slug, parent_slug, status) VALUES (?, ?, ?, 'PUBLISHED')`,
          [pageTitle, relativeSlug, parentSlug]
        );
        savedCount++;
      }

      return {
        success: true,
        message: `Successfully saved ${savedCount} new pages. Skipped ${skippedCount} duplicates.`,
      };
    } catch (error: any) {
      throw new HttpException(
        `Database save error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}