import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import { LogOut, Users, Shield, UserCheck, Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'membre': return <Users className="w-5 h-5" />;
      case 'controleur': return <Shield className="w-5 h-5" />;
      case 'administrateur': return <UserCheck className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'membre': return 'bg-blue-100 text-blue-800';
      case 'controleur': return 'bg-orange-100 text-orange-800';
      case 'administrateur': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Interface spéciale pour l'administrateur et le membre
  if (user?.role === 'administrateur' || user?.role === 'membre' || user?.role === 'controleur') {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar pour desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar userRole={user.role} />
        </div>

        {/* Sidebar mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex w-full max-w-xs sm:max-w-sm flex-1 flex-col bg-white shadow-xl">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <Sidebar userRole={user.role} />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header mobile */}
          <div className="md:hidden">
            <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm border-b">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate px-2">
                {user.role === 'administrateur' ? 'MuSAIB Admin' :
                 user.role === 'controleur' ? 'MuSAIB Contrôle' :
                 'MuSAIB'}
              </h1>
              <div className="w-10"></div> {/* Spacer pour centrer le titre */}
            </div>
          </div>

          {/* Contenu */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <ErrorBoundary
              fallback={
                <div className="p-4 sm:p-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Erreur dans cette section
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Une erreur s'est produite dans cette partie de l'application.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Recharger
                  </button>
                </div>
              }
            >
              {children || <Outlet />}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    );
  }

  // Interface standard pour les autres rôles
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                Gestion de Mutuelle
              </h1>
              {user && (
                <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1 capitalize">{user.role}</span>
                </span>
              )}
            </div>
            
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="hidden sm:block text-xs sm:text-sm text-gray-700">
                  Bienvenue, <span className="font-medium truncate max-w-24 sm:max-w-32">{user.name}</span>
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <ErrorBoundary
          fallback={
            <div className="text-center py-6 sm:py-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Erreur dans cette section
              </h2>
              <p className="text-gray-600 mb-4">
                Une erreur s'est produite dans cette partie de l'application.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Recharger
              </button>
            </div>
          }
        >
          {children || <Outlet />}
        </ErrorBoundary>
      </main>
    </div>
  );
}