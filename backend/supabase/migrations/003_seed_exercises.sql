-- ============================================
-- YOUMOVE - Seed Data
-- Initial exercises library
-- ============================================

-- ============================================
-- CHEST EXERCISES
-- ============================================
INSERT INTO exercises (name, name_pt, primary_muscle, secondary_muscles, movement_type, equipment_required, difficulty_level, instructions, tips) VALUES
(
    'Bench Press',
    'Supino Reto',
    'chest',
    ARRAY['triceps', 'shoulders']::muscle_group[],
    'compound',
    ARRAY['barbell', 'bench'],
    5,
    ARRAY[
        'Deite no banco com os pés apoiados no chão',
        'Segure a barra com pegada um pouco mais larga que os ombros',
        'Desça a barra até tocar levemente o peito',
        'Empurre a barra para cima até estender os braços'
    ],
    ARRAY[
        'Mantenha as escápulas retraídas durante todo o movimento',
        'Não deixe os cotovelos muito abertos',
        'Respire: inspire descendo, expire subindo'
    ]
),
(
    'Incline Dumbbell Press',
    'Supino Inclinado com Halteres',
    'chest',
    ARRAY['triceps', 'shoulders']::muscle_group[],
    'compound',
    ARRAY['dumbbells', 'incline bench'],
    5,
    ARRAY[
        'Ajuste o banco em inclinação de 30-45 graus',
        'Segure um halter em cada mão na altura do peito',
        'Empurre os halteres para cima até estender os braços',
        'Desça controladamente até os halteres ficarem na altura do peito'
    ],
    ARRAY[
        'Foco na porção superior do peitoral',
        'Não bata os halteres no topo do movimento',
        'Mantenha a tensão constante'
    ]
),
(
    'Push-ups',
    'Flexão de Braços',
    'chest',
    ARRAY['triceps', 'shoulders', 'core']::muscle_group[],
    'compound',
    ARRAY[]::TEXT[],
    3,
    ARRAY[
        'Posicione-se em prancha com as mãos na largura dos ombros',
        'Desça o corpo mantendo o core contraído',
        'Toque levemente o peito no chão',
        'Empurre o corpo de volta à posição inicial'
    ],
    ARRAY[
        'Mantenha o corpo reto como uma tábua',
        'Não deixe o quadril subir ou descer',
        'Cotovelos a 45 graus do corpo'
    ]
);

-- ============================================
-- BACK EXERCISES
-- ============================================
INSERT INTO exercises (name, name_pt, primary_muscle, secondary_muscles, movement_type, equipment_required, difficulty_level, instructions, tips) VALUES
(
    'Lat Pulldown',
    'Puxada Frontal',
    'back',
    ARRAY['biceps', 'shoulders']::muscle_group[],
    'compound',
    ARRAY['cable machine', 'lat bar'],
    4,
    ARRAY[
        'Sente-se na máquina e ajuste a almofada das coxas',
        'Segure a barra com pegada larga',
        'Puxe a barra até a altura do queixo',
        'Retorne controladamente à posição inicial'
    ],
    ARRAY[
        'Não balance o corpo para puxar',
        'Foque em contrair as escápulas',
        'Mantenha o peito erguido'
    ]
),
(
    'Barbell Row',
    'Remada Curvada',
    'back',
    ARRAY['biceps', 'core']::muscle_group[],
    'compound',
    ARRAY['barbell'],
    6,
    ARRAY[
        'Segure a barra com pegada pronada na largura dos ombros',
        'Incline o tronco a aproximadamente 45 graus',
        'Puxe a barra em direção ao abdômen',
        'Desça a barra controladamente'
    ],
    ARRAY[
        'Mantenha as costas retas durante todo movimento',
        'Puxe com os cotovelos, não com as mãos',
        'Contraia as escápulas no topo'
    ]
),
(
    'Deadlift',
    'Levantamento Terra',
    'back',
    ARRAY['hamstrings', 'glutes', 'core', 'quadriceps']::muscle_group[],
    'compound',
    ARRAY['barbell'],
    8,
    ARRAY[
        'Posicione os pés na largura do quadril',
        'Segure a barra com pegada alternada ou pronada',
        'Mantenha as costas retas e core ativado',
        'Levante a barra estendendo quadris e joelhos simultaneamente',
        'Retorne ao solo com controle'
    ],
    ARRAY[
        'A barra deve permanecer próxima ao corpo',
        'Não arredonde a lombar',
        'Inicie o movimento empurrando o chão'
    ]
);

