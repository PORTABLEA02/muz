import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react';

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export function ForcePasswordChange() {
  const { user, updatePassword } = useAuth();
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validatePassword = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation est requise';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulation de la mise à jour du mot de passe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (updatePassword) {
        updatePassword(passwordData.newPassword);
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
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

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4 sm:py-6 sm:px-6 lg:py-12 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2">
            Changement de mot de passe requis
          </h2>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                {user?.isFirstLogin ? (
                  <p>
                    <strong>Première connexion détectée.</strong><br/>
                    Pour votre sécurité, vous devez définir un nouveau mot de passe avant de continuer.
                  </p>
                ) : (
                  <p>
                    <strong>Mot de passe réinitialisé.</strong><br/>
                    Votre mot de passe a été réinitialisé par un administrateur. 
                    Vous devez en définir un nouveau pour continuer.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Force du mot de passe :</span>
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
              
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
              )}
              
              <div className="mt-2 text-xs sm:text-sm text-gray-500">
                <p className="font-medium mb-1">Le mot de passe doit contenir :</p>
                <ul className="space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <li className={`flex items-center ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-3 h-3 mr-1 ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                    Au moins 8 caractères
                  </li>
                  <li className={`flex items-center ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-3 h-3 mr-1 ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    Une lettre majuscule
                  </li>
                  <li className={`flex items-center ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-3 h-3 mr-1 ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    Une lettre minuscule
                  </li>
                  <li className={`flex items-center ${/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-3 h-3 mr-1 ${/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    Un chiffre
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || passwordStrength < 3}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white transition-colors ${
                isLoading || passwordStrength < 3
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Définir le nouveau mot de passe
                </>
              )}
            </button>
          </form>

          {/* Conseils de sécurité */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Conseils pour un mot de passe sécurisé
            </h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• Utilisez un mot de passe unique pour ce compte</li>
              <li>• Évitez les informations personnelles (nom, date de naissance)</li>
              <li>• Mélangez lettres, chiffres et caractères spéciaux</li>
              <li>• Ne partagez jamais votre mot de passe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}