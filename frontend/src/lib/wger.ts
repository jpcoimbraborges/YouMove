/**
 * wger API Integration Service
 * Documentation: https://wger.de/en/software/api
 */

import { getLocalExerciseImage } from './local-exercises';
import { searchUnsplashExercise } from './unsplash';

const WGER_API_BASE = 'https://wger.de/api/v2';
const WGER_API_TOKEN = '66f7c9cc598f5d0660e57e0b434f2d420930b322';

export interface WgerExercise {
    id: number;
    uuid: string;
    name: string;
    description: string;
    category: number;
    muscles: number[];
    muscles_secondary: number[];
    equipment: number[];
    variations: number | null;
    license_author: string;
}

export interface WgerExerciseInfo {
    id: number;
    name: string;
    description: string;
    category: { id: number; name: string };
    muscles: Array<{ id: number; name: string; name_en: string }>;
    images: Array<{ id: number; uuid: string; image: string; is_main: boolean }>;
}

export interface WgerSearchResult {
    count: number;
    next: string | null;
    previous: string | null;
    results: WgerExercise[];
}

/**
 * Direct mapping of exercise names to wger exercise IDs
 * These IDs have been verified to have images in the wger database
 */
const EXERCISE_ID_MAP: Record<string, number> = {
    // Chest (verified IDs)
    'Bench Press': 192, // Atualizado ID correto (era 73)
    'Push-up': 135,
    'Bench Press Narrow Grip': 88, // Narrow grip bench press

    // Arms
    'Bicep Curl': 95,  // Biceps Curl With Cable
    'Dumbbell Bicep Curl': 92,  // Biceps Curls With Dumbbell
    'Hammer Curl': 92,
    'Biceps Curls With Barbell': 91,
    'Biceps Curls With Dumbbell': 92,

    // Core
    'Crunches': 91, // Crunches
    'Plank': 240, // Plank
    'Ab': 91,
};

/**
 * Search exercises by name using the standard exercise endpoint
 * Note: The wger API's name filter is unreliable, so this is used as fallback only
 */
