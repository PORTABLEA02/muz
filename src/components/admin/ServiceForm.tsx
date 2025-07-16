import React, { useState } from 'react';
import { 
  X, 
  Save, 
  DollarSign,
  FileText,
  Settings,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react';

interface Service {
  id?: string;
  nom: string;
  description: string;
  montant: number | null;
  type: 'allocation' | 'pret';
  conditions: string[];
  actif: boolean;
}

interface ServiceFormProps {
  service?: Service;
  onClose: () => void;
  onSubmit: (service: Service) => void;
  isEditing?: boolean;
}

export function ServiceForm({ service, onClose, onSubmit, isEditing = false }: ServiceFormProps) {
  const [formData, setFormData] = useState<Service>({
    nom: service?.nom || '',
    description: service?.description || '',
    montant: service?.montant || null,
    type: service?.type || 'allocation',
    conditions: service?.conditions || [''],
    actif: service?.actif ?? true,
    ...(service?.id && { id: service.id })
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Service, string>>>({});

  const handleChange = (field: keyof Service, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConditionChange = (index: number, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = value;
    setFormData(prev => ({ ...prev, conditions: newConditions }));
  };

  const addCondition = () => {
    setFormData(prev => ({ 
      ...prev, 
      conditions: [...prev.conditions, ''] 
    }));
  };

  const removeCondition = (index: number) => {
    if (formData.conditions.length > 1) {
      const newConditions = formData.conditions.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, conditions: newConditions }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Service, string>> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du service est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (formData.type === 'allocation' && (!formData.montant || formData.montant <= 0)) {
      newErrors.montant = 'Le montant est requis pour les allocations';
    }

    // Vérifier que toutes les conditions sont remplies
    const emptyConditions = formData.conditions.filter(c => !c.trim());
    if (emptyConditions.length > 0) {
      newErrors.conditions = 'Toutes les conditions doivent être remplies';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Nettoyer les conditions vides
    const cleanedService = {
      ...formData,
      conditions: formData.conditions.filter(c => c.trim()),
      montant: formData.type === 'pret' ? null : formData.montant
    };

    onSubmit(cleanedService);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Modifier le service' : 'Nouveau service'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Informations générales</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du service <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Settings className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nom ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Allocation Mariage"
                  />
                </div>
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Description détaillée du service"
                  />
                </div>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de service <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as 'allocation' | 'pret')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="allocation">Allocation</option>
                  <option value="pret">Prêt</option>
                </select>
              </div>

              {formData.type === 'allocation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.montant || ''}
                      onChange={(e) => handleChange('montant', parseInt(e.target.value) || null)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.montant ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  {errors.montant && <p className="text-red-500 text-xs mt-1">{errors.montant}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Montant fixe pour ce type d'allocation
                  </p>
                </div>
              )}

              {formData.type === 'pret' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Prêt :</strong> Le montant sera défini par le membre lors de sa demande, 
                    selon les conditions d'éligibilité.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conditions d'éligibilité */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Conditions d'éligibilité</h4>
            <div className="space-y-3">
              {formData.conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => handleConditionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Condition ${index + 1}`}
                  />
                  {formData.conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addCondition}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une condition
              </button>
              
              {errors.conditions && <p className="text-red-500 text-xs mt-1">{errors.conditions}</p>}
            </div>
          </div>

          {/* Statut */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Statut du service</h4>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => handleChange('actif', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="actif" className="text-sm font-medium text-gray-700">
                Service actif
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Les services inactifs ne sont pas disponibles pour les membres
            </p>
          </div>

          {/* Avertissement pour modification */}
          {isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">Attention</h4>
                  <p className="text-sm text-yellow-800">
                    La modification de ce service peut affecter les demandes en cours. 
                    Assurez-vous que les changements sont appropriés.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Enregistrer les modifications' : 'Créer le service'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}