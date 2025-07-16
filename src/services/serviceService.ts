import { supabase } from '../lib/supabase';
import type { Service } from '../lib/supabase';

export class ServiceService {
  static async getServices(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get services error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get services error:', error);
      return [];
    }
  }

  static async getActiveServices(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get active services error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get active services error:', error);
      return [];
    }
  }

  static async getServiceByName(name: string): Promise<Service | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        console.error('Get service by name error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get service by name error:', error);
      return null;
    }
  }

  static async createService(serviceData: Omit<Service, 'id' | 'created_at'>): Promise<Service | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (error) {
        console.error('Create service error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create service error:', error);
      return null;
    }
  }

  static async updateService(serviceId: string, updates: Partial<Service>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId);

      if (error) {
        console.error('Update service error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update service error:', error);
      return false;
    }
  }

  static async deleteService(serviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Delete service error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete service error:', error);
      return false;
    }
  }

  static async toggleServiceStatus(serviceId: string): Promise<boolean> {
    try {
      // D'abord récupérer le statut actuel
      const { data: service, error: getError } = await supabase
        .from('services')
        .select('is_active')
        .eq('id', serviceId)
        .single();

      if (getError) {
        console.error('Get service status error:', getError);
        return false;
      }

      // Inverser le statut
      const { error: updateError } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', serviceId);

      if (updateError) {
        console.error('Toggle service status error:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Toggle service status error:', error);
      return false;
    }
  }
}