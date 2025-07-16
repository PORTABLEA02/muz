import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import { AuditService } from './auditService';

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Update profile error:', error);
        return false;
      }

      // Log de mise à jour de profil
      await AuditService.createLog(
        'Mise à jour profil',
        `Profil mis à jour pour l'utilisateur ${userId}`,
        'info',
        'Administration'
      );

      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  }

  static async activateUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (error) {
        console.error('Activate user error:', error);
        return false;
      }

      await AuditService.createLog(
        'Activation utilisateur',
        `Utilisateur ${userId} activé`,
        'success',
        'Administration'
      );

      return true;
    } catch (error) {
      console.error('Activate user error:', error);
      return false;
    }
  }

  static async suspendUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        console.error('Suspend user error:', error);
        return false;
      }

      await AuditService.createLog(
        'Suspension utilisateur',
        `Utilisateur ${userId} suspendu`,
        'warning',
        'Administration'
      );

      return true;
    } catch (error) {
      console.error('Suspend user error:', error);
      return false;
    }
  }

  static async getAllProfiles(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get all profiles error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get all profiles error:', error);
      return [];
    }
  }

  static async createProfile(profileData: Omit<Profile, 'id' | 'created_at'>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Create profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create profile error:', error);
      return null;
    }
  }

  static async deleteProfile(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Delete profile error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete profile error:', error);
      return false;
    }
  }
}