export async function searchExercisesByName(name: string): Promise<WgerSearchResult> {
    try {
        const response = await fetch(
            `${WGER_API_BASE}/exercise/?language=2&limit=10`,
            {
                headers: {
                    'Authorization': `Token ${WGER_API_TOKEN}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`wger API error: ${response.status}`);
        }

        const data = await response.json();

        // Filter results manually since API filter doesn't work
        const filtered = data.results.filter((ex: WgerExercise) =>
            ex.name && ex.name.toLowerCase().includes(name.toLowerCase())
        );

        return {
            count: filtered.length,
            next: null,
            previous: null,
            results: filtered
        };
    } catch (error) {
        console.error('Error searching exercises:', error);
        return { count: 0, next: null, previous: null, results: [] };
    }
}

/**
 * Get detailed info including images for a specific exercise ID
 */
export async function getExerciseInfo(id: number): Promise<WgerExerciseInfo | null> {
    try {
        const response = await fetch(
            `${WGER_API_BASE}/exerciseinfo/${id}/`,
            {
                headers: {
                    'Authorization': `Token ${WGER_API_TOKEN}`,
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching info for exercise ${id}:`, error);
        return null;
    }
}

/**
 * Get main image for an exercise using comprehensive fallback system:
 * Local → wger (direct) → wger (search) → Unsplash → null (shows icon)
 */
export async function getExerciseImageByName(exerciseName: string): Promise<string | null> {
    try {
        // Normalize name first to match mappings
        const normalizedName = normalizeExerciseName(exerciseName);
        console.log(`[images] Processing image for "${exerciseName}" (Normalized: "${normalizedName}")`);

        // Priority 1: Check for local image
        const localImage = getLocalExerciseImage(normalizedName);
        if (localImage) {
            console.log(`[images] Using local image for "${normalizedName}": ${localImage}`);
            return localImage;
        }

        // Priority 2: Check if we have a direct wger ID mapping
        const exerciseId = EXERCISE_ID_MAP[normalizedName] || EXERCISE_ID_MAP[exerciseName];

        if (exerciseId) {
            console.log(`[wger] Using direct ID mapping for "${exerciseName}": ${exerciseId}`);
            const info = await getExerciseInfo(exerciseId);

            if (info && info.images && info.images.length > 0) {
                const mainImage = info.images.find(img => img.is_main);
                const imageUrl = mainImage?.image || info.images[0].image;
                console.log(`[wger] Found image via direct mapping: ${imageUrl}`);
                return imageUrl;
            }
        }

        // Priority 3: Fallback to wger search (unreliable)
        console.log(`[wger] No direct mapping for "${exerciseName}", trying search...`);
        const searchResult = await searchExercisesByName(exerciseName);

        if (searchResult.results.length > 0) {
            // Iterate through candidates to find one with an image
            for (const exercise of searchResult.results) {
                const info = await getExerciseInfo(exercise.id);

                if (info && info.images && info.images.length > 0) {
                    const mainImage = info.images.find(img => img.is_main);
                    const imageUrl = mainImage?.image || info.images[0].image;
                    console.log(`[wger] Found image via search: ${imageUrl}`);
                    return imageUrl;
                }
            }
        }

        // Priority 4: Fallback to Unsplash
        console.log(`[unsplash] Trying Unsplash fallback for "${exerciseName}"...`);
        const unsplashImage = await searchUnsplashExercise(exerciseName);
        if (unsplashImage) {
            console.log(`[unsplash] Found image: ${unsplashImage}`);
            return unsplashImage;
        }

        // Priority 5: No image found - will show icon fallback
        console.log(`[images] No image found for "${exerciseName}", will use icon fallback`);
        return null;
    } catch (error) {
        console.error('Error getting exercise image:', error);
        return null;
    }
}

/**
 * Normalize exercise name for better matching
 */
export function normalizeExerciseName(name: string): string {
    const lowerName = name.toLowerCase().trim();

    // Direct detailed mapping (PT -> EN)
    const exactMap: Record<string, string> = {
        'supino reto': 'Bench Press',
        'supino inclinado': 'Incline Bench Press',
        'supino declinado': 'Decline Bench Press',
        'flexão de braço': 'Push-up',
        'flexões de braço': 'Push-up',
        'flexão': 'Push-up',
        'agachamento': 'Squat',
        'agachamento livre': 'Squat',
        'agachamento sumô': 'Sumo Squat',
        'leg press': 'Leg Press',
        'extensão de pernas': 'Leg Extensions',
        'mesa flexora': 'Leg Curls',
        'cadeira extensora': 'Leg Extensions',
        'panturrilha': 'Calf Raises',
        'elevação de panturrilha': 'Calf Raises',
        'pulley frente': 'Lat Pulldown',
        'puxada frente': 'Lat Pulldown',
        'puxada alta': 'Lat Pulldown',
        'remada baixa': 'Seated Row',
        'remada curvada': 'Bent Over Row',
        'remada unilateral': 'Dumbbell Row',
        'remada serrote': 'Dumbbell Row',
        'desenvolvimento': 'Overhead Press',
        'desenvolvimento ombros': 'Overhead Press',
        'elevação lateral': 'Lateral Raise',
        'elevação frontal': 'Front Raise',
        'rosca direta': 'Bicep Curl',
        'rosca alternada': 'Dumbbell Bicep Curl',
        'martelo': 'Hammer Curl',
        'tríceps corda': 'Triceps Pushdown',
        'tríceps testa': 'Skullcrushers',
        'tríceps banco': 'Bench Dips',
        'mergulho': 'Dips',
        'abdominal': 'Crunches',
        'prancha': 'Plank',
        'burpee': 'Burpee',
        'polichinelo': 'Jumping Jacks',
        'corrida': 'Running',
        'caminhada': 'Walking',
        'esteira': 'Treadmill',
        'elíptico': 'Elliptical',
        'bike': 'Cycling',
        'bicicleta': 'Cycling',
        'levantamento terra': 'Deadlift',
        'stiff': 'Stiff-Legged Deadlift',
        'avanço': 'Lunges',
        'afundo': 'Lunges',
        'passada': 'Lunges',
        'barra fixa': 'Pull-up',
        'barra': 'Pull-up',
        'remada com elástico': 'Band Row'
    };

    if (exactMap[lowerName]) {
        console.log(`[wger] Exact match found: "${name}" -> "${exactMap[lowerName]}"`);
        return exactMap[lowerName];
    }

    // Keyword mapping if no exact match
    if (lowerName.includes('supino')) return 'Bench Press';
    if (lowerName.includes('agachamento')) return 'Squat';
    if (lowerName.includes('leg press')) return 'Leg Press';
    if (lowerName.includes('flexão')) return 'Push-up';
    if (lowerName.includes('remada')) return 'Row';
    if (lowerName.includes('puxada')) return 'Lat Pulldown';
    if (lowerName.includes('desenvolvimento')) return 'Overhead Press';
    if (lowerName.includes('elevação lateral')) return 'Lateral Raise';
    if (lowerName.includes('rosca')) return 'Bicep Curl';

    // Tríceps específicos
    if (lowerName.includes('tríceps na polia') || lowerName.includes('tríceps polia')) return 'Triceps Pushdown';
    if (lowerName.includes('tríceps corda')) return 'Triceps Pushdown';
    if (lowerName.includes('tríceps testa')) return 'Skullcrushers';
    if (lowerName.includes('tríceps')) return 'Triceps'; // Genérico (fallback)

    if (lowerName.includes('abdominal') || lowerName.includes('crunch')) return 'Crunches';
    if (lowerName.includes('prancha')) return 'Plank';
    if (lowerName.includes('levantamento terra')) return 'Deadlift';
    if (lowerName.includes('barra')) return 'Pull-up';

    console.log(`[wger] No mapping found for "${name}", processing as is.`);

    // Simple cleanup
    return lowerName
        .replace(/^(o|a|os|as|de|com|no|na|nos|nas)\s+/gi, '')
        .trim();
}

/**
 * Cache for exercise images to avoid repeated API calls
 */
const imageCache = new Map<string, string | null>();

/**
 * Get exercise image with caching
 */
export async function getCachedExerciseImage(exerciseName: string): Promise<string | null> {
    const normalizedName = normalizeExerciseName(exerciseName);
    const cacheKey = `img_${normalizedName}`;

    // Check cache first
    if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey) || null;
    }

    // Fetch from API
    console.log(`[wger] Fetching image for: "${exerciseName}" (Normalized: "${normalizedName}")`);
    const imageUrl = await getExerciseImageByName(normalizedName);

    if (imageUrl) {
        console.log(`[wger] Found image for "${normalizedName}": ${imageUrl}`);
    } else {
        // Try searching without normalization if failed
        if (normalizedName !== exerciseName) {
            console.log(`[wger] Retrying with original name: "${exerciseName}"`);
            const retryUrl = await getExerciseImageByName(exerciseName);
            if (retryUrl) {
                console.log(`[wger] Found image with original name!`);
                imageCache.set(cacheKey, retryUrl);
                return retryUrl;
            }
        }
        console.log(`[wger] No image found for "${normalizedName}"`);
    }

    // Cache the result (even nulls to avoid repeated failures)
    imageCache.set(cacheKey, imageUrl);

    return imageUrl;
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
    imageCache.clear();
}
