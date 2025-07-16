# Supabase Storage Configuration

## Buckets Required

Pour que l'application fonctionne correctement, vous devez créer les buckets suivants dans Supabase Storage :

### 1. Bucket `documents`
- **Usage**: Stockage de tous les documents (pièces justificatives)
- **Folders**:
  - `demands/` - Documents liés aux demandes
  - `family/` - Documents liés aux membres de famille
  - `general/` - Documents généraux

### Configuration des Buckets

1. Connectez-vous à votre dashboard Supabase
2. Allez dans la section "Storage"
3. Créez un nouveau bucket nommé `documents`
4. Configurez les permissions selon vos besoins :
   - Public : Si vous voulez que les documents soient accessibles publiquement
   - Private : Si vous voulez contrôler l'accès (recommandé)

### Politiques RLS pour Storage

Si vous choisissez un bucket privé, vous devrez configurer des politiques RLS :

```sql
-- Politique pour permettre aux utilisateurs authentifiés d'uploader
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'documents'
);

-- Politique pour permettre aux utilisateurs de voir leurs propres documents
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'documents'
);

-- Politique pour permettre aux admins de voir tous les documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'administrateur'
  )
);
```

### Types de fichiers supportés

L'application supporte les types de fichiers suivants :
- PDF (.pdf)
- Images (.jpg, .jpeg, .png)
- Documents Word (.doc, .docx)

### Taille maximale

La taille maximale par fichier est configurée à 5MB dans l'interface utilisateur.