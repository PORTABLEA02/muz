import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'membre' | 'controleur' | 'administrateur';
  must_change_password: boolean;
  is_first_login: boolean;
  last_password_change: string | null;
  phone: string | null;
  address: string | null;
  service: string | null;
  adhesion_number: string | null;
  employee_number: string | null;
  date_adhesion: string | null;
  is_active: boolean | null;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  member_of_user_id: string;
  first_name: string;
  last_name: string;
  npi: string;
  birth_certificate_ref: string;
  date_of_birth: string;
  relation: 'epoux' | 'epouse' | 'enfant' | 'pere' | 'mere' | 'beau_pere' | 'belle_mere';
  date_added: string;
  justification_document: any;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  default_amount: number | null;
  type: 'allocation' | 'pret';
  conditions: string[];
  is_active: boolean;
  created_at: string;
}

export interface Demand {
  id: string;
  service_type: string;
  beneficiary_name: string;
  beneficiary_relation: string;
  amount: number | null;
  submission_date: string;
  event_date: string | null;
  status: 'en_attente' | 'acceptee' | 'rejetee' | 'validee';
  member_id: string;
  member_name: string;
  controller_id: string | null;
  controller_name: string | null;
  administrator_id: string | null;
  administrator_name: string | null;
  comment: string | null;
  processing_date: string | null;
  validation_date: string | null;
  justification_document: any;
  payment_info: any;
  created_at: string;
}

export interface AuditLog {
  id: string;
  log_timestamp: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  details: string | null;
  log_type: 'info' | 'warning' | 'error' | 'success';
  ip_address: string | null;
  module: string;
  created_at: string;
}