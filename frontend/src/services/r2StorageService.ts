// R2 Storage Service
// Handles image loading from R2 with retry logic and optimization

import { STORAGE_URL } from '../config/api.config';

interface R2LoadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  cacheBust?: boolean;
}

class R2StorageService {
  private imageCache: Map<string, string> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();

  /**
   * Get the full URL for a storage path
   */
  getUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    
    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Construct URL based on path format
    if (path.startsWith('/storage')) {
      return STORAGE_URL + path;
    }
    
    return `${STORAGE_URL}/storage/${path}`;
  }

  /**
   * Preload an image from R2 with retry logic
   */
  async preloadImage(
    path: string,
    options: R2LoadOptions = {}
  ): Promise<string> {
    const url = this.getUrl(path);
    if (!url) {
      throw new Error('Invalid image path');
    }

    // Check cache first
    if (!options.cacheBust && this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Create loading promise
    const loadPromise = this._loadImageWithRetry(url, options);
    this.loadingPromises.set(url, loadPromise);

    try {
      const loadedUrl = await loadPromise;
      this.imageCache.set(url, loadedUrl);
      return loadedUrl;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Load image with retry logic
   */
  private async _loadImageWithRetry(
    url: string,
    options: R2LoadOptions
  ): Promise<string> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      timeout = 10000,
      cacheBust = false,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const imageUrl = cacheBust ? `${url}?t=${Date.now()}` : url;
        await this._loadImage(imageUrl, timeout);
        return imageUrl;
      } catch (err) {
        lastError = err as Error;
        console.warn(`Image load attempt ${attempt}/${maxRetries} failed:`, err);

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to load image');
  }

  /**
   * Load a single image with timeout
   */
  private _loadImage(url: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      const timeoutId = setTimeout(() => {
        img.src = ''; // Cancel loading
        reject(new Error('Image load timeout'));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Image load error'));
      };

      img.src = url;
    });
  }

  /**
   * Preload multiple images in parallel
   */
  async preloadImages(
    paths: string[],
    options: R2LoadOptions = {}
  ): Promise<string[]> {
    const promises = paths.map(path => 
      this.preloadImage(path, options).catch(err => {
        console.error('Failed to preload image:', path, err);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter(Boolean) as string[];
  }

  /**
   * Clear cache for a specific URL or all
   */
  clearCache(url?: string): void {
    if (url) {
      this.imageCache.delete(url);
    } else {
      this.imageCache.clear();
    }
  }

  /**
   * Check if an image is already cached
   */
  isCached(path: string): boolean {
    const url = this.getUrl(path);
    return url ? this.imageCache.has(url) : false;
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.imageCache.size;
  }

  /**
   * Prefetch images for better performance
   */
  prefetch(paths: string[]): void {
    // Start loading in background without blocking
    paths.forEach(path => {
      this.preloadImage(path, { maxRetries: 2 }).catch(() => {
        // Silently fail for prefetch
      });
    });
  }

  /**
   * Download a file from R2
   */
  async downloadFile(path: string, filename?: string): Promise<void> {
    const url = this.getUrl(path);
    if (!url) {
      throw new Error('Invalid file path');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || path.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      throw new Error('Failed to download file');
    }
  }
}

// Export singleton instance
export const r2StorageService = new R2StorageService();

// Export helper functions
export const getR2Url = (path: string | null | undefined) => 
  r2StorageService.getUrl(path);

export const preloadR2Image = (path: string, options?: R2LoadOptions) =>
  r2StorageService.preloadImage(path, options);

export const prefetchR2Images = (paths: string[]) =>
  r2StorageService.prefetch(paths);
