import React, { useState, useRef } from 'react';
import { X, UploadCloud, Link as LinkIcon, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ImageItem, ImageCategory } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImage: (newImage: ImageItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddImage,
}) => {
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<Exclude<ImageCategory, 'All' | 'Favorites'>>('Nature');
  const [photographer, setPhotographer] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
      if (!title) {
        // Auto-generate title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = sourceType === 'file' ? fileDataUrl : imageUrl.trim();

    if (!finalUrl) {
      setError('Please provide an image either by file upload or web URL.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for the image.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const newImage: ImageItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      url: finalUrl,
      thumbnailUrl: finalUrl,
      category,
      photographer: photographer.trim() || 'You',
      location: location.trim() || undefined,
      aspectRatio: 'landscape',
      tags: parsedTags.length > 0 ? parsedTags : [category.toLowerCase()],
      likes: 1,
      date: new Date().toISOString().split('T')[0],
      isCustom: true,
    };

    onAddImage(newImage);
    // Reset and close
    setFileDataUrl('');
    setImageUrl('');
    setTitle('');
    setLocation('');
    setTagsInput('');
    setError('');
    onClose();
  };

  const currentPreview = sourceType === 'file' ? fileDataUrl : imageUrl;

  return (
    <div
      id="upload-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="upload-modal-content"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-stone-100 text-stone-800">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">Add New Photo</h2>
              <p className="text-xs text-stone-500">Upload from device or paste an image link</p>
            </div>
          </div>
          <button
            id="btn-close-upload-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Tab switcher */}
        <div className="px-6 pt-4">
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
            <button
              id="tab-source-file"
              type="button"
              onClick={() => setSourceType('file')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                sourceType === 'file'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Local File</span>
            </button>
            <button
              id="tab-source-url"
              type="button"
              onClick={() => setSourceType('url')}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                sourceType === 'url'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Paste Image URL</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Upload / Drag & Drop area */}
          {sourceType === 'file' ? (
            <div>
              <input
                ref={fileInputRef}
                id="file-upload-hidden-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div
                id="file-dropzone-area"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[140px] ${
                  dragActive
                    ? 'border-stone-900 bg-stone-100/70'
                    : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'
                }`}
              >
                {fileDataUrl ? (
                  <div className="relative group w-full flex flex-col items-center">
                    <img
                      src={fileDataUrl}
                      alt="Uploaded preview"
                      className="max-h-36 rounded-lg object-contain shadow-xs"
                    />
                    <span className="text-xs text-stone-500 mt-2 font-medium">
                      Click or drop another file to replace
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-stone-100 text-stone-600 mb-2">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-stone-800">
                      Drag & drop your image here, or <span className="text-stone-950 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Supports JPG, PNG, WebP, GIF (up to 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="input-image-url" className="block text-xs font-semibold text-stone-700 mb-1">
                Image Web Address (URL)
              </label>
              <input
                id="input-image-url"
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              />
              {imageUrl && (
                <div className="mt-2 p-2 rounded-lg bg-stone-100 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-32 rounded object-contain"
                    onError={() => setError('Could not load image from this URL. Please verify the link.')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Form details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="input-photo-title" className="block text-xs font-semibold text-stone-700 mb-1">
                Title *
              </label>
              <input
                id="input-photo-title"
                type="text"
                required
                placeholder="e.g. Morning Mist at Dawn"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              />
            </div>

            <div>
              <label htmlFor="select-photo-category" className="block text-xs font-semibold text-stone-700 mb-1">
                Category
              </label>
              <select
                id="select-photo-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              >
                <option value="Nature">Nature</option>
                <option value="Architecture">Architecture</option>
                <option value="Travel">Travel</option>
                <option value="Minimal">Minimal</option>
                <option value="Street">Street</option>
                <option value="Animals">Animals</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-photo-author" className="block text-xs font-semibold text-stone-700 mb-1">
                Photographer / Creator
              </label>
              <input
                id="input-photo-author"
                type="text"
                placeholder="Your name or artist"
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              />
            </div>

            <div>
              <label htmlFor="input-photo-location" className="block text-xs font-semibold text-stone-700 mb-1">
                Location (optional)
              </label>
              <input
                id="input-photo-location"
                type="text"
                placeholder="e.g. Kyoto, Japan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-photo-tags" className="block text-xs font-semibold text-stone-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="input-photo-tags"
              type="text"
              placeholder="sunshine, outdoors, hills, calm"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              id="btn-cancel-upload"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              id="btn-submit-photo"
              type="submit"
              disabled={!currentPreview}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs"
            >
              Add to Gallery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
