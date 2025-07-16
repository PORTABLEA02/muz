// Utilitaire pour la gestion centralisée des erreurs

export interface ErrorLogEntry {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorLogEntry[] = [];
  private isOnline = navigator.onLine;

  private constructor() {
    // Écouter les changements de statut réseau
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public logError(
    error: Error, 
    severity: ErrorLogEntry['severity'] = 'medium',
    context?: Record<string, any>
  ): void {
    const errorEntry: ErrorLogEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity,
      context
    };

    // Log en console pour le développement
    console.error('ErrorLogger:', errorEntry);

    // Ajouter à la queue
    this.errorQueue.push(errorEntry);

    // Essayer d'envoyer immédiatement si en ligne
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  public logComponentError(
    error: Error,
    errorInfo: React.ErrorInfo,
    severity: ErrorLogEntry['severity'] = 'high'
  ): void {
    const errorEntry: ErrorLogEntry = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity,
      context: {
        type: 'component_error',
        componentStack: errorInfo.componentStack
      }
    };

    // Log en console pour le développement
    console.error('Component Error:', errorEntry);

    this.errorQueue.push(errorEntry);

    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // En production, remplacez ceci par votre endpoint réel
      // Exemple d'envoi vers Supabase ou votre API
      // await fetch('/api/log-errors', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ errors: errorsToSend })
      // });
      
      console.log('Errors would be sent to logging service:', errorsToSend);
    } catch (sendError) {
      console.error('Failed to send errors to logging service:', sendError);
      // Remettre les erreurs dans la queue pour un nouvel essai
      this.errorQueue.unshift(...errorsToSend);
    }
  }

  public getQueuedErrors(): ErrorLogEntry[] {
    return [...this.errorQueue];
  }

  public clearQueue(): void {
    this.errorQueue = [];
  }
}

// Instance singleton
export const errorLogger = ErrorLogger.getInstance();

// Fonction utilitaire pour logger les erreurs async
export const logAsyncError = (
  error: Error, 
  context?: Record<string, any>
): void => {
  errorLogger.logError(error, 'medium', {
    type: 'async_error',
    ...context
  });
};

// Fonction utilitaire pour logger les erreurs de validation
export const logValidationError = (
  message: string, 
  context?: Record<string, any>
): void => {
  const error = new Error(message);
  errorLogger.logError(error, 'low', {
    type: 'validation_error',
    ...context
  });
};

// Fonction utilitaire pour logger les erreurs critiques
export const logCriticalError = (
  error: Error, 
  context?: Record<string, any>
): void => {
  errorLogger.logError(error, 'critical', {
    type: 'critical_error',
    ...context
  });
};