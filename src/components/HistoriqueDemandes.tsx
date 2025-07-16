import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DemandService } from '../services/demandService';
import { Calendar, DollarSign, FileText, Filter, Search, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';

export function HistoriqueDemandes() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [selectedDemande, setSelectedDemande] = useState<string | null>(null);
  const [mesDemandes, setMesDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Charger les demandes du membre
  React.useEffect(() => {
    const loadDemandes = async () => {
      if (!user) {
        setMesDemandes([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const demandes = await DemandService.getDemandsByMember(user.id);
        setMesDemandes(Array.isArray(demandes) ? demandes : []);
      } catch (error) {
        console.error('Error loading demandes:', error);
        setMesDemandes([]);
      } finally {
        setLoading(false);
      }
    };

    loadDemandes();
  }, [user]);

  // Initialiser les filtres selon les paramètres URL
  React.useEffect(() => {
    const statutParam = searchParams.get('statut');
    const typeParam = searchParams.get('type');
    
    if (statutParam) {
      if (statutParam === 'en_attente') {
        setFiltreStatut('en_attente');
      } else if (statutParam === 'approuvees') {
        setFiltreStatut('acceptee'); // On filtre sur acceptee pour les approuvées
      } else if (statutParam === 'validees') {
        setFiltreStatut('validee');
      } else if (statutParam === 'rejetees') {
        setFiltreStatut('rejetee');
      }
    }
    
    if (typeParam) {
      setFiltreType(typeParam);
    }
  }, [searchParams]);
  // Fonctions utilitaires
  const getStatutLabel = (statut: string) => {
    const labels = {
      'en_attente': 'En attente',
      'acceptee': 'Acceptée',
      'rejetee': 'Rejetée',
      'validee': 'Validée'
    };
    return labels[statut as keyof typeof labels] || statut;
  };

  const getStatutColor = (statut: string) => {
    const colors = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'acceptee': 'bg-blue-100 text-blue-800',
      'rejetee': 'bg-red-100 text-red-800',
      'validee': 'bg-green-100 text-green-800'
    };
    return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <Clock className="w-4 h-4" />;
      case 'acceptee': return <CheckCircle className="w-4 h-4" />;
      case 'rejetee': return <XCircle className="w-4 h-4" />;
      case 'validee': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'mariage': 'Allocation Mariage',
      'naissance': 'Allocation Naissance',
      'deces': 'Allocation Décès',
      'pret_social': 'Prêt Social',
      'pret_economique': 'Prêt Économique'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Filtrage des demandes
  const demandesFiltrees = mesDemandes.filter(demande => {
    const matchStatut = filtreStatut === 'tous' || demande.status === filtreStatut;
    
    // Pour les approuvées, on inclut à la fois acceptee et validee
    const matchStatutApprouvees = filtreStatut === 'acceptee' && (demande.status === 'acceptee' || demande.status === 'validee');
    
    const matchType = filtreType === 'tous' || demande.service_type === filtreType;
    const matchRecherche = demande.beneficiary_name.toLowerCase().includes(recherche.toLowerCase()) ||
                          getTypeLabel(demande.service_type).toLowerCase().includes(recherche.toLowerCase());
    
    return (matchStatut || matchStatutApprouvees) && matchType && matchRecherche;
  });

  const demandeSelectionnee = selectedDemande ? mesDemandes.find(d => d.id === selectedDemande) : null;
  console.log('demandeSelectionnee:', demandeSelectionnee);
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mb-4"
        >
          ← Retour au dashboard
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Historique des demandes</h1>
        <p className="text-sm sm:text-base text-gray-600">Consultez toutes vos demandes passées et leur statut</p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="acceptee">Approuvées (Acceptée + Validée)</option>
              <option value="rejetee">Rejetée</option>
              <option value="validee">Validée</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="tous">Tous les types</option>
              <option value="mariage">Allocation Mariage</option>
              <option value="naissance">Allocation Naissance</option>
              <option value="deces">Allocation Décès</option>
              <option value="pret_social">Prêt Social</option>
              <option value="pret_economique">Prêt Économique</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => {
                setFiltreStatut('tous');
                setFiltreType('tous');
                setRecherche('');
                // Nettoyer les paramètres URL
                navigate('/membre/historique', { replace: true });
              }}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm"
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{mesDemandes.length}</div>
          <div className="text-xs sm:text-sm text-gray-600">Total demandes</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{mesDemandes.filter(d => d.status === 'en_attente').length}</div>
          <div className="text-xs sm:text-sm text-gray-600">En attente</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-2xl font-bold text-green-600">{mesDemandes.filter(d => d.status === 'acceptee' || d.status === 'validee').length}</div>
          <div className="text-xs sm:text-sm text-gray-600">Approuvées</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-xl sm:text-2xl font-bold text-red-600">{mesDemandes.filter(d => d.status === 'rejetee').length}</div>
          <div className="text-xs sm:text-sm text-gray-600">Rejetées</div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Demandes ({demandesFiltrees.length})
          </h3>
        </div>
        
        {demandesFiltrees.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucune demande trouvée</h3>
            <p className="text-sm sm:text-base text-gray-500">Aucune demande ne correspond à vos critères de recherche</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {demandesFiltrees.map((demande) => (
              <div key={demande.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                        {getTypeLabel(demande.service_type)} - {demande.beneficiary_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(demande.status)}`}>
                        {getStatutIcon(demande.status)}
                        <span className="ml-1">{getStatutLabel(demande.status)}</span>
                      </span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{getTypeLabel(demande.service_type)}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3">
                      Bénéficiaire: {demande.beneficiary_name} ({demande.beneficiary_relation})
                    </p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Soumise le {new Date(demande.submission_date).toLocaleDateString('fr-FR')}
                      </div>
                      {demande.amount && (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {demande.amount.toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedDemande(demande.id)}
                    className="sm:ml-4 inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {demandeSelectionnee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Détails de la demande</h3>
              <button
                onClick={() => setSelectedDemande(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">
                  {getTypeLabel(demandeSelectionnee.service_type)} - {demandeSelectionnee.beneficiary_name}
                </h4>
                <p className="text-sm text-gray-600">{getTypeLabel(demandeSelectionnee.service_type)}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Bénéficiaire</h5>
                <p className="text-sm text-gray-600">{demandeSelectionnee.beneficiary_name} ({demandeSelectionnee.beneficiary_relation})</p>
              </div>

              {demandeSelectionnee.amount && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Montant</h5>
                  <p className="text-sm text-gray-600">{demandeSelectionnee.amount.toLocaleString()} FCFA</p>
                </div>
              )}

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Statut</h5>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(demandeSelectionnee.status)}`}>
                  {getStatutIcon(demandeSelectionnee.status)}
                  <span className="ml-1">{getStatutLabel(demandeSelectionnee.status)}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Date de soumission</h5>
                  <p className="text-sm text-gray-600">{new Date(demandeSelectionnee.submission_date).toLocaleDateString('fr-FR')}</p>
                </div>

                {demandeSelectionnee.processing_date && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Date de traitement</h5>
                    <p className="text-sm text-gray-600">{new Date(demandeSelectionnee.processing_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>

              {demandeSelectionnee.justification_document && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Pièce justificative</h5>
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {demandeSelectionnee.justification_document.nom || 'Nom inconnu'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {demandeSelectionnee.justification_document.taille
                            ? (demandeSelectionnee.justification_document.taille / 1024 / 1024).toFixed(2) + ' MB'
                            : 'Taille inconnue'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (demandeSelectionnee.justification_document.url) {
                            window.open(demandeSelectionnee.justification_document.url, '_blank');
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </button>
                      <button
                        onClick={() => {
                          if (demandeSelectionnee.justification_document.url) {
                            const link = document.createElement('a');
                            link.href = demandeSelectionnee.justification_document.url;
                            link.download = demandeSelectionnee.justification_document.nom || 'document';
                            link.click();
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
