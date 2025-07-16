import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import { AuditService } from './auditService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'membre' | 'controleur' | 'administrateur';
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
  lastPasswordChange?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'membre' | 'controleur' | 'administrateur';
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
  lastPasswordChange?: string;
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        return null;
      }

      if (!authData.user) {
        return null;
      }

      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        return null;
      }

      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        mustChangePassword: profile.must_change_password,
        isFirstLogin: profile.is_first_login,
        lastPasswordChange: profile.last_password_change
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return null;
    }
  }

  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Get current user error:', error);
        return null;
      }

      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        mustChangePassword: profile.must_change_password,
        isFirstLogin: profile.is_first_login,
        lastPasswordChange: profile.last_password_change
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async updatePassword(newPassword: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('Update password error:', updateError);
        return false;
      }

      // Mettre à jour le profil
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            must_change_password: false,
            is_first_login: false,
            last_password_change: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      return true;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  }

  static async createUser(email: string, password: string, userData: {
    full_name: string;
    role: 'membre' | 'controleur' | 'administrateur';
    phone?: string;
    address?: string;
    service?: string;
  }): Promise<AuthUser | null> {
    try {
      // Obtenir le token d'authentification actuel
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No valid session found');
        return null;
      }

      // Appeler l'Edge Function pour créer l'utilisateur
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      console.log('Regis infos Calling Supabase Function:', apiUrl); 
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create user error:', errorData);
        throw new Error(errorData.error || 'Failed to create user');
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('Create user failed:', result);
        return null;
      }

      // Log de création d'utilisateur
      await AuditService.createLog(
        'Création utilisateur',
        `Nouvel utilisateur créé: ${userData.full_name} (${email})`,
        'success',
        'Administration'
      );

      return result.user;
      
    } catch (error) {
      console.error('Create user error:', error);
      return null;
    }
  }

  static async resetUserPassword(userId: string, email: string): Promise<boolean> {
    try {
      // Obtenir le token d'authentification actuel
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No valid session found');
        return false;
      }

      // Appeler l'Edge Function pour réinitialiser le mot de passe
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Reset password error:', errorData);
        return false;
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('Reset password failed:', result);
        return false;
      }

      // Marquer que l'utilisateur doit changer son mot de passe
      await supabase
        .from('profiles')
        .update({
          must_change_password: true,
          is_first_login: true
        })
        .eq('id', userId);

      // Log de réinitialisation
      await AuditService.createLog(
        'Réinitialisation mot de passe',
        `Mot de passe réinitialisé pour ${email}`,
        'info',
        'Administration'
      );

      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }
}