import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Share2,
  Heart,
  Info,
  MapPin,
  Calendar,
  ExternalLink,
  Tag,
  Check
} from 'lucide-react';
import { ImageItem } from '../types';

interface LightboxModalProps {
  image: ImageItem | null;
  images: ImageItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: ImageItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  image,
  images,
  isOpen,
  onClose,
  onSelectImage,
  isFavorite,
  onToggleFavorite,
  onTagClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset zoom & rotation when image changes
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
  }, [image?.id]);

  // Current index in images array
  const currentIndex = image ? images.findIndex((img) => img.id === image.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1 && currentIndex !== -1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onSelectImage(images[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, images, onSelectImage]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onSelectImage(images[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, images, onSelectImage]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
      } else if (e.key === '0') {
        setZoomLevel(1);
        setRotation(0);
      } else if (e.key.toLowerCase() === 'r') {
        setRotation((prev) => (prev + 90) % 360);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !image) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.target = '_blank';
    link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="lightbox-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Controls */}
      <div
        id="lightbox-top-bar"
        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10 z-20 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title and image count */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/15 text-stone-200">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate text-stone-100">
              {image.title}
            </h2>
            <p className="text-xs text-stone-400 truncate">
              {image.photographer} • <span className="text-stone-300">{image.category}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom In */}
          <button
            id="lightbox-btn-zoom-in"
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition"
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            id="lightbox-btn-zoom-out"
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition"
            title="Zoom Out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Zoom indicator */}
          {zoomLevel !== 1 && (
            <button
              id="lightbox-btn-reset-zoom"
              onClick={handleResetZoom}
              className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 transition"
              title="Reset Zoom (0)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
          )}

          {/* Rotate */}
          <button
            id="lightbox-btn-rotate"
            onClick={handleRotate}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition hidden sm:inline-flex"
            title="Rotate 90° (R)"
            aria-label="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Favorite */}
          <button
            id="lightbox-btn-favorite"
            onClick={() => onToggleFavorite(image.id)}
            className={`p-2 rounded-lg transition ${
              isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white'
            }`}
            title="Toggle favorite"
            aria-label="Toggle favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Share / Copy */}
          <button
            id="lightbox-btn-share"
            onClick={handleCopyLink}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition relative"
            title="Copy photo link"
            aria-label="Copy photo link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            id="lightbox-btn-download"
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition"
            title="Download image"
            aria-label="Download image"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Toggle details info */}
          <button
            id="lightbox-btn-toggle-info"
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg transition ${
              showInfo ? 'bg-white text-stone-900' : 'bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white'
            }`}
            title="Image information"
            aria-label="Toggle image info"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            id="lightbox-btn-close"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/15 hover:bg-rose-600 text-white transition ml-2"
            title="Close Lightbox (Esc)"
            aria-label="Close lightbox"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        id="lightbox-stage"
        className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden"
        onClick={(e) => {
          // If clicked directly on the stage (empty space), close lightbox
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Previous Button */}
        {hasPrev && (
          <button
            id="lightbox-btn-prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition shadow-lg z-20"
            title="Previous (Arrow Left)"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* The Viewport & Image */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            id={`lightbox-img-full-${image.id}`}
            src={image.url}
            alt={image.title}
            className="max-h-[78vh] max-w-[88vw] object-contain rounded-lg shadow-2xl transition-all select-none"
            draggable={false}
          />
        </div>

        {/* Next Button */}
        {hasNext && (
          <button
            id="lightbox-btn-next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition shadow-lg z-20"
            title="Next (Arrow Right)"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Optional Metadata / Info drawer */}
      {showInfo && (
        <div
          id="lightbox-info-drawer"
          className="w-full bg-stone-900/95 border-t border-white/10 px-6 py-4 text-white z-30 animate-in slide-in-from-bottom-4 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{image.title}</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-white/20 text-stone-200">
                  {image.category}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                <span className="flex items-center gap-1">
                  Photo by{' '}
                  {image.photographerUrl ? (
                    <a
                      href={image.photographerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-200 hover:text-white underline inline-flex items-center gap-0.5 font-medium"
                    >
                      {image.photographer}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-stone-200 font-medium">{image.photographer}</span>
                  )}
                </span>
                {image.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {image.location}
                  </span>
                )}
                {image.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {image.date}
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            {image.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-500 mr-1" />
                {image.tags.map((tag) => (
                  <button
                    key={tag}
                    id={`lightbox-tag-${tag}`}
                    onClick={() => {
                      onTagClick?.(tag);
                      onClose();
                    }}
                    className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/25 text-stone-300 hover:text-white transition"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint Bar */}
      <div
        id="lightbox-shortcuts-bar"
        className="w-full py-2 px-4 bg-black/60 text-center text-[11px] text-stone-400 hidden sm:flex items-center justify-center gap-4 border-t border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300">→</kbd> Navigate</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300">+</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300">-</kbd> Zoom</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300">R</kbd> Rotate</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-stone-300">ESC</kbd> Close</span>
      </div>
    </div>
  );
};
