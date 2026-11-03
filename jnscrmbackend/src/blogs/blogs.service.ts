import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class BlogsService {
  private pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'jnseducation-db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // --- CATEGORIES LOGIC ---
  async getAllCategories() {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM blog_categories ORDER BY id DESC');
      return { categories: rows };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new InternalServerErrorException('Failed to fetch categories');
    }
  }

  async createCategory(name: string, slug: string) {
    try {
      const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      await this.pool.execute(
        'INSERT INTO blog_categories (name, slug) VALUES (?, ?)',
        [name, finalSlug]
      );
      return { success: true, message: 'Category created successfully' };
    } catch (error) {
      console.error('Error creating category:', error);
      throw new InternalServerErrorException('Failed to create category');
    }
  }
  async updateCategory(id: number, name: string, slug: string) {
    const [result]: any = await this.pool.query(
      'UPDATE blog_categories SET name = ?, slug = ? WHERE id = ?',
      [name, slug, id]
    );
    return result;
  }

  async deleteCategory(id: number) {
    const [result]: any = await this.pool.query(
      'DELETE FROM blog_categories WHERE id = ?',
      [id]
    );
    return result;
  }

  // --- BLOGS LOGIC ---
  async getAllBlogs(page: number = 1, limit: number = 10, search: string = '', status: string = '') {
    try {
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT b.*, c.name as category_name 
        FROM blogs b 
        LEFT JOIN blog_categories c ON b.category_id = c.id 
        WHERE 1=1
      `;
      const queryParams: any[] = [];

      if (search) {
        query += ` AND (b.title LIKE ? OR b.content LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (status && status !== 'All') {
        query += ` AND b.status = ?`;
        queryParams.push(status);
      }

      query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(Number(limit), Number(offset));

      const [blogs] = await this.pool.execute(query, queryParams);
      
      // Optimized count query using the same filters if needed, or total count
      const [countRows]: any = await this.pool.execute('SELECT COUNT(*) as total FROM blogs');
      const total = countRows[0]?.total || 0;

      return {
        blogs,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
      };
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw new InternalServerErrorException('Failed to fetch blogs');
    }
  }

  async createBlog(data: {
    title: string;
    slug: string;
    category_id: number;
    cover_image: string;
    content: string;
    status: string;
    author_name: string;
    author_role: string;
  }) {
    try {
      const finalSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const now = new Date();

      await this.pool.execute(
        `INSERT INTO blogs (title, slug, category_id, cover_image, content, status, author_name, author_role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          finalSlug,
          data.category_id || null,
          data.cover_image || null,
          data.content,
          data.status || 'draft',
          data.author_name,
          data.author_role,
          now,
          now,
        ]
      );

      return { success: true, message: 'Blog published successfully' };
    } catch (error) {
      console.error('Error creating blog:', error);
      throw new InternalServerErrorException('Failed to create blog');
    }
  }

  async updateBlog(id: number, data: any) {
    try {
      const finalSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const now = new Date();

      await this.pool.execute(
        `UPDATE blogs 
         SET title = ?, slug = ?, category_id = ?, cover_image = ?, content = ?, status = ?, updated_at = ? 
         WHERE id = ?`,
        [
          data.title,
          finalSlug,
          data.category_id || null,
          data.cover_image || null,
          data.content,
          data.status || 'draft',
          now,
          id,
        ]
      );

      return { success: true, message: 'Blog updated successfully' };
    } catch (error) {
      console.error('Error updating blog:', error);
      throw new InternalServerErrorException('Failed to update blog');
    }
  }
async updateBlogStatus(id: number, status: string) {
    try {
      const now = new Date();
      await this.pool.execute(
        `UPDATE blogs SET status = ?, updated_at = ? WHERE id = ?`,
        [status, now, id]
      );
      return { success: true, message: 'Blog status updated successfully' };
    } catch (error) {
      console.error('Error updating blog status:', error);
      throw new InternalServerErrorException('Failed to update blog status');
    }
  }
  async deleteBlog(id: number) {
    try {
      await this.pool.execute('DELETE FROM blogs WHERE id = ?', [id]);
      return { success: true, message: 'Blog deleted successfully' };
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw new InternalServerErrorException('Failed to delete blog');
    }
  }
}