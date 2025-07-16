import React, { useState } from 'react';
import type { FamilyMember } from '../lib/supabase';
import type { FamilyMemberFormData } from '../services/familyService';
import { X, User, Calendar, Users, Upload, Save, AlertCircle } from 'lucide-react';

interface FamilleEditFormProps {
  membre: FamilyMember;
  onSave: (id: string, data: Partial<FamilyMemberFormData>) => Promise<boolean>;
  onCancel: () => void;
  canAddRelation: (relation: FamilyMember['relation'], currentId?: string) => boolean;
}

export function FamilleEditForm({ membre, onSave, onCancel, canAddRelation }: FamilleEditFormProps) {
  const [formData, setFormData] = useState<FamilyMemberFormData>({
    first_name: membre.first_name,
    last_name: membre.last_name,
    npi: membre.npi,
    birth_certificate_ref: membre.birth_certificate_ref,
    date_of_birth: membre.date_of_birth,
    relation: membre.relation,
    justification_document: undefined
  });

  const [errors, setErrors] = useState<Partial<FamilyMemberFormData>>({});
  const [removeJustificationDocument, setRemoveJustificationDocument] = useState(false);

  const relationOptions = [
    { value: 'epoux', label: 'Époux' },
    { value: 'epouse', label: 'Épouse' },
    { value: 'enfant', label: 'Enfant' },
    { value: 'pere', label: 'Père' },
    { value: 'mere', label: 'Mère' },
    { value: 'beau_pere', label: 'Beau-père' },
    { value: 'belle_mere', label: 'Belle-mère' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Partial<FamilyMemberFormData> = {};
    if (!formData.last_name.trim()) newErrors.last_name = 'Le nom est requis';
    if (!formData.first_name.trim()) newErrors.first_name = 'Le prénom est requis';
    if (!formData.npi.trim()) {
      newErrors.npi = 'Le numéro NPI est requis';
    } else if (formData.npi.length < 10) {
      newErrors.npi = 'Le numéro NPI doit contenir au moins 10 chiffres';
    } else if (!/^\d+$/.test(formData.npi)) {
      newErrors.npi = 'Le numéro NPI ne doit contenir que des chiffres';
    }
    if (!formData.birth_certificate_ref.trim()) newErrors.birth_certificate_ref = 'L\'acte de naissance est requis';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'La date de naissance est requise';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Préparer les données à sauvegarder
    const dataToSave: Partial<FamilyMemberFormData> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      npi: formData.npi,
      birth_certificate_ref: formData.birth_certificate_ref,
      date_of_birth: formData.date_of_birth,
      relation: formData.relation
    };

    // Gérer la pièce justificative
    if (formData.justification_document) {
      dataToSave.justification_document = formData.justification_document;
    } else if (removeJustificationDocument) {
      // Marquer pour suppression
      dataToSave.justification_document = null as any;
    }

    const success = onSave(membre.id, dataToSave);
    if (success) {
      onCancel();
    } else {
      setErrors({ relation: 'Impossible de modifier ce type de membre (limite atteinte ou déjà existant)' });
    }
  };

  const handleChange = (field: keyof FamilyMemberFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            Modifier le membre de famille
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Informations actuelles */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Informations actuelles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800">
            <div><span className="font-medium">Nom :</span> {membre.last_name}</div>
            <div><span className="font-medium">Prénom :</span> {membre.first_name}</div>
            <div><span className="font-medium">Âge :</span> {calculateAge(membre.date_of_birth)} ans</div>
            <div><span className="font-medium">Ajouté le :</span> {new Date(membre.date_added).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="relation" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Relation
              </label>
              <select
                id="relation"
                value={formData.relation}
                onChange={(e) => handleChange('relation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {relationOptions.map(option => {
                  const isAvailable = option.value === membre.relation || canAddRelation(option.value as FamilyMember['relation'], membre.id);
                  return (
                    <option 
                      key={option.value} 
                      value={option.value}
                      disabled={!isAvailable}
                    >
                      {option.label} {!isAvailable ? '(Non disponible)' : ''}
                    </option>
                  );
                })}
              </select>
              {errors.relation && <p className="text-red-500 text-xs mt-1">{errors.relation}</p>}
            </div>

            <div>
              <label htmlFor="nom" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                id="nom"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                } text-sm`}
                placeholder="Nom de famille"
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
            </div>

            <div>
              <label htmlFor="prenom" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                id="prenom"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                } text-sm`}
                placeholder="Prénom"
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>

            <div>
              <label htmlFor="npi" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Numéro NPI
              </label>
              <input
                type="tel"
                id="npi"
                value={formData.npi}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  handleChange('npi', value);
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                    e.preventDefault();
                  }
                }}
                maxLength={13}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.npi ? 'border-red-500' : 'border-gray-300'
                } text-sm`}
                placeholder="1234567890123"
              />
              <p className="text-xs text-gray-500 mt-1">13 chiffres maximum</p>
              {errors.npi && <p className="text-red-500 text-xs mt-1">{errors.npi}</p>}
            </div>

            <div>
              <label htmlFor="dateNaissance" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                id="dateNaissance"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                } text-sm`}
              />
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
            </div>

            <div>
              <label htmlFor="acteNaissance" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Acte de naissance
              </label>
              <input
                type="text"
                id="acteNaissance"
                value={formData.birth_certificate_ref}
                onChange={(e) => handleChange('birth_certificate_ref', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.birth_certificate_ref ? 'border-red-500' : 'border-gray-300'
                } text-sm`}
                placeholder="Référence de l'acte de naissance"
              />
              {errors.birth_certificate_ref && <p className="text-red-500 text-xs mt-1">{errors.birth_certificate_ref}</p>}
            </div>
          </div>

          {/* Pièce justificative actuelle */}
          {membre.justification_document && !removeJustificationDocument && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Pièce justificative actuelle
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {membre.justification_document.nom}
                      </span>
                      <div className="text-xs text-gray-500">
                        {(membre.justification_document.taille / 1024 / 1024).toFixed(2)} MB • 
                        Uploadé le {new Date(membre.justification_document.dateUpload).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveJustificationDocument(true)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nouvelle pièce justificative */}
          {(removeJustificationDocument || !membre.justification_document) && (
            <div>
              <label htmlFor="justificationDocument" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                {removeJustificationDocument ? 'Nouvelle pièce justificative' : 'Pièce justificative'}
                {!membre.justification_document && <span className="text-red-500"> *</span>}
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="justificationDocument"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({
                        ...prev,
                        justification_document: file
                      }));
                      if (errors.justification_document) {
                        setErrors(prev => ({ ...prev, justification_document: undefined }));
                      }
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="justificationDocument"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 mb-1">
                    Cliquez pour sélectionner un fichier
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, JPG, PNG, DOC (max. 5MB)
                  </span>
                </label>
              </div>
              
              {formData.justification_document && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <span className="text-sm text-blue-800 font-medium">
                          {formData.justification_document.name}
                        </span>
                        <div className="text-xs text-blue-600">
                          {(formData.justification_document.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          justification_document: undefined
                        }));
                        const fileInput = document.getElementById('justificationDocument') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}

              {removeJustificationDocument && (
                <button
                  type="button"
                  onClick={() => setRemoveJustificationDocument(false)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Conserver la pièce justificative actuelle
                </button>
              )}
            </div>
          )}

          {/* Avertissement administrateur */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-orange-900 mb-1">Modification administrative</h4>
                <p className="text-sm text-orange-800">
                  En tant qu'administrateur, vous pouvez modifier toutes les informations de ce membre de famille. 
                  Ces modifications seront enregistrées dans les logs d'audit.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les modifications
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}