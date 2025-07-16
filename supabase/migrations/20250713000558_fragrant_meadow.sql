/*
  # Insertion des données initiales pour la production

  1. Données utilisateurs de démonstration
    - Profils pour admin, contrôleur et membres
    - Mots de passe par défaut (à changer lors de la première connexion)

  2. Données de famille de démonstration
    - Membres de famille pour les adhérents

  3. Demandes de démonstration
    - Quelques demandes avec différents statuts

  4. Logs d'audit initiaux
    - Logs de création du système
*/

-- Insérer les profils utilisateurs de démonstration
INSERT INTO profiles (
  id, 
  full_name, 
  email, 
  role, 
  must_change_password, 
  is_first_login,
  phone, 
  address, 
  service, 
  adhesion_number, 
  employee_number,
  date_adhesion
) VALUES 
-- Administrateur
(
  '00000000-0000-0000-0000-000000000001',
  'Administrateur MuSAIB',
  'admin@musaib.com',
  'administrateur',
  false,
  false,
  '+221 77 000 00 00',
  'Dakar, Sénégal',
  'Administration Générale',
  NULL,
  'ADM-2023-001',
  '2023-01-01'
),
-- Contrôleur
(
  '00000000-0000-0000-0000-000000000002',
  'Marie Martin',
  'controleur@demo.com',
  'controleur',
  false,
  false,
  '+221 76 987 65 43',
  'Thiès, Sénégal',
  'Contrôle et Audit',
  NULL,
  'CTRL-2023-002',
  '2023-03-01'
),
-- Membres
(
  '00000000-0000-0000-0000-000000000003',
  'Jean Dupont',
  'membre@demo.com',
  'membre',
  false,
  false,
  '+221 77 123 45 67',
  'Dakar, Plateau, Sénégal',
  'Informatique',
  'MUS-2023-001',
  NULL,
  '2023-01-15'
),
(
  '00000000-0000-0000-0000-000000000004',
  'Amadou Diallo',
  'amadou.diallo@email.com',
  'membre',
  false,
  false,
  '+221 78 456 78 90',
  'Saint-Louis, Sénégal',
  'Ressources Humaines',
  'MUS-2023-002',
  NULL,
  '2023-06-10'
),
(
  '00000000-0000-0000-0000-000000000005',
  'Fatou Ndiaye',
  'fatou.ndiaye@email.com',
  'membre',
  false,
  false,
  '+221 77 321 65 98',
  'Kaolack, Sénégal',
  'Marketing',
  'MUS-2023-003',
  NULL,
  '2023-08-05'
)
ON CONFLICT (id) DO NOTHING;

-- Insérer des membres de famille de démonstration
INSERT INTO family_members (
  id,
  member_of_user_id,
  first_name,
  last_name,
  npi,
  birth_certificate_ref,
  date_of_birth,
  relation,
  date_added,
  justification_document
) VALUES 
-- Famille de Jean Dupont
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'Marie',
  'Dupont',
  '1234567890123',
  'ACT-2024-001',
  '1990-05-15',
  'epouse',
  '2023-02-01',
  '{"nom": "certificat_mariage.pdf", "taille": 1024000, "dateUpload": "2023-02-01T10:00:00Z"}'::jsonb
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'Pierre',
  'Dupont',
  '2345678901234',
  'ACT-2024-002',
  '2015-03-20',
  'enfant',
  '2023-02-01',
  '{"nom": "acte_naissance_pierre.pdf", "taille": 512000, "dateUpload": "2023-02-01T10:30:00Z"}'::jsonb
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'Sophie',
  'Dupont',
  '3456789012345',
  'ACT-2024-003',
  '2018-07-10',
  'enfant',
  '2023-02-01',
  '{"nom": "acte_naissance_sophie.pdf", "taille": 512000, "dateUpload": "2023-02-01T10:45:00Z"}'::jsonb
),
-- Famille d'Amadou Diallo
(
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000004',
  'Aissatou',
  'Diallo',
  '4567890123456',
  'ACT-2024-004',
  '1995-12-08',
  'epouse',
  '2023-07-01',
  '{"nom": "certificat_mariage_diallo.pdf", "taille": 1024000, "dateUpload": "2023-07-01T14:00:00Z"}'::jsonb
),
(
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000004',
  'Mamadou',
  'Diallo',
  '5678901234567',
  'ACT-2024-005',
  '2020-01-25',
  'enfant',
  '2023-07-01',
  '{"nom": "acte_naissance_mamadou.pdf", "taille": 512000, "dateUpload": "2023-07-01T14:30:00Z"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Insérer des demandes de démonstration
INSERT INTO demands (
  id,
  service_type,
  beneficiary_name,
  beneficiary_relation,
  amount,
  submission_date,
  event_date,
  status,
  member_id,
  member_name,
  controller_id,
  controller_name,
  administrator_id,
  administrator_name,
  comment,
  processing_date,
  validation_date,
  justification_document,
  payment_info
) VALUES 
-- Demande validée
(
  '20000000-0000-0000-0000-000000000001',
  'mariage',
  'Jean Dupont',
  'Adhérent',
  50000,
  '2024-01-15',
  '2024-01-20',
  'validee',
  '00000000-0000-0000-0000-000000000003',
  'Jean Dupont',
  '00000000-0000-0000-0000-000000000002',
  'Marie Martin',
  '00000000-0000-0000-0000-000000000001',
  'Administrateur MuSAIB',
  'Demande approuvée et validée',
  '2024-01-16',
  '2024-01-17',
  '{"nom": "certificat_mariage.pdf", "taille": 1024000, "dateUpload": "2024-01-15T10:00:00Z", "url": "#certificat_mariage.pdf"}'::jsonb,
  '{"modePaiement": "mobile_money", "numeroAbonnement": "77 123 45 67", "nomAbonne": "Jean Dupont"}'::jsonb
),
-- Demande acceptée (en attente de validation admin)
(
  '20000000-0000-0000-0000-000000000002',
  'naissance',
  'Sophie Dupont',
  'Enfant',
  25000,
  '2024-01-18',
  '2024-01-10',
  'acceptee',
  '00000000-0000-0000-0000-000000000003',
  'Jean Dupont',
  '00000000-0000-0000-0000-000000000002',
  'Marie Martin',
  NULL,
  NULL,
  'Demande approuvée par le contrôleur',
  '2024-01-19',
  NULL,
  '{"nom": "acte_naissance_sophie.pdf", "taille": 512000, "dateUpload": "2024-01-18T14:00:00Z", "url": "#acte_naissance_sophie.pdf"}'::jsonb,
  '{"modePaiement": "virement_bancaire", "compteBancaire": "SN08 SN01 0152 0000001234567890", "nomCompte": "Jean Dupont"}'::jsonb
),
-- Demande en attente
(
  '20000000-0000-0000-0000-000000000003',
  'pret_social',
  'Amadou Diallo',
  'Adhérent',
  100000,
  '2024-01-20',
  NULL,
  'en_attente',
  '00000000-0000-0000-0000-000000000004',
  'Amadou Diallo',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '{"nom": "justificatifs_revenus.pdf", "taille": 2048000, "dateUpload": "2024-01-20T09:00:00Z", "url": "#justificatifs_revenus.pdf"}'::jsonb,
  '{"modePaiement": "mobile_money", "numeroAbonnement": "78 456 78 90", "nomAbonne": "Amadou Diallo"}'::jsonb
),
-- Demande rejetée
(
  '20000000-0000-0000-0000-000000000004',
  'deces',
  'Fatou Ndiaye',
  'Adhérent',
  75000,
  '2024-01-12',
  '2024-01-05',
  'rejetee',
  '00000000-0000-0000-0000-000000000005',
  'Fatou Ndiaye',
  '00000000-0000-0000-0000-000000000002',
  'Marie Martin',
  NULL,
  NULL,
  'Documents insuffisants - acte de décès non conforme',
  '2024-01-13',
  NULL,
  '{"nom": "acte_deces_incomplet.pdf", "taille": 256000, "dateUpload": "2024-01-12T16:00:00Z", "url": "#acte_deces_incomplet.pdf"}'::jsonb,
  '{"modePaiement": "cheque"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Insérer des logs d'audit initiaux
INSERT INTO audit_logs (
  id,
  log_timestamp,
  user_id,
  user_name,
  action,
  details,
  log_type,
  ip_address,
  module
) VALUES 
(
  '30000000-0000-0000-0000-000000000001',
  '2024-01-01T00:00:00Z',
  NULL,
  'Système',
  'Initialisation du système',
  'Création de la base de données et insertion des données initiales',
  'success',
  '127.0.0.1',
  'Système'
),
(
  '30000000-0000-0000-0000-000000000002',
  '2024-01-15T10:00:00Z',
  '00000000-0000-0000-0000-000000000003',
  'Jean Dupont',
  'Connexion utilisateur',
  'Première connexion de Jean Dupont',
  'info',
  '192.168.1.105',
  'Authentification'
),
(
  '30000000-0000-0000-0000-000000000003',
  '2024-01-15T10:30:00Z',
  '00000000-0000-0000-0000-000000000003',
  'Jean Dupont',
  'Nouvelle demande',
  'Soumission d\'une demande d\'allocation mariage',
  'info',
  '192.168.1.105',
  'Demandes'
),
(
  '30000000-0000-0000-0000-000000000004',
  '2024-01-16T09:15:00Z',
  '00000000-0000-0000-0000-000000000002',
  'Marie Martin',
  'Demande acceptée',
  'Demande d\'allocation mariage de Jean Dupont acceptée',
  'success',
  '192.168.1.100',
  'Gestion des demandes'
),
(
  '30000000-0000-0000-0000-000000000005',
  '2024-01-17T14:20:00Z',
  '00000000-0000-0000-0000-000000000001',
  'Administrateur MuSAIB',
  'Demande validée',
  'Demande d\'allocation mariage de Jean Dupont validée définitivement',
  'success',
  '192.168.1.101',
  'Gestion des demandes'
)
ON CONFLICT (id) DO NOTHING;

-- Créer des utilisateurs auth pour les profils de démonstration
-- Note: En production, ces utilisateurs devront être créés via l'interface Supabase Auth
-- ou via l'API d'administration avec des mots de passe sécurisés

-- Fonction pour créer des utilisateurs de démonstration (à utiliser avec précaution)
CREATE OR REPLACE FUNCTION create_demo_users()
RETURNS void AS $$
BEGIN
  -- Cette fonction doit être exécutée avec des privilèges d'administration
  -- et seulement pour les environnements de développement/démonstration
  
  -- Note: En production réelle, les utilisateurs doivent être créés
  -- via l'interface d'administration Supabase ou l'API Auth
  
  RAISE NOTICE 'Les utilisateurs de démonstration doivent être créés manuellement via Supabase Auth';
  RAISE NOTICE 'Emails: admin@musaib.com, controleur@demo.com, membre@demo.com, amadou.diallo@email.com, fatou.ndiaye@email.com';
  RAISE NOTICE 'Mot de passe par défaut: MotDePasse123! (à changer lors de la première connexion)';
END;
$$ LANGUAGE plpgsql;

-- Appeler la fonction d'information
SELECT create_demo_users();

-- Supprimer la fonction après utilisation
DROP FUNCTION create_demo_users();