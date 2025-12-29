-- ============================================
-- YOUMOVE - Fix Exercise GIF URLs
-- Migration: 008_fix_exercise_gifs
-- Date: 2025-12-23
-- Purpose: Update exercise library to use working GitHub URLs
-- ============================================

-- Atualizar URLs para usar o repositório free-exercise-db do GitHub
-- Convertendo IDs numéricos para nomes de exercícios

-- Função para converter nome do exercício em slug (formato do GitHub)
CREATE OR REPLACE FUNCTION exercise_name_to_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove caracteres especiais e substitui espaços por underscores
    RETURN REPLACE(
        REGEXP_REPLACE(
            INITCAP(name),
            '[^a-zA-Z0-9\s/]',
            '',
            'g'
        ),
        ' ',
        '_'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar gif_url para usar GitHub (imagens JPG estáticas)
-- Formato: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{slug}/0.jpg
UPDATE exercise_library
SET gif_url = CONCAT(
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/',
    exercise_name_to_slug(name),
    '/0.jpg'
)
WHERE gif_url LIKE '%v2.exercisedb.io%' OR gif_url LIKE '%cloudfront%';

-- Adicionar coluna para armazenar o slug do GitHub (útil para futuras buscas)
ALTER TABLE exercise_library 
ADD COLUMN IF NOT EXISTS github_slug TEXT;

-- Atualizar a coluna github_slug
UPDATE exercise_library
SET github_slug = exercise_name_to_slug(name);

-- Criar índice para busca por slug
CREATE INDEX IF NOT EXISTS idx_exercise_library_github_slug 
ON exercise_library(github_slug);

-- Log de quantos registros foram atualizados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM exercise_library
    WHERE gif_url LIKE '%githubusercontent.com%';
    
    RAISE NOTICE 'Updated % exercise GIF URLs to use GitHub repository', updated_count;
END $$;
