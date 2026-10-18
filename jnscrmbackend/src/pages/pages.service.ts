import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class PagesService {
  constructor(private readonly dbService: DatabaseService) {}

  private formatTitle(str: string): string {
    return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async getPagesFromDb(query?: { page?: string; limit?: string; search?: string; filter?: string; role?: string }) {
    try {
      const pageNum = parseInt(query?.page || '1', 10);
      const limitNum = parseInt(query?.limit || '50', 10);
      const searchQuery = query?.search ? `%${query.search.trim()}%` : null;
      const isEventFilter = query?.filter === 'events';

      let dataQuery = 'SELECT * FROM pages';
      let queryParams: any[] = [];
      let conditions: string[] = [];

      if (isEventFilter) {
        conditions.push("(slug = 'events' OR slug LIKE 'events/%' OR parent_page = 'events' OR slug LIKE 'events-%' OR slug LIKE '%/events/%')");
      }

      if (searchQuery) {
        conditions.push('(page_title LIKE ? OR slug LIKE ?)');
        queryParams.push(searchQuery, searchQuery);
      }

      if (conditions.length > 0) {
        dataQuery += ' WHERE ' + conditions.join(' AND ');
      }

      const rows: any = await this.dbService.query(dataQuery, queryParams);
      let allPages = Array.isArray(rows) ? rows : [];

      const sortPagesRecursively = (parentSlug: string | null): any[] => {
        let result: any[] = [];
        const children = allPages.filter((p: any) => (p.parent_page || null) === parentSlug);
        for (const child of children) {
          result.push(child, ...sortPagesRecursively(child.slug));
        }
        return result;
      };

      const topLevelPages = allPages.filter((p: any) => !p.parent_page);
      const sortedList: any[] = [];

      for (const parent of topLevelPages) {
        sortedList.push(parent, ...sortPagesRecursively(parent.slug));
      }

      const remaining = allPages.filter((p: any) => !sortedList.includes(p));
      sortedList.push(...remaining);

      const total = sortedList.length;
      const offset = (pageNum - 1) * limitNum;
      const paginatedPages = sortedList.slice(offset, offset + limitNum);

      const formattedPages = paginatedPages.map((p: any) => ({
        name: p.page_title || 'Untitled Page',
        path: p.slug || '',
        parentPage: p.parent_page || 'None',
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
      throw new HttpException(`Database fetch error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async scanGitHubPages() {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      throw new HttpException('GitHub credentials are not set in environment variables', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'JnS-CRM-Backend',
    };

    try {
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoResponse.ok) {
        throw new Error(`GitHub Repo Error (${repoResponse.status}): ${await repoResponse.text()}`);
      }
      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch || 'main';

      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
      if (!treeResponse.ok) {
        throw new Error(`GitHub Tree Error (${treeResponse.status}): ${await treeResponse.text()}`);
      }
      const data = await treeResponse.json();

      if (!data.tree) {
        return { success: true, message: 'No tree structure found.' };
      }

      const appDirs = data.tree.filter((item: any) => 
        item.type === 'tree' && item.path.startsWith('jnscrm/src/app/')
      );

      const scannedSlugs = new Set<string>();

      for (const dir of appDirs) {
        const relativeSlug = dir.path.replace('jnscrm/src/app/', '');
        if (!relativeSlug || relativeSlug.startsWith('_') || relativeSlug.includes('api')) continue;

        scannedSlugs.add(relativeSlug);
        const pathSegments = relativeSlug.split('/');
        
        if (pathSegments.length > 1) {
          const parentSlug = pathSegments.slice(0, -1).join('/');
          scannedSlugs.add(parentSlug);
          const parentTitle = this.formatTitle(pathSegments[pathSegments.length - 2]);
          const grandParentSlug = pathSegments.length > 2 ? pathSegments.slice(0, -2).join('/') : null;

          const existingParent: any = await this.dbService.query(
            'SELECT id FROM pages WHERE slug = ? AND (parent_page <=> ?)',
            [parentSlug, grandParentSlug]
          );

          if (!existingParent?.length) {
            await this.dbService.query(
              `INSERT INTO pages (page_title, slug, parent_page, status, publish_date, created_at) VALUES (?, ?, ?, 'PUBLISHED', NOW(), NOW())`,
              [parentTitle, parentSlug, grandParentSlug]
            );
          }
        }

        const pageTitle = this.formatTitle(pathSegments[pathSegments.length - 1]);
        const parentSlug = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') : null;

        const existingPage: any = await this.dbService.query(
          'SELECT id FROM pages WHERE slug = ? AND (parent_page <=> ?)',
          [relativeSlug, parentSlug]
        );

        if (!existingPage?.length) {
          await this.dbService.query(
            `INSERT INTO pages (page_title, slug, parent_page, status, publish_date, created_at) VALUES (?, ?, ?, 'PUBLISHED', NOW(), NOW())`,
            [pageTitle, relativeSlug, parentSlug]
          );
        }
      }

      if (scannedSlugs.size > 0) {
        const slugsArray = Array.from(scannedSlugs);
        const placeholders = slugsArray.map(() => '?').join(',');
        await this.dbService.query(`DELETE FROM pages WHERE slug NOT IN (${placeholders})`, slugsArray);
      }

      return {
        success: true,
        message: 'GitHub repository scanned, synchronized, and auto-cleaned successfully!',
      };
    } catch (error: any) {
      throw new HttpException(`Failed to scan GitHub pages: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  async savePage(body: any) {
    const pages = Array.isArray(body) ? body : [body];
    return this.savePagesToDb(pages);
  }

  async savePagesToDb(pages: { name: string; path: string }[]) {
    if (!pages?.length) {
      return { success: false, message: 'No pages provided to save.' };
    }

    try {
      let savedCount = 0;
      let skippedCount = 0;

      for (const page of pages) {
        const relativeSlug = page.path.startsWith('jnscrm/src/app/') 
          ? page.path.replace('jnscrm/src/app/', '') 
          : page.path;

        if (!relativeSlug || relativeSlug.startsWith('_') || relativeSlug.includes('api')) continue;

        const pathSegments = relativeSlug.split('/');
        const parentSlug = pathSegments.length > 1 ? pathSegments.slice(0, -1).join('/') : null;
        
        if (pathSegments.length > 1) {
          const parentTitle = this.formatTitle(pathSegments[pathSegments.length - 2]);
          const grandParentSlug = pathSegments.length > 2 ? pathSegments.slice(0, -2).join('/') : null;

          const existingParent: any = await this.dbService.query(
            'SELECT id FROM pages WHERE slug = ? AND (parent_page <=> ?)',
            [parentSlug, grandParentSlug]
          );

          if (!existingParent?.length) {
            await this.dbService.query(
              `INSERT INTO pages (page_title, slug, parent_page, status, publish_date, created_at) VALUES (?, ?, ?, 'PUBLISHED', NOW(), NOW())`,
              [parentTitle, parentSlug, grandParentSlug]
            );
          }
        }

        const pageTitle = page.name ? this.formatTitle(page.name) : this.formatTitle(pathSegments[pathSegments.length - 1]);

        const existingRows: any = await this.dbService.query(
          'SELECT id FROM pages WHERE slug = ? AND (parent_page <=> ?)',
          [relativeSlug, parentSlug]
        );

        if (existingRows?.length) {
          skippedCount++;
          continue; 
        }

        await this.dbService.query(
          `INSERT INTO pages (page_title, slug, parent_page, status, publish_date, created_at) VALUES (?, ?, ?, 'PUBLISHED', NOW(), NOW())`,
          [pageTitle, relativeSlug, parentSlug]
        );
        savedCount++;
      }

      return {
        success: true,
        message: `Successfully saved ${savedCount} new pages. Skipped ${skippedCount} duplicates.`,
      };
    } catch (error: any) {
      throw new HttpException(`Database save error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}