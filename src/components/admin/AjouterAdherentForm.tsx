import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Eye, 
  EyeOff, 
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AdherentFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  service: string;
  motDePasse: string;
  confirmerMotDePasse: string;
}

interface AjouterAdherentFormProps {
  onClose: () => void;
  onSubmit: (data: AdherentFormData) => void;
}

export function AjouterAdherentForm({ onClose, onSubmit }: AjouterAdherentFormProps) {
  const [formData, setFormData] = useState<AdherentFormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    service: '',
    motDePasse: '',
    confirmerMotDePasse: ''
  });

  const [errors, setErrors] = useState<Partial<AdherentFormData>>({});
  const [showPasswords, setShowPasswords] = useState({
    motDePasse: false,
    confirmerMotDePasse: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const services = [
    'Informatique',
    'Comptabilité',
    'Ressources Humaines',
    'Marketing',
    'Administration',
    'Finance',
    'Commercial',
    'Technique',
    'Logistique',
    'Autre'
  ];

  const handleChange = (field: keyof AdherentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AdherentFormData> = {};

    // Validation des champs obligatoires
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    
    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation téléphone
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.service.trim()) newErrors.service = 'Le service est requis';

    // Validation mot de passe
    if (!formData.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    } else if (formData.motDePasse.length < 8) {
      newErrors.motDePasse = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.motDePasse)) {
      newErrors.motDePasse = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    // Validation confirmation mot de passe
    if (!formData.confirmerMotDePasse) {
      newErrors.confirmerMotDePasse = 'La confirmation est requise';
    } else if (formData.motDePasse !== formData.confirmerMotDePasse) {
      newErrors.confirmerMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'adhérent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { label: 'Très faible', color: 'text-red-600' };
      case 2: return { label: 'Faible', color: 'text-orange-600' };
      case 3: return { label: 'Moyen', color: 'text-yellow-600' };
      case 4: return { label: 'Fort', color: 'text-green-600' };
      case 5: return { label: 'Très fort', color: 'text-green-700' };
      default: return { label: '', color: '' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.motDePasse);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Ajouter un nouvel adhérent</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Informations personnelles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nom ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nom de famille"
                  />
                </div>
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.prenom ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Prénom"
                  />
                </div>
                {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="email@exemple.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleChange('telephone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.telephone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+229 01 97 97 97 97"
                  />
                </div>
                {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.adresse ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Adresse complète"
                  />
                </div>
                {errors.adresse && <p className="text-red-500 text-xs mt-1">{errors.adresse}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={formData.service}
                    onChange={(e) => handleChange('service', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.service ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
                {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Sécurité</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type={showPasswords.motDePasse ? 'text' : 'password'}
                    value={formData.motDePasse}
                    onChange={(e) => handleChange('motDePasse', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.motDePasse ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('motDePasse')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.motDePasse ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Indicateur de force du mot de passe */}
                {formData.motDePasse && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Force :</span>
                      <span className={strengthInfo.color}>{strengthInfo.label}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          passwordStrength <= 1 ? 'bg-red-500' :
                          passwordStrength === 2 ? 'bg-orange-500' :
                          passwordStrength === 3 ? 'bg-yellow-500' :
                          passwordStrength === 4 ? 'bg-green-500' : 'bg-green-600'
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {errors.motDePasse && <p className="text-red-500 text-xs mt-1">{errors.motDePasse}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type={showPasswords.confirmerMotDePasse ? 'text' : 'password'}
                    value={formData.confirmerMotDePasse}
                    onChange={(e) => handleChange('confirmerMotDePasse', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmerMotDePasse ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirmer le mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmerMotDePasse')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirmerMotDePasse ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmerMotDePasse && <p className="text-red-500 text-xs mt-1">{errors.confirmerMotDePasse}</p>}
              </div>
            </div>

            {/* Critères du mot de passe */}
            <div className="mt-4 text-xs text-gray-500">
              <p className="font-medium mb-2">Le mot de passe doit contenir :</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center ${formData.motDePasse.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-3 h-3 mr-1 ${formData.motDePasse.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                  Au moins 8 caractères
                </div>
                <div className={`flex items-center ${/[A-Z]/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-3 h-3 mr-1 ${/[A-Z]/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-400'}`} />
                  Une majuscule
                </div>
                <div className={`flex items-center ${/[a-z]/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-3 h-3 mr-1 ${/[a-z]/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-400'}`} />
                  Une minuscule
                </div>
                <div className={`flex items-center ${/\d/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`w-3 h-3 mr-1 ${/\d/.test(formData.motDePasse) ? 'text-green-600' : 'text-gray-400'}`} />
                  Un chiffre
                </div>
              </div>
            </div>
          </div>

          {/* Informations importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Informations importantes</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• L'adhérent recevra un email avec ses identifiants de connexion</li>
                  <li>• Il devra changer son mot de passe lors de sa première connexion</li>
                  <li>• Un numéro d'adhérent unique sera généré automatiquement</li>
                  <li>• Le statut sera défini sur "Actif" par défaut</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading || passwordStrength < 3}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                isLoading || passwordStrength < 3
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Ajouter l'adhérent
                </>
              )}
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