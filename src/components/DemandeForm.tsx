import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemandeFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDemandes } from '../contexts/DemandeContext';
import { useFamille } from '../contexts/FamilleContext';
import { DemandService } from '../services/demandService';
import { X, CreditCard, Building, Smartphone, User } from 'lucide-react';


export function DemandeForm() {
  const { user } = useAuth();
  const { createDemande } = useDemandes();
  const { getMembresFamilleByMembre, membresFamille } = useFamille();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  
  const [userFamilyMembers, setUserFamilyMembers] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(true);

  // Load family members for the current user
  React.useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!user) {
        setUserFamilyMembers([]);
        setLoadingFamily(false);
        return;
      }

      try {
        setLoadingFamily(true);
        const familyData = await getMembresFamilleByMembre(user.id);
        setUserFamilyMembers(Array.isArray(familyData) ? familyData : []);
      } catch (error) {
        console.error('Error loading family members:', error);
        setUserFamilyMembers([]);
      } finally {
        setLoadingFamily(false);
      }
    };

    loadFamilyMembers();
  }, [user, getMembresFamilleByMembre, membresFamille]); // Ajouter membresFamille pour se mettre à jour quand les données changent
  
  // Montants prédéfinis pour chaque type de service
  const montantsServices = {
    'mariage': 50000,
    'naissance': 25000,
    'deces': 75000,
    'pret_social': 0, // Montant libre pour prêt social
    'pret_economique': 0 // Montant libre pour prêt économique
  };

  const [formData, setFormData] = useState<DemandeFormData>({
    type: 'mariage',
    beneficiaireId: user?.id || '',
    beneficiaireNom: user?.name || '',
    beneficiaireRelation: 'Adhérent',
    montant: montantsServices['mariage'],
    pieceJointe: undefined,
    dateSurvenance: '',
    paiement: {
      modePaiement: 'mobile_money'
    }
  });

  const [errors, setErrors] = useState<Partial<DemandeFormData>>({});
  const [dateError, setDateError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DemandeFormData) => {
    if (user) {
      setIsSubmitting(true);
      try {
        const success = await createDemande(data, user.id, user.name);
        if (success) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error submitting demand:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Fonction pour valider la date de survenance
  const validateEventDate = (date: string, eventType: string): boolean => {
    if (!date) return true; // Si pas de date, on laisse passer pour l'instant
    
    // Ne valider que pour les allocations (pas les prêts)
    if (eventType.includes('pret')) return true;
    
    const eventDate = new Date(date);
    const currentDate = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    
    if (eventDate <= oneYearAgo) {
      setDateError("L'événement est déjà vieux de 1 an, cette demande ne peut pas être soumise");
      return false;
    }
    
    setDateError('');
    return true;
  };

  // Fonction pour obtenir le label de la date selon le type
  const getDateLabel = (type: string): string => {
    switch (type) {
      case 'mariage': return 'Date du mariage';
      case 'naissance': return 'Date de naissance';
      case 'deces': return 'Date du décès';
      default: return 'Date de l\'événement';
    }
  };

  // Vérifier si le type nécessite une date
  const requiresEventDate = (type: string): boolean => {
    return ['mariage', 'naissance', 'deces'].includes(type);
  };
  const getRelationLabel = (relation: string) => {
    const labels = {
      'epoux': 'Époux',
      'epouse': 'Épouse',
      'enfant': 'Enfant',
      'pere': 'Père',
      'mere': 'Mère',
      'beau_pere': 'Beau-père',
      'belle_mere': 'Belle-mère'
    };
    return labels[relation as keyof typeof labels] || relation;
  };

  const typeOptions = [
    { value: 'mariage', label: 'Allocation Mariage' },
    { value: 'naissance', label: 'Allocation Naissance' },
    { value: 'deces', label: 'Allocation Décès' },
    { value: 'pret_social', label: 'Prêt Social' },
    { value: 'pret_economique', label: 'Prêt Économique' }
  ];

  // Liste des bénéficiaires possibles (adhérent + famille)
  const beneficiaires = [
    {
      id: user?.id || '',
      nom: user?.name || '',
      relation: 'Adhérent'
    },
    ...userFamilyMembers.map(membre => ({
      id: membre.id,
      nom: `${membre.first_name} ${membre.last_name}`,
      relation: getRelationLabel(membre.relation)
    }))
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Partial<DemandeFormData> = {};
    if (!formData.beneficiaireId) newErrors.beneficiaireId = 'Le bénéficiaire est requis';
    
    // Validation de la date de survenance pour les allocations
    if (requiresEventDate(formData.type)) {
      if (!formData.dateSurvenance) {
        newErrors.dateSurvenance = `La ${getDateLabel(formData.type).toLowerCase()} est requise`;
      } else if (!validateEventDate(formData.dateSurvenance, formData.type)) {
        newErrors.dateSurvenance = dateError;
      }
      
      // Validation de la pièce justificative pour les allocations
      if (!formData.fichierPieceJointe && !formData.pieceJointe?.trim()) {
        newErrors.pieceJointe = 'Une pièce justificative est requise pour ce type de demande';
      }
    }
    
    // Validation des informations de paiement
    if (formData.paiement.modePaiement === 'mobile_money') {
      if (!formData.paiement.numeroAbonnement?.trim()) {
        newErrors.beneficiaireId = 'Le numéro d\'abonnement est requis pour Mobile Money';
     } else {
       const numeroClean = formData.paiement.numeroAbonnement.replace(/\s/g, '');
       if (numeroClean.length < 9) {
         newErrors.beneficiaireId = 'Le numéro d\'abonnement doit contenir au moins 9 chiffres';
       } else if (!/^\d+$/.test(numeroClean)) {
         newErrors.beneficiaireId = 'Le numéro d\'abonnement ne doit contenir que des chiffres';
       }
      }
      if (!formData.paiement.nomAbonne?.trim()) {
        newErrors.beneficiaireNom = 'Le nom de l\'abonné est requis pour Mobile Money';
      }
    } else if (formData.paiement.modePaiement === 'virement_bancaire') {
      if (!formData.paiement.compteBancaire?.trim()) {
        newErrors.beneficiaireId = 'Le compte bancaire est requis pour le virement';
      }
      if (!formData.paiement.nomCompte?.trim()) {
        newErrors.beneficiaireNom = 'Le nom du compte est requis pour le virement';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    handleSubmit(formData);
  };

  const handleChange = (field: keyof DemandeFormData, value: string | number) => {
    if (field === 'type') {
      // Mettre à jour le montant automatiquement selon le type
      const nouveauMontant = montantsServices[value as keyof typeof montantsServices];
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        montant: nouveauMontant,
        dateSurvenance: '' // Réinitialiser la date quand on change de type
      }));
      setDateError(''); // Réinitialiser l'erreur de date
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validation en temps réel pour la date de survenance
    if (field === 'dateSurvenance' && requiresEventDate(formData.type)) {
      validateEventDate(value as string, formData.type);
    }
  };

  const handleBeneficiaireChange = (beneficiaireId: string) => {
    const beneficiaire = beneficiaires.find(b => b.id === beneficiaireId);
    if (beneficiaire) {
      setFormData(prev => ({
        ...prev,
        beneficiaireId: beneficiaire.id,
        beneficiaireNom: beneficiaire.nom,
        beneficiaireRelation: beneficiaire.relation
      }));
    }
  };

  const handlePaiementChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      paiement: { ...prev.paiement, [field]: value }
    }));
  };

  const handleModePaiementChange = (mode: 'mobile_money' | 'virement_bancaire' | 'cheque') => {
    setFormData(prev => ({ 
      ...prev, 
      paiement: { modePaiement: mode }
    }));
  };

  if (!showForm) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mb-4"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Demande de service</h1>
          <p className="text-sm sm:text-base text-gray-600">Créez une nouvelle demande de service</p>
        </div>
        
        {loadingFamily ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="w-5 h-5 mr-2" />
            Nouvelle demande
          </button>
        </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mb-4"
        >
          ← Retour au dashboard
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Nouvelle Demande</h1>
        <p className="text-sm sm:text-base text-gray-600">Remplissez le formulaire pour soumettre votre demande</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Type de demande
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="beneficiaire" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Bénéficiaire de la demande
            </label>
            {loadingFamily ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : (
            <select
              id="beneficiaire"
              value={formData.beneficiaireId}
              onChange={(e) => handleBeneficiaireChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.beneficiaireId ? 'border-red-500' : 'border-gray-300'
              } text-sm`}
            >
              <option value="">Sélectionner un bénéficiaire</option>
              {beneficiaires.map(beneficiaire => (
                <option key={beneficiaire.id} value={beneficiaire.id}>
                  {beneficiaire.nom} ({beneficiaire.relation})
                </option>
              ))}
            </select>
            )}
            {errors.beneficiaireId && <p className="text-red-500 text-xs mt-1">{errors.beneficiaireId}</p>}
          </div>

          {/* Champ date de survenance pour les allocations */}
          {requiresEventDate(formData.type) && (
            <div>
              <label htmlFor="dateSurvenance" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {getDateLabel(formData.type)} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dateSurvenance"
                value={formData.dateSurvenance || ''}
                onChange={(e) => handleChange('dateSurvenance', e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Ne pas permettre de dates futures
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.dateSurvenance || dateError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {(errors.dateSurvenance || dateError) && (
                <p className="text-red-500 text-xs mt-1">{errors.dateSurvenance || dateError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Les événements de plus d'un an ne peuvent pas faire l'objet d'une demande
              </p>
            </div>
          )}

          {/* Affichage du bénéficiaire sélectionné */}
          {formData.beneficiaireNom && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-900">Bénéficiaire sélectionné</p>
                  <p className="text-xs sm:text-sm text-blue-800 truncate">
                    {formData.beneficiaireNom} - {formData.beneficiaireRelation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(formData.type.includes('pret') || formData.type === 'mariage') && (
            <div>
              <label htmlFor="montant" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Montant (FCFA) {formData.type !== 'pret_social' && formData.type !== 'pret_economique' && <span className="text-xs text-gray-500">(montant fixe)</span>}
              </label>
              <input
                type="number"
                id="montant"
                value={formData.montant || ''}
                onChange={(e) => handleChange('montant', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  formData.type !== 'pret_social' && formData.type !== 'pret_economique' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="0"
                min="0"
                max={formData.type === 'pret_economique' ? '2000000' : undefined}
                disabled={formData.type !== 'pret_social' && formData.type !== 'pret_economique'}
                readOnly={formData.type !== 'pret_social' && formData.type !== 'pret_economique'}
              />
              {formData.type !== 'pret_social' && formData.type !== 'pret_economique' && (
                <p className="text-xs text-gray-500 mt-1">
                  Montant fixe défini par la mutuelle pour ce type de service
                </p>
              )}
              {formData.type === 'pret_economique' && (
                <p className="text-xs text-blue-600 mt-1">
                  Vous pouvez saisir le montant souhaité (maximum 2 000 000 FCFA)
                </p>
              )}
              {formData.type === 'pret_social' && (
                <p className="text-xs text-blue-600 mt-1">
                  Vous pouvez saisir le montant souhaité (maximum 500 000 FCFA)
                </p>
              )}
            </div>
          )}

          {/* Section Mode de paiement */}
          <div className="border-t pt-4 sm:pt-6">
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Informations de paiement</h4>
            
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Mode de paiement
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleModePaiementChange('mobile_money')}
                  className={`flex items-center justify-center p-2 sm:p-3 border rounded-lg transition-colors text-xs sm:text-sm ${
                    formData.paiement.modePaiement === 'mobile_money'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Mobile Money
                </button>
                
                <button
                  type="button"
                  onClick={() => handleModePaiementChange('virement_bancaire')}
                  className={`flex items-center justify-center p-2 sm:p-3 border rounded-lg transition-colors text-xs sm:text-sm ${
                    formData.paiement.modePaiement === 'virement_bancaire'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Virement bancaire
                </button>
                
                <button
                  type="button"
                  onClick={() => handleModePaiementChange('cheque')}
                  className={`flex items-center justify-center p-2 sm:p-3 border rounded-lg transition-colors text-xs sm:text-sm ${
                    formData.paiement.modePaiement === 'cheque'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Chèque
                </button>
              </div>
            </div>

            {/* Champs spécifiques selon le mode de paiement */}
            {formData.paiement.modePaiement === 'mobile_money' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="numeroAbonnement" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Numéro d'abonnement
                  </label>
                  <input
                   type="tel"
                    id="numeroAbonnement"
                    value={formData.paiement.numeroAbonnement || ''}
                   onChange={(e) => {
                     // Ne permettre que les chiffres et les espaces
                     const value = e.target.value.replace(/[^\d\s]/g, '');
                     handlePaiementChange('numeroAbonnement', value);
                   }}
                   onKeyPress={(e) => {
                     // Empêcher la saisie de caractères non numériques (sauf espaces)
                     if (!/[0-9\s]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                       e.preventDefault();
                     }
                   }}
                   maxLength={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Votre numéro de téléphone"
                  />
                 <p className="text-xs text-gray-500 mt-1">Format: 77 XXX XX XX (chiffres et espaces uniquement)</p>
                </div>
                <div>
                  <label htmlFor="nomAbonne" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Nom de l'abonné
                  </label>
                  <input
                    type="text"
                    id="nomAbonne"
                    value={formData.paiement.nomAbonne || ''}
                    onChange={(e) => handlePaiementChange('nomAbonne', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Votre nom complet"
                  />
                </div>
              </div>
            )}

            {formData.paiement.modePaiement === 'virement_bancaire' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="compteBancaire" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Compte bancaire
                  </label>
                  <input
                    type="text"
                    id="compteBancaire"
                    value={formData.paiement.compteBancaire || ''}
                    onChange={(e) => handlePaiementChange('compteBancaire', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Votre numéro de compte bancaire"
                  />
                </div>
                <div>
                  <label htmlFor="nomCompte" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Nom du compte
                  </label>
                  <input
                    type="text"
                    id="nomCompte"
                    value={formData.paiement.nomCompte || ''}
                    onChange={(e) => handlePaiementChange('nomCompte', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Nom du titulaire du compte"
                  />
                </div>
              </div>
            )}

            {formData.paiement.modePaiement === 'cheque' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-800">
                  Pour le paiement par chèque, vous recevrez les instructions détaillées après validation de votre demande.
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pieceJointe" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Pièce justificative {requiresEventDate(formData.type) ? <span className="text-red-500">*</span> : '(optionnel)'}
            </label>
            
            {/* Zone de téléchargement de fichier */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="pieceJointe"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Stocker le fichier dans le state
                    setFormData(prev => ({
                      ...prev,
                      pieceJointe: file,
                      fichierPieceJointe: file
                    }));
                    // Effacer l'erreur si elle existe
                    if (errors.pieceJointe) {
                      setErrors(prev => ({ ...prev, pieceJointe: undefined }));
                    }
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="pieceJointe"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600 mb-1">
                  Cliquez pour sélectionner un fichier
                </span>
                <span className="text-xs text-gray-500">
                  PDF, JPG, PNG, DOC (max. 5MB)
                </span>
              </label>
            </div>
            
            {/* Fichier sélectionné */}
            {formData.pieceJointe && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <span className="text-sm text-blue-800 font-medium">
                        {formData.pieceJointe.name}
                      </span>
                      <div className="text-xs text-blue-600">
                        {(formData.pieceJointe.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        pieceJointe: undefined,
                        fichierPieceJointe: undefined
                      }));
                      // Réinitialiser l'input file
                      const fileInput = document.getElementById('pieceJointe') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
            
            {/* Messages d'aide selon le type de demande */}
            <div className="mt-2 text-xs text-gray-600">
              {formData.type === 'mariage' && (
                <p>• Certificat de mariage ou acte de mariage requis</p>
              )}
              {formData.type === 'naissance' && (
                <p>• Acte de naissance ou certificat de naissance requis</p>
              )}
              {formData.type === 'deces' && (
                <p>• Acte de décès ou certificat de décès requis</p>
              )}
              {formData.type === 'pret_social' && (
                <p>• Justificatifs de revenus, pièce d'identité (optionnel)</p>
              )}
              {formData.type === 'pret_economique' && (
                <p>• Business plan, justificatifs financiers (optionnel)</p>
              )}
            </div>
            
            {/* Erreur de validation */}
            {errors.pieceJointe && (
              <p className="text-red-500 text-xs mt-1">{errors.pieceJointe}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="submit"
              disabled={!!dateError || isSubmitting}
              className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm font-medium ${
                dateError || isSubmitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Soumission...' : 'Soumettre'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
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