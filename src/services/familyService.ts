import { supabase } from '../lib/supabase';
import type { FamilyMember } from '../lib/supabase';
import { StorageService } from './storageService';

export interface FamilyMemberFormData {
  first_name: string;
  last_name: string;
  npi: string;
  birth_certificate_ref: string;
  date_of_birth: string;
  relation: 'epoux' | 'epouse' | 'enfant' | 'pere' | 'mere' | 'beau_pere' | 'belle_mere';
  justification_document?: File;
}

export class FamilyService {
  static async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('member_of_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get family members error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get family members error:', error);
      return [];
    }
  }

  static async addFamilyMember(userId: string, memberData: FamilyMemberFormData): Promise<FamilyMember | null> {
    try {
      let justificationDoc = null;
      
      // Upload du fichier si présent
      if (memberData.justification_document) {
        const uploadResult = await StorageService.uploadFile(
          memberData.justification_document,
          'family'
        );
        
        if (uploadResult) {
          justificationDoc = {
            nom: uploadResult.name,
            url: uploadResult.url,
            path: uploadResult.path,
            taille: uploadResult.size,
            dateUpload: new Date().toISOString()
          };
        }
      }

      const { data, error } = await supabase
        .from('family_members')
        .insert([{
          member_of_user_id: userId,
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          npi: memberData.npi,
          birth_certificate_ref: memberData.birth_certificate_ref,
          date_of_birth: memberData.date_of_birth,
          relation: memberData.relation,
          justification_document: justificationDoc
        }])
        .select()
        .single();

      if (error) {
        console.error('Add family member error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Add family member error:', error);
      return null;
    }
  }

  static async updateFamilyMember(memberId: string, updates: Partial<FamilyMemberFormData>): Promise<boolean> {
    try {
      let updateData: any = { ...updates };
      
      // Gérer l'upload du nouveau fichier si présent
      if (updates.justification_document instanceof File) {
        const uploadResult = await StorageService.uploadFile(
          updates.justification_document,
          'family'
        );
        
        if (uploadResult) {
          updateData.justification_document = {
            nom: uploadResult.name,
            url: uploadResult.url,
            path: uploadResult.path,
            taille: uploadResult.size,
            dateUpload: new Date().toISOString()
          };
        } else {
          delete updateData.justification_document;
        }
      } else if (updates.justification_document === null) {
        // Suppression explicite du document
        updateData.justification_document = null;
      } else {
        // Ne pas modifier le document existant
        delete updateData.justification_document;
      }

      const { error } = await supabase
        .from('family_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) {
        console.error('Update family member error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update family member error:', error);
      return false;
    }
  }

  static async deleteFamilyMember(memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Delete family member error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete family member error:', error);
      return false;
    }
  }

  static async canAddRelation(userId: string, relation: string): Promise<boolean> {
    try {
      const familyMembers = await this.getFamilyMembers(userId);
      
      switch (relation) {
        case 'epoux':
        case 'epouse':
          return !familyMembers.some(m => m.relation === 'epoux' || m.relation === 'epouse');
        case 'pere':
          return !familyMembers.some(m => m.relation === 'pere');
        case 'mere':
          return !familyMembers.some(m => m.relation === 'mere');
        case 'beau_pere':
          return !familyMembers.some(m => m.relation === 'beau_pere');
        case 'belle_mere':
          return !familyMembers.some(m => m.relation === 'belle_mere');
        case 'enfant':
          return familyMembers.filter(m => m.relation === 'enfant').length < 6;
        default:
          return false;
      }
    } catch (error) {
      console.error('Can add relation error:', error);
      return false;
    }
  }

}