-- ============================================
-- SHOULDERS EXERCISES
-- ============================================
INSERT INTO exercises (name, name_pt, primary_muscle, secondary_muscles, movement_type, equipment_required, difficulty_level, instructions, tips) VALUES
(
    'Overhead Press',
    'Desenvolvimento com Barra',
    'shoulders',
    ARRAY['triceps', 'core']::muscle_group[],
    'compound',
    ARRAY['barbell'],
    6,
    ARRAY[
        'Segure a barra na altura dos ombros',
        'Empurre a barra verticalmente até estender os braços',
        'Passe a cabeça para frente ao final do movimento',
        'Desça a barra controladamente'
    ],
    ARRAY[
        'Mantenha o core contraído',
        'Não incline o tronco para trás',
        'Respire antes de empurrar'
    ]
),
(
    'Lateral Raises',
    'Elevação Lateral',
    'shoulders',
    ARRAY[]::muscle_group[],
    'isolation',
    ARRAY['dumbbells'],
    4,
    ARRAY[
        'Segure um halter em cada mão ao lado do corpo',
        'Eleve os braços lateralmente até a altura dos ombros',
        'Mantenha uma leve flexão nos cotovelos',
        'Desça controladamente'
    ],
    ARRAY[
        'Não balance o corpo',
        'Cotovelos levemente acima das mãos no topo',
        'Use peso moderado com boa técnica'
    ]
);

-- ============================================
-- LEGS EXERCISES
-- ============================================
INSERT INTO exercises (name, name_pt, primary_muscle, secondary_muscles, movement_type, equipment_required, difficulty_level, instructions, tips) VALUES
(
    'Barbell Squat',
    'Agachamento com Barra',
    'quadriceps',
    ARRAY['glutes', 'hamstrings', 'core']::muscle_group[],
    'compound',
    ARRAY['barbell', 'squat rack'],
    7,
    ARRAY[
        'Posicione a barra nos trapézios, não no pescoço',
        'Pés na largura dos ombros, pontas levemente para fora',
        'Desça controladamente até as coxas ficarem paralelas ao chão',
        'Empurre o chão para subir'
    ],
    ARRAY[
        'Joelhos na direção dos pés',
        'Mantenha o peito erguido',
        'Não deixe os joelhos cederem para dentro'
    ]
),
(
    'Romanian Deadlift',
    'Levantamento Terra Romeno',
    'hamstrings',
    ARRAY['glutes', 'back']::muscle_group[],
    'compound',
    ARRAY['barbell'],
    6,
    ARRAY[
        'Segure a barra na frente das coxas',
        'Empurre o quadril para trás mantendo as pernas quase estendidas',
        'Desça a barra deslizando pelas coxas',
        'Sinta o alongamento nos posteriores',
        'Retorne contraindo glúteos'
    ],
    ARRAY[
        'Mantenha a barra próxima ao corpo',
        'Joelhos levemente flexionados',
        'Foco no movimento do quadril'
    ]
),
(
    'Leg Press',
    'Leg Press',
    'quadriceps',
    ARRAY['glutes', 'hamstrings']::muscle_group[],
    'compound',
    ARRAY['leg press machine'],
    4,
    ARRAY[
        'Sente-se na máquina com as costas apoiadas',
        'Posicione os pés na plataforma na largura dos ombros',
        'Destrave a plataforma e desça controladamente',
        'Empurre até quase estender as pernas'
    ],
    ARRAY[
        'Não trave os joelhos na extensão',
        'Não deixe a lombar sair do apoio',
        'Pés mais altos = mais glúteos e posteriores'
    ]
);

