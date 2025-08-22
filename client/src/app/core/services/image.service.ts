import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  /**
   * Constructs the full URL for an image based on the relative path
   * @param relativePath - The relative path from the database (e.g., "/images/products/filename.jpg")
   * @returns The full URL that can be used in img src
   */
  getImageUrl(relativePath: string | null | undefined): string {
    if (!relativePath) {
      return this.getPlaceholderImageUrl();
    }

    // If it's already a full URL, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    // If it's a data URL, return as is
    if (relativePath.startsWith('data:')) {
      return relativePath;
    }

    // Construct the full URL for client/public/images/products
    const clientBaseUrl = window.location.origin;
    
    // Ensure the path starts with / if it doesn't already
    const imagePath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    return `${clientBaseUrl}${imagePath}`;
  }

  /**
   * Gets a placeholder image URL when no image is available
   */
  getPlaceholderImageUrl(): string {
    return 'https://via.placeholder.com/400x300?text=No+Image+Available';
  }

  /**
   * Validates if an image URL is valid
   */
  isValidImageUrl(url: string): boolean {
    return Boolean(url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')));
  }

  /**
   * Handles image loading errors by trying alternative URL patterns
   */
  handleImageError(event: any, originalPath: string): void {
    console.error('Image failed to load:', event);
    console.log('Failed image URL:', event.target.src);
    
    // Try alternative URL construction if the first one fails
    if (originalPath && !originalPath.includes('data:') && !originalPath.includes('via.placeholder.com')) {
      const clientBaseUrl = window.location.origin;
      
      // Try different URL patterns
      let alternativeUrl = this.getImageUrl(originalPath);
      
      // Try HTTP instead of HTTPS for localhost
      if (alternativeUrl.includes('https://localhost:4200')) {
        alternativeUrl = alternativeUrl.replace('https://localhost:4200', 'http://localhost:4200');
      }
      // Try with /images/ prefix if not present
      else if (!alternativeUrl.includes('/images/')) {
        const urlParts = alternativeUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        alternativeUrl = alternativeUrl.replace(`/${filename}`, `/images/${filename}`);
      }
      // Try without /images/ prefix if present
      else if (alternativeUrl.includes('/images/')) {
        alternativeUrl = alternativeUrl.replace('/images/', '/');
      }
      
      console.log('Trying alternative URL:', alternativeUrl);
      event.target.src = alternativeUrl;
    } else {
      // Fallback to placeholder
      event.target.src = this.getPlaceholderImageUrl();
    }
  }
}
