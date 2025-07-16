import React, { useState } from 'react';
import { AuditService } from '../../services/auditService';
import type { AuditLog } from '../../lib/supabase';
import { 
  Activity, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export function LogsAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [filtreModule, setFiltreModule] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  // Charger les logs depuis Supabase
  React.useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const logsData = await AuditService.getLogs();
        setLogs(logsData);
      } catch (error) {
        console.error('Error loading logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const logsFiltres = logs.filter(log => {
    const matchType = filtreType === 'tous' || log.log_type === filtreType;
    const matchModule = filtreModule === 'tous' || log.module === filtreModule;
    const matchRecherche = 
      (log.user_name || '').toLowerCase().includes(recherche.toLowerCase()) ||
      log.action.toLowerCase().includes(recherche.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(recherche.toLowerCase());
    
    let matchDate = true;
    if (dateDebut || dateFin) {
      const logDate = new Date(log.log_timestamp);
      if (dateDebut) matchDate = matchDate && logDate >= new Date(dateDebut);
      if (dateFin) matchDate = matchDate && logDate <= new Date(dateFin + 'T23:59:59');
    }
    
    return matchType && matchModule && matchRecherche && matchDate;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return 'Succès';
      case 'warning': return 'Avertissement';
      case 'error': return 'Erreur';
      default: return 'Information';
    }
  };

  const stats = {
    total: logs.length,
    info: logs.filter(l => l.log_type === 'info').length,
    success: logs.filter(l => l.log_type === 'success').length,
    warning: logs.filter(l => l.log_type === 'warning').length,
    error: logs.filter(l => l.log_type === 'error').length
  };

  const modules = [...new Set(logs.map(log => log.module))];

  const exportLogs = () => {
    const csvContent = [
      'Date,Utilisateur,Action,Détails,Type,Module',
      ...logsFiltres.map(log => 
        `"${new Date(log.log_timestamp).toLocaleString('fr-FR')}","${log.user_name || 'Système'}","${log.action}","${log.details || ''}","${getTypeLabel(log.log_type)}","${log.module}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs & Audit</h1>
          <p className="text-gray-600">Suivi des activités et audit de sécurité ({stats.total} entrées)</p>
        </div>
        <button 
          onClick={exportLogs}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter les logs
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Info</p>
              <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Succès</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avertissements</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Erreurs</p>
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tous">Tous les types</option>
              <option value="info">Information</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissement</option>
              <option value="error">Erreur</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select
              value={filtreModule}
              onChange={(e) => setFiltreModule(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tous">Tous les modules</option>
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltreType('tous');
                setFiltreModule('tous');
                setRecherche('');
                setDateDebut('');
                setDateFin('');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Entrées de log ({logsFiltres.length})
          </h3>
        </div>
        
        {logsFiltres.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune entrée trouvée</h3>
            <p className="text-gray-500">Aucune entrée de log ne correspond à vos critères de recherche</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logsFiltres.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(log.log_type)}
                      <h3 className="text-lg font-medium text-gray-900">{log.action}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(log.log_type)}`}>
                        {getTypeLabel(log.log_type)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {log.module}
                      </span>
                    </div>
                    
                    {log.details && (
                      <p className="text-sm text-gray-600 mb-3">{log.details}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {log.user_name || 'Système'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(log.log_timestamp).toLocaleString('fr-FR')}
                      </div>
                      {log.ip_address && (
                        <div className="flex items-center">
                          <span className="w-4 h-4 mr-1">🌐</span>
                          {log.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}