-- ============================================
-- ARMS EXERCISES
-- ============================================
INSERT INTO exercises (name, name_pt, primary_muscle, secondary_muscles, movement_type, equipment_required, difficulty_level, instructions, tips) VALUES
(
    'Barbell Curl',
    'Rosca Direta',
    'biceps',
    ARRAY['forearms']::muscle_group[],
    'isolation',
    ARRAY['barbell'],
    3,
    ARRAY[
        'Segure a barra com pegada supinada',
        'Mantenha os cotovelos fixos ao lado do corpo',
        'Flexione os braços trazendo a barra até os ombros',
        'Desça controladamente'
    ],
    ARRAY[
        'Não balance o corpo',
        'Mantenha os cotovelos fixos',
        'Contração máxima no topo'
    ]
),
(
    'Tricep Dips',
    'Mergulho no Paralelo',
    'triceps',
    ARRAY['chest', 'shoulders']::muscle_group[],
    'compound',
    ARRAY['parallel bars'],
    6,
    ARRAY[
        'Segure as barras paralelas',
        'Desça o corpo flexionando os cotovelos',
        'Desça até os cotovelos formarem 90 graus',
        'Empurre para cima até estender os braços'
    ],
    ARRAY[
        'Tronco reto = mais tríceps',
        'Tronco inclinado = mais peito',
        'Não desça demais para proteger os ombros'
    ]
),
(
    'Skull Crushers',
    'Tríceps Testa',
    'triceps',
    ARRAY[]::muscle_group[],
    'isolation',
    ARRAY['barbell', 'ez bar', 'bench'],
    5,
    ARRAY[
        'Deite no banco segurando a barra',
        'Estenda os braços acima do peito',
        'Flexione os cotovelos descendo a barra em direção à testa',
        'Estenda os braços de volta'
    ],
    ARRAY[
        'Mantenha os cotovelos fixos',
        'Movimento controlado',
        'Pode usar EZ bar para maior conforto'
    ]
);

-- ============================================
-- CORE EXERCISES
-- ============================================
INSERT INTO exercises (name, name_pt, primary_muscle, secondary_muscles, movement_type, equipment_required, difficulty_level, instructions, tips) VALUES
(
    'Plank',
    'Prancha',
    'core',
    ARRAY['shoulders']::muscle_group[],
    'isolation',
    ARRAY[]::TEXT[],
    3,
    ARRAY[
        'Apoie os antebraços no chão',
        'Mantenha o corpo reto da cabeça aos pés',
        'Contraia o abdômen e glúteos',
        'Mantenha a posição pelo tempo determinado'
    ],
    ARRAY[
        'Não deixe o quadril subir ou descer',
        'Respire normalmente',
        'Olhe para o chão para manter o pescoço neutro'
    ]
),
(
    'Cable Crunch',
    'Abdominal no Cabo',
    'core',
    ARRAY[]::muscle_group[],
    'isolation',
    ARRAY['cable machine', 'rope attachment'],
    4,
    ARRAY[
        'Ajoelhe-se em frente à polia alta',
        'Segure a corda atrás da cabeça',
        'Flexione o tronco contraindo o abdômen',
        'Retorne controladamente'
    ],
    ARRAY[
        'Não puxe com os braços',
        'Foque na contração abdominal',
        'Mantenha os quadris fixos'
    ]
);

-- ============================================
-- UPDATE EXERCISES METADATA
-- ============================================
UPDATE exercises SET is_public = TRUE, is_active = TRUE WHERE created_by IS NULL;
