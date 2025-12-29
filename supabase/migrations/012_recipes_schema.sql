-- ============================================
-- YOUMOVE - Recipes Module Schema
-- Migration: 012_recipes_schema
-- Date: 2025-12-29
-- ============================================

-- Extensions (should already be enabled, but good practice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: recipes
-- ============================================

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Macros (per serving)
    calories_per_serving INT NOT NULL,
    protein_g_per_serving DECIMAL(5,1) NOT NULL,
    carbs_g_per_serving DECIMAL(5,1) NOT NULL,
    fats_g_per_serving DECIMAL(5,1) NOT NULL,
    fiber_g_per_serving DECIMAL(5,1) DEFAULT 0,
    
    -- Metadata
    servings INT NOT NULL DEFAULT 1,
    prep_time_minutes INT,
    difficulty TEXT, -- 'easy', 'medium', 'hard'
    meal_type TEXT[], -- ['breakfast', 'lunch', 'dinner', 'snack']
    goal_type TEXT[], -- ['cutting', 'bulking', 'balanced']
    tags TEXT[], -- ['high-protein', 'low-carb', 'vegetarian', 'quick']
    
    -- Content
    ingredients JSONB, -- [{ name, quantity, unit }]
    instructions TEXT[], -- Array of steps
    
    -- Stats
    views INT DEFAULT 0,
    favorites INT DEFAULT 0,
    
    -- Admin / System
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes USING GIN (meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_goal_type ON recipes USING GIN (goal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_recipes_calories ON recipes (calories_per_serving);
CREATE INDEX IF NOT EXISTS idx_recipes_protein ON recipes (protein_g_per_serving DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active recipes
DROP POLICY IF EXISTS "Recipes readable by all" ON recipes;
CREATE POLICY "Recipes readable by all"
ON recipes FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow everyone to read (public access if needed by non-auth pages, but keeping strict for now)

-- ============================================
-- SEED DATA (Top 20 Recipes)
-- ============================================

INSERT INTO recipes (name, description, image_url, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fats_g_per_serving, fiber_g_per_serving, servings, prep_time_minutes, difficulty, meal_type, goal_type, tags, ingredients, instructions)
VALUES
-- 1. Omelete de Claras com Espinafre
(
    'Omelete de Claras com Espinafre',
    'Proteína limpa e rápida, perfeita para começar o dia com energia e leveza.',
    null, -- Use placeholder in frontend if null
    180, 28, 5, 6, 2,
    1, 10, 'easy',
    ARRAY['breakfast', 'snack'],
    ARRAY['cutting', 'balanced'],
    ARRAY['high-protein', 'low-carb', 'quick', 'vegetarian'],
    '[
        { "name": "Claras de ovo", "quantity": 4, "unit": "unidades" },
        { "name": "Espinafre fresco", "quantity": 1, "unit": "xícara" },
        { "name": "Cebola picada", "quantity": 2, "unit": "colheres de sopa" },
        { "name": "Azeite", "quantity": 1, "unit": "colher de chá" },
        { "name": "Sal e pimenta", "quantity": null, "unit": "a gosto" }
    ]',
    ARRAY[
        'Bata as claras em uma tigela com uma pitada de sal e pimenta.',
        'Aqueça uma frigideira antiaderente em fogo médio com o azeite.',
        'Refogue a cebola até ficar translúcida.',
        'Adicione o espinafre e cozinhe até murchar.',
        'Despeje as claras batidas sobre os vegetais uniformemente.',
        'Deixe cozinhar por 3-4 minutos até as claras firmarem.',
        'Dobre ao meio com cuidado e sirva imediatamente.'
    ]
),
-- 2. Panqueca de Aveia e Banana
(
    'Panqueca de Aveia e Banana',
    'Opção clássica e energética, rica em fibras e potássio.',
    null,
    250, 10, 40, 5, 6,
    1, 15, 'easy',
    ARRAY['breakfast', 'pre_workout'],
    ARRAY['bulking', 'balanced'],
    ARRAY['vegetarian', 'energy'],
    '[
        { "name": "Banana madura", "quantity": 1, "unit": "unidade" },
        { "name": "Aveia em flocos", "quantity": 0.5, "unit": "xícara" },
        { "name": "Ovo", "quantity": 1, "unit": "unidade" },
        { "name": "Canela", "quantity": null, "unit": "a gosto" }
    ]',
    ARRAY[
        'Amasse bem a banana em um prato.',
        'Misture o ovo e a aveia até formar uma massa homogênea.',
        'Adicione a canela a gosto.',
        'Aqueça uma frigideira untada em fogo baixo.',
        'Despeje a massa e cozinhe por 2-3 minutos de cada lado até dourar.'
    ]
),
-- 3. Frango Grelhado com Batata Doce
(
    'Frango Grelhado com Batata Doce',
    'O clássico maromba. Simples, eficaz e nutritivo.',
    null,
    350, 40, 35, 6, 4,
    1, 25, 'easy',
    ARRAY['lunch', 'dinner', 'post_workout'],
    ARRAY['bulking', 'balanced', 'cutting'],
    ARRAY['high-protein', 'classic', 'gluten-free'],
    '[
        { "name": "Peito de frango", "quantity": 150, "unit": "g" },
        { "name": "Batata doce", "quantity": 150, "unit": "g" },
        { "name": "Brócolis", "quantity": 100, "unit": "g" },
        { "name": "Azeite", "quantity": 1, "unit": "colher de chá" }
    ]',
    ARRAY[
        'Tempere o frango com sal, pimenta e limão.',
        'Cozinhe a batata doce no vapor ou água até ficar macia.',
        'Grelhe o frango em fogo médio até cozinhar por completo.',
        'Sirva com brócolis cozido no vapor.'
    ]
),
-- 4. Smoothie de Proteína Verde
(
    'Smoothie de Proteína Verde',
    'Detox e proteína em um só copo. Ideal para pressa.',
    null,
    200, 25, 15, 4, 3,
    1, 5, 'easy',
    ARRAY['breakfast', 'snack', 'post_workout'],
    ARRAY['cutting', 'balanced'],
    ARRAY['quick', 'smoothie', 'high-protein'],
    '[
        { "name": "Whey Protein (Baunilha)", "quantity": 1, "unit": "scoop" },
        { "name": "Espinafre", "quantity": 1, "unit": "punhado" },
        { "name": "Maçã verde", "quantity": 0.5, "unit": "unidade" },
        { "name": "Água ou leite vegetal", "quantity": 250, "unit": "ml" },
        { "name": "Gelo", "quantity": 4, "unit": "cubos" }
    ]',
    ARRAY[
        'Coloque todos os ingredientes no liquidificador.',
        'Bata até ficar homogêneo e cremoso.',
        'Beba imediatamente.'
    ]
),
-- 5. Salmão com Aspargos
(
    'Salmão com Aspargos',
    'Rico em ômega-3 e gorduras boas. Jantar sofisticado e saudável.',
    null,
    420, 35, 10, 22, 4,
    1, 20, 'medium',
    ARRAY['lunch', 'dinner'],
    ARRAY['balanced', 'low-carb'],
    ARRAY['keto', 'gluten-free', 'high-fat'],
    '[
        { "name": "Filé de salmão", "quantity": 150, "unit": "g" },
        { "name": "Aspargos", "quantity": 8, "unit": "unidades" },
        { "name": "Limão", "quantity": 0.5, "unit": "unidade" },
        { "name": "Azeite", "quantity": 1, "unit": "colher de sopa" }
    ]',
    ARRAY[
        'Tempere o salmão com sal, pimenta e raspas de limão.',
        'Tempere os aspargos com azeite e sal.',
        'Coloque ambos em uma assadeira.',
        'Asse a 200°C por 12-15 minutos até o salmão lascar facilmente.'
    ]
),
-- 6. Iogurte Grego com Frutas Vermelhas
(
    'Iogurte Grego com Frutas Vermelhas',
    'Lanche proteico e rico em antioxidantes.',
    null,
    180, 15, 20, 4, 2,
    1, 5, 'easy',
    ARRAY['breakfast', 'snack'],
    ARRAY['cutting', 'balanced'],
    ARRAY['quick', 'vegetarian'],
    '[
        { "name": "Iogurte Grego Natural", "quantity": 150, "unit": "g" },
        { "name": "Morangos", "quantity": 5, "unit": "unidades" },
        { "name": "Mirtilos", "quantity": 1, "unit": "colher de sopa" },
        { "name": "Mel (opcional)", "quantity": 1, "unit": "colher de chá" }
    ]',
    ARRAY[
        'Coloque o iogurte em uma tigela.',
        'Adicione as frutas por cima.',
        'Finalize com um fio de mel se desejar.'
    ]
),
-- 7. Tapioca com Queijo Cottage e Ovos
(
    'Tapioca com Queijo Cottage',
    'Opção leve e versátil, típica brasileira.',
    null,
    280, 18, 35, 8, 1,
    1, 10, 'easy',
    ARRAY['breakfast', 'snack'],
    ARRAY['balanced', 'gluten-free'],
    ARRAY['brazilian', 'quick'],
    '[
        { "name": "Goma de tapioca", "quantity": 3, "unit": "colheres de sopa" },
        { "name": "Queijo Cottage", "quantity": 2, "unit": "colheres de sopa" },
        { "name": "Ovo mexido", "quantity": 1, "unit": "unidade" },
        { "name": "Orégano", "quantity": null, "unit": "a gosto" }
    ]',
    ARRAY[
        'Prepare a tapioca na frigideira.',
        'Enquanto isso, faça o ovo mexido.',
        'Recheie a tapioca com o ovo e o cottage.',
        'Tempere com orégano e dobre.'
    ]
),
-- 8. Carne Moída com Abóbora Cabotiá
(
    'Carne Moída com Abóbora',
    'Refeição "confort food" fitness, baixa em calorias.',
    null,
    320, 30, 25, 10, 6,
    1, 30, 'medium',
    ARRAY['lunch', 'dinner'],
    ARRAY['cutting', 'balanced'],
    ARRAY['high-protein', 'gluten-free'],
    '[
        { "name": "Patinho moído", "quantity": 150, "unit": "g" },
        { "name": "Abóbora Cabotiá", "quantity": 200, "unit": "g" },
        { "name": "Alho", "quantity": 1, "unit": "dente" },
        { "name": "Cebolinha", "quantity": null, "unit": "a gosto" }
    ]',
    ARRAY[
        'Refogue a carne com alho até dourar.',
        'Cozinhe a abóbora em cubos até ficar macia.',
        'Misture a abóbora na carne e deixe apurar sabores.',
        'Finalize com cebolinha fresca.'
    ]
),
-- 9. Salada Caesar com Frango
(
    'Salada Caesar Fit',
    'Versão mais leve da salada clássica, sem excesso de gordura no molho.',
    null,
    290, 35, 10, 12, 3,
    1, 15, 'easy',
    ARRAY['lunch', 'dinner'],
    ARRAY['cutting', 'low-carb'],
    ARRAY['salad', 'high-protein'],
    '[
        { "name": "Peito de frango", "quantity": 120, "unit": "g" },
        { "name": "Alface americana", "quantity": 1, "unit": "prato cheiro" },
        { "name": "Iogurte natural (para molho)", "quantity": 2, "unit": "colheres de sopa" },
        { "name": "Mostarda", "quantity": 1, "unit": "colher de chá" },
        { "name": "Queijo parmesão", "quantity": 1, "unit": "colher de sopa" }
    ]',
    ARRAY[
        'Grelhe o frango em tiras.',
        'Misture iogurte, mostarda, limão, sal e pimenta para o molho.',
        'Misture o molho nas folhas lavadas.',
        'Cubra com o frango e polvilhe parmesão.'
    ]
),
-- 10. Wrap de Peru com Vegetais
(
    'Wrap de Peru',
    'Lanche prático para levar na marmita.',
    null,
    240, 20, 25, 6, 4,
    1, 5, 'easy',
    ARRAY['snack', 'lunch'],
    ARRAY['balanced', 'cutting'],
    ARRAY['quick', 'portable'],
    '[
        { "name": "Rap10 Integral (ou tortilla)", "quantity": 1, "unit": "unidade" },
        { "name": "Peito de peru", "quantity": 3, "unit": "fatias" },
        { "name": "Queijo branco", "quantity": 1, "unit": "fatia" },
        { "name": "Alface e tomate", "quantity": null, "unit": "a gosto" }
    ]',
    ARRAY[
        'Aqueça a tortilla levemente.',
        'Coloque o recheio no centro.',
        'Enrole firmemente e corte ao meio.'
    ]
),
-- 11. Pasta de Amendoim com Maçã
(
    'Pasta de Amendoim com Maçã',
    'Combinação perfeita de gorduras boas e carboidratos fibrosos.',
    null,
    200, 5, 25, 10, 4,
    1, 2, 'easy',
    ARRAY['snack', 'pre_workout'],
    ARRAY['balanced', 'bulking'],
    ARRAY['vegan', 'quick', 'energy'],
    '[
        { "name": "Maçã média", "quantity": 1, "unit": "unidade" },
        { "name": "Pasta de amendoim integral", "quantity": 1, "unit": "colher de sopa" }
    ]',
    ARRAY[
        'Corte a maçã em fatias.',
        'Sirva com a pasta de amendoim.'
    ]
),
-- 12. Ovos Cozidos
(
    'Ovos Cozidos Perfeitos',
    'O snack mais simples e eficiente da natureza.',
    null,
    140, 12, 1, 10, 0,
    1, 10, 'easy',
    ARRAY['snack', 'breakfast'],
    ARRAY['cutting', 'balanced', 'bulking'],
    ARRAY['keto', 'vegetarian', 'super-easy'],
    '[
        { "name": "Ovos", "quantity": 2, "unit": "unidades" },
        { "name": "Sal", "quantity": null, "unit": "a gosto" }
    ]',
    ARRAY[
        'Coloque os ovos em água fria.',
        'Leve ao fogo. Quando ferver, desligue e tampe.',
        'Espere 10-12 minutos para gema dura, ou 6-7 para mole.',
        'Resfrie em água gelada e descasque.'
    ]
),
-- 13. Poke Bowl de Atum
(
    'Poke de Atum Fit',
    'Fresco, colorido e cheio de nutrientes.',
    null,
    400, 35, 45, 10, 5,
    1, 20, 'medium',
    ARRAY['lunch', 'dinner'],
    ARRAY['balanced', 'pescatarian'],
    ARRAY['healthy-fat', 'fresh'],
    '[
        { "name": "Atum fresco em cubos", "quantity": 120, "unit": "g" },
        { "name": "Arroz japonês (gohan)", "quantity": 100, "unit": "g" },
        { "name": "Pepino fatiado", "quantity": 0.5, "unit": "unidade" },
        { "name": "Cenoura ralada", "quantity": 2, "unit": "colheres de sopa" },
        { "name": "Shoyu light", "quantity": 1, "unit": "colher de sopa" }
    ]',
    ARRAY[
        'Cozinhe o arroz.',
        'Monte a tigela com arroz na base.',
        'Disponha o peixe e os vegetais por cima.',
        'Tempere com shoyu e sirva frio.'
    ]
),
-- 14. Mingau de Aveia Proteico (Proats)
(
    'Mingau de Aveia Proteico',
    'Café da manhã quente e saciante para dias frios.',
    null,
    300, 25, 35, 6, 5,
    1, 10, 'easy',
    ARRAY['breakfast', 'post_workout'],
    ARRAY['balanced', 'bulking'],
    ARRAY['high-protein', 'warm'],
    '[
        { "name": "Aveia em flocos", "quantity": 40, "unit": "g" },
        { "name": "Leite desnatado ou vegetal", "quantity": 150, "unit": "ml" },
        { "name": "Whey Protein (Chocolate)", "quantity": 1, "unit": "scoop" },
        { "name": "Cacau em pó", "quantity": 1, "unit": "colher de chá" }
    ]',
    ARRAY[
        'Cozinhe a aveia com o leite até engrossar.',
        'Espere esfriar um pouco (para não talhar o whey).',
        'Misture o whey e o cacau.',
        'Sirva quente.'
    ]
),
-- 15. Macarrão Integral à Bolonhesa
(
    'Macarrão Integral à Bolonhesa',
    'Conforto italiano em versão saudável.',
    null,
    450, 35, 55, 10, 8,
    1, 25, 'medium',
    ARRAY['lunch', 'dinner', 'post_workout'],
    ARRAY['bulking', 'balanced'],
    ARRAY['high-carb', 'comfort-food'],
    '[
        { "name": "Macarrão integral", "quantity": 80, "unit": "g (cru)" },
        { "name": "Patinho moído", "quantity": 120, "unit": "g" },
        { "name": "Molho de tomate caseiro", "quantity": 0.5, "unit": "xícara" },
        { "name": "Manjericão", "quantity": null, "unit": "fresco" }
    ]',
    ARRAY[
        'Cozinhe o macarrão al dente.',
        'Refogue a carne e adicione o molho de tomate.',
        'Misture a massa ao molho.',
        'Decore com manjericão.'
    ]
);
