import React, { useState } from 'react';
import { Settings, Plus, Edit, Trash2, DollarSign, Calendar, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { ServiceForm } from './ServiceForm';
import { ServiceService } from '../../services/serviceService';

interface Service {
  id: string;
  nom: string;
  description: string;
  montant: number;
  type: 'allocation' | 'pret';
  conditions: string[];
  actif: boolean;
  dateCreation: string;
}

export function GestionServices() {
  const [services, setServices] = useState<Service[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    action: 'delete' | 'toggle' | null;
    service: Service | null;
  }>({ show: false, action: null, service: null });

  // Charger les services depuis Supabase
  React.useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const servicesData = await ServiceService.getServices();
        // Convertir les données Supabase vers le format local
        const convertedServices = servicesData.map(service => ({
          id: service.id,
          nom: service.name,
          description: service.description || '',
          montant: service.default_amount || 0,
          type: service.type as 'allocation' | 'pret',
          conditions: service.conditions || [],
          actif: service.is_active,
          dateCreation: service.created_at
        }));
        setServices(convertedServices);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleCreateService = async (serviceData: any) => {
    try {
      setLoading(true);
      
      // Convertir vers le format Supabase
      const supabaseService = {
        name: serviceData.nom,
        description: serviceData.description,
        default_amount: serviceData.montant,
        type: serviceData.type,
        conditions: serviceData.conditions,
        is_active: serviceData.actif
      };
      
      const newService = await ServiceService.createService(supabaseService);
      
      if (newService) {
        // Convertir la réponse vers le format local
        const convertedService = {
          id: newService.id,
          nom: newService.name,
          description: newService.description || '',
          montant: newService.default_amount || 0,
          type: newService.type as 'allocation' | 'pret',
          conditions: newService.conditions || [],
          actif: newService.is_active,
          dateCreation: newService.created_at
        };
        
        setServices(prev => [...prev, convertedService]);
        setShowForm(false);
        showSuccessMessage(`Le service "${serviceData.nom}" a été créé avec succès.`);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      showSuccessMessage('Erreur lors de la création du service.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async (serviceData: any) => {
    if (!editingService) return;
    
    try {
      setLoading(true);
      
      // Convertir vers le format Supabase
      const supabaseUpdates = {
        name: serviceData.nom,
        description: serviceData.description,
        default_amount: serviceData.montant,
        type: serviceData.type,
        conditions: serviceData.conditions,
        is_active: serviceData.actif
      };
      
      const success = await ServiceService.updateService(editingService.id, supabaseUpdates);
      
      if (success) {
        // Mettre à jour localement
        setServices(prev => prev.map(service => 
          service.id === editingService.id 
            ? { ...service, ...serviceData }
            : service
        ));
        setEditingService(null);
        setShowForm(false);
        showSuccessMessage(`Le service "${serviceData.nom}" a été modifié avec succès.`);
      }
    } catch (error) {
      console.error('Error updating service:', error);
      showSuccessMessage('Erreur lors de la modification du service.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      setLoading(true);
      const success = await ServiceService.toggleServiceStatus(service.id);
      
      if (success) {
        setServices(prev => prev.map(s => 
          s.id === service.id 
            ? { ...s, actif: !s.actif }
            : s
        ));
        showSuccessMessage(
          `Le service "${service.nom}" a été ${service.actif ? 'désactivé' : 'activé'} avec succès.`
        );
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
      showSuccessMessage('Erreur lors du changement de statut du service.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    try {
      setLoading(true);
      const success = await ServiceService.deleteService(service.id);
      
      if (success) {
        setServices(prev => prev.filter(s => s.id !== service.id));
        showSuccessMessage(`Le service "${service.nom}" a été supprimé avec succès.`);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      showSuccessMessage('Erreur lors de la suppression du service.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (action: 'delete' | 'toggle', service: Service) => {
    setConfirmModal({ show: true, action, service });
  };

  const executeAction = () => {
    if (!confirmModal.service || !confirmModal.action) return;

    if (confirmModal.action === 'delete') {
      handleDeleteService(confirmModal.service);
    } else if (confirmModal.action === 'toggle') {
      handleToggleStatus(confirmModal.service);
    }

    setConfirmModal({ show: false, action: null, service: null });
  };

  const getTypeColor = (type: string) => {
    return type === 'allocation' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getTypeLabel = (type: string) => {
    return type === 'allocation' ? 'Allocation' : 'Prêt';
  };

  const stats = {
    total: services.length,
    actifs: services.filter(s => s.actif).length,
    allocations: services.filter(s => s.type === 'allocation').length,
    prets: services.filter(s => s.type === 'pret').length
  };

  return (
    <div className="p-6">
      {/* Message de succès */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des services</h1>
          <p className="text-gray-600">Configurez les services offerts par la mutuelle ({stats.total} services)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau service
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total services</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Services actifs</p>
              <p className="text-3xl font-bold text-green-600">{stats.actifs}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Allocations</p>
              <p className="text-3xl font-bold text-blue-600">{stats.allocations}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Prêts</p>
              <p className="text-3xl font-bold text-green-600">{stats.prets}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des services */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Services configurés</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {services.map((service) => (
            <div key={service.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{service.nom}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(service.type)}`}>
                      {getTypeLabel(service.type)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {service.montant.toLocaleString()} FCFA
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Créé le {new Date(service.dateCreation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions d'éligibilité :</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {service.conditions.map((condition, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setShowForm(true);
                    }}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </button>
                  
                  <button
                    onClick={() => confirmAction('toggle', service)}
                    disabled={loading}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${
                      service.actif 
                        ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                        : 'text-green-700 bg-green-100 hover:bg-green-200'
                    }`}
                  >
                    {service.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  
                  <button
                    onClick={() => confirmAction('delete', service)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avertissement pour les services inactifs */}
      {services.some(s => !s.actif) && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-1">Services inactifs détectés</h3>
              <p className="text-sm text-yellow-700">
                Certains services sont actuellement inactifs et ne sont pas disponibles pour les membres. 
                Activez-les pour permettre aux membres de soumettre des demandes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {confirmModal.show && confirmModal.service && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer l'action
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmModal.action === 'delete' ? (
                <>
                  Êtes-vous sûr de vouloir supprimer le service{' '}
                  <span className="font-medium">"{confirmModal.service.nom}"</span> ?
                  Cette action est irréversible.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir {confirmModal.service.actif ? 'désactiver' : 'activer'} le service{' '}
                  <span className="font-medium">"{confirmModal.service.nom}"</span> ?
                </>
              )}
            </p>
            
            {confirmModal.action === 'delete' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Attention :</strong> La suppression d'un service peut affecter 
                  les demandes existantes qui utilisent ce service.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={executeAction}
                disabled={loading}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${
                  confirmModal.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {loading ? 'Traitement...' : 'Confirmer'}
              </button>
              <button
                onClick={() => setConfirmModal({ show: false, action: null, service: null })}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création/modification */}
      {showForm && (
        <ServiceForm
          service={editingService || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingService(null);
          }}
          onSubmit={editingService ? handleUpdateService : handleCreateService}
          isEditing={!!editingService}
        />
      )}
    </div>
  );
}