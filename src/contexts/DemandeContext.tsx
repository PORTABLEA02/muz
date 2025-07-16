import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { DemandService, type DemandFormData } from '../services/demandService';
import { AuditService } from '../services/auditService';
import type { Demand } from '../lib/supabase';

interface DemandeContextType {
  demandes: Demand[];
  loading: boolean;
  createDemande: (data: DemandFormData, membreId: string, membreNom: string) => Promise<boolean>;
  updateDemandeStatut: (id: string, statut: 'acceptee' | 'rejetee' | 'validee', userId: string, userNom: string, commentaire?: string) => Promise<boolean>;
  getDemandesByRole: (role: string, userId?: string) => Promise<Demand[]>;
  refreshDemandes: () => Promise<void>;
}

const DemandeContext = createContext<DemandeContextType | undefined>(undefined);

export function DemandeProvider({ children }: { children: ReactNode }) {
  const [demandes, setDemandes] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const refreshDemandes = async () => {
    // Only load demands if user is authenticated
    if (!isAuthenticated || !user) {
      setDemandes([]);
      return;
    }

    try {
      setLoading(true);
      const allDemandes = await DemandService.getDemands();
      setDemandes(allDemandes);
    } catch (error) {
      console.error('Error refreshing demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les demandes seulement quand l'utilisateur est authentifié
  React.useEffect(() => {
    if (isAuthenticated && user) {
      refreshDemandes();
    } else {
      setDemandes([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const createDemande = async (data: DemandFormData, membreId: string, membreNom: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      setLoading(true);
      
      // Préparer les données pour le service
      const demandData = {
        service_type: data.type,
        beneficiary_name: data.beneficiaireNom,
        beneficiary_relation: data.beneficiaireRelation,
        amount: data.montant,
        event_date: data.dateSurvenance,
        justification_document: data.pieceJointe,
        payment_info: data.paiement
      };
      
      const nouvelleDemande = await DemandService.createDemand(membreId, membreNom, demandData);
      
      if (nouvelleDemande) {
        // Rafraîchir la liste des demandes
        await refreshDemandes();
        
        // Log de création de demande
        await AuditService.createLog(
          'Nouvelle demande',
          `Demande ${data.type} créée par ${membreNom}`,
          'info',
          'Demandes'
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating demande:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateDemandeStatut = async (
    id: string, 
    statut: 'acceptee' | 'rejetee' | 'validee', 
    userId: string, 
    userNom: string, 
    commentaire?: string
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      setLoading(true);
      
      const success = await DemandService.updateDemandStatus(id, statut, userId, userNom, commentaire);
      
      if (success) {
        // Rafraîchir la liste des demandes
        await refreshDemandes();
        
        // Log de mise à jour de statut
        await AuditService.createLog(
          'Mise à jour statut demande',
          `Demande ${id} ${statut === 'validee' ? 'validée' : statut === 'rejetee' ? 'rejetée' : 'acceptée'} par ${userNom}`,
          statut === 'rejetee' ? 'warning' : 'success',
          'Demandes'
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating demande status:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDemandesByRole = async (role: string, userId?: string): Promise<Demand[]> => {
    if (!isAuthenticated || !user) {
      return [];
    }

    try {
      return await DemandService.getDemandsByRole(role, userId);
    } catch (error) {
      console.error('Error getting demandes by role:', error);
      return [];
    }
  };

  return (
    <DemandeContext.Provider value={{ 
      demandes, 
      loading,
      createDemande, 
      updateDemandeStatut, 
      getDemandesByRole,
      refreshDemandes
    }}>
      {children}
    </DemandeContext.Provider>
  );
}

export function useDemandes() {
  const context = useContext(DemandeContext);
  if (context === undefined) {
    throw new Error('useDemandes must be used within a DemandeProvider');
  }
  return context;
}