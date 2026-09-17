import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';

@Injectable()
export class LeadsService {
  constructor(private readonly db: DatabaseService) {}

  // 1. Form Submission save karne ke liye (POST) + Asynchronous CRM Forwarding
  async create(createLeadDto: CreateLeadDto) {
    const { form_type, form_data, source_url } = createLeadDto;
    const query = `
      INSERT INTO leads (form_type, form_data, source_url, status, created_at) 
      VALUES (?, ?, ?, 'Unread', NOW())
    `;
    
    // JSON data ko stringify karna zaroori hai MySQL JSON column ke liye
    const result: any = await this.db.query(query, [
      form_type, 
      JSON.stringify(form_data), 
      source_url || ''
    ]);

    const leadId = result.insertId;

    // Asynchronous Execution: Background mein custom CRM par data bhejna
    this.forwardToCustomCRM(createLeadDto).catch(err => {
      console.error('CRM Error Details:', err);
    });

    return { success: true, message: 'Lead saved successfully', leadId };
  }

  // Custom CRM par data post karne ka secure method with Token
  private async forwardToCustomCRM(payload: CreateLeadDto) {
    const crmUrl: string = process.env.CRM_API_URL ?? 'http://localhost:5000/api/leads';
    const crmToken: string = process.env.CRM_API_TOKEN ?? '';

    try {
      await fetch(crmUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${crmToken}`
        },
        body: JSON.stringify(payload),
      });
    } catch (error: any) {
      throw new Error(error?.message || 'CRM connection error');
    }
  }

  // 2. Leads fetch karne ke liye (GET with Search, Filters & Server-Side Pagination)
  async findAll(
    formType?: string, 
    status?: string, 
    search?: string, 
    page: number = 1, 
    limit: number = 100
  ) {
    let query = `SELECT * FROM leads WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM leads WHERE 1=1`;
    const params: any[] = [];
    const countParams: any[] = [];

    if (formType && formType !== 'all_forms') {
      query += ` AND form_type = ?`;
      countQuery += ` AND form_type = ?`;
      params.push(formType);
      countParams.push(formType);
    }

    if (status) {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      query += ` AND (source_url LIKE ? OR CAST(form_data AS CHAR) LIKE ?)`;
      countQuery += ` AND (source_url LIKE ? OR CAST(form_data AS CHAR) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    // Pagination Limit & Offset optimization for large scale datasets
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 100;
    const offset = (parsedPage - 1) * parsedLimit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    // Execute queries efficiently
    const leads: any = await this.db.query(query, params);
    const totalResult: any = await this.db.query(countQuery, countParams);
    const total = totalResult[0]?.total || 0;

    return {
      data: leads,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    };
  }

  // 3. Status update karne ke liye (Read / Trashed)
  async updateStatus(id: number, status: 'Unread' | 'Read' | 'Trashed') {
    const query = `UPDATE leads SET status = ? WHERE id = ?`;
    const result: any = await this.db.query(query, [status, id]);
    
    if (result.affectedRows === 0) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    return { success: true, message: `Lead status updated to ${status}` };
  }

  // 4. Permanent Delete ke liye
  async remove(id: number) {
    const query = `DELETE FROM leads WHERE id = ?`;
    const result: any = await this.db.query(query, [id]);
    
    if (result.affectedRows === 0) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    return { success: true, message: 'Lead permanently deleted' };
  }
}