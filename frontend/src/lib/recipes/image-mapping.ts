export function getRecipeImage(name: string, originalUrl?: string | null): string | null {
    // If we have a valid uploaded image, use it
    if (originalUrl && originalUrl.startsWith('http')) {
        return originalUrl;
    }

    // Modern Design: No fallback images from Unsplash. 
    // We will render Category Icons instead.
    return null;
}
