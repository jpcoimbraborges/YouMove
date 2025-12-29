-- ============================================
-- YOUMOVE - Workout Templates
-- Migration: 004_workout_templates
-- Date: 2024-12-29
-- ============================================

-- ============================================
-- TABLE: workout_templates
-- Pre-built workout templates for quick start
-- ============================================
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Classification
    category TEXT NOT NULL CHECK (category IN ('strength', 'hypertrophy', 'endurance', 'weight_loss', 'functional', 'flexibility')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    target_muscles TEXT[] DEFAULT '{}',
    
    -- Structure
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 180),
    exercises JSONB NOT NULL DEFAULT '[]',
    /*
    Structure:
    [
        {
            "name": "Supino Reto",
            "sets": 4,
            "reps": "8-12",
            "rest_seconds": 90,
            "notes": "Foco na contração"
        }
    ]
    */
    
    -- Metadata
    equipment_needed TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    
    -- Stats
    uses_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(2,1) DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    
    -- System
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_templates_category ON workout_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_difficulty ON workout_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_templates_active ON workout_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_featured ON workout_templates(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_uses ON workout_templates(uses_count DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Public read access for active templates
CREATE POLICY "Templates are viewable by everyone"
    ON workout_templates FOR SELECT
    USING (is_active = true);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON workout_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: 15 Workout Templates
-- ============================================

-- =====================
-- BEGINNER TEMPLATES (5)
-- =====================

INSERT INTO workout_templates (name, slug, description, category, difficulty, target_muscles, duration_minutes, equipment_needed, tags, is_featured, exercises) VALUES

-- 1. Full Body Básico
('Full Body Iniciante', 'full-body-iniciante', 
'Treino completo para quem está começando. Trabalha todos os grupos musculares de forma equilibrada.',
'hypertrophy', 'beginner', 
ARRAY['chest', 'back', 'legs', 'shoulders', 'core'],
45, 
ARRAY['dumbbells', 'bench'],
ARRAY['full-body', 'beginner-friendly', 'balanced'],
true,
'[
    {"name": "Agachamento Livre", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Desça até as coxas ficarem paralelas ao chão"},
    {"name": "Supino com Halteres", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Cotovelos a 45 graus"},
    {"name": "Remada Curvada", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Costas retas, puxe até o umbigo"},
    {"name": "Desenvolvimento com Halteres", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Sem balançar o corpo"},
    {"name": "Prancha", "sets": 3, "reps": "30 seg", "rest_seconds": 45, "notes": "Mantenha o corpo alinhado"},
    {"name": "Rosca Direta", "sets": 2, "reps": "12-15", "rest_seconds": 45, "notes": "Movimento controlado"}
]'::jsonb),

-- 2. Cardio + Core
('Cardio e Core Express', 'cardio-core-express',
'Treino rápido focado em queima calórica e fortalecimento do core. Perfeito para dias corridos.',
'weight_loss', 'beginner',
ARRAY['core', 'full-body'],
30,
ARRAY['mat'],
ARRAY['cardio', 'core', 'quick', 'no-equipment'],
true,
'[
    {"name": "Polichinelos", "sets": 3, "reps": "45 seg", "rest_seconds": 15, "notes": "Mantenha ritmo constante"},
    {"name": "Prancha Frontal", "sets": 3, "reps": "30 seg", "rest_seconds": 30, "notes": "Abdômen contraído"},
    {"name": "Mountain Climbers", "sets": 3, "reps": "30 seg", "rest_seconds": 30, "notes": "Quadril baixo"},
    {"name": "Abdominal Bicicleta", "sets": 3, "reps": "20 reps", "rest_seconds": 30, "notes": "Toque cotovelo-joelho"},
    {"name": "Burpees Modificados", "sets": 3, "reps": "10 reps", "rest_seconds": 45, "notes": "Sem o pulo se necessário"},
    {"name": "Prancha Lateral", "sets": 2, "reps": "20 seg/lado", "rest_seconds": 30, "notes": "Quadril elevado"}
]'::jsonb),

-- 3. Upper Body Básico
('Upper Body Iniciante', 'upper-body-iniciante',
'Treino focado na parte superior do corpo. Ideal para desenvolver força nos braços, peito e costas.',
'hypertrophy', 'beginner',
ARRAY['chest', 'back', 'shoulders', 'biceps', 'triceps'],
40,
ARRAY['dumbbells', 'bench'],
ARRAY['upper-body', 'arms', 'beginner-friendly'],
false,
'[
    {"name": "Flexão de Braços", "sets": 3, "reps": "8-12", "rest_seconds": 60, "notes": "Pode fazer no joelho"},
    {"name": "Remada Unilateral", "sets": 3, "reps": "10/lado", "rest_seconds": 60, "notes": "Costas paralelas ao chão"},
    {"name": "Desenvolvimento Sentado", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Sem arquear as costas"},
    {"name": "Tríceps Francês", "sets": 3, "reps": "12-15", "rest_seconds": 45, "notes": "Cotovelos fixos"},
    {"name": "Rosca Martelo", "sets": 3, "reps": "12-15", "rest_seconds": 45, "notes": "Palmas voltadas uma pra outra"},
    {"name": "Elevação Frontal", "sets": 2, "reps": "12", "rest_seconds": 45, "notes": "Até a altura do ombro"}
]'::jsonb),

-- 4. Lower Body Básico
('Lower Body Iniciante', 'lower-body-iniciante',
'Treino completo para pernas e glúteos. Exercícios fundamentais para base sólida.',
'hypertrophy', 'beginner',
ARRAY['quadriceps', 'hamstrings', 'glutes', 'calves'],
40,
ARRAY['dumbbells'],
ARRAY['lower-body', 'legs', 'glutes', 'beginner-friendly'],
false,
'[
    {"name": "Agachamento Goblet", "sets": 4, "reps": "12-15", "rest_seconds": 60, "notes": "Haltere próximo ao peito"},
    {"name": "Afundo Estacionário", "sets": 3, "reps": "10/perna", "rest_seconds": 60, "notes": "Joelho não ultrapassa o pé"},
    {"name": "Stiff com Halteres", "sets": 3, "reps": "12", "rest_seconds": 60, "notes": "Joelhos levemente flexionados"},
    {"name": "Elevação Pélvica", "sets": 3, "reps": "15", "rest_seconds": 45, "notes": "Aperte os glúteos no topo"},
    {"name": "Panturrilha em Pé", "sets": 3, "reps": "15-20", "rest_seconds": 30, "notes": "Amplitude total"},
    {"name": "Cadeira Isométrica", "sets": 3, "reps": "30 seg", "rest_seconds": 45, "notes": "Costas na parede"}
]'::jsonb),

-- 5. Mobilidade e Alongamento
('Mobilidade e Recuperação', 'mobilidade-recuperacao',
'Sessão de mobilidade e alongamento. Perfeito para dias de descanso ativo ou pós-treino.',
'flexibility', 'beginner',
ARRAY['full-body'],
20,
ARRAY['mat'],
ARRAY['stretching', 'mobility', 'recovery', 'no-equipment'],
false,
'[
    {"name": "Círculos de Quadril", "sets": 2, "reps": "10/lado", "rest_seconds": 0, "notes": "Movimentos amplos"},
    {"name": "Cat-Cow", "sets": 2, "reps": "10", "rest_seconds": 0, "notes": "Respiração sincronizada"},
    {"name": "Alongamento de Quadríceps", "sets": 2, "reps": "30 seg/lado", "rest_seconds": 0, "notes": "Mantenha equilíbrio"},
    {"name": "Pombo (Pigeon)", "sets": 2, "reps": "30 seg/lado", "rest_seconds": 0, "notes": "Relaxe na posição"},
    {"name": "Torção Deitada", "sets": 2, "reps": "30 seg/lado", "rest_seconds": 0, "notes": "Ombros no chão"},
    {"name": "Child''s Pose", "sets": 2, "reps": "45 seg", "rest_seconds": 0, "notes": "Respire profundamente"}
]'::jsonb),

-- =====================
-- INTERMEDIATE TEMPLATES (5)
-- =====================

-- 6. Push/Pull/Legs - Push Day
('Push Day (PPL)', 'push-day-ppl',
'Dia de empurrar: peito, ombros e tríceps. Parte do programa Push/Pull/Legs.',
'hypertrophy', 'intermediate',
ARRAY['chest', 'shoulders', 'triceps'],
55,
ARRAY['barbell', 'dumbbells', 'cables', 'bench'],
ARRAY['push', 'ppl', 'chest', 'shoulders'],
true,
'[
    {"name": "Supino Reto com Barra", "sets": 4, "reps": "8-10", "rest_seconds": 120, "notes": "Desça até tocar o peito"},
    {"name": "Supino Inclinado Halteres", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "30-45 graus"},
    {"name": "Desenvolvimento Militar", "sets": 4, "reps": "8-10", "rest_seconds": 90, "notes": "Barra na frente"},
    {"name": "Elevação Lateral", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Cotovelos levemente flexionados"},
    {"name": "Tríceps Pulley", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Cotovelos fixos"},
    {"name": "Mergulho no Banco", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Desça até 90 graus"},
    {"name": "Crucifixo na Polia", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Foco na contração"}
]'::jsonb),

-- 7. Push/Pull/Legs - Pull Day
('Pull Day (PPL)', 'pull-day-ppl',
'Dia de puxar: costas e bíceps. Parte do programa Push/Pull/Legs.',
'hypertrophy', 'intermediate',
ARRAY['back', 'biceps', 'forearms'],
55,
ARRAY['barbell', 'dumbbells', 'cables', 'pull-up-bar'],
ARRAY['pull', 'ppl', 'back', 'biceps'],
true,
'[
    {"name": "Barra Fixa", "sets": 4, "reps": "6-10", "rest_seconds": 120, "notes": "Pegada pronada, largura dos ombros"},
    {"name": "Remada Curvada", "sets": 4, "reps": "8-10", "rest_seconds": 90, "notes": "Puxe até o umbigo"},
    {"name": "Pulldown", "sets": 3, "reps": "10-12", "rest_seconds": 75, "notes": "Puxe até o peito"},
    {"name": "Remada Cavalinho", "sets": 3, "reps": "10-12", "rest_seconds": 75, "notes": "Peito apoiado"},
    {"name": "Face Pull", "sets": 3, "reps": "15-20", "rest_seconds": 60, "notes": "Puxe até as orelhas"},
    {"name": "Rosca Direta com Barra", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Sem balançar"},
    {"name": "Rosca Martelo", "sets": 3, "reps": "12", "rest_seconds": 60, "notes": "Alternada ou simultânea"}
]'::jsonb),

-- 8. Push/Pull/Legs - Legs Day
('Legs Day (PPL)', 'legs-day-ppl',
'Dia de pernas: quadríceps, posterior e glúteos. Parte do programa Push/Pull/Legs.',
'hypertrophy', 'intermediate',
ARRAY['quadriceps', 'hamstrings', 'glutes', 'calves'],
60,
ARRAY['barbell', 'leg-press', 'machines'],
ARRAY['legs', 'ppl', 'lower-body'],
true,
'[
    {"name": "Agachamento Livre", "sets": 4, "reps": "8-10", "rest_seconds": 180, "notes": "Profundidade paralela ou mais"},
    {"name": "Leg Press 45°", "sets": 4, "reps": "10-12", "rest_seconds": 120, "notes": "Pés largura dos ombros"},
    {"name": "Cadeira Extensora", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Contração no topo"},
    {"name": "Mesa Flexora", "sets": 3, "reps": "10-12", "rest_seconds": 75, "notes": "Movimento controlado"},
    {"name": "Stiff Romeno", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Sinta alongamento no posterior"},
    {"name": "Panturrilha Sentado", "sets": 4, "reps": "15-20", "rest_seconds": 45, "notes": "Pause no alongamento"},
    {"name": "Afundo Búlgaro", "sets": 3, "reps": "10/perna", "rest_seconds": 60, "notes": "Pé traseiro elevado"}
]'::jsonb),

-- 9. HIIT Queima de Gordura
('HIIT Fat Burner', 'hiit-fat-burner',
'Treino intervalado de alta intensidade. Máxima queima calórica em tempo mínimo.',
'weight_loss', 'intermediate',
ARRAY['full-body'],
25,
ARRAY['mat', 'kettlebell'],
ARRAY['hiit', 'cardio', 'fat-loss', 'intense'],
true,
'[
    {"name": "Burpees", "sets": 4, "reps": "45 seg", "rest_seconds": 15, "notes": "Máxima intensidade"},
    {"name": "Swing com Kettlebell", "sets": 4, "reps": "45 seg", "rest_seconds": 15, "notes": "Explosão no quadril"},
    {"name": "Jump Squats", "sets": 4, "reps": "45 seg", "rest_seconds": 15, "notes": "Aterrisse suave"},
    {"name": "Mountain Climbers", "sets": 4, "reps": "45 seg", "rest_seconds": 15, "notes": "Ritmo acelerado"},
    {"name": "Thruster com Halteres", "sets": 4, "reps": "45 seg", "rest_seconds": 15, "notes": "Agachamento + desenvolvimento"},
    {"name": "High Knees", "sets": 4, "reps": "45 seg", "rest_seconds": 15, "notes": "Joelhos na altura do quadril"}
]'::jsonb),

-- 10. Força 5x5
('Força 5x5 Clássico', 'forca-5x5-classico',
'Programa clássico de força. 5 séries de 5 repetições nos exercícios compostos principais.',
'strength', 'intermediate',
ARRAY['full-body'],
50,
ARRAY['barbell', 'rack', 'bench'],
ARRAY['strength', '5x5', 'compound', 'powerlifting'],
false,
'[
    {"name": "Agachamento Livre", "sets": 5, "reps": "5", "rest_seconds": 180, "notes": "Progressão de 2.5kg/semana"},
    {"name": "Supino Reto", "sets": 5, "reps": "5", "rest_seconds": 180, "notes": "Pegada média"},
    {"name": "Remada Curvada", "sets": 5, "reps": "5", "rest_seconds": 180, "notes": "Costas paralelas ao chão"},
    {"name": "Desenvolvimento em Pé", "sets": 5, "reps": "5", "rest_seconds": 180, "notes": "Strict, sem impulso"},
    {"name": "Levantamento Terra", "sets": 1, "reps": "5", "rest_seconds": 0, "notes": "Apenas 1 série pesada"}
]'::jsonb),

-- =====================
-- ADVANCED TEMPLATES (5)
-- =====================

-- 11. Programa Powerlifting
('Powerlifting Básico', 'powerlifting-basico',
'Foco nos três grandes lifts: agachamento, supino e terra. Para atletas de força.',
'strength', 'advanced',
ARRAY['full-body'],
75,
ARRAY['barbell', 'rack', 'bench', 'belt'],
ARRAY['powerlifting', 'strength', 'competition'],
false,
'[
    {"name": "Agachamento Livre", "sets": 5, "reps": "3-5", "rest_seconds": 240, "notes": "85-90% 1RM"},
    {"name": "Supino Reto (Pausa)", "sets": 5, "reps": "3-5", "rest_seconds": 240, "notes": "Pausa de 1seg no peito"},
    {"name": "Levantamento Terra", "sets": 5, "reps": "3-5", "rest_seconds": 240, "notes": "Convencional ou Sumo"},
    {"name": "Good Morning", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Acessório para posterior"},
    {"name": "Remada Pendlay", "sets": 3, "reps": "5", "rest_seconds": 120, "notes": "Barra toca o chão cada rep"}
]'::jsonb),

-- 12. Bodybuilding Split - Peito
('Peito Completo (BB)', 'peito-completo-bb',
'Treino de peito estilo bodybuilding. Alto volume, máxima hipertrofia.',
'hypertrophy', 'advanced',
ARRAY['chest'],
55,
ARRAY['barbell', 'dumbbells', 'cables', 'machines'],
ARRAY['chest', 'bodybuilding', 'volume'],
false,
'[
    {"name": "Supino Inclinado 30°", "sets": 4, "reps": "8-10", "rest_seconds": 90, "notes": "Primeiro exercício fresco"},
    {"name": "Supino Reto com Barra", "sets": 4, "reps": "8-10", "rest_seconds": 90, "notes": "Foco na contração"},
    {"name": "Crucifixo Inclinado", "sets": 3, "reps": "12", "rest_seconds": 75, "notes": "Alongamento profundo"},
    {"name": "Peck Deck", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Squeeze no centro"},
    {"name": "Cross-Over Baixo", "sets": 3, "reps": "15", "rest_seconds": 60, "notes": "Polia baixa para cima"},
    {"name": "Flexão até Falha", "sets": 2, "reps": "Falha", "rest_seconds": 0, "notes": "Finisher"}
]'::jsonb),

-- 13. Bodybuilding Split - Costas
('Costas Completo (BB)', 'costas-completo-bb',
'Treino de costas estilo bodybuilding. Largura e espessura.',
'hypertrophy', 'advanced',
ARRAY['back'],
60,
ARRAY['barbell', 'dumbbells', 'cables', 'machines'],
ARRAY['back', 'bodybuilding', 'volume'],
false,
'[
    {"name": "Barra Fixa Pegada Larga", "sets": 4, "reps": "6-10", "rest_seconds": 120, "notes": "Para largura"},
    {"name": "Remada Cavalinho", "sets": 4, "reps": "10-12", "rest_seconds": 90, "notes": "Para espessura"},
    {"name": "Pulldown Pegada Neutra", "sets": 3, "reps": "10-12", "rest_seconds": 75, "notes": "Foco no dorsal"},
    {"name": "Remada Unilateral", "sets": 3, "reps": "10/lado", "rest_seconds": 75, "notes": "Rotação do tronco"},
    {"name": "Pullover na Polia", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Braços estendidos"},
    {"name": "Hiperextensão", "sets": 3, "reps": "15", "rest_seconds": 60, "notes": "Lombar e glúteos"}
]'::jsonb),

-- 14. Giant Sets - Total Body
('Giant Sets Total Body', 'giant-sets-total-body',
'Treino avançado com séries gigantes. Máximo estresse metabólico.',
'hypertrophy', 'advanced',
ARRAY['full-body'],
50,
ARRAY['dumbbells', 'cables', 'machines'],
ARRAY['giant-sets', 'metabolic', 'advanced', 'intense'],
false,
'[
    {"name": "GIANT SET 1: Supino + Fly + Flexão", "sets": 4, "reps": "12+12+falha", "rest_seconds": 120, "notes": "Sem descanso entre exercícios"},
    {"name": "GIANT SET 2: Remada + Pulldown + Face Pull", "sets": 4, "reps": "12+12+15", "rest_seconds": 120, "notes": "Transição rápida"},
    {"name": "GIANT SET 3: Agachamento + Afundo + Leg Press", "sets": 3, "reps": "15+10/perna+20", "rest_seconds": 150, "notes": "Prepare-se para queimar"},
    {"name": "GIANT SET 4: Desenvolvimento + Lateral + Frontal", "sets": 3, "reps": "10+12+10", "rest_seconds": 90, "notes": "Ombros completos"}
]'::jsonb),

-- 15. CrossFit Style WOD
('CrossFit AMRAP 20', 'crossfit-amrap-20',
'Treino estilo CrossFit. AMRAP (As Many Rounds As Possible) em 20 minutos.',
'functional', 'advanced',
ARRAY['full-body'],
30,
ARRAY['barbell', 'pull-up-bar', 'box'],
ARRAY['crossfit', 'wod', 'amrap', 'functional'],
false,
'[
    {"name": "AMRAP 20 min:", "sets": 1, "reps": "-", "rest_seconds": 0, "notes": "Complete o máximo de rounds"},
    {"name": "Thruster (40kg)", "sets": 1, "reps": "10", "rest_seconds": 0, "notes": "Agachamento frontal + push press"},
    {"name": "Pull-ups", "sets": 1, "reps": "15", "rest_seconds": 0, "notes": "Kipping permitido"},
    {"name": "Box Jump (60cm)", "sets": 1, "reps": "20", "rest_seconds": 0, "notes": "Step down para descer"},
    {"name": "Push-ups", "sets": 1, "reps": "20", "rest_seconds": 0, "notes": "Peito toca o chão"},
    {"name": "Anote rounds + reps extras", "sets": 1, "reps": "-", "rest_seconds": 0, "notes": "Compare próxima vez"}
]'::jsonb);

-- ============================================
-- Set some templates as featured
-- ============================================
UPDATE workout_templates SET is_featured = true WHERE slug IN (
    'full-body-iniciante',
    'cardio-core-express',
    'push-day-ppl',
    'pull-day-ppl',
    'legs-day-ppl',
    'hiit-fat-burner'
);
