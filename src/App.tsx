import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DemandeProvider } from './contexts/DemandeContext';
import { FamilleProvider } from './contexts/FamilleContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { FamilleManagement } from './components/FamilleManagement';
import { HistoriqueDemandes } from './components/HistoriqueDemandes';
import { DemandeForm } from './components/DemandeForm';
import { GestionAdherents } from './components/admin/GestionAdherents';
import { ImportationUtilisateurs } from './components/admin/ImportationUtilisateurs';
import { GestionDemandes } from './components/admin/GestionDemandes';
import { GestionServices } from './components/admin/GestionServices';
import { LogsAudit } from './components/admin/LogsAudit';
import { MonCompte as AdminMonCompte } from './components/admin/MonCompte';
import { MonCompte as ControleurMonCompte } from './components/controleur/MonCompte';
import { MonCompte } from './components/membre/MonCompte';
import { ForcePasswordChange } from './components/ForcePasswordChange';

// Fonction de logging des erreurs personnalisée
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  // Log l'erreur avec plus de contexte
  console.error('Global Error Boundary caught an error:', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    errorInfo: {
      componentStack: errorInfo.componentStack
    },
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // En production, vous pourriez envoyer cela à un service de monitoring
  // comme Sentry, LogRocket, ou votre propre API de logging
};

// Composant pour protéger les routes qui nécessitent une authentification
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier si l'utilisateur doit changer son mot de passe
  if (user?.mustChangePassword || user?.isFirstLogin) {
    return <ForcePasswordChange />;
  }
  
  return <>{children}</>;
}

// Composant pour protéger les routes admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'administrateur') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Composant pour protéger les routes membre
function MemberRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'membre') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Composant pour protéger les routes contrôleur
function ControllerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'controleur') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Route de connexion */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
        } 
      />
      
      {/* Routes protégées */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard principal */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Routes pour les membres */}
        <Route path="membre">
          <Route 
            path="famille" 
            element={
              <MemberRoute>
                <FamilleManagement />
              </MemberRoute>
            } 
          />
          <Route 
            path="demande" 
            element={
              <MemberRoute>
                <DemandeForm />
              </MemberRoute>
            } 
          />
          <Route 
            path="historique" 
            element={
              <MemberRoute>
                <HistoriqueDemandes />
              </MemberRoute>
            } 
          />
          <Route 
            path="compte" 
            element={
              <MemberRoute>
                <MonCompte />
              </MemberRoute>
            } 
          />
        </Route>
        
        {/* Routes pour l'administration */}
        <Route path="admin">
          <Route 
            path="adherents" 
            element={
              <AdminRoute>
                <GestionAdherents />
              </AdminRoute>
            } 
          />
          <Route 
            path="import" 
            element={
              <AdminRoute>
                <ImportationUtilisateurs />
              </AdminRoute>
            } 
          />
          <Route 
            path="demandes" 
            element={
              <AdminRoute>
                <GestionDemandes />
              </AdminRoute>
            } 
          />
          <Route 
            path="services" 
            element={
              <AdminRoute>
                <GestionServices />
              </AdminRoute>
            } 
          />
          <Route 
            path="logs" 
            element={
              <AdminRoute>
                <LogsAudit />
              </AdminRoute>
            } 
          />
          <Route 
            path="compte" 
            element={
              <AdminRoute>
                <AdminMonCompte />
              </AdminRoute>
            } 
          />
        </Route>
        
        {/* Routes pour le contrôleur */}
        <Route path="controleur">
          <Route 
            path="compte" 
            element={
              <ControllerRoute>
                <ControleurMonCompte />
              </ControllerRoute>
            } 
          />
        </Route>
      </Route>
      
      {/* Route par défaut - redirection vers login si non authentifié, dashboard sinon */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary onError={handleGlobalError}>
      <AuthProvider>
        <FamilleProvider>
          <DemandeProvider>
            <ErrorBoundary 
              onError={handleGlobalError}
              fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      Erreur de l'application
                    </h1>
                    <p className="text-gray-600 mb-4">
                      Une erreur critique s'est produite dans l'application.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Recharger l'application
                    </button>
                  </div>
                </div>
              }
            >
              <AppContent />
            </ErrorBoundary>
          </DemandeProvider>
        </FamilleProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;