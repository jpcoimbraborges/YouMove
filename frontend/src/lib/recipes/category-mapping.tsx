import {
    Beef,
    Fish,
    Wheat,
    Carrot,
    Coffee,
    Milk,
    Utensils,
    ChefHat,
    Zap,
    Egg,
    Salad,
    Sandwich,
    Pizza,
    Cookie,
    Apple,
    Drumstick,
    Croissant,
    IceCream,
    Soup
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CategoryStyle {
    icon: LucideIcon;
    gradient: string;
    iconColor: string;
    label: string;
}

// Default style
const DEFAULT_STYLE: CategoryStyle = {
    icon: ChefHat,
    gradient: 'from-slate-800 to-slate-900',
    iconColor: 'text-slate-400',
    label: 'Receita'
};

export function getRecipeCategoryStyle(name: string): CategoryStyle {
    const text = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Breakfast / Bakery
    if (text.includes('pao') || text.includes('toast') || text.includes('rice') || text.includes('cakes')) {
        return {
            icon: Sandwich,
            gradient: 'from-amber-900/40 to-orange-900/40',
            iconColor: 'text-amber-400',
            label: 'Lanche'
        };
    }
    if (text.includes('ovo') || text.includes('omelete')) {
        return {
            icon: Egg,
            gradient: 'from-yellow-900/40 to-amber-900/40',
            iconColor: 'text-yellow-400',
            label: 'Ovos'
        };
    }
    if (text.includes('aveia') || text.includes('mingau') || text.includes('panqueca') || text.includes('waffle')) {
        return {
            icon: Wheat,
            gradient: 'from-orange-900/40 to-amber-900/40',
            iconColor: 'text-orange-300',
            label: 'Cereal'
        };
    }
    if (text.includes('cafe')) {
        return {
            icon: Coffee,
            gradient: 'from-stone-900/40 to-amber-900/40',
            iconColor: 'text-amber-600',
            label: 'Café'
        };
    }

    // Proteins
    if (text.includes('frango') || text.includes('grelhado') || text.includes('asa')) {
        return {
            icon: Drumstick,
            gradient: 'from-orange-900/40 to-red-900/40',
            iconColor: 'text-orange-400',
            label: 'Frango'
        };
    }
    if (text.includes('carne') || text.includes('file') || text.includes('bife') || text.includes('hamburguer') || text.includes('moida') || text.includes('patinho')) {
        return {
            icon: Beef,
            gradient: 'from-red-900/40 to-rose-900/40',
            iconColor: 'text-red-400',
            label: 'Carne'
        };
    }
    if (text.includes('peixe') || text.includes('tilapia') || text.includes('salmao') || text.includes('atum') || text.includes('poke')) {
        return {
            icon: Fish,
            gradient: 'from-blue-900/40 to-cyan-900/40',
            iconColor: 'text-cyan-400',
            label: 'Peixe'
        };
    }

    // Veggies / Sides
    if (text.includes('salada') || text.includes('vegetais') || text.includes('verde') || text.includes('legumes')) {
        return {
            icon: Salad, // Fallback if Salad doesn't exist use Carrot
            gradient: 'from-green-900/40 to-emerald-900/40',
            iconColor: 'text-green-400',
            label: 'Salada'
        };
    }
    if (text.includes('batata') || text.includes('cenoura') || text.includes('sopa')) {
        return {
            icon: Carrot,
            gradient: 'from-orange-800/40 to-red-900/40',
            iconColor: 'text-orange-400',
            label: 'Vegetais'
        };
    }

    // Drinks / Shakes
    if (text.includes('shake') || text.includes('smoothie') || text.includes('whey') || text.includes('suco') || text.includes('pre-treino') || text.includes('pos-treino')) {
        return {
            icon: Milk, // Or Zap
            gradient: 'from-purple-900/40 to-indigo-900/40',
            iconColor: 'text-purple-400',
            label: 'Shake'
        };
    }

    // Sweets / Fruits
    if (text.includes('maca') || text.includes('banana') || text.includes('fruta') || text.includes('doce')) {
        return {
            icon: Apple,
            gradient: 'from-red-900/40 to-pink-900/40',
            iconColor: 'text-pink-400',
            label: 'Fruta'
        };
    }
    if (text.includes('imune') || text.includes('vitamin')) {
        return {
            icon: Zap,
            gradient: 'from-yellow-900/40 to-orange-900/40',
            iconColor: 'text-yellow-400',
            label: 'Energia'
        };
    }

    // Pasta / Italian
    if (text.includes('macarrao') || text.includes('pizza') || text.includes('massa')) {
        return {
            icon: Pizza, // or Utensils
            gradient: 'from-red-900/40 to-orange-900/40',
            iconColor: 'text-red-400',
            label: 'Massa'
        };
    }

    // Default with basic keywords check for generic food
    return DEFAULT_STYLE;
}
