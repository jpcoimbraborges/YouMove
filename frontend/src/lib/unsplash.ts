/**
 * Unsplash API Integration for Exercise Images
 * Used as fallback when wger API doesn't have images
 */

const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // TODO: Move to env

interface UnsplashImage {
    id: string;
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string | null;
}

interface UnsplashSearchResponse {
    total: number;
    total_pages: number;
    results: UnsplashImage[];
}

/**
 * Search for exercise images on Unsplash
 */
export async function searchUnsplashExercise(exerciseName: string): Promise<string | null> {
    try {
        // For demo purposes, use Unsplash's public feed (no key needed)
        // In production, you should use a proper API key

        // Map exercise names to search terms
        const searchTerm = getUnsplashSearchTerm(exerciseName);

        console.log(`[unsplash] Searching for: "${searchTerm}"`);

        // Using Lorem Picsum for demo (free, no key needed)
        // Returns random fitness-related images
        // In production, replace with actual Unsplash API
        const randomSeed = searchTerm.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const imageUrl = `https://picsum.photos/seed/${randomSeed}/400/400`;

        console.log(`[unsplash] Using placeholder: ${imageUrl}`);
        return imageUrl;

        /* Production Unsplash code (requires API key):
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=squarish`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data: UnsplashSearchResponse = await response.json();
        
        if (data.results.length > 0) {
            return data.results[0].urls.regular;
        }
        
        return null;
        */
    } catch (error) {
        console.error('Error searching Unsplash:', error);
        return null;
    }
}

/**
 * Map exercise names to better search terms for Unsplash
 */
function getUnsplashSearchTerm(exerciseName: string): string {
    const lowerName = exerciseName.toLowerCase();

    // Map to general fitness categories for better Unsplash results
    if (lowerName.includes('bench') || lowerName.includes('press')) return 'gym workout bench press';
    if (lowerName.includes('push')) return 'pushup fitness';
    if (lowerName.includes('squat')) return 'squat workout gym';
    if (lowerName.includes('pull')) return 'pullup gym bar';
    if (lowerName.includes('curl')) return 'bicep curl dumbbell';
    if (lowerName.includes('row')) return 'rowing exercise gym';
    if (lowerName.includes('shoulder')) return 'shoulder workout gym';
    if (lowerName.includes('leg')) return 'leg workout gym';
    if (lowerName.includes('ab') || lowerName.includes('crunch')) return 'ab workout fitness';
    if (lowerName.includes('plank')) return 'plank exercise';

    // Default: use the exercise name + "workout"
    return `${exerciseName} workout gym`;
}
