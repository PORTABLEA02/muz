import { supabase } from '../lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
}

export class StorageService {
  private static readonly BUCKET_NAME = 'documents';

  static async uploadFile(file: File, folder: string = 'general'): Promise<UploadResult | null> {
    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(StorageService.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(StorageService.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('Storage service error:', error);
      return null;
    }
  }

  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(StorageService.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete file error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage service error:', error);
      return false;
    }
  }

  static async getFileUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(StorageService.BUCKET_NAME)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Get file URL error:', error);
      return null;
    }
  }

  static getDownloadUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(StorageService.BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
}