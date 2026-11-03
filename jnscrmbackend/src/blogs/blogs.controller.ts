// src/blogs/blogs.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { BlogsService } from './blogs.service.js';

@Controller('admin/blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // --- CATEGORIES ROUTES ---
  @Get('categories')
  async getCategories() {
    return this.blogsService.getAllCategories();
  }

  @Post('categories')
  async createCategory(@Body() body: { name: string; slug: string }) {
    return this.blogsService.createCategory(body.name, body.slug);
  }

  // 🚀 Added missing Category Update Route
  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: { name: string; slug: string }) {
    return this.blogsService.updateCategory(Number(id), body.name, body.slug);
  }

  // 🚀 Added missing Category Delete Route
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.blogsService.deleteCategory(Number(id));
  }

  // --- BLOGS CRUD ROUTES ---
  @Get()
  async getBlogs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('status') status: string,
  ) {
    return this.blogsService.getAllBlogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search || '',
      status || '',
    );
  }

  @Post()
  async createBlog(@Body() body: any) {
    return this.blogsService.createBlog(body);
  }

  @Put(':id')
  async updateBlog(@Param('id') id: string, @Body() body: any) {
    return this.blogsService.updateBlog(Number(id), body);
  }

  // --- DEDICATED STATUS UPDATE ENDPOINT (Soft Delete / Trash / Recover) ---
  @Patch(':id/status')
  async updateBlogStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.blogsService.updateBlogStatus(Number(id), body.status);
  }

  @Delete(':id')
  async deleteBlog(@Param('id') id: string) {
    return this.blogsService.deleteBlog(Number(id));
  }
}