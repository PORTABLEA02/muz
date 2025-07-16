import React, { useState } from 'react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemandes } from '../../contexts/DemandeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Eye,
  Download,
  AlertCircle,
  Shield
} from 'lucide-react';

export function GestionDemandes() {
  const { demandes, updateDemandeStatut, loading: demandesLoading } = useDemandes();
  const { user } = useAuth();
  console.log('👤 Utilisateur connecté:', user);
  const [searchParams] = useSearchParams();
  const [selectedDemande, setSelectedDemande] = useState<string | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<string>('acceptee');
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [actionType, setActionType] = useState<'validate' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fonctions utilitaires
  const getTypeLabel = (type: string = '') => {
    const labels = {
      'mariage': 'Allocation Mariage',
      'naissance': 'Allocation Naissance',
      'deces': 'Allocation Décès',
      'pret_social': 'Prêt Social',
      'pret_economique': 'Prêt Économique'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatutLabel = (statut: string = '') => {
    const labels = {
      'en_attente': 'En attente',
      'acceptee': 'Acceptée par le contrôleur',
      'rejetee': 'Rejetée',
      'validee': 'Validée par l\'administrateur'
    };
    return labels[statut as keyof typeof labels] || statut;
  };

  const getStatutColor = (statut: string = '') => {
    const colors = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'acceptee': 'bg-blue-100 text-blue-800',
      'rejetee': 'bg-red-100 text-red-800',
      'validee': 'bg-green-100 text-green-800'
    };
    return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatutIcon = (statut: string = '') => {
    switch (statut) {
      case 'en_attente': return <Clock className="w-4 h-4" />;
      case 'acceptee': return <CheckCircle className="w-4 h-4" />;
      case 'rejetee': return <XCircle className="w-4 h-4" />;
      case 'validee': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Initialiser les filtres selon les paramètres URL
  React.useEffect(() => {
    const statutParam = searchParams.get('statut');
    const typeParam = searchParams.get('type');
    
    if (statutParam) {
      setFiltreStatut(statutParam === 'tous' ? 'acceptee' : statutParam);
    }
    
    if (typeParam) {
      setFiltreType(typeParam);
    }
  }, [searchParams]);

  // Memoized filtering of demands to prevent redundant calculations
  const demandesFiltrees = useMemo(() => {
    return demandes.filter(demande => {
      const matchStatut = filtreStatut === 'tous' || demande.status === filtreStatut;
      const matchType = filtreType === 'tous' || demande.service_type === filtreType;
      
      // Protection contre les valeurs undefined/null
      const typeLabel = getTypeLabel(demande.service_type)?.toLowerCase() || '';
      const memberName = demande.member_name?.toLowerCase() || '';
      const beneficiaryName = demande.beneficiary_name?.toLowerCase() || '';
      const searchTerm = recherche.toLowerCase();
      
      const matchRecherche = 
        typeLabel.includes(searchTerm) ||
        memberName.includes(searchTerm) ||
        beneficiaryName.includes(searchTerm);
      
      return matchStatut && matchType && matchRecherche;
    });
  }, [demandes, filtreStatut, filtreType, recherche]);

  const handleValider = async (demandeId: string) => {
  if (!user) {
    toast.error('Connectez-vous pour valider');
    return;
  }

  setIsProcessing(true);

  try {
    const success = await updateDemandeStatut(
      demandeId, 
      'validee', 
      user.id, 
      user.name, 
      commentaire
    );

    if (success) {
      toast.success('Validé avec succès');
      setSelectedDemande(null);
      setActionType(null);
      setCommentaire('');
      // Option: trigger data refresh
    } else {
      toast.error('La validation a échoué');
    }
  } catch (error) {
    toast.error(`Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`);
    console.error('Validation error:', error);
  } finally {
    setIsProcessing(false);
  }
};
  const handleRejeter = async (demandeId: string) => {
    if (!user || !commentaire.trim()) return;
    
    setIsProcessing(true);
    try {
      const success = await updateDemandeStatut(demandeId, 'rejetee', user.id, user.name, commentaire);
      if (success) {
        setSelectedDemande(null);
        setActionType(null);
        setCommentaire('');
      }
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Memoized statistics to prevent redundant calculations
  const stats = useMemo(() => {
    return {
      total: demandes.length,
      enAttente: demandes.filter(d => d.status === 'en_attente').length,
      acceptees: demandes.filter(d => d.status === 'acceptee').length, // En attente de validation admin
      validees: demandes.filter(d => d.status === 'validee').length,
      rejetees: demandes.filter(d => d.status === 'rejetee').length
    };
  }, [demandes]);

  const demandeSelectionnee = selectedDemande ? demandes.find(d => d.id === selectedDemande) : null;

  // Fonction pour formater les dates de manière sécurisée
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  if (demandesLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des demandes</h1>
          <p className="text-gray-600">Validation finale des demandes acceptées par les contrôleurs ({stats.total} demandes)</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Administrateur</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En attente contrôle</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <button
          onClick={() => setFiltreStatut('acceptee')}
          className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all text-left ${
            filtreStatut === 'acceptee' ? 'ring-2 ring-blue-500 border-blue-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">À valider</p>
              <p className="text-2xl font-bold text-blue-600">{stats.acceptees}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
        </button>

        <button
          onClick={() => setFiltreStatut('validee')}
          className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all text-left ${
            filtreStatut === 'validee' ? 'ring-2 ring-green-500 border-green-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Validées</p>
              <p className="text-2xl font-bold text-green-600">{stats.validees}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </button>

        <button
          onClick={() => setFiltreStatut('rejetee')}
          className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all text-left ${
            filtreStatut === 'rejetee' ? 'ring-2 ring-red-500 border-red-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejetees}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="acceptee">À valider (Acceptées)</option>
              <option value="validee">Validées</option>
              <option value="rejetee">Rejetées</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de service</label>
            <select
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tous">Tous les types</option>
              <option value="mariage">Allocation Mariage</option>
              <option value="naissance">Allocation Naissance</option>
              <option value="deces">Allocation Décès</option>
              <option value="pret_social">Prêt Social</option>
              <option value="pret_economique">Prêt Économique</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltreStatut('acceptee');
                setFiltreType('tous');
                setRecherche('');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Information sur le rôle administrateur */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-purple-600 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-purple-900 mb-1">Rôle Administrateur</h3>
            <p className="text-sm text-purple-800">
              En tant qu'administrateur, vous validez définitivement les demandes acceptées par les contrôleurs. 
              Une fois validées, les demandes peuvent être traitées pour paiement.
            </p>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Demandes ({demandesFiltrees.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filtreStatut === 'acceptee' ? 'Demandes en attente de votre validation' : 
             filtreStatut === 'validee' ? 'Demandes que vous avez validées' :
             filtreStatut === 'rejetee' ? 'Demandes rejetées' :
             'Toutes les demandes'}
          </p>
        </div>
        
        {demandesFiltrees.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande trouvée</h3>
            <p className="text-gray-500">
              {filtreStatut === 'acceptee' ? 'Aucune demande en attente de validation' :
               'Aucune demande ne correspond à vos critères de recherche'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {demandesFiltrees.map((demande) => (
              <div key={demande.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {getTypeLabel(demande.service_type)} - {demande.beneficiary_name || 'Bénéficiaire inconnu'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(demande.status)}`}>
                        {getStatutIcon(demande.status)}
                        <span className="ml-1">{getStatutLabel(demande.status)}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{getTypeLabel(demande.service_type)}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {demande.member_name || 'Membre inconnu'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Soumise le {formatDate(demande.submission_date)}
                      </div>
                      {demande.amount && (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {demande.amount.toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Bénéficiaire: {demande.beneficiary_name || 'Inconnu'} ({demande.beneficiary_relation || 'Relation inconnue'})
                    </p>
                    
                    {/* Informations de traitement */}
                    {demande.controller_name && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Contrôleur:</span> {demande.controller_name}
                        {demande.processing_date && (
                          <span> • Traité le {formatDate(demande.processing_date)}</span>
                        )}
                      </div>
                    )}
                    
                    {demande.administrator_name && (
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Administrateur:</span> {demande.administrator_name}
                        {demande.validation_date && (
                          <span> • Validé le {formatDate(demande.validation_date)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDemande(demande.id);
                        setActionType(null);
                        setCommentaire('');
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Examiner
                    </button>
                    
                    {demande.status === 'acceptee' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDemande(demande.id);
                            setActionType('validate');
                            setCommentaire('');
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Valider
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDemande(demande.id);
                            setActionType('reject');
                            setCommentaire('');
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails/validation */}
      {demandeSelectionnee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {actionType === 'validate' ? 'Valider la demande' :
                 actionType === 'reject' ? 'Rejeter la demande' :
                 'Détails de la demande'}
              </h3>
              <button
                onClick={() => {
                  setSelectedDemande(null);
                  setActionType(null);
                  setCommentaire('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 mb-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Informations de la demande</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700">Type de service</h5>
                      <p className="text-sm text-gray-600">{getTypeLabel(demandeSelectionnee.service_type)}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700">Bénéficiaire</h5>
                      <p className="text-sm text-gray-600">
                        {demandeSelectionnee.beneficiary_name || 'Inconnu'} ({demandeSelectionnee.beneficiary_relation || 'Relation inconnue'})
                      </p>
                    </div>

                    {demandeSelectionnee.amount && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Montant</h5>
                        <p className="text-sm text-gray-600 font-medium">{demandeSelectionnee.amount.toLocaleString()} FCFA</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-sm font-medium text-gray-700">Statut actuel</h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(demandeSelectionnee.status)}`}>
                        {getStatutIcon(demandeSelectionnee.status)}
                        <span className="ml-1">{getStatutLabel(demandeSelectionnee.status)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Informations de traitement</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700">Membre demandeur</h5>
                      <p className="text-sm text-gray-600">{demandeSelectionnee.member_name || 'Membre inconnu'}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700">Date de soumission</h5>
                      <p className="text-sm text-gray-600">{formatDate(demandeSelectionnee.submission_date)}</p>
                    </div>

                    {demandeSelectionnee.controller_name && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Contrôleur</h5>
                        <p className="text-sm text-gray-600">
                          {demandeSelectionnee.controller_name}
                          {demandeSelectionnee.processing_date && (
                            <span className="text-gray-500"> • {formatDate(demandeSelectionnee.processing_date)}</span>
                          )}
                        </p>
                      </div>
                    )}

                    {demandeSelectionnee.administrator_name && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Administrateur</h5>
                        <p className="text-sm text-gray-600">
                          {demandeSelectionnee.administrator_name}
                          {demandeSelectionnee.validation_date && (
                            <span className="text-gray-500"> • {formatDate(demandeSelectionnee.validation_date)}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pièce justificative */}
              {demandeSelectionnee.justification_document && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Pièce justificative</h5>
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{demandeSelectionnee.justification_document.nom || 'Document sans nom'}</p>
                        <p className="text-xs text-gray-500">
                          {demandeSelectionnee.justification_document.taille ? 
                            (demandeSelectionnee.justification_document.taille / 1024 / 1024).toFixed(2) + ' MB' : 
                            'Taille inconnue'} • 
                          Uploadé le {formatDate(demandeSelectionnee.justification_document.dateUpload)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (demandeSelectionnee.justification_document?.url) {
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
                          if (demandeSelectionnee.justification_document?.url) {
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

              {/* Commentaire précédent */}
              {demandeSelectionnee.comment && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Commentaire du contrôleur</h5>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{demandeSelectionnee.comment}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions de validation/rejet */}
            {demandeSelectionnee.status === 'acceptee' && actionType && (
              <>
                <div className="mb-6">
                  <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire administrateur {actionType === 'reject' ? '(requis pour le rejet)' : '(optionnel)'}
                  </label>
                  <textarea
                    id="commentaire"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={actionType === 'reject' ? 'Motif du rejet (obligatoire)...' : 'Ajoutez un commentaire sur votre décision...'}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800 mb-1">Attention - Décision finale</h3>
                      <p className="text-sm text-yellow-700">
                        {actionType === 'validate' ? (
                          <>
                            <strong>Valider</strong> : La demande sera définitivement approuvée et pourra être traitée pour paiement. 
                            Cette action est irréversible.
                          </>
                        ) : (
                          <>
                            <strong>Rejeter</strong> : La demande sera définitivement rejetée et ne pourra plus être traitée. 
                            Un commentaire explicatif est obligatoire. Cette action est irréversible.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {actionType === 'validate' && (
                    <button
                      onClick={() => handleValider(demandeSelectionnee.id)}
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Validation...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Valider définitivement
                        </>
                      )}
                    </button>
                  )}
                  
                  {actionType === 'reject' && (
                    <button
                      onClick={() => handleRejeter(demandeSelectionnee.id)}
                      disabled={!commentaire.trim() || isProcessing}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Rejet...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeter définitivement
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedDemande(null);
                      setActionType(null);
                      setCommentaire('');
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}

            {/* Bouton fermer pour les demandes non-modifiables */}
            {(demandeSelectionnee.status !== 'acceptee' || !actionType) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedDemande(null);
                    setActionType(null);
                    setCommentaire('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}