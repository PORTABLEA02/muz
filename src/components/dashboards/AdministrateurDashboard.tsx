import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDemandes } from '../../contexts/DemandeContext';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  FileText,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';

export function AdministrateurDashboard() {
  const { user } = useAuth();
  const { demandes, loading: demandesLoading } = useDemandes();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les données au montage du composant
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { ProfileService } = await import('../../services/profileService');
        const profilesData = await ProfileService.getAllProfiles();
        setProfiles(profilesData);
      } catch (error) {
        console.error('Error loading admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calcul des statistiques
  const totalAdherents = profiles.filter(p => p.role === 'membre').length;
  const demandesEnAttente = demandes.filter(d => d.status === 'acceptee').length;
  const demandesTraitees = demandes.filter(d => d.status === 'validee').length;
  const demandesCeMois = demandes.filter(d => {
    const date = new Date(d.submission_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  // Calculer les changements par rapport au mois précédent
  const demandesMoisPrecedent = demandes.filter(d => {
    const date = new Date(d.submission_date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
  }).length;

  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
  };

  if (loading || demandesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total adhérents',
      value: totalAdherents,
      change: '—', // Pas de comparaison temporelle pour le total
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      path: '/admin/adherents'
    },
    {
      title: 'Demandes en attente',
      value: demandesEnAttente,
      change: '—', // Statut instantané, pas de comparaison temporelle
      icon: Clock,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      path: '/admin/demandes?statut=acceptee'
    },
    {
      title: 'Demandes traitées',
      value: demandesTraitees,
      change: '—', // Statut instantané, pas de comparaison temporelle
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      path: '/admin/demandes?statut=validee'
    },
    {
      title: 'Demandes ce mois',
      value: demandesCeMois,
      change: calculateChange(demandesCeMois, demandesMoisPrecedent),
      icon: FileText,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      path: '/admin/demandes'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Administrateur</h1>
        <p className="text-gray-600">Vue d'ensemble de la plateforme MuSAIB</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <button 
            key={index} 
            onClick={() => navigate(stat.path)}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left group cursor-pointer w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'
                }`}>
                  <TrendingUp className="inline w-4 h-4 mr-1" />
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.iconBg} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor} group-hover:text-blue-600 transition-colors`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Évolution des demandes */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des demandes</h3>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Graphique des demandes par mois</p>
              <p className="text-xs text-gray-500 mt-2">Données chargées depuis Supabase</p>
            </div>
          </div>
        </div>

        {/* Répartition par service */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par service</h3>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Répartition des adhérents par service</p>
              <p className="text-xs text-gray-500 mt-2">Données chargées depuis Supabase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Logs d'audit récents</p>
              <p className="text-xs text-gray-500 mt-2">Données chargées depuis Supabase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}