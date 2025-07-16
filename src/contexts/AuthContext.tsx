import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthService, type AuthUser } from '../services/authService';
import { AuditService } from '../services/auditService';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updatePassword: (newPassword: string) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking current user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const authUser = await AuthService.signIn(email, password);
      
      if (authUser) {
        setUser(authUser);
        
        // Log de connexion
        await AuditService.createLog(
          'Connexion utilisateur',
          `Connexion réussie pour ${authUser.email}`,
          'success',
          'Authentification'
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Log d'erreur de connexion
      await AuditService.createLog(
        'Erreur de connexion',
        `Tentative de connexion échouée pour ${email}`,
        'error',
        'Authentification'
      );
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Log de déconnexion
        await AuditService.createLog(
          'Déconnexion utilisateur',
          `Déconnexion de ${user.email}`,
          'info',
          'Authentification'
        );
      }
      
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const success = await AuthService.updatePassword(newPassword);
      
      if (success && user) {
        // Recharger complètement le profil utilisateur depuis Supabase
        // pour s'assurer que l'état est synchronisé avec la source de vérité
        const refreshedUser = await AuthService.getCurrentUser();
        if (refreshedUser) {
          setUser(refreshedUser);
        }
        
        // Log de changement de mot de passe
        await AuditService.createLog(
          'Changement de mot de passe',
          `Mot de passe modifié pour ${refreshedUser?.email || user.email}`,
          'success',
          'Sécurité'
        );
      }
    } catch (error) {
      console.error('Update password error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, updatePassword, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}