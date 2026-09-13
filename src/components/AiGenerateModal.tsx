import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ImagePlus,
  Key,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { ImageItem, ImageCategory, AspectRatioType } from '../types';
import {
  generateAiImage,
  getStoredApiKey,
  setStoredApiKey,
  AiProvider,
} from '../services/aiImageService';

interface AiGenerateModalProps {
  isOpen: boolean;
  prompt: string;
  onClose: () => void;
  onAddImage: (newImage: ImageItem) => void;
}

const CATEGORIES: Exclude<ImageCategory, 'All' | 'Favorites'>[] = [
  'Minimal',
  'Nature',
  'Architecture',
  'Travel',
  'Street',
  'Animals',
];

const ASPECT_RATIOS: { label: string; value: AspectRatioType }[] = [
  { label: 'Landscape (16:9)', value: 'landscape' },
  { label: 'Square (1:1)', value: 'square' },
  { label: 'Portrait (3:4)', value: 'portrait' },
];

export const AiGenerateModal: React.FC<AiGenerateModalProps> = ({
  isOpen,
  prompt: initialPrompt,
  onClose,
  onAddImage,
}) => {
  const [promptInput, setPromptInput] = useState(initialPrompt);
  const [provider, setProvider] = useState<AiProvider>('pollinations');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<Exclude<ImageCategory, 'All' | 'Favorites'>>('Minimal');
  const [selectedAspectRatio, setSelectedAspectRatio] =
    useState<AspectRatioType>('landscape');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPromptInput(initialPrompt);
      setError('');
      setIsGenerating(false);
      setPreviewImage(null);
      const key = getStoredApiKey();
      setApiKey(key);
      if (key && provider === 'gemini') {
        setShowApiKeyInput(false);
      }
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    setStoredApiKey(val);
  };

  const handleGenerate = async () => {
    if (!promptInput.trim()) {
      setError('Please enter a prompt describing the image you want to generate.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const generated = await generateAiImage({
        prompt: promptInput,
        provider,
        apiKey,
        category: selectedCategory,
        aspectRatio: selectedAspectRatio,
      });

      setPreviewImage(generated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not generate image. Please check your connection or API key.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToGallery = () => {
    if (previewImage) {
      onAddImage(previewImage);
      onClose();
    }
  };

  return (
    <div
      id="ai-generate-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="ai-generate-modal-content"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-stone-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Image Generator API</h2>
              <p className="text-xs text-stone-300">Create original photo using AI models</p>
            </div>
          </div>
          <button
            id="btn-close-ai-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Preview State */}
          {previewImage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Generated Image Preview
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {previewImage.photographer}
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-950 aspect-video shadow-md group">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 text-xs">
                <p className="font-semibold text-stone-800 mb-1">{previewImage.title}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {previewImage.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white border border-stone-200 text-stone-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="btn-ai-save-image"
                  onClick={handleSaveToGallery}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Add to Gallery</span>
                </button>

                <button
                  id="btn-ai-regenerate"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
          ) : (
            /* Prompt Input Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Image Search Prompt
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="e.g. Futuristic glass skyscraper in sunset, minimal design..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Provider Choice */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  AI Model API
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('pollinations')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      provider === 'pollinations'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Pollinations AI</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${provider === 'pollinations' ? 'bg-amber-400 text-stone-900' : 'bg-emerald-100 text-emerald-800'}`}>
                        Free REST API
                      </span>
                    </div>
                    <p className={`text-[11px] ${provider === 'pollinations' ? 'text-stone-300' : 'text-stone-500'}`}>
                      Instant keyless AI image generation
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('gemini')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      provider === 'gemini'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Google Gemini</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${provider === 'gemini' ? 'bg-amber-400 text-stone-900' : 'bg-stone-100 text-stone-600'}`}>
                        SDK API Key
                      </span>
                    </div>
                    <p className={`text-[11px] ${provider === 'gemini' ? 'text-stone-300' : 'text-stone-500'}`}>
                      Google GenAI Image Model
                    </p>
                  </button>
                </div>
              </div>

              {/* Gemini API Key Section */}
              {provider === 'gemini' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-300/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      Gemini API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="text-[10px] font-semibold text-amber-800 hover:underline"
                    >
                      {apiKey ? 'Change Key' : 'Enter Key'}
                    </button>
                  </div>

                  {(showApiKeyInput || !apiKey) && (
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white border border-amber-300/80 outline-none font-mono focus:border-amber-600"
                    />
                  )}
                  {apiKey && !showApiKeyInput && (
                    <p className="text-[11px] text-amber-800 font-mono">
                      Key configured: •••••••••{apiKey.slice(-4)}
                    </p>
                  )}
                </div>
              )}

              {/* Options: Aspect Ratio & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(
                        e.target.value as Exclude<ImageCategory, 'All' | 'Favorites'>
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-stone-50 border border-stone-200 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={selectedAspectRatio}
                    onChange={(e) =>
                      setSelectedAspectRatio(e.target.value as AspectRatioType)
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-stone-50 border border-stone-200 outline-none"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="btn-generate-ai-image"
                onClick={handleGenerate}
                disabled={isGenerating || !promptInput.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Connecting to AI API & Rendering Image...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>Generate AI Image via API</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};