/**
 * Utility to provide fallback images for recipes based on keywords.
 * Uses high-quality Unsplash image IDs.
 */

// Categorized image IDs from Unsplash
const RECIPE_IMAGES: Record<string, string> = {
    // Breakfast / Ovos
    'omelete': 'https://images.unsplash.com/photo-1510693206972-df098062cb71?q=80&w=800&auto=format&fit=crop',
    'ovos': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=800&auto=format&fit=crop',
    'panqueca': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=800&auto=format&fit=crop',
    'tapioca': 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?q=80&w=800&auto=format&fit=crop',
    'cafe': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
    'iogurte': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop',
    'mingau': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=800&auto=format&fit=crop',
    'aveia': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=800&auto=format&fit=crop',

    // Meals / Proteins
    'frango': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop',
    'grelhado': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop',
    'carne': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800&auto=format&fit=crop', // Steak/Meat (Safe)
    'moida': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800&auto=format&fit=crop',
    'patinho': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800&auto=format&fit=crop',
    'salmao': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop',
    'peixe': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop',
    'tilapia': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop',
    'salada': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    'wrap': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=800&auto=format&fit=crop',
    'hamburguer': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    'macarrao': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop',
    'arroz': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=800&auto=format&fit=crop',
    'poke': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    'atum': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    'cottage': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=800&auto=format&fit=crop',
    'queijo': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=800&auto=format&fit=crop',
    'legumes': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    'vegetais': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    'pre-treino': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=800&auto=format&fit=crop',
    'pos-treino': 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=800&auto=format&fit=crop',

    // Snacks / Sides
    'batata': 'https://images.unsplash.com/photo-1518977676601-b53f82a24174?q=80&w=800&auto=format&fit=crop', // Roasted veg (Safe)
    'doce': 'https://images.unsplash.com/photo-1518977676601-b53f82a24174?q=80&w=800&auto=format&fit=crop',
    'rice': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop', // Oatmeal (Safe)
    'cakes': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop',
    'amendoim': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop',
    'smoothie': 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?q=80&w=800&auto=format&fit=crop', // Smoothie (Safe)
    'shake': 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?q=80&w=800&auto=format&fit=crop',
    'whey': 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?q=80&w=800&auto=format&fit=crop',
    'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=800&auto=format&fit=crop',

    // Default
    'default': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop',
};

// Helper to remove accents: "Salmão" -> "salmao"
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function getRecipeImage(name: string, originalUrl?: string | null): string {
    // If we have a valid uploaded image, use it
    if (originalUrl && originalUrl.startsWith('http')) {
        return originalUrl;
    }

    // Normalize input
    const normalizedName = normalizeText(name);

    // Prioritize exact keyword matches (longer keys first in strict search could be better, but greedy match is fine here)
    for (const [key, url] of Object.entries(RECIPE_IMAGES)) {
        if (normalizedName.includes(key)) {
            return url;
        }
    }

    return RECIPE_IMAGES['default'];
}
