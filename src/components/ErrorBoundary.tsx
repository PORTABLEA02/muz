import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Met à jour l'état pour afficher l'interface de secours
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur pour le débogage
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Met à jour l'état avec les informations d'erreur
    this.setState({
      error,
      errorInfo
    });

    // Appelle la fonction de callback personnalisée si fournie
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En production, vous pourriez envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, ou votre propre service de logging
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Ici vous pourriez intégrer un service de monitoring d'erreurs
    // Exemple avec un service fictif :
    try {
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: error.message,
      //     stack: error.stack,
      //     componentStack: errorInfo.componentStack,
      //     timestamp: new Date().toISOString(),
      //     userAgent: navigator.userAgent,
      //     url: window.location.href
      //   })
      // });
      
      console.log('Error logged to service:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface de secours par défaut
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            {/* Icône d'erreur */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            {/* Titre et message */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Oups ! Une erreur s'est produite
            </h1>
            <p className="text-gray-600 mb-6">
              Nous sommes désolés, mais quelque chose s'est mal passé. 
              Veuillez essayer l'une des options ci-dessous.
            </p>

            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Retour au dashboard
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recharger la page
              </button>
            </div>

            {/* Message d'aide */}
            <p className="mt-6 text-xs text-gray-500">
              Si le problème persiste, veuillez contacter l'administrateur système.
            </p>
          </div>
        </div>
      );
    }

    // Si pas d'erreur, rendre les enfants normalement
    return this.props.children;
  }
}

// Hook personnalisé pour déclencher une erreur (utile pour les tests)
export const useErrorHandler = () => {
  return (error: Error) => {
    throw error;
  };
};

// Composant fonctionnel wrapper pour une utilisation plus simple
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({ 
  children, 
  fallback, 
  onError 
}) => {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
};