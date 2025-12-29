-- ============================================
-- YOUMOVE - Recipes Table Migration
-- Create healthy recipes database
-- ============================================

-- 1. Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Macros (per serving)
    calories_per_serving INT NOT NULL,
    protein_g_per_serving DECIMAL NOT NULL,
    carbs_g_per_serving DECIMAL NOT NULL,
    fats_g_per_serving DECIMAL NOT NULL,
    fiber_g_per_serving DECIMAL DEFAULT 0,
    
    -- Metadata
    servings INT NOT NULL DEFAULT 1,
    prep_time_minutes INT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    meal_type TEXT[],
    goal_type TEXT[],
    tags TEXT[],
    
    -- Content
    ingredients JSONB,
    instructions TEXT[],
    
    -- Stats
    views INT DEFAULT 0,
    favorites INT DEFAULT 0,
    
    -- System
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes USING GIN (meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_goal_type ON recipes USING GIN (goal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_recipes_calories ON recipes (calories_per_serving);
CREATE INDEX IF NOT EXISTS idx_recipes_protein ON recipes (protein_g_per_serving DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes (is_active) WHERE is_active = true;

-- 3. Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Recipes readable by all authenticated users"
ON recipes FOR SELECT
TO authenticated
USING (is_active = true);

-- Optional: Allow public read (if you want unauthenticated access)
-- CREATE POLICY "Recipes readable by public"
-- ON recipes FOR SELECT
-- TO anon
-- USING (is_active = true);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT SEED DATA (Initial 20 Recipes)
-- ============================================

-- Breakfast Recipes
INSERT INTO recipes (name, description, image_url, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fats_g_per_serving, fiber_g_per_serving, servings, prep_time_minutes, difficulty, meal_type, goal_type, tags, ingredients, instructions) VALUES
('Omelete de Claras com Espinafre', 'Proteína limpa e rápida, perfeita para qualquer refeição', '/recipes/omelet-spinach.jpg', 180, 28, 5, 6, 2, 1, 10, 'easy', '{"breakfast","lunch","snack"}', '{"cutting","balanced"}', '{"high-protein","low-carb","quick","vegetarian"}', '[{"name":"Claras de ovo","quantity":4,"unit":"unidades"},{"name":"Espinafre fresco","quantity":1,"unit":"xícara"},{"name":"Cebola picada","quantity":2,"unit":"colheres de sopa"},{"name":"Azeite","quantity":1,"unit":"colher de chá"},{"name":"Sal e pimenta","quantity":null,"unit":"a gosto"}]', '{"Bata as claras em uma tigela com sal e pimenta","Aqueça uma frigideira antiaderente em fogo médio com o azeite","Refogue a cebola até dourar","Adicione o espinafre e cozinhe até murchar","Despeje as claras batidas sobre os vegetais","Deixe cozinhar por 3-4 minutos até firmar","Dobre ao meio e sirva imediatamente"}'),

('Panqueca de Aveia e Banana', 'Rico em carboidratos saudáveis e proteína', '/recipes/oat-pancake.jpg', 320, 18, 45, 8, 6, 2, 15, 'easy', '{"breakfast","snack"}', '{"bulking","balanced"}', '{"high-carb","vegetarian","quick"}', '[{"name":"Aveia em flocos","quantity":1,"unit":"xícara"},{"name":"Banana madura","quantity":1,"unit":"unidade"},{"name":"Ovos","quantity":2,"unit":"unidades"},{"name":"Whey protein (opcional)","quantity":1,"unit":"scoop"},{"name":"Canela","quantity":1,"unit":"colher de chá"}]', '{"Amasse a banana em uma tigela","Adicione os ovos e bata bem","Misture a aveia, whey e canela","Deixe a massa descansar por 5 minutos","Aqueça uma frigideira antiaderente","Despeje porção de massa e cozinhe 2-3 min de cada lado","Sirva com frutas ou mel"}'),

('Iogurte Grego com Frutas Vermelhas', 'Lanche proteico refrescante e antioxidante', '/recipes/greek-yogurt.jpg', 220, 20, 25, 4, 4, 1, 5, 'easy', '{"breakfast","snack","post-workout"}', '{"cutting","balanced"}', '{"high-protein","quick","vegetarian","low-fat"}', '[{"name":"Iogurte grego natural","quantity":200,"unit":"g"},{"name":"Frutas vermelhas congeladas","quantity":1,"unit":"xícara"},{"name":"Mel","quantity":1,"unit":"colher de sopa"},{"name":"Granola light","quantity":2,"unit":"colheres de sopa"}]', '{"Coloque o iogurte em uma tigela","Adicione as frutas vermelhas por cima","Regue com mel","Finalize com granola","Sirva imediatamente"}'),

('Tapioca com Queijo Cottage', 'Carboidrato de baixo índice glicêmico com proteína', '/recipes/tapioca-cottage.jpg', 240, 16, 38, 4, 2, 1, 10, 'easy', '{"breakfast","snack"}', '{"cutting","balanced"}', '{"low-fat","quick","gluten-free"}', '[{"name":"Goma de tapioca","quantity":4,"unit":"colheres de sopa"},{"name":"Queijo cottage","quantity":100,"unit":"g"},{"name":"Tomate cereja","quantity":5,"unit":"unidades"},{"name":"Manjericão fresco","quantity":null,"unit":"a gosto"}]', '{"Aqueça uma frigideira antiaderente","Espalhe a goma de tapioca formando um disco","Deixe cozinhar até firmar","Vire e cozinhe do outro lado","Recheie com queijo cottage e tomates","Dobre ao meio e sirva"}'),

('Smoothie de Proteína Verde', 'Bebida nutritiva e refrescante com vegetais', '/recipes/green-smoothie.jpg', 260, 25, 30, 6, 8, 1, 5, 'easy', '{"breakfast","snack","post-workout"}', '{"cutting","balanced"}', '{"high-protein","quick","vegetarian","high-fiber"}', '[{"name":"Whey protein (baunilha)","quantity":1,"unit":"scoop"},{"name":"Espinafre baby","quantity":2,"unit":"xícaras"},{"name":"Banana congelada","quantity":1,"unit":"unidade"},{"name":"Leite de amêndoas","quantity":300,"unit":"ml"},{"name":"Pasta de amendoim","quantity":1,"unit":"colher de sopa"}]', '{"Coloque todos os ingredientes no liquidificador","Bata até ficar homogêneo e cremoso","Adicione gelo se desejar","Sirva imediatamente"}');

-- Lunch/Dinner Recipes
INSERT INTO recipes (name, description, image_url, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fats_g_per_serving, fiber_g_per_serving, servings, prep_time_minutes, difficulty, meal_type, goal_type, tags, ingredients, instructions) VALUES
('Frango Grelhado com Batata Doce', 'Clássico da dieta fitness - proteína e carboidratos de qualidade', '/recipes/chicken-sweet-potato.jpg', 420, 45, 40, 8, 6, 1, 25, 'easy', '{"lunch","dinner","post-workout"}', '{"bulking","balanced"}', '{"high-protein","high-carb","gluten-free"}', '[{"name":"Peito de frango","quantity":200,"unit":"g"},{"name":"Batata doce","quantity":200,"unit":"g"},{"name":"Brócolis","quantity":1,"unit":"xícara"},{"name":"Azeite","quantity":1,"unit":"colher de sopa"},{"name":"Temperos","quantity":null,"unit":"a gosto"}]', '{"Tempere o frango e deixe marinar","Lave e corte a batata doce em cubos","Asse a batata a 200°C por 30 minutos","Grelhe o frango por 5-6 min de cada lado","Cozinhe o brócolis no vapor por 4 minutos","Monte o prato e regue com azeite"}'),

('Salmão com Aspargos', 'Rico em ômega-3 e proteínas de alta qualidade', '/recipes/salmon-asparagus.jpg', 380, 42, 12, 18, 4, 1, 20, 'medium', '{"lunch","dinner"}', '{"cutting","balanced"}', '{"high-protein","low-carb","omega-3","keto-friendly"}', '[{"name":"Filé de salmão","quantity":200,"unit":"g"},{"name":"Aspargos","quantity":150,"unit":"g"},{"name":"Limão","quantity":1,"unit":"unidade"},{"name":"Alho","quantity":2,"unit":"dentes"},{"name":"Azeite extra virgem","quantity":1,"unit":"colher de sopa"}]', '{"Tempere o salmão com limão, alho e sal","Deixe marinar por 10 minutos","Asse a 180°C por 15 minutos","Grelhe os aspargos com azeite","Sirva o salmão com aspargos e limão"}'),

('Carne Moída Magra com Arroz Integral', 'Refeição completa e nutritiva', '/recipes/ground-beef-rice.jpg', 480, 38, 52, 12, 5, 1, 30, 'easy', '{"lunch","dinner"}', '{"bulking","balanced"}', '{"high-protein","high-carb"}', '[{"name":"Carne moída (patinho)","quantity":200,"unit":"g"},{"name":"Arroz integral","quantity":80,"unit":"g (cru)"},{"name":"Feijão preto","quantity":100,"unit":"g"},{"name":"Cenoura ralada","quantity":1,"unit":"unidade"},{"name":"Cebola e alho","quantity":null,"unit":"a gosto"}]', '{"Cozinhe o arroz integral","Refogue a cebola e alho","Adicione a carne moída e refogue","Acrescente a cenoura ralada","Tempere a gosto","Cozinhe o feijão separadamente","Monte o prato com arroz, feijão e carne"}'),

('Salada Caesar com Frango', 'Salada proteica e saborosa', '/recipes/caesar-salad.jpg', 350, 40, 18, 14, 4, 1, 15, 'easy', '{"lunch","dinner"}', '{"cutting","balanced"}', '{"high-protein","low-carb"}', '[{"name":"Peito de frango grelhado","quantity":200,"unit":"g"},{"name":"Alface romana","quantity":3,"unit":"xícaras"},{"name":"Parmesão ralado","quantity":30,"unit":"g"},{"name":"Croutons integrais","quantity":30,"unit":"g"},{"name":"Molho caesar light","quantity":2,"unit":"colheres de sopa"}]', '{"Grelhe o frango e corte em tiras","Lave e rasgue a alface","Monte a salada em uma tigela","Adicione o frango, parmesão e croutons","Regue com molho caesar","Misture bem e sirva"}'),

('Filé de Tilápia com Legumes', 'Peixe branco leve com vegetais coloridos', '/recipes/tilapia-vegetables.jpg', 280, 38, 20, 6, 5, 1, 25, 'easy', '{"lunch","dinner"}', '{"cutting","balanced"}', '{"high-protein","low-fat","low-carb"}', '[{"name":"Filé de tilápia","quantity":200,"unit":"g"},{"name":"Abobrinha","quantity":1,"unit":"unidade"},{"name":"Tomate","quantity":2,"unit":"unidades"},{"name":"Pimentão","quantity":1,"unit":"unidade"},{"name":"Limão e ervas","quantity":null,"unit":"a gosto"}]', '{"Tempere a tilápia com limão e ervas","Corte os legumes em cubos","Grelhe a tilápia por 3-4 min de cada lado","Refogue os legumes rapidamente","Sirva o peixe com legumes ao lado"}');

-- Snacks
INSERT INTO recipes (name, description, image_url, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fats_g_per_serving, fiber_g_per_serving, servings, prep_time_minutes, difficulty, meal_type, goal_type, tags, ingredients, instructions) VALUES
('Pasta de Amendoim com Maçã', 'Lanche rápido com proteína e gorduras boas', '/recipes/peanut-butter-apple.jpg', 220, 8, 24, 12, 4, 1, 2, 'easy', '{"snack","pre-workout"}', '{"cutting","balanced","bulking"}', '{"quick","vegetarian","high-fiber"}', '[{"name":"Maçã","quantity":1,"unit":"unidade"},{"name":"Pasta de amendoim integral","quantity":2,"unit":"colheres de sopa"}]', '{"Corte a maçã em fatias","Espalhe a pasta de amendoim","Sirva imediatamente"}'),

('Ovos Cozidos', 'Proteína pura e prática para qualquer hora', '/recipes/boiled-eggs.jpg', 140, 12, 2, 10, 0, 2, 15, 'easy', '{"snack","breakfast","post-workout"}', '{"cutting","balanced","bulking"}', '{"high-protein","quick","keto-friendly"}', '[{"name":"Ovos","quantity":2,"unit":"unidades"}]', '{"Coloque os ovos em uma panela com água","Leve à fervura","Cozinhe por 10-12 minutos","Resfrie em água gelada","Descasque e sirva"}'),

('Queijo Cottage com Pepino', 'Lanche fresco e proteico', '/recipes/cottage-cucumber.jpg', 120, 14, 8, 2, 2, 1, 5, 'easy', '{"snack"}', '{"cutting","balanced"}', '{"high-protein","low-fat","quick","vegetarian"}', '[{"name":"Queijo cottage","quantity":150,"unit":"g"},{"name":"Pepino","quantity":1,"unit":"unidade"},{"name":"Tomate cereja","quantity":5,"unit":"unidades"},{"name":"Azeite e oregano","quantity":null,"unit":"a gosto"}]', '{"Corte o pepino em rodelas","Lave os tomates","Coloque o cottage em uma tigela","Adicione pepino e tomates","Tempere com azeite e orégano"}'),

('Protein Shake de Chocolate', 'Bebida proteica pós-treino', '/recipes/protein-shake.jpg', 200, 30, 15, 3, 2, 1, 3, 'easy', '{"snack","post-workout"}', '{"cutting","balanced","bulking"}', '{"high-protein","quick","low-fat"}', '[{"name":"Whey protein chocolate","quantity":1,"unit":"scoop"},{"name":"Banana","quantity":0.5,"unit":"unidade"},{"name":"Leite desnatado","quantity":300,"unit":"ml"},{"name":"Cacau em pó","quantity":1,"unit":"colher de chá"}]', '{"Coloque todos ingredientes no liquidificador","Bata até ficar homogêneo","Adicione gelo se desejar","Sirva imediatamente"}'),

('Wrap de Peru e Vegetais', 'Lanche prático e balanceado', '/recipes/turkey-wrap.jpg', 280, 24, 32, 6, 5, 1, 10, 'easy', '{"snack","lunch"}', '{"cutting","balanced"}', '{"high-protein","quick"}', '[{"name":"Tortilla integral","quantity":1,"unit":"unidade"},{"name":"Peito de peru fatiado","quantity":100,"unit":"g"},{"name":"Alface","quantity":2,"unit":"folhas"},{"name":"Tomate","quantity":1,"unit":"unidade"},{"name":"Mostarda dijon","quantity":1,"unit":"colher de chá"}]', '{"Aqueça a tortilla levemente","Espalhe a mostarda","Adicione alface, tomate e peru","Enrole firmemente","Corte ao meio e sirva"}');

-- Pre/Post Workout
INSERT INTO recipes (name, description, image_url, calories_per_serving, protein_g_per_serving, carbs_g_per_serving, fats_g_per_serving, fiber_g_per_serving, servings, prep_time_minutes, difficulty, meal_type, goal_type, tags, ingredients, instructions) VALUES
('Banana com Aveia Pré-Treino', 'Energia rápida para treino intenso', '/recipes/banana-oats.jpg', 240, 8, 48, 3, 6, 1, 3, 'easy', '{"snack","pre-workout"}', '{"bulking","balanced"}', '{"high-carb","quick","vegetarian"}', '[{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Aveia em flocos","quantity":0.5,"unit":"xícara"},{"name":"Mel","quantity":1,"unit":"colher de chá"},{"name":"Canela","quantity":null,"unit":"a gosto"}]', '{"Corte a banana em rodelas","Misture com aveia","Adicione mel e canela","Sirva imediatamente ou leve ao micro-ondas por 1 min"}'),

('Rice Cakes com Pasta de Amendoim', 'Carboidratos de rápida absorção', '/recipes/rice-cakes.jpg', 180, 6, 28, 6, 2, 2, 2, 'easy', '{"snack","pre-workout"}', '{"bulking","balanced"}', '{"quick","vegetarian"}', '[{"name":"Bolacha de arroz","quantity":2,"unit":"unidades"},{"name":"Pasta de amendoim","quantity":1,"unit":"colher de sopa"},{"name":"Geleia sem açúcar","quantity":1,"unit":"colher de chá"}]', '{"Espalhe pasta de amendoim nas bolachas","Adicione geleia por cima","Sirva imediatamente"}'),

('Batata Doce Assada', 'Carboidrato complexo perfeito pré-treino', '/recipes/sweet-potato-baked.jpg', 180, 4, 42, 0.5, 6, 1, 35, 'easy', '{"snack","pre-workout","lunch","dinner"}', '{"bulking","balanced"}', '{"high-carb","gluten-free","vegan"}', '[{"name":"Batata doce média","quantity":1,"unit":"unidade"},{"name":"Canela","quantity":null,"unit":"a gosto"}]', '{"Lave bem a batata","Faça furos com um garfo","Asse a 200°C por 40-45 minutos","Polvilhe canela","Sirva quente"}'),

('Frango com Arroz Branco Pós-Treino', 'Refeição anabólica para recuperação muscular', '/recipes/chicken-white-rice.jpg', 450, 48, 55, 4, 3, 1, 20, 'easy', '{"post-workout","lunch","dinner"}', '{"bulking","balanced"}', '{"high-protein","high-carb"}', '[{"name":"Peito de frango","quantity":200,"unit":"g"},{"name":"Arroz branco","quantity":80,"unit":"g (cru)"},{"name":"Temperos","quantity":null,"unit":"a gosto"}]', '{"Cozinhe o arroz branco","Tempereegrelhe o frango","Corte o frango em cubos","Sirva com arroz","Adicione molho de soja light se desejar"}'),

('Shake de Whey com Banana Pós-Treino', 'Proteína de rápida absorção para janela anabólica', '/recipes/post-workout-shake.jpg', 280, 32, 35, 2, 4, 1, 3, 'easy', '{"post-workout","snack"}', '{"cutting","balanced","bulking"}', '{"high-protein","quick"}', '[{"name":"Whey protein","quantity":1,"unit":"scoop"},{"name":"Banana","quantity":1,"unit":"unidade"},{"name":"Aveia","quantity":2,"unit":"colheres de sopa"},{"name":"Água ou leite desnatado","quantity":300,"unit":"ml"}]', '{"Coloque todos ingredientes no liquidificador","Bata até ficar cremoso","Consuma em até 30 minutos após o treino"}');

-- ============================================
-- VERIFICATION
-- ============================================

-- Count total recipes
SELECT COUNT(*) as total_recipes FROM recipes WHERE is_active = true;

-- Count by meal type
SELECT 
    UNNEST(meal_type) as meal,
    COUNT(*) as count
FROM recipes 
WHERE is_active = true
GROUP BY meal
ORDER BY count DESC;

-- Count by goal type
SELECT 
    UNNEST(goal_type) as goal,
    COUNT(*) as count
FROM recipes
WHERE is_active = true
GROUP BY goal
ORDER BY count DESC;
