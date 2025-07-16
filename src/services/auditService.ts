import { supabase } from '../lib/supabase';
import type { AuditLog } from '../lib/supabase';

export class AuditService {
  static async getLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('log_timestamp', { ascending: false });

      if (error) {
        console.error('Get logs error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get logs error:', error);
      return [];
    }
  }

  static async createLog(
    action: string,
    details?: string,
    logType: 'info' | 'warning' | 'error' | 'success' = 'info',
    module: string = 'System'
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('log_action', {
        p_action: action,
        p_details: details,
        p_log_type: logType,
        p_module: module
      });

      if (error) {
        console.error('Create log error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Create log error:', error);
      return false;
    }
  }

  static async getLogsByModule(module: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('module', module)
        .order('log_timestamp', { ascending: false });

      if (error) {
        console.error('Get logs by module error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get logs by module error:', error);
      return [];
    }
  }

  static async getLogsByType(logType: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('log_type', logType)
        .order('log_timestamp', { ascending: false });

      if (error) {
        console.error('Get logs by type error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get logs by type error:', error);
      return [];
    }
  }

  static async getLogsByUser(userId: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_timestamp', { ascending: false });

      if (error) {
        console.error('Get logs by user error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get logs by user error:', error);
      return [];
    }
  }
}