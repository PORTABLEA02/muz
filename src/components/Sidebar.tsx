import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  FileText, 
  Settings, 
  FileBarChart,
  User,
  LogOut,
  Shield,
  UserPlus,
  Clock,
  History
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole = 'administrateur' }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Gestion des adhérents', path: '/admin/adherents' },
    { icon: Upload, label: 'Importation utilisateurs', path: '/admin/import' },
    { icon: FileText, label: 'Gestion des demandes', path: '/admin/demandes' },
    { icon: Settings, label: 'Gestion des services', path: '/admin/services' },
    { icon: FileBarChart, label: 'Logs & Audit', path: '/admin/logs' },
  ];

  const controleurMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Contrôle des demandes', path: '/dashboard' },
  ];

  const memberMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: UserPlus, label: 'Informations familiales', path: '/membre/famille' },
    { icon: FileText, label: 'Demande de service', path: '/membre/demande' },
    { icon: History, label: 'Historique', path: '/membre/historique' },
  ];

  const menuItems = 
    userRole === 'membre' ? memberMenuItems :
    userRole === 'controleur' ? controleurMenuItems :
    adminMenuItems;
    
  const sidebarTitle = 
    userRole === 'membre' ? 'MuSAIB' :
    userRole === 'controleur' ? 'MuSAIB Contrôle' :
    'MuSAIB Admin';

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path;
  };
  return (
    <div className="flex w-full sm:w-64 flex-col bg-white border-r border-gray-200 h-full">
      {/* Header */}
      <div className="flex h-16 items-center px-6 bg-blue-600">
        <Shield className="h-8 w-8 text-white mr-3" />
        <span className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">{sidebarTitle}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleMenuClick(item.path)}
            className={`w-full flex items-center px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className={`mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-center mb-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
              {userRole === 'controleur' ? (
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
              ) : (
                <User className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              )}
            </div>
          </div>
          <div className="ml-2 sm:ml-3 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'email@exemple.com'}
            </p>
          </div>
        </div>
        
        <Link 
          to={
            userRole === 'administrateur' ? '/admin/compte' :
            userRole === 'controleur' ? '/controleur/compte' :
            '/membre/compte'
          }
          className="w-full flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-2"
        >
          <User className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">Mon compte</span>
        </Link>
        
        <button 
          onClick={logout}
          className="w-full flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}