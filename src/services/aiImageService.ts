import { GoogleGenAI } from '@google/genai';
import { ImageItem, ImageCategory, AspectRatioType } from '../types';

export type AiProvider = 'pollinations' | 'gemini';

export interface GenerateAiImageOptions {
  prompt: string;
  provider?: AiProvider;
  apiKey?: string;
  category?: Exclude<ImageCategory, 'All' | 'Favorites'>;
  aspectRatio?: AspectRatioType;
}

export const getStoredApiKey = (): string => {
  const viteEnv = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  const runtimeProcess = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process;

  return (
    localStorage.getItem('gallery_gemini_api_key') ||
    viteEnv?.VITE_GEMINI_API_KEY ||
    runtimeProcess?.env?.GEMINI_API_KEY ||
    runtimeProcess?.env?.API_KEY ||
    ''
  );
};

export const setStoredApiKey = (key: string): void => {
  if (key) {
    localStorage.setItem('gallery_gemini_api_key', key);
  } else {
    localStorage.removeItem('gallery_gemini_api_key');
  }
};

const getAspectDimensions = (ratio: AspectRatioType = 'landscape') => {
  switch (ratio) {
    case 'portrait':
      return { width: 800, height: 1200 };
    case 'square':
      return { width: 1000, height: 1000 };
    case 'landscape':
    default:
      return { width: 1200, height: 800 };
  }
};

const generateWithPollinations = async (
  prompt: string,
  aspectRatio: AspectRatioType = 'landscape'
): Promise<string> => {
  const { width, height } = getAspectDimensions(aspectRatio);
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(prompt.trim());
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => {
      resolve(imageUrl);
    }, 12000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(imageUrl);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
};

const generateWithGemini = async (
  prompt: string,
  apiKey: string
): Promise<{ url: string; mimeType: string }> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `Create a high-quality editorial photograph of: ${prompt}. Do not add text, captions, borders, or watermarks.`,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data
  );
  const imageData = imagePart?.inlineData?.data;
  const mimeType = imagePart?.inlineData?.mimeType || 'image/png';

  if (!imageData) {
    throw new Error('Gemini API did not return image data. Try refining your prompt or switching provider.');
  }

  return {
    url: `data:${mimeType};base64,${imageData}`,
    mimeType,
  };
};

export const generateAiImage = async ({
  prompt,
  provider = 'pollinations',
  apiKey,
  category = 'Minimal',
  aspectRatio = 'landscape',
}: GenerateAiImageOptions): Promise<ImageItem> => {
  const cleanedPrompt = prompt.trim();
  if (!cleanedPrompt) {
    throw new Error('Please enter a valid search prompt to generate an image.');
  }

  let finalUrl = '';
  let providerName = 'AI Generator';

  if (provider === 'gemini') {
    const effectiveKey = apiKey || getStoredApiKey();
    if (!effectiveKey) {
      throw new Error(
        'Gemini API key is required. Please provide a key or switch to Pollinations AI (Free).'
      );
    }
    const result = await generateWithGemini(cleanedPrompt, effectiveKey);
    finalUrl = result.url;
    providerName = 'Google Gemini AI';
  } else {
    finalUrl = await generateWithPollinations(cleanedPrompt, aspectRatio);
    providerName = 'Pollinations AI';
  }

  const titleFormatted = cleanedPrompt.charAt(0).toUpperCase() + cleanedPrompt.slice(1);
  const tagsList = cleanedPrompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 6);

  if (!tagsList.includes('ai-generated')) {
    tagsList.push('ai-generated');
  }

  const newImage: ImageItem = {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: titleFormatted,
    url: finalUrl,
    thumbnailUrl: finalUrl,
    category,
    photographer: providerName,
    aspectRatio,
    tags: tagsList,
    likes: 1,
    date: new Date().toISOString().split('T')[0],
    isCustom: true,
  };

  return newImage;
};
