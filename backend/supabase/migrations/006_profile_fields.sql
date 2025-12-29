-- Adiciona colunas de perfil se não existirem
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS fitness_goal TEXT DEFAULT 'Ganhar massa muscular',
ADD COLUMN IF NOT EXISTS fitness_level TEXT DEFAULT 'Intermediário',
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Garantir política de update
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
