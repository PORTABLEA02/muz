import React, { useState } from 'react';
import { MembreFamilleFormData, MembreFamille } from '../types';
import { X, User, Calendar, Users, Upload } from 'lucide-react';

interface FamilleFormProps {
  onSubmit: (data: MembreFamilleFormData) => Promise<boolean>;
  onCancel: () => void;
  canAddRelation: (relation: MembreFamille['relation']) => boolean;
}

export function FamilleForm({ onSubmit, onCancel, canAddRelation }: FamilleFormProps) {
  const [formData, setFormData] = useState<MembreFamilleFormData>({
    nom: '',
    prenom: '',
    npi: '',
    acteNaissance: '',
    dateNaissance: '',
    relation: 'enfant',
    pieceJustificative: undefined
  });

  const [errors, setErrors] = useState<Partial<MembreFamilleFormData>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const relationOptions = [
    { value: 'epoux', label: 'Époux' },
    { value: 'epouse', label: 'Épouse' },
    { value: 'enfant', label: 'Enfant' },
    { value: 'pere', label: 'Père' },
    { value: 'mere', label: 'Mère' },
    { value: 'beau_pere', label: 'Beau-père' },
    { value: 'belle_mere', label: 'Belle-mère' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Partial<MembreFamilleFormData> = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
   if (!formData.npi.trim()) {
     newErrors.npi = 'Le numéro NPI est requis';
   } else if (formData.npi.length < 10) {
     newErrors.npi = 'Le numéro NPI doit contenir au moins 10 chiffres';
   } else if (!/^\d+$/.test(formData.npi)) {
     newErrors.npi = 'Le numéro NPI ne doit contenir que des chiffres';
   }
    if (!formData.acteNaissance.trim()) newErrors.acteNaissance = 'L\'acte de naissance est requis';
    if (!formData.dateNaissance) newErrors.dateNaissance = 'La date de naissance est requise';
    
    // Validation de la pièce justificative
    if (!formData.pieceJustificative) {
      newErrors.pieceJustificative = 'Une pièce justificative est requise';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Préparer les données pour le service
      const familyData = {
        first_name: formData.prenom,
        last_name: formData.nom,
        npi: formData.npi,
        birth_certificate_ref: formData.acteNaissance,
        date_of_birth: formData.dateNaissance,
        relation: formData.relation,
        justification_document: formData.pieceJustificative
      };
      
      const success = await onSubmit(familyData);
      if (success) {
        setFormData({ 
          nom: '', 
          prenom: '', 
          npi: '', 
          acteNaissance: '', 
          dateNaissance: '', 
          relation: 'enfant',
          pieceJustificative: undefined
        });
        setErrors({});
      } else {
        setErrors({ relation: 'Impossible d\'ajouter ce type de membre (limite atteinte ou déjà existant)' });
      }
    } catch (error) {
      console.error('Error submitting family member:', error);
      setErrors({ relation: 'Erreur lors de l\'ajout du membre de famille' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof MembreFamilleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Ajouter un membre de famille</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
              {relationOptions.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={!canAddRelation(option.value as MembreFamille['relation'])}
                >
                  {option.label} {!canAddRelation(option.value as MembreFamille['relation']) ? '(Non disponible)' : ''}
                </option>
              ))}
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
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nom ? 'border-red-500' : 'border-gray-300'
              } text-sm`}
              placeholder="Nom de famille"
            />
            {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
          </div>

          <div>
            <label htmlFor="prenom" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              type="text"
              id="prenom"
              value={formData.prenom}
              onChange={(e) => handleChange('prenom', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.prenom ? 'border-red-500' : 'border-gray-300'
              } text-sm`}
              placeholder="Prénom"
            />
            {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
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
               // Ne permettre que les chiffres
               const value = e.target.value.replace(/\D/g, '');
               handleChange('npi', value);
             }}
             onKeyPress={(e) => {
               // Empêcher la saisie de caractères non numériques
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
              value={formData.dateNaissance}
              onChange={(e) => handleChange('dateNaissance', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.dateNaissance ? 'border-red-500' : 'border-gray-300'
              } text-sm`}
            />
            {errors.dateNaissance && <p className="text-red-500 text-xs mt-1">{errors.dateNaissance}</p>}
          </div>

          <div>
            <label htmlFor="acteNaissance" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Acte de naissance
            </label>
            <input
              type="text"
              id="acteNaissance"
              value={formData.acteNaissance}
              onChange={(e) => handleChange('acteNaissance', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.acteNaissance ? 'border-red-500' : 'border-gray-300'
              } text-sm`}
              placeholder="Référence de l'acte de naissance"
            />
            {errors.acteNaissance && <p className="text-red-500 text-xs mt-1">{errors.acteNaissance}</p>}
          </div>

          <div>
            <label htmlFor="pieceJustificative" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Pièce justificative <span className="text-red-500">*</span>
            </label>
            
            {/* Zone de téléchargement de fichier */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="pieceJustificative"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData(prev => ({
                      ...prev,
                      pieceJustificative: file
                    }));
                    // Effacer l'erreur si elle existe
                    if (errors.pieceJustificative) {
                      setErrors(prev => ({ ...prev, pieceJustificative: undefined }));
                    }
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="pieceJustificative"
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
            
            {/* Fichier sélectionné */}
            {formData.pieceJustificative && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <span className="text-sm text-blue-800 font-medium">
                        {formData.pieceJustificative.name}
                      </span>
                      <div className="text-xs text-blue-600">
                        {(formData.pieceJustificative.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        pieceJustificative: undefined
                      }));
                      // Réinitialiser l'input file
                      const fileInput = document.getElementById('pieceJustificative') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
            
            {/* Messages d'aide selon la relation */}
            <div className="mt-2 text-xs text-gray-600">
              {formData.relation === 'epoux' || formData.relation === 'epouse' ? (
                <p>• Certificat de mariage ou livret de famille requis</p>
              ) : formData.relation === 'enfant' ? (
                <p>• Acte de naissance ou livret de famille requis</p>
              ) : formData.relation === 'pere' || formData.relation === 'mere' ? (
                <p>• Acte de naissance de l'adhérent ou livret de famille requis</p>
              ) : (
                <p>• Document prouvant le lien de parenté requis</p>
              )}
            </div>
            
            {/* Erreur de validation */}
            {errors.pieceJustificative && (
              <p className="text-red-500 text-xs mt-1">{errors.pieceJustificative}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm font-medium ${
                isSubmitting 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm font-medium ${
                isSubmitting
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}