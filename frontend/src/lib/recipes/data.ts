import { Recipe } from '@/types/recipe.types';

export const STATIC_RECIPES: Recipe[] = [
    {
        id: '1',
        name: 'Omelete de Claras com Espinafre',
        description: 'Proteína limpa e rápida, perfeita para começar o dia com energia e leveza.',
        image_url: null,
        calories_per_serving: 180,
        protein_g_per_serving: 28,
        carbs_g_per_serving: 5,
        fats_g_per_serving: 6,
        fiber_g_per_serving: 2,
        servings: 1,
        prep_time_minutes: 10,
        difficulty: 'easy',
        meal_type: ['breakfast', 'snack'],
        goal_type: ['cutting', 'balanced'],
        tags: ['high-protein', 'low-carb', 'quick', 'vegetarian'],
        ingredients: [
            { name: "Claras de ovo", quantity: 4, unit: "unidades" },
            { name: "Espinafre fresco", quantity: 1, unit: "xícara" },
            { name: "Cebola picada", quantity: 2, unit: "colheres de sopa" },
            { name: "Azeite", quantity: 1, unit: "colher de chá" },
            { name: "Sal e pimenta", quantity: null, unit: "a gosto" }
        ],
        instructions: [
            'Bata as claras em uma tigela com uma pitada de sal e pimenta.',
            'Aqueça uma frigideira antiaderente em fogo médio com o azeite.',
            'Refogue a cebola até ficar translúcida.',
            'Adicione o espinafre e cozinhe até murchar.',
            'Despeje as claras batidas sobre os vegetais uniformemente.',
            'Deixe cozinhar por 3-4 minutos até as claras firmarem.',
            'Dobre ao meio com cuidado e sirva imediatamente.'
        ],
        views: 120,
        favorites: 45,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Panqueca de Aveia e Banana',
        description: 'Opção clássica e energética, rica em fibras e potássio.',
        image_url: null,
        calories_per_serving: 250,
        protein_g_per_serving: 10,
        carbs_g_per_serving: 40,
        fats_g_per_serving: 5,
        fiber_g_per_serving: 6,
        servings: 1,
        prep_time_minutes: 15,
        difficulty: 'easy',
        meal_type: ['breakfast', 'pre_workout'],
        goal_type: ['bulking', 'balanced'],
        tags: ['vegetarian', 'energy'],
        ingredients: [
            { name: "Banana madura", quantity: 1, unit: "unidade" },
            { name: "Aveia em flocos", quantity: 0.5, unit: "xícara" },
            { name: "Ovo", quantity: 1, unit: "unidade" },
            { name: "Canela", quantity: null, unit: "a gosto" }
        ],
        instructions: [
            'Amasse bem a banana em um prato.',
            'Misture o ovo e a aveia até formar uma massa homogênea.',
            'Adicione a canela a gosto.',
            'Aqueça uma frigideira untada em fogo baixo.',
            'Despeje a massa e cozinhe por 2-3 minutos de cada lado até dourar.'
        ],
        views: 98,
        favorites: 32,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Frango Grelhado com Batata Doce',
        description: 'O clássico maromba. Simples, eficaz e nutritivo.',
        image_url: null,
        calories_per_serving: 350,
        protein_g_per_serving: 40,
        carbs_g_per_serving: 35,
        fats_g_per_serving: 6,
        fiber_g_per_serving: 4,
        servings: 1,
        prep_time_minutes: 25,
        difficulty: 'easy',
        meal_type: ['lunch', 'dinner', 'post_workout'],
        goal_type: ['bulking', 'balanced', 'cutting'],
        tags: ['high-protein', 'classic', 'gluten-free'],
        ingredients: [
            { name: "Peito de frango", quantity: 150, unit: "g" },
            { name: "Batata doce", quantity: 150, unit: "g" },
            { name: "Brócolis", quantity: 100, unit: "g" },
            { name: "Azeite", quantity: 1, unit: "colher de chá" }
        ],
        instructions: [
            'Tempere o frango com sal, pimenta e limão.',
            'Cozinhe a batata doce no vapor ou água até ficar macia.',
            'Grelhe o frango em fogo médio até cozinhar por completo.',
            'Sirva com brócolis cozido no vapor.'
        ],
        views: 150,
        favorites: 60,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '4',
        name: 'Smoothie de Proteína Verde',
        description: 'Detox e proteína em um só copo. Ideal para pressa.',
        image_url: null,
        calories_per_serving: 200,
        protein_g_per_serving: 25,
        carbs_g_per_serving: 15,
        fats_g_per_serving: 4,
        fiber_g_per_serving: 3,
        servings: 1,
        prep_time_minutes: 5,
        difficulty: 'easy',
        meal_type: ['breakfast', 'snack', 'post_workout'],
        goal_type: ['cutting', 'balanced'],
        tags: ['quick', 'smoothie', 'high-protein'],
        ingredients: [
            { name: "Whey Protein (Baunilha)", quantity: 1, unit: "scoop" },
            { name: "Espinafre", quantity: 1, unit: "punhado" },
            { name: "Maçã verde", quantity: 0.5, unit: "unidade" },
            { name: "Água ou leite vegetal", quantity: 250, unit: "ml" },
            { name: "Gelo", quantity: 4, unit: "cubos" }
        ],
        instructions: [
            'Coloque todos os ingredientes no liquidificador.',
            'Bata até ficar homogêneo e cremoso.',
            'Beba imediatamente.'
        ],
        views: 85,
        favorites: 20,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '5',
        name: 'Salmão com Aspargos',
        description: 'Rico em ômega-3 e gorduras boas. Jantar sofisticado e saudável.',
        image_url: null,
        calories_per_serving: 420,
        protein_g_per_serving: 35,
        carbs_g_per_serving: 10,
        fats_g_per_serving: 22,
        fiber_g_per_serving: 4,
        servings: 1,
        prep_time_minutes: 20,
        difficulty: 'medium',
        meal_type: ['lunch', 'dinner'],
        goal_type: ['balanced', 'low-carb'],
        tags: ['keto', 'gluten-free', 'high-fat'],
        ingredients: [
            { name: "Filé de salmão", quantity: 150, unit: "g" },
            { name: "Aspargos", quantity: 8, unit: "unidades" },
            { name: "Limão", quantity: 0.5, unit: "unidade" },
            { name: "Azeite", quantity: 1, unit: "colher de sopa" }
        ],
        instructions: [
            'Tempere o salmão com sal, pimenta e raspas de limão.',
            'Tempere os aspargos com azeite e sal.',
            'Coloque ambos em uma assadeira.',
            'Asse a 200°C por 12-15 minutos até o salmão lascar facilmente.'
        ],
        views: 200,
        favorites: 80,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];
