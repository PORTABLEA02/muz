import { supabase } from '../lib/supabase';
import type { Demand } from '../lib/supabase';
import { StorageService } from './storageService';

export interface DemandFormData {
  service_type: string;
  beneficiary_name: string;
  beneficiary_relation: string;
  amount?: number;
  event_date?: string;
  justification_document?: File;
  payment_info?: any;
}

export class DemandService {
  static async getDemands(): Promise<Demand[]> {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get demands error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get demands error:', error);
      return [];
    }
  }

  static async getDemandsByMember(memberId: string): Promise<Demand[]> {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get demands by member error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get demands by member error:', error);
      return [];
    }
  }

  static async getDemandsByStatus(status: string): Promise<Demand[]> {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get demands by status error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get demands by status error:', error);
      return [];
    }
  }

  static async createDemand(memberId: string, memberName: string, demandData: DemandFormData): Promise<Demand | null> {
    try {
      let justificationDoc = null;
      
      // Upload du fichier si présent
      if (demandData.justification_document) {
        const uploadResult = await StorageService.uploadFile(
          demandData.justification_document,
          'demands'
        );
        
        if (uploadResult) {
          justificationDoc = {
            nom: uploadResult.name,
            url: uploadResult.url,
            path: uploadResult.path,
            taille: uploadResult.size,
            dateUpload: new Date().toISOString()
          };
        }
      }

      const { data, error } = await supabase
        .from('demands')
        .insert([{
          member_id: memberId,
          member_name: memberName,
          service_type: demandData.service_type,
          beneficiary_name: demandData.beneficiary_name,
          beneficiary_relation: demandData.beneficiary_relation,
          amount: demandData.amount,
          event_date: demandData.event_date,
          justification_document: justificationDoc,
          payment_info: demandData.payment_info
        }])
        .select()
        .single();

      if (error) {
        console.error('Create demand error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create demand error:', error);
      return null;
    }
  }

  static async updateDemandStatus(
    demandId: string, 
    status: 'acceptee' | 'rejetee' | 'validee',
    userId: string,
    userName: string,
    comment?: string
  ): Promise<boolean> {
    try {
      const updates: any = {
        status,
        comment
      };

      if (status === 'acceptee' || status === 'rejetee') {
        updates.controller_id = userId;
        updates.controller_name = userName;
        updates.processing_date = new Date().toISOString().split('T')[0];
      } else if (status === 'validee') {
        updates.administrator_id = userId;
        updates.administrator_name = userName;
        updates.validation_date = new Date().toISOString().split('T')[0];
      } else if (status === 'rejetee' && updates.administrator_id) {
        // Si c'est un rejet par l'administrateur, on garde les infos admin
        updates.administrator_id = userId;
        updates.administrator_name = userName;
        updates.validation_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('demands')
        .update(updates)
        .eq('id', demandId);

      if (error) {
        console.error('Update demand status error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update demand status error:', error);
      return false;
    }
  }

  static async deleteDemand(demandId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('demands')
        .delete()
        .eq('id', demandId);

      if (error) {
        console.error('Delete demand error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete demand error:', error);
      return false;
    }
  }

  static async getDemandsByRole(role: string, userId?: string): Promise<Demand[]> {
    try {
      let query = supabase.from('demands').select('*');

      switch (role) {
        case 'membre':
          if (userId) {
            query = query.eq('member_id', userId);
          }
          break;
        case 'controleur':
          // Le contrôleur voit toutes les demandes
          break;
        case 'administrateur':
          // L'admin ne voit que les demandes acceptées par le contrôleur
          query = query.eq('status', 'acceptee');
          break;
        default:
          return [];
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Get demands by role error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get demands by role error:', error);
      return [];
    }
  }
}