/*
  # Création du schéma de base de données pour la plateforme MuSAIB

  1. Nouvelles Tables
    - `profiles` - Profils utilisateurs étendus (membres, contrôleurs, administrateurs)
    - `family_members` - Membres de famille des adhérents
    - `services` - Services offerts par la mutuelle
    - `demands` - Demandes de services soumises par les membres
    - `audit_logs` - Logs d'audit pour traçabilité

  2. Sécurité
    - Activation du Row Level Security (RLS) sur toutes les tables
    - Politiques RLS pour contrôler l'accès selon les rôles
    - Contraintes CHECK pour validation des données

  3. Relations
    - Clés étrangères vers auth.users pour les profils
    - Relations entre membres et leurs familles
    - Traçabilité des demandes avec contrôleurs et administrateurs
*/

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set the search path to public for clarity
SET search_path = public;

-- Table: profiles
-- Stores application-specific user profiles, linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('membre', 'controleur', 'administrateur')),
    must_change_password BOOLEAN DEFAULT FALSE,
    is_first_login BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMPTZ,
    phone TEXT,
    address TEXT,
    service TEXT,
    adhesion_number TEXT UNIQUE,
    employee_number TEXT UNIQUE,
    date_adhesion DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);

CREATE POLICY "Admins can manage all profiles" 
ON profiles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);

-- Table: family_members
-- Stores family members associated with each 'membre' profile
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_of_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    npi TEXT UNIQUE NOT NULL,
    birth_certificate_ref TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    relation TEXT NOT NULL CHECK (relation IN ('epoux', 'epouse', 'enfant', 'pere', 'mere', 'beau_pere', 'belle_mere')),
    date_added DATE NOT NULL DEFAULT CURRENT_DATE,
    justification_document JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_members
CREATE POLICY "Members can view their own family" 
ON family_members FOR SELECT 
USING (auth.uid() = member_of_user_id);

CREATE POLICY "Members can insert their own family" 
ON family_members FOR INSERT 
WITH CHECK (auth.uid() = member_of_user_id);

CREATE POLICY "Members can update their own family" 
ON family_members FOR UPDATE 
USING (auth.uid() = member_of_user_id);

CREATE POLICY "Admins can manage all family members" 
ON family_members FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);

-- Table: services
-- Defines the types of services offered by the mutuelle
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    default_amount INTEGER,
    type TEXT NOT NULL CHECK (type IN ('allocation', 'pret')),
    conditions TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "All authenticated users can view active services" 
ON services FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Admins can manage services" 
ON services FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);

-- Table: demands
-- Records all service demands submitted by members
CREATE TABLE IF NOT EXISTS demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    beneficiary_relation TEXT NOT NULL,
    amount INTEGER,
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_date DATE,
    status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'acceptee', 'rejetee', 'validee')),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    controller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    controller_name TEXT,
    administrator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    administrator_name TEXT,
    comment TEXT,
    processing_date DATE,
    validation_date DATE,
    justification_document JSONB,
    payment_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for demands
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demands
CREATE POLICY "Members can view and manage their own demands" 
ON demands FOR ALL 
USING (auth.uid() = member_id);

CREATE POLICY "Controllers can view all demands" 
ON demands FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('controleur', 'administrateur')
    )
);

CREATE POLICY "Controllers can update demand status" 
ON demands FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'controleur'
    )
    AND status = 'en_attente'
);

CREATE POLICY "Admins can validate accepted demands" 
ON demands FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
    AND status = 'acceptee'
);

-- Table: audit_logs
-- Records important user and system actions for auditing and security purposes
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    log_type TEXT NOT NULL CHECK (log_type IN ('info', 'warning', 'error', 'success')),
    ip_address TEXT,
    module TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" 
ON audit_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);

CREATE POLICY "System can insert audit logs" 
ON audit_logs FOR INSERT 
WITH CHECK (TRUE);

-- Insert default services
INSERT INTO services (name, description, default_amount, type, conditions, is_active) VALUES
('Allocation Mariage', 'Aide financière pour les frais de mariage', 50000, 'allocation', 
 ARRAY['Être membre depuis au moins 6 mois', 'Fournir un certificat de mariage'], TRUE),
('Allocation Naissance', 'Aide financière pour l''arrivée d''un nouveau-né', 25000, 'allocation', 
 ARRAY['Être membre actif', 'Fournir un acte de naissance'], TRUE),
('Allocation Décès', 'Aide financière pour les frais funéraires', 75000, 'allocation', 
 ARRAY['Être membre ou ayant droit', 'Fournir un acte de décès'], TRUE),
('Prêt Social', 'Prêt pour les urgences sociales', NULL, 'pret', 
 ARRAY['Être membre depuis au moins 1 an', 'Avoir un garant', 'Remboursement sur 12 mois'], TRUE),
('Prêt Économique', 'Prêt pour les activités génératrices de revenus', NULL, 'pret', 
 ARRAY['Être membre depuis au moins 2 ans', 'Présenter un business plan', 'Remboursement sur 24 mois'], TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(member_of_user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_npi ON family_members(npi);
CREATE INDEX IF NOT EXISTS idx_demands_member_id ON demands(member_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_service_type ON demands(service_type);
CREATE INDEX IF NOT EXISTS idx_demands_submission_date ON demands(submission_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(log_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_family_members_justification_gin ON family_members USING GIN (justification_document);
CREATE INDEX IF NOT EXISTS idx_demands_justification_gin ON demands USING GIN (justification_document);
CREATE INDEX IF NOT EXISTS idx_demands_payment_info_gin ON demands USING GIN (payment_info);

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'membre')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log important actions
CREATE OR REPLACE FUNCTION public.log_action(
  p_action TEXT,
  p_details TEXT DEFAULT NULL,
  p_log_type TEXT DEFAULT 'info',
  p_module TEXT DEFAULT 'System'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  current_user_id UUID;
  current_user_name TEXT;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    SELECT full_name INTO current_user_name 
    FROM profiles 
    WHERE id = current_user_id;
  END IF;
  
  -- Insert log entry
  INSERT INTO audit_logs (
    user_id, 
    user_name, 
    action, 
    details, 
    log_type, 
    module
  ) VALUES (
    current_user_id,
    current_user_name,
    p_action,
    p_details,
    p_log_type,
    p_module
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;