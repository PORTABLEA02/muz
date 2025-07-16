import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MembreDashboard } from './dashboards/MembreDashboard';
import { ControleurDashboard } from './dashboards/ControleurDashboard';
import { AdministrateurDashboard } from './dashboards/AdministrateurDashboard';

export function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'membre':
      return <MembreDashboard />;
    case 'controleur':
      return <ControleurDashboard />;
    case 'administrateur':
      return <AdministrateurDashboard />;
    default:
      return <div>Rôle non reconnu</div>;
  }
}