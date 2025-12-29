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
    'tapioca': 'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?q=80&w=800&auto=format&fit=crop', // Generic crepes/wrap style
    'cafe': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
    'iogurte': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop',

    // Meals / Salgados
    'frango': 'https://images.unsplash.com/photo-1532550907401-7f58865a3639?q=80&w=800&auto=format&fit=crop',
    'carne': 'https://images.unsplash.com/photo-1603360946369-dc9bb6f5f3b5?q=80&w=800&auto=format&fit=crop',
    'salmao': 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?q=80&w=800&auto=format&fit=crop',
    'peixe': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop',
    'salada': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    'wrap': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=800&auto=format&fit=crop',
    'hamburguer': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    'macarrao': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop',
    'arroz': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=800&auto=format&fit=crop',
    'moida': 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=800&auto=format&fit=crop', // Ground beef
    'patinho': 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=800&auto=format&fit=crop',
    'mingau': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=800&auto=format&fit=crop', // Porridge/Oats
    'aveia': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=800&auto=format&fit=crop',
    'poke': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    'atum': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    'tilapia': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop',

    // Snacks / Drinks
    'smoothie': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?q=80&w=800&auto=format&fit=crop',
    'shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28dfc?q=80&w=800&auto=format&fit=crop',
    'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=800&auto=format&fit=crop',
    'amendoim': 'https://images.unsplash.com/photo-1620917670397-a363a0604084?q=80&w=800&auto=format&fit=crop', // Peanut butter toast

    // Default
    'default': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop', // Healthy food spread
};

export function getRecipeImage(name: string, originalUrl?: string | null): string {
    // If we have a valid uploaded image, use it
    if (originalUrl && originalUrl.startsWith('http')) {
        return originalUrl;
    }

    // Otherwise, find a match based on recipe name
    const lowerName = name.toLowerCase();

    // Check for keyword matches
    for (const [key, url] of Object.entries(RECIPE_IMAGES)) {
        if (lowerName.includes(key)) {
            return url;
        }
    }

    // Check strict keywords for portuguese
    if (lowerName.includes('cookie') || lowerName.includes('doce')) return 'https://images.unsplash.com/photo-1499636138143-bd649043e981?q=80&w=800&auto=format&fit=crop';

    return RECIPE_IMAGES['default'];
}
