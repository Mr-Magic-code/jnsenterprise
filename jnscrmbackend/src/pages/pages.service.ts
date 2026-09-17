import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PagesService {
  constructor(
    @Inject('DATABASE_CONNECTION') private db: any,
  ) {}

  // 1. GitHub se pages scan karne ka function
  async scanGitHubPages() {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      throw new HttpException('GitHub credentials are missing in backend .env', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/src/app`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      });

      const items = response.data;
      const scannedPages: any[] = [];

      const [existingPages]: any = await this.db.query('SELECT slug FROM pages');
      const existingSlugs = existingPages.map((p: any) => p.slug);

      for (const item of items) {
        if (item.type === 'dir') {
          if (item.name.startsWith('_') || item.name === 'api' || item.name === 'login' || item.name === 'dashboard') continue;

          const cleanSlug = item.name.replace(/^\[(.+)\]$/, '$1');
          const title = cleanSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

          const isSaved = existingSlugs.includes(cleanSlug);

          scannedPages.push({
            title: title,
            slug: cleanSlug,
            status: 'published',
            is_saved: isSaved,
          });
        }
      }

      return { success: true, pages: scannedPages };
    } catch (error: any) {
      console.error('GitHub Scan Error:', error.response?.data || error.message);
      throw new HttpException('Failed to scan pages from GitHub repository.', HttpStatus.BAD_REQUEST);
    }
  }

  // 2. Database mein naya page save karne ka function (Raw SQL)
  async savePage(pageData: { title: string; slug: string; parent_slug?: string; status?: string }) {
    try {
      const { title, slug, parent_slug = null, status = 'published' } = pageData;

      if (!title || !slug) {
        throw new HttpException('Title and slug are required', HttpStatus.BAD_REQUEST);
      }

      const query = `INSERT INTO pages (title, slug, parent_slug, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`;
      const [result]: any = await this.db.query(query, [title, slug, parent_slug, status]);

      return {
        success: true,
        message: 'Page saved successfully to database!',
        pageId: result.insertId,
      };
    } catch (error: any) {
      console.error('Save Page Error:', error.message);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new HttpException('Page with this slug already exists in database.', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message || 'Failed to save page.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}