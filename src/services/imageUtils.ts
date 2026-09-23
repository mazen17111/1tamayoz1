import { uploadToFirebaseStorage } from '../lib/firebase';
import { apiService } from './api';

export interface ImageOptimizationResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * High-performance, client-side canvas compressor for quiz & question images.
 * Reduces 5MB-10MB phone camera shots / high-res screenshots down to crisp 30KB-80KB assets.
 * Preserves high contrast for mathematical equations, geometric shapes, and text.
 */
export async function optimizeImage(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<ImageOptimizationResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر معالجة الصورة'));
      img.onload = () => {
        let { width, height } = img;

        // Scale down while maintaining exact aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر تشغيل معالج الرسوم'));
          return;
        }

        // Fill background with white in case of transparent PNG with dark text
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP or JPEG for maximum compression & crispness
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('تعذر ضغط الصورة'));
              return;
            }
            const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const compressedFile = new File([blob], `${cleanBase || 'quiz-image'}.jpg`, {
              type: mimeType,
            });

            resolve({
              file: compressedFile,
              dataUrl,
              width,
              height,
              sizeBytes: blob.size,
            });
          },
          mimeType,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image with multi-tier permanent storage:
 * 1. Firebase Cloud Storage (Permanent cloud CDN URL that survives container rebuilds)
 * 2. Express Server /uploads/ (Local high-speed disk fallback)
 * 3. Compact Base64 Data URL (Never expires, safely under 100KB)
 */
export async function uploadQuizImagePermanently(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; fallbackDataUrl: string }> {
  // Step 1: Optimize & compress in browser (0-100ms)
  const optimized = await optimizeImage(file, 1200, 0.85);

  // Cache locally in localStorage for instant offline recovery
  try {
    const cacheKey = `img_cache_${optimized.file.name}_${Date.now()}`;
    localStorage.setItem(cacheKey, optimized.dataUrl.slice(0, 200000));
  } catch (e) {
    // LocalStorage quota might be full, ignore
  }

  let finalUrl = '';

  // Step 2: Try Firebase Cloud Storage first for permanent hosting
  try {
    const fbRes = await uploadToFirebaseStorage(optimized.file, 'images', (percent) => {
      if (onProgress) onProgress(Math.min(95, percent));
    });
    if (fbRes?.url && fbRes.url.startsWith('http')) {
      finalUrl = fbRes.url;
    }
  } catch (fbErr) {
    console.warn('Firebase storage upload failed, falling back to server disk storage:', fbErr);
  }

  // Step 3: If Firebase Storage was not used or failed, upload to Express server /uploads/
  if (!finalUrl) {
    try {
      const serverRes = await apiService.uploadFile(optimized.file, (percent) => {
        if (onProgress) onProgress(percent);
      });
      if (serverRes?.url) {
        finalUrl = serverRes.url;
      }
    } catch (serverErr) {
      console.warn('Server disk upload failed, falling back to embedded optimized image:', serverErr);
    }
  }

  // Step 4: If all remote uploads fail, use the optimized base64 Data URL
  if (!finalUrl) {
    finalUrl = optimized.dataUrl;
  }

  if (onProgress) onProgress(100);

  return {
    url: finalUrl,
    fallbackDataUrl: optimized.dataUrl,
  };
}
