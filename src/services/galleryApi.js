import axios from 'axios';
import supabase from './supabaseClient';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://admin-self-seven.vercel.app/api'
  : '/api';

export const galleryApi = axios.create({
  baseURL: API_BASE_URL,
});

// Get distinct folder names from gallery_photos
export const getFolders = async () => {
  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('folder_name')
      .not('folder_name', 'is', null)
      .neq('folder_name', '');

    if (error) throw error;

    const names = [...new Set((data || []).map((r) => r.folder_name).filter(Boolean))];
    const folders = names.sort().map((name) => ({ name }));
    return { success: true, data: folders };
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

// Rename folder - update folder_name for all photos in that folder
export const renameFolder = async (oldName, newName) => {
  try {
    const trimmed = (newName || '').trim();
    if (!trimmed) throw new Error('Folder name is required');
    if (trimmed === oldName) return { success: true };

    const { error } = await supabase
      .from('gallery_photos')
      .update({ folder_name: trimmed })
      .eq('folder_name', oldName);

    if (error) throw error;
    return { success: true, message: 'Folder renamed' };
  } catch (error) {
    console.error('Error renaming folder:', error);
    throw error;
  }
};

// Delete folder = delete all photos with that folder_name
export const deleteFolder = async (folderName) => {
  try {
    const { data: photos, error: fetchError } = await supabase
      .from('gallery_photos')
      .select('id, storage_path')
      .eq('folder_name', folderName);

    if (fetchError) throw fetchError;

    const paths = (photos || []).map((p) => p.storage_path).filter(Boolean);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove(paths);
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('folder_name', folderName);

    if (deleteError) throw deleteError;

    return { success: true, message: 'Folder and all photos deleted' };
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Upload photo - folderName = string or null for uncategorized
// bucketName: optional storage bucket (default: 'gallery')
// NOTE: if bucketName !== 'gallery', only uploads to storage (no gallery_photos DB row)
export const uploadImage = async (file, folderName = null, bucketName = 'gallery') => {
  try {
    if (!file) throw new Error('No file provided');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) throw new Error('File size exceeds 5MB limit.');

    const pathPrefix = folderName && String(folderName).trim() ? String(folderName).trim() : 'uncategorized';
    const fileName = `${pathPrefix}/${Date.now()}_${file.name}`;

    const { data: uploadData, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    // Only save to gallery_photos DB table when using the gallery bucket
    if (bucketName === 'gallery') {
      const { data: authData } = await supabase.auth.getUser();
      const uploadedBy = authData?.user?.id ?? null;

      const { data: row, error: insertError } = await supabase
        .from('gallery_photos')
        .insert([
          {
            storage_bucket: bucketName,
            storage_path: fileName,
            public_url: urlData.publicUrl,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            uploaded_by: uploadedBy,
            folder_name: folderName && String(folderName).trim() ? String(folderName).trim() : null,
          },
        ])
        .select('*')
        .single();

      if (insertError) throw insertError;

      return {
        success: true,
        data: {
          id: row?.id,
          path: uploadData.path,
          url: urlData.publicUrl,
          fileName,
          created_at: row?.created_at,
        },
      };
    }

    // For non-gallery buckets (e.g. doctor-images), just return the URL
    return {
      success: true,
      data: {
        path: uploadData.path,
        url: urlData.publicUrl,
        fileName,
      },
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// folderFilter: 'all' | 'uncategorized' | folderName (string)
export const getGalleryImages = async (folderFilter = 'all') => {
  try {
    if (folderFilter === 'all') return getAllGalleryImages();

    let query = supabase
      .from('gallery_photos')
      .select('id, public_url, storage_path, original_name, created_at, folder_name')
      .order('created_at', { ascending: false })
      .limit(500);

    if (folderFilter === 'uncategorized') {
      query = query.is('folder_name', null);
    } else if (folderFilter) {
      query = query.eq('folder_name', folderFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const images = (data || []).map((item) => ({
      id: item.id,
      url: item.public_url,
      storage_path: item.storage_path,
      name: item.original_name || item.storage_path?.split('/').pop(),
      created_at: item.created_at,
      folder_name: item.folder_name,
    }));

    return { success: true, data: images };
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw error;
  }
};

export const getAllGalleryImages = async () => {
  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('id, public_url, storage_path, original_name, created_at, folder_name')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const images = (data || []).map((item) => ({
      id: item.id,
      url: item.public_url,
      storage_path: item.storage_path,
      name: item.original_name || item.storage_path?.split('/').pop(),
      created_at: item.created_at,
      folder_name: item.folder_name,
    }));

    return { success: true, data: images };
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw error;
  }
};

export const deleteGalleryImage = async (storagePathOrFileName, rowId) => {
  try {
    const storagePath = storagePathOrFileName.includes('/')
      ? storagePathOrFileName
      : `uncategorized/${storagePathOrFileName}`;

    const { error: storageError } = await supabase.storage
      .from('gallery')
      .remove([storagePath]);

    if (storageError) throw storageError;

    if (rowId) {
      const { error: dbError } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', rowId);
      if (dbError) throw dbError;
    }

    return { success: true, message: 'Image deleted successfully' };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
