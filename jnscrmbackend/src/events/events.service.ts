import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class EventsService {
  constructor(private readonly dbService: DatabaseService) {}

  // Get all events with secure column mapping for blazing-fast frontend rendering
  async getEvents() {
    try {
      const rows: any = await this.dbService.query('SELECT * FROM events ORDER BY id DESC');
      
      const formattedEvents = (Array.isArray(rows) ? rows : []).map((ev: any) => ({
        id: ev.id,
        event_name: ev.event_name,
        day_date: ev.day_and_date || ev.day_date,       // Safe mapping for day & date
        event_time: ev.event_time,
        venue: ev.venue,
        cover_image: ev.cover_image,
        target_page: ev.target_page,
        status: ev.event_status || ev.status,           // Safe mapping for event status
        created_at: ev.created_at,
        updated_at: ev.updated_at
      }));

      return { 
        success: true, 
        events: formattedEvents 
      };
    } catch (error: any) {
      throw new HttpException(`Failed to fetch events: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Create new event securely
  async createEvent(body: any) {
    try {
      const { event_name, day_date, event_time, venue, cover_image, target_page, status } = body;
      
      const result: any = await this.dbService.query(
        `INSERT INTO events (event_name, day_and_date, event_time, venue, cover_image, target_page, event_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [event_name, day_date, event_time, venue, cover_image || null, target_page, status]
      );

      return { 
        success: true, 
        message: 'Event created successfully!', 
        id: result.insertId 
      };
    } catch (error: any) {
      throw new HttpException(`Failed to create event: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update existing event (Automatically updates updated_at timestamp)
  async updateEvent(body: any) {
    try {
      const { id, event_name, day_date, event_time, venue, cover_image, target_page, status } = body;
      
      if (!id) {
        throw new Error('Event ID is required for updating.');
      }

      await this.dbService.query(
        `UPDATE events SET event_name = ?, day_and_date = ?, event_time = ?, venue = ?, cover_image = ?, target_page = ?, event_status = ?, updated_at = NOW() WHERE id = ?`,
        [event_name, day_date, event_time, venue, cover_image || null, target_page, status, id]
      );

      return { 
        success: true, 
        message: 'Event updated successfully!' 
      };
    } catch (error: any) {
      throw new HttpException(`Failed to update event: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete event securely
  async deleteEvent(id: number) {
    try {
      if (!id) {
        throw new Error('Event ID is required for deletion.');
      }

      await this.dbService.query('DELETE FROM events WHERE id = ?', [id]);

      return { 
        success: true, 
        message: 'Event deleted successfully!' 
      };
    } catch (error: any) {
      throw new HttpException(`Failed to delete event: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}