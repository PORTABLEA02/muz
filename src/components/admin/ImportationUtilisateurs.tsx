import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Users, Eye, Edit } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { AuditService } from '../../services/auditService';

interface UserPreview {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  service: string;
  adresse: string;
  mot_de_passe: string;
  errors: string[];
  lineNumber: number;
}

interface ImportHistory {
  id: string;
  date: string;
  filename: string;
  total: number;
  success: number;
  errors: number;
  status: 'success' | 'partial' | 'failed';
}

export function ImportationUtilisateurs() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [usersPreviews, setUsersPreviews] = useState<UserPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    total: number;
    details: string[];
    failedUsers: Array<{user: UserPreview, error: string}>;
  } | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);

  // Charger l'historique des importations au montage
  React.useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      // Récupérer les logs d'audit liés aux importations
      const logs = await AuditService.getLogsByModule('Importation');
      const history = logs
        .filter(log => log.action === 'Importation utilisateurs')
        .map(log => {
          const details = log.details ? JSON.parse(log.details) : {};
          return {
            id: log.id,
            date: log.log_timestamp,
            filename: details.filename || 'Fichier inconnu',
            total: details.total || 0,
            success: details.success || 0,
            errors: details.errors || 0,
            status: details.errors === 0 ? 'success' : details.success > 0 ? 'partial' : 'failed'
          } as ImportHistory;
        })
        .slice(0, 10); // Garder seulement les 10 dernières
      
      setImportHistory(history);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Vérifier le type de fichier
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Type de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)');
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux. Taille maximale : 10 MB');
      return;
    }

    setUploadedFile(file);
    setShowPreview(false);
    setUsersPreviews([]);
    setImportResults(null);
  };

  const parseCSVFile = (file: File): Promise<UserPreview[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('Fichier vide'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
          
          // Vérifier les colonnes requises
          const requiredColumns = ['nom', 'prenom', 'email', 'telephone', 'mot_de_passe'];
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          
          if (missingColumns.length > 0) {
            reject(new Error(`Colonnes manquantes: ${missingColumns.join(', ')}`));
            return;
          }

          const users: UserPreview[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            // Parser la ligne CSV en gérant les guillemets
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const errors: string[] = [];
            
            // Extraire les valeurs selon les en-têtes
            const nom = values[headers.indexOf('nom')] || '';
            const prenom = values[headers.indexOf('prenom')] || '';
            const email = values[headers.indexOf('email')] || '';
            const telephone = values[headers.indexOf('telephone')] || '';
            const service = values[headers.indexOf('service')] || '';
            const adresse = values[headers.indexOf('adresse')] || '';
            const mot_de_passe = values[headers.indexOf('mot_de_passe')] || '';
            
            // Validation des données
            if (!nom.trim()) errors.push('Nom manquant');
            if (!prenom.trim()) errors.push('Prénom manquant');
            if (!email.trim()) {
              errors.push('Email manquant');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              errors.push('Format email invalide');
            }
            if (!telephone.trim()) {
              errors.push('Téléphone manquant');
            } else if (!/^\+?[\d\s-()]+$/.test(telephone)) {
              errors.push('Format téléphone invalide');
            }
            if (!mot_de_passe.trim()) {
              errors.push('Mot de passe manquant');
            } else if (mot_de_passe.length < 8) {
              errors.push('Mot de passe trop court (min. 8 caractères)');
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(mot_de_passe)) {
              errors.push('Mot de passe faible (majuscule, minuscule, chiffre requis)');
            }
            
            users.push({
              nom: nom.trim(),
              prenom: prenom.trim(),
              email: email.trim().toLowerCase(),
              telephone: telephone.trim(),
              service: service.trim(),
              adresse: adresse.trim(),
              mot_de_passe: mot_de_passe.trim(),
              errors,
              lineNumber: i + 1
            });
          }
          
          // Vérifier les doublons d'email dans le fichier
          const emailCounts = new Map<string, number>();
          users.forEach(user => {
            if (user.email) {
              const count = emailCounts.get(user.email) || 0;
              emailCounts.set(user.email, count + 1);
              if (count > 0) {
                user.errors.push('Email en doublon dans le fichier');
              }
            }
          });
          
          resolve(users);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handlePreviewFile = async () => {
    if (!uploadedFile) return;
    
    try {
      setIsImporting(true);
      const users = await parseCSVFile(uploadedFile);
      
      if (users.length > 1000) {
        alert('Trop d\'utilisateurs dans le fichier. Maximum : 1000 utilisateurs par importation.');
        return;
      }
      
      setUsersPreviews(users);
      setShowPreview(true);
    } catch (error) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      alert(`Erreur lors de l'analyse du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const performImport = async () => {
    if (!uploadedFile) return;
    
    const validUsers = usersPreviews.filter(user => user.errors.length === 0);
    
    if (validUsers.length === 0) {
      alert('Aucun utilisateur valide à importer');
      return;
    }

    setIsImporting(true);
    
    try {
      const results = {
        success: 0,
        errors: 0,
        total: validUsers.length,
        details: [] as string[],
        failedUsers: [] as Array<{user: UserPreview, error: string}>
      };

      // Importer les utilisateurs un par un
      for (const user of validUsers) {
        try {
          const newUser = await AuthService.createUser(
            user.email,
            user.mot_de_passe,
            {
              full_name: `${user.prenom} ${user.nom}`,
              role: 'membre',
              phone: user.telephone,
              address: user.adresse,
              service: user.service
            }
          );

          if (newUser) {
            results.success++;
            results.details.push(`✓ ${user.prenom} ${user.nom} (${user.email}) importé avec succès`);
          } else {
            results.errors++;
            results.failedUsers.push({
              user,
              error: 'Échec de création (raison inconnue)'
            });
            results.details.push(`✗ ${user.prenom} ${user.nom} (${user.email}) - Échec de création`);
          }
        } catch (error) {
          results.errors++;
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          results.failedUsers.push({
            user,
            error: errorMessage
          });
          results.details.push(`✗ ${user.prenom} ${user.nom} (${user.email}) - ${errorMessage}`);
        }

        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Enregistrer dans l'historique via les logs d'audit
      await AuditService.createLog(
        'Importation utilisateurs',
        JSON.stringify({
          filename: uploadedFile.name,
          total: results.total,
          success: results.success,
          errors: results.errors,
          details: results.details.slice(0, 10) // Limiter les détails
        }),
        results.errors === 0 ? 'success' : results.success > 0 ? 'warning' : 'error',
        'Importation'
      );

      setImportResults(results);
      setShowPreview(false);
      
      // Recharger l'historique
      await loadImportHistory();

    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      alert(`Erreur lors de l'importation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'nom,prenom,email,telephone,service,adresse,mot_de_passe',
      'Dupont,Jean,jean.dupont@email.com,+221771234567,Informatique,"Dakar, Plateau",MotDePasse123!',
      'Martin,Marie,marie.martin@email.com,+221769876543,Comptabilité,"Thiès, Centre",SecurePass456!',
      'Diallo,Amadou,amadou.diallo@email.com,+221775555555,Marketing,"Saint-Louis",StrongPwd789!'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele_import_adherents.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!importResults) return;
    
    const csvContent = [
      'Résultat,Nom,Prénom,Email,Erreur',
      ...importResults.details.map(detail => {
        const isSuccess = detail.startsWith('✓');
        const parts = detail.split(' - ');
        const userInfo = parts[0].replace(/^[✓✗]\s/, '');
        const error = parts[1] || '';
        return `${isSuccess ? 'Succès' : 'Échec'},"${userInfo}","","","${error}"`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_importation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validUsers = usersPreviews.filter(user => user.errors.length === 0);
  const invalidUsers = usersPreviews.filter(user => user.errors.length > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Réussie';
      case 'partial': return 'Partielle';
      case 'failed': return 'Échouée';
      default: return 'Inconnue';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Importation utilisateurs</h1>
        <p className="text-gray-600">Importez en masse les adhérents via un fichier CSV ou Excel</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions d'importation</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Utilisez le modèle CSV fourni pour structurer vos données</li>
          <li>• Champs obligatoires : nom, prénom, email, téléphone, mot_de_passe</li>
          <li>• Champs optionnels : service, adresse</li>
          <li>• Format accepté : CSV avec encodage UTF-8</li>
          <li>• Taille maximale : 10 MB</li>
          <li>• Maximum 1000 utilisateurs par importation</li>
          <li>• Les mots de passe doivent contenir au moins 8 caractères avec majuscule, minuscule et chiffre</li>
          <li>• Les emails doivent être uniques dans le système</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone d'upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Télécharger le fichier</h3>
          
          {/* Bouton de téléchargement du modèle */}
          <div className="mb-4">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger le modèle CSV
            </button>
          </div>

          {/* Zone de drag & drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-gray-500 mb-4">
              ou cliquez pour sélectionner un fichier
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={isImporting}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isImporting 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              }`}
            >
              {isImporting ? 'Traitement...' : 'Sélectionner un fichier'}
            </label>
          </div>

          {/* Fichier sélectionné */}
          {uploadedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setShowPreview(false);
                    setUsersPreviews([]);
                    setImportResults(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isImporting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handlePreviewFile}
                  disabled={isImporting}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    isImporting
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  {isImporting ? 'Analyse...' : 'Prévisualiser'}
                </button>
                {showPreview && usersPreviews.length > 0 && validUsers.length > 0 && (
                  <button
                    onClick={performImport}
                    disabled={isImporting}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      isImporting
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isImporting ? 'Importation...' : `Importer ${validUsers.length} utilisateur(s)`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Résultats d'importation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultats d'importation</h3>
          
          {!importResults ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune importation en cours</p>
              <p className="text-sm text-gray-400">Les résultats s'afficheront ici après l'importation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-green-800">Succès</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                  <div className="text-sm text-red-800">Erreurs</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                  <div className="text-sm text-blue-800">Total</div>
                </div>
              </div>

              {/* Détails */}
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-3">Détails de l'importation</h4>
                <div className="space-y-2">
                  {importResults.details.slice(0, 20).map((detail, index) => (
                    <div key={index} className="flex items-start text-sm">
                      {detail.includes('✓') ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={detail.includes('✓') ? 'text-green-700' : 'text-red-700'}>
                        {detail.replace(/^[✓✗]\s/, '')}
                      </span>
                    </div>
                  ))}
                  {importResults.details.length > 20 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ... et {importResults.details.length - 20} autres résultats
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button 
                  onClick={downloadResults}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Télécharger le rapport
                </button>
                <button 
                  onClick={() => {
                    setImportResults(null);
                    setUploadedFile(null);
                    setShowPreview(false);
                    setUsersPreviews([]);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Nouvelle importation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de prévisualisation */}
      {showPreview && usersPreviews.length > 0 && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Prévisualisation des utilisateurs ({usersPreviews.length})
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isImporting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Statistiques de prévisualisation */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validUsers.length}</div>
                <div className="text-sm text-green-800">Valides</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{invalidUsers.length}</div>
                <div className="text-sm text-red-800">Erreurs</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{usersPreviews.length}</div>
                <div className="text-sm text-blue-800">Total</div>
              </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h4 className="font-medium text-gray-900">Utilisateurs à importer</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ligne</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersPreviews.map((user, index) => (
                      <tr key={index} className={user.errors.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.lineNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.prenom}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.telephone}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.service}</td>
                        <td className="px-4 py-3 text-sm">
                          {user.errors.length === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valide
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-1">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Erreur
                              </span>
                              <div className="text-xs text-red-600">
                                {user.errors.join(', ')}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                {validUsers.length > 0 && (
                  <span className="text-green-600 font-medium">
                    {validUsers.length} utilisateur(s) seront importés
                  </span>
                )}
                {invalidUsers.length > 0 && (
                  <span className="text-red-600 font-medium ml-4">
                    {invalidUsers.length} erreur(s) détectée(s)
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  disabled={isImporting}
                >
                  Fermer
                </button>
                {validUsers.length > 0 && (
                  <button
                    onClick={performImport}
                    disabled={isImporting}
                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${
                      isImporting
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'text-white bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isImporting ? 'Importation...' : `Importer ${validUsers.length} utilisateur(s)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historique des importations */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des importations</h3>
        </div>
        <div className="p-6">
          {importHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune importation précédente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {importHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Importation du {new Date(item.date).toLocaleDateString('fr-FR')}
                      </h4>
                      <p className="text-sm text-gray-600">Fichier: {item.filename}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-600">{item.success}</span> importés
                    </div>
                    <div>
                      <span className="font-medium text-red-600">{item.errors}</span> erreurs
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">{item.total}</span> total
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}