import React, { useState, useEffect } from 'react';
import {
  Upload,
  ImageIcon,
  Trash2,
  Loader,
  CheckCircle,
  XCircle,
  FolderPlus,
  Folder,
  FolderOpen,
  X,
  Pencil,
} from 'lucide-react';
import {
  uploadImage,
  getGalleryImages,
  deleteGalleryImage,
  getFolders,
  deleteFolder,
  renameFolder,
} from '../../services/galleryApi';

const GallerySection = () => {
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);

  // 'all' | 'uncategorized' | folderName (string)
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);
  const [renameFolderModal, setRenameFolderModal] = useState(null);
  // Empty folders (no photos yet) - persist in localStorage
  const PENDING_KEY = 'gallery_pending_folders';
  const [pendingFolders, setPendingFolders] = useState(() => {
    try {
      const s = localStorage.getItem(PENDING_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(pendingFolders));
    } catch {}
  }, [pendingFolders]);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadImages();
  }, [activeFilter]);

  const loadFolders = async () => {
    try {
      const res = await getFolders();
      const dbFolders = res.data || [];
      const dbNames = new Set(dbFolders.map((f) => f.name));
      // Merge DB folders + pending (empty) folders, remove pending ones that now exist in DB
      const stillPending = pendingFolders.filter((n) => !dbNames.has(n));
      setPendingFolders(stillPending);
      const merged = [
        ...dbFolders,
        ...stillPending.map((name) => ({ name })),
      ].sort((a, b) => a.name.localeCompare(b.name));
      setFolders(merged);
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      const res = await getGalleryImages(activeFilter);
      setImages(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    setActiveFilter(name);
    setNewFolderName('');
    setShowCreateFolder(false);
    setPendingFolders((prev) =>
      prev.includes(name) ? prev : [...prev, name].sort()
    );
    setFolders((prev) =>
      prev.some((f) => f.name === name) ? prev : [...prev, { name }].sort((a, b) => a.name.localeCompare(b.name))
    );
    setImages([]);
    setSuccess('Folder created – upload photos to add them here');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRenameFolder = async () => {
    if (!renameFolderModal) return;
    const newName = newFolderName.trim();
    if (!newName || newName === renameFolderModal.name) {
      setRenameFolderModal(null);
      setNewFolderName('');
      return;
    }
    const oldName = renameFolderModal.name;
    const isPending = pendingFolders.includes(oldName);
    try {
      setLoading(true);
      setError(null);
      if (isPending) {
        // Empty folder - only update local state
        setPendingFolders((prev) =>
          prev.map((n) => (n === oldName ? newName : n)).sort()
        );
        setFolders((prev) =>
          prev.map((f) => (f.name === oldName ? { name: newName } : f)).sort((a, b) => a.name.localeCompare(b.name))
        );
        if (activeFilter === oldName) setActiveFilter(newName);
      } else {
        await renameFolder(oldName, newName);
        if (activeFilter === oldName) setActiveFilter(newName);
        await loadFolders();
      }
      setRenameFolderModal(null);
      setNewFolderName('');
      await loadImages();
      setSuccess('Folder renamed');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err.message || 'Failed to rename folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folder) => {
    const isPending = pendingFolders.includes(folder.name);
    try {
      setLoading(true);
      setError(null);
      if (isPending) {
        setPendingFolders((prev) => prev.filter((n) => n !== folder.name));
        setFolders((prev) => prev.filter((f) => f.name !== folder.name));
        if (activeFilter === folder.name) setActiveFilter('all');
      } else {
        await deleteFolder(folder.name);
        if (activeFilter === folder.name) setActiveFilter('all');
        await loadFolders();
        await loadImages();
      }
      setConfirmDeleteFolder(null);
      setSuccess('Folder deleted');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err.message || 'Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    event.target.value = '';
    if (files.length === 0) return;

    const validFiles = [];
    const newPreviews = [];

    for (let file of files) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file: ${file.name}. Use JPEG, PNG, WEBP or GIF.`);
        continue;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File too large (5MB max): ${file.name}`);
        continue;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({ file, preview: e.target.result });
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(newPreviews);
          uploadValidFiles(validFiles);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadValidFiles = async (validFiles) => {
    if (validFiles.length === 0) return;
    const folderName =
      activeFilter === 'all' || activeFilter === 'uncategorized' ? null : activeFilter;
    try {
      setUploading(true);
      setError(null);
      for (let file of validFiles) {
        const response = await uploadImage(file, folderName);
        setImages((prev) => [
          {
            id: response.data.id,
            name: response.data.fileName.split('/').pop(),
            url: response.data.url,
            storage_path: response.data.fileName,
            created_at: response.data.created_at || new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      await loadFolders(); // removes folder from pending once it has photos in DB
      setSuccess(`${validFiles.length} photo(s) uploaded`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setImagePreviews([]);
    }
  };

  const handleDeleteImage = async (image, index) => {
    try {
      setLoading(true);
      await deleteGalleryImage(image.storage_path || image.name, image.id);
      setImages((prev) => prev.filter((_, i) => i !== index));
      setLightboxImage(null);
      setSuccess('Photo deleted');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileChange({ target: { files } });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const activeFolderName =
    activeFilter && activeFilter !== 'all' && activeFilter !== 'uncategorized'
      ? activeFilter
      : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar - Folders */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800">Folders</span>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
              title="New folder"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 min-h-[320px] max-h-[calc(100vh-160px)] overflow-y-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-colors text-base ${
                activeFilter === 'all'
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ImageIcon className="h-5 w-5" />
              All Photos
            </button>
            <button
              onClick={() => setActiveFilter('uncategorized')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-colors text-base ${
                activeFilter === 'uncategorized'
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Folder className="h-5 w-5" />
              Uncategorized
            </button>
            {folders.map((f) => (
              <div
                key={f.name}
                className="group flex items-stretch gap-2 rounded-lg hover:bg-gray-50 min-h-[44px]"
              >
                <button
                  onClick={() => setActiveFilter(f.name)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-colors text-base min-h-[44px] ${
                    activeFilter === f.name
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FolderOpen className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{f.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameFolderModal(f);
                    setNewFolderName(f.name);
                  }}
                  className="p-2 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity self-stretch flex items-center"
                  title="Rename folder"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteFolder(f);
                  }}
                  className="p-2 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity self-stretch flex items-center"
                  title="Delete folder"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-emerald-800 font-medium">{success}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 p-6 sm:p-8 transition-all duration-300 hover:border-indigo-300 hover:shadow-lg"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div
            className="flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[140px]"
            onClick={() => !uploading && document.getElementById('gallery-upload').click()}
          >
            <input
              type="file"
              id="gallery-upload"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div
              className={`p-3 rounded-xl bg-white/80 shadow ring-1 ring-indigo-100 ${
                uploading ? 'scale-95' : ''
              }`}
            >
              {uploading ? (
                <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-indigo-600" />
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">
                {uploading ? 'Uploading…' : 'Drop photos or click to upload'}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeFilter === 'all'
                  ? 'Select a folder first, or uploads go to Uncategorized'
                  : activeFilter === 'uncategorized'
                  ? 'Uploading to Uncategorized'
                  : activeFolderName
                  ? `Uploading to "${activeFolderName}"`
                  : 'Uploading'}
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, GIF • Max 5MB</p>
            </div>
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-wrap gap-2">
              {imagePreviews.map((p, i) => (
                <div
                  key={i}
                  className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-indigo-200"
                >
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                    <Loader className="h-4 w-4 text-white animate-spin" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-indigo-600" />
              {activeFilter === 'all'
                ? 'All Photos'
                : activeFilter === 'uncategorized'
                ? 'Uncategorized'
                : activeFolderName || 'Gallery'}
            </h3>
            <span className="text-sm text-gray-500 font-medium">{images.length} photos</span>
          </div>

          <div className="p-6">
            {loading && images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-gray-500">Loading…</p>
              </div>
            )}

            {images.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                  <ImageIcon className="h-12 w-12 text-indigo-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-1">No photos here</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  {activeFilter === 'uncategorized'
                    ? 'Upload photos without selecting a folder'
                    : activeFolderName
                    ? `Upload photos to "${activeFolderName}"`
                    : 'Select a folder or upload to Uncategorized'}
                </p>
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id || index}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-100 hover:ring-2 hover:ring-indigo-300 transition-all duration-300 hover:shadow-lg"
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => setLightboxImage({ ...image, index })}
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext fill="%239ca3af" x="50" y="55" text-anchor="middle" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image, index);
                        }}
                        disabled={loading}
                        className="self-end p-2 rounded-lg bg-white/90 hover:bg-red-500 hover:text-white text-gray-700 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <p className="text-white text-xs font-medium truncate drop-shadow">
                        {image.name?.substring(0, 24) || 'Photo'}
                        {(image.name?.length || 0) > 24 ? '…' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowCreateFolder(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameFolderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !loading && setRenameFolderModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rename Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => !loading && setRenameFolderModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFolder}
                disabled={loading || !newFolderName.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirm */}
      {confirmDeleteFolder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !loading && setConfirmDeleteFolder(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Folder?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you delete this folder, it will remove all the photos inside it. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => !loading && setConfirmDeleteFolder(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFolder(confirmDeleteFolder)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm truncate max-w-[80vw]">
            {lightboxImage.name}
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySection;
