// Types pour l'application MuSAIB

export interface DemandeFormData {
  type: 'mariage' | 'naissance' | 'deces' | 'pret_social' | 'pret_economique';
  beneficiaireId: string;
  beneficiaireNom: string;
  beneficiaireRelation: string;
  montant?: number;
  pieceJointe?: File;
  fichierPieceJointe?: File;
  dateSurvenance?: string;
  paiement: {
    modePaiement: 'mobile_money' | 'virement_bancaire' | 'cheque';
    numeroAbonnement?: string;
    nomAbonne?: string;
    compteBancaire?: string;
    nomCompte?: string;
  };
}

export interface MembreFamilleFormData {
  nom: string;
  prenom: string;
  npi: string;
  acteNaissance: string;
  dateNaissance: string;
  relation: 'epoux' | 'epouse' | 'enfant' | 'pere' | 'mere' | 'beau_pere' | 'belle_mere';
  pieceJustificative?: File;
}

export interface MembreFamille {
  id: string;
  nom: string;
  prenom: string;
  npi: string;
  acteNaissance: string;
  dateNaissance: string;
  relation: 'epoux' | 'epouse' | 'enfant' | 'pere' | 'mere' | 'beau_pere' | 'belle_mere';
  dateAjout: string;
  pieceJustificative?: {
    nom: string;
    url: string;
    taille: number;
    dateUpload: string;
  };
}

export interface Demande {
  id: string;
  type: string;
  beneficiaireNom: string;
  beneficiaireRelation: string;
  montant?: number;
  dateSoumission: string;
  dateSurvenance?: string;
  statut: 'en_attente' | 'acceptee' | 'rejetee' | 'validee';
  membreId: string;
  membreNom: string;
  controleurId?: string;
  controleurNom?: string;
  administrateurId?: string;
  administrateurNom?: string;
  commentaire?: string;
  dateTraitement?: string;
  dateValidation?: string;
  pieceJointe?: {
    nom: string;
    url: string;
    taille: number;
    dateUpload: string;
  };
  paiement?: any;
}