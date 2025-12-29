-- ============================================
-- YOUMOVE - Wger Exercises Table
-- Tabela para armazenar exercícios sincronizados da API Wger
-- ============================================

-- Criar tabela wger_exercises
CREATE TABLE IF NOT EXISTS wger_exercises (
    -- Identificação (usa mesmo ID da Wger para facilitar sync)
    id BIGINT PRIMARY KEY,
    
    -- Nomes
    name TEXT NOT NULL,
    name_pt TEXT,
    
    -- Descrição
    description TEXT,
    
    -- Imagem
    image_url TEXT,
    
    -- Categorização
    category INTEGER,
    muscles INTEGER[],
    equipment INTEGER[],
    
    -- Metadados
    last_synced TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_wger_exercises_name ON wger_exercises(name);
CREATE INDEX IF NOT EXISTS idx_wger_exercises_name_pt ON wger_exercises(name_pt);
CREATE INDEX IF NOT EXISTS idx_wger_exercises_category ON wger_exercises(category);
CREATE INDEX IF NOT EXISTS idx_wger_exercises_muscles ON wger_exercises USING GIN(muscles);
CREATE INDEX IF NOT EXISTS idx_wger_exercises_last_synced ON wger_exercises(last_synced);

-- Índice de busca full-text (português + inglês)
CREATE INDEX IF NOT EXISTS idx_wger_exercises_search ON wger_exercises 
USING GIN(to_tsvector('portuguese', COALESCE(name_pt, '') || ' ' || COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_wger_exercises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wger_exercises_updated_at
    BEFORE UPDATE ON wger_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_wger_exercises_updated_at();

-- RLS (Row Level Security)
ALTER TABLE wger_exercises ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler
CREATE POLICY "Wger exercises are viewable by everyone"
    ON wger_exercises FOR SELECT
    USING (true);

-- Política: Apenas service role pode inserir/atualizar
-- (sync script usa service role key)
CREATE POLICY "Only service role can modify wger exercises"
    ON wger_exercises FOR ALL
    USING (auth.role() = 'service_role');

-- Comentários
COMMENT ON TABLE wger_exercises IS 'Exercícios sincronizados da API Wger (open-source fitness database)';
COMMENT ON COLUMN wger_exercises.id IS 'ID do exercício na API Wger';
COMMENT ON COLUMN wger_exercises.name IS 'Nome do exercício (geralmente em inglês ou espanhol)';
COMMENT ON COLUMN wger_exercises.name_pt IS 'Nome em português (se disponível)';
COMMENT ON COLUMN wger_exercises.description IS 'Descrição do exercício';
COMMENT ON COLUMN wger_exercises.image_url IS 'URL da imagem do exercício';
COMMENT ON COLUMN wger_exercises.category IS 'ID da categoria na Wger (8=arms, 10=legs, 11=abs, 12=back, 13=shoulders, 14=chest)';
COMMENT ON COLUMN wger_exercises.muscles IS 'Array de IDs dos músculos trabalhados';
COMMENT ON COLUMN wger_exercises.equipment IS 'Array de IDs dos equipamentos necessários';
COMMENT ON COLUMN wger_exercises.last_synced IS 'Última vez que foi sincronizado da API Wger';

-- ============================================
-- Função auxiliar para busca
-- ============================================

CREATE OR REPLACE FUNCTION search_wger_exercises(
    search_query TEXT,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    name_pt TEXT,
    description TEXT,
    image_url TEXT,
    category INTEGER,
    muscles INTEGER[],
    equipment INTEGER[],
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        we.id,
        we.name,
        we.name_pt,
        we.description,
        we.image_url,
        we.category,
        we.muscles,
        we.equipment,
        ts_rank(
            to_tsvector('portuguese', COALESCE(we.name_pt, '') || ' ' || COALESCE(we.name, '') || ' ' || COALESCE(we.description, '')),
            plainto_tsquery('portuguese', search_query)
        ) AS relevance
    FROM wger_exercises we
    WHERE 
        to_tsvector('portuguese', COALESCE(we.name_pt, '') || ' ' || COALESCE(we.name, '') || ' ' || COALESCE(we.description, ''))
        @@ plainto_tsquery('portuguese', search_query)
    ORDER BY relevance DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_wger_exercises IS 'Busca exercícios Wger por texto com ranking de relevância';

-- ============================================
-- View para facilitar consultas
-- ============================================

CREATE OR REPLACE VIEW wger_exercises_with_images AS
SELECT *
FROM wger_exercises
WHERE image_url IS NOT NULL;

COMMENT ON VIEW wger_exercises_with_images IS 'View de exercícios Wger que possuem imagem';

-- Grant permissions na view
GRANT SELECT ON wger_exercises_with_images TO anon, authenticated;
