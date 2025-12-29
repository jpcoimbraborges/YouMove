import { z } from 'zod';

// --- Hybrid Assets: Local 3D Images ---
// Includes both Portuguese and English terms for maximum compatibility
const LOCAL_ASSETS: Record<string, string> = {
    // --- Peito / Chest ---
    'Supino': '/exercises/bench-press.png',
    'Bench Press': '/exercises/bench-press.png',
    'Barbell Bench Press': '/exercises/bench-press.png',
    'Incline': '/exercises/incline-bench.png',
    'Inclinado': '/exercises/incline-bench.png',
    'Declinado': '/exercises/bench-press.png',
    'Decline': '/exercises/bench-press.png',
    'Flexão': '/exercises/push-up.png',
    'Push-up': '/exercises/push-up.png',
    'Push up': '/exercises/push-up.png',
    'Pushup': '/exercises/push-up.png',
    'Voador': '/exercises/chest-fly.png',
    'Fly': '/exercises/chest-fly.png',
    'Flyes': '/exercises/chest-fly.png',
    'Crucifixo': '/exercises/chest-fly.png',
    'Paralelas': '/exercises/dips.png',
    'Dips': '/exercises/dips.png',
    'Mergulho': '/exercises/dips.png',

    // --- Costas / Back ---
    'Barra Fixa': '/exercises/pull-up.png',
    'Pull-up': '/exercises/pull-up.png',
    'Pull up': '/exercises/pull-up.png',
    'Pullup': '/exercises/pull-up.png',
    'Chin-up': '/exercises/pull-up.png',
    'Puxada': '/exercises/lat-pulldown.png',
    'Pulldown': '/exercises/lat-pulldown.png',
    'Lat Pulldown': '/exercises/lat-pulldown.png',
    'Remada Curvada': '/exercises/bent-over-row.png',
    'Bent Over Row': '/exercises/bent-over-row.png',
    'Bent-Over': '/exercises/bent-over-row.png',
    'Barbell Row': '/exercises/bent-over-row.png',
    'Remada Baixa': '/exercises/seated-row.png',
    'Remada Sentada': '/exercises/seated-row.png',
    'Seated Row': '/exercises/seated-row.png',
    'Cable Row': '/exercises/seated-row.png',
    'Serrote': '/exercises/dumbbell-row.png',
    'Remada Unilateral': '/exercises/dumbbell-row.png',
    'Dumbbell Row': '/exercises/dumbbell-row.png',
    'One-Arm Row': '/exercises/dumbbell-row.png',

    // --- Pernas (Coxa/Glúteo) / Legs (Quads/Glutes) ---
    'Agachamento': '/exercises/squat.png',
    'Squat': '/exercises/squat.png',
    'Back Squat': '/exercises/squat.png',
    'Leg Press': '/exercises/leg-press.png',
    'Passada': '/exercises/lunges.png',
    'Afundo': '/exercises/lunges.png',
    'Lunge': '/exercises/lunges.png',
    'Lunges': '/exercises/lunges.png',
    'Extensora': '/exercises/leg-extension.png',
    'Leg Extension': '/exercises/leg-extension.png',
    'Búlgaro': '/exercises/bulgarian-squat.png',
    'Bulgarian': '/exercises/bulgarian-squat.png',
    'Split Squat': '/exercises/bulgarian-squat.png',

    // --- Pernas (Posterior) / Legs (Hamstrings) ---
    'Levantamento Terra': '/exercises/deadlift.png',
    'Deadlift': '/exercises/deadlift.png',
    'Stiff': '/exercises/stiff-deadlift.png',
    'Romanian Deadlift': '/exercises/stiff-deadlift.png',
    'RDL': '/exercises/stiff-deadlift.png',
    'Flexora': '/exercises/leg-curl.png',
    'Leg Curl': '/exercises/leg-curl.png',
    'Hamstring Curl': '/exercises/leg-curl.png',

    // --- Ombros / Shoulders ---
    'Desenvolvimento': '/exercises/shoulder-press.png',
    'Shoulder Press': '/exercises/shoulder-press.png',
    'Military Press': '/exercises/shoulder-press.png',
    'Overhead Press': '/exercises/shoulder-press.png',
    'Elevação Lateral': '/exercises/lateral-raise.png',
    'Lateral Raise': '/exercises/lateral-raise.png',
    'Side Raise': '/exercises/lateral-raise.png',
    'Elevação Frontal': '/exercises/front-raise.png',
    'Front Raise': '/exercises/front-raise.png',
    'Crucifixo Inverso': '/exercises/reverse-fly.png',
    'Reverse Fly': '/exercises/reverse-fly.png',
    'Reverse Flyes': '/exercises/reverse-fly.png',
    'Rear Delt': '/exercises/reverse-fly.png',

    // --- Braços / Arms ---
    'Rosca Direta': '/exercises/bicep-curl.png',
    'Rosca': '/exercises/bicep-curl.png',
    'Bicep Curl': '/exercises/bicep-curl.png',
    'Barbell Curl': '/exercises/bicep-curl.png',
    'Curl': '/exercises/bicep-curl.png',
    'Rosca Martelo': '/exercises/hammer-curl.png',
    'Martelo': '/exercises/hammer-curl.png',
    'Hammer Curl': '/exercises/hammer-curl.png',
    'Tríceps Corda': '/exercises/tricep-pushdown.png',
    'Tríceps Pulley': '/exercises/tricep-pushdown.png',
    'Tricep Pushdown': '/exercises/tricep-pushdown.png',
    'Triceps Pushdown': '/exercises/tricep-pushdown.png',
    'Pushdown': '/exercises/tricep-pushdown.png',
    'Tríceps Testa': '/exercises/skullcrushers.png',
    'Skullcrusher': '/exercises/skullcrushers.png',
    'Skull Crusher': '/exercises/skullcrushers.png',
    'Lying Triceps': '/exercises/skullcrushers.png',

    // --- Abs / Core ---
    'Prancha': '/exercises/plank.png',
    'Plank': '/exercises/plank.png',
    'Abdominal Supra': '/exercises/crunch.png',
    'Abdominal': '/exercises/crunch.png',
    'Crunch': '/exercises/crunch.png',
    'Crunches': '/exercises/crunch.png',
    'Elevação de Pernas': '/exercises/leg-raise.png',
    'Leg Raise': '/exercises/leg-raise.png',
    'Infra': '/exercises/leg-raise.png',
    'Remador': '/exercises/v-up.png',
    'V-Up': '/exercises/v-up.png',
    'V Up': '/exercises/v-up.png',

    // === NOVOS: CARDIO/AERÓBICO (Português + Inglês) ===

    // --- Máquinas Indoor ---
    'Esteira': '/exercises/treadmill.png',
    'Treadmill': '/exercises/treadmill.png',
    'Running': '/exercises/treadmill.png',
    'Corrida': '/exercises/treadmill.png',

    'Bicicleta': '/exercises/stationary-bike.png',
    'Bike': '/exercises/stationary-bike.png',
    'Cycling': '/exercises/stationary-bike.png',
    'Ergométrica': '/exercises/stationary-bike.png',
    'Spinning': '/exercises/stationary-bike.png',

    'Elíptico': '/exercises/elliptical.png',
    'Elliptical': '/exercises/elliptical.png',
    'Transport': '/exercises/elliptical.png',

    'Simulador de Escada': '/exercises/stair-climber.png',
    'Stair': '/exercises/stair-climber.png',
    'Escada': '/exercises/stair-climber.png',
    'Climber': '/exercises/stair-climber.png',

    'Remo': '/exercises/rowing-machine.png',
    'Rowing': '/exercises/rowing-machine.png',
    'Rower': '/exercises/rowing-machine.png',

    // --- Cardio Peso do Corpo ---
    'Pular Corda': '/exercises/jump-rope.png',
    'Jump Rope': '/exercises/jump-rope.png',
    'Rope': '/exercises/jump-rope.png',

    'Polichinelo': '/exercises/jumping-jacks.png',
    'Jumping Jack': '/exercises/jumping-jacks.png',

    'Burpee': '/exercises/burpees.png',
    // Burpee is same in English

    'Mountain Climber': '/exercises/mountain-climbers.png',
    'Escalador': '/exercises/mountain-climbers.png',

    'Corrida Estacionária': '/exercises/high-knees.png',
    'High Knees': '/exercises/high-knees.png',
    'Joelho Alto': '/exercises/high-knees.png',

    // --- Outdoor ---
    'Corrida de Rua': '/exercises/outdoor-run.png',
    'Running Outdoor': '/exercises/outdoor-run.png',
    'Corrida ao Ar Livre': '/exercises/outdoor-run.png',

    'Caminhada': '/exercises/walking.png',
    'Walking': '/exercises/walking.png',

    'Natação': '/exercises/swimming.png',
    'Swimming': '/exercises/swimming.png',
    'Nado': '/exercises/swimming.png',

    'Ciclismo': '/exercises/outdoor-cycling.png',
    'Bicicleta de Estrada': '/exercises/outdoor-cycling.png',

    // === NOVOS COMPLEMENTARES (10 novas imagens 3D) ===

    // --- Glúteos & Panturrilha ---
    'Elevação Pélvica': '/exercises/hip-thrust.png',
    'Hip Thrust': '/exercises/hip-thrust.png',
    'Ponte': '/exercises/hip-thrust.png',
    'Coice': '/exercises/glute-kickback.png',
    'Glute Kickback': '/exercises/glute-kickback.png',
    'Glúteo Cabo': '/exercises/glute-kickback.png',
    'Panturrilha': '/exercises/calf-raise.png',
    'Gêmeos': '/exercises/calf-raise.png',
    'Elevação de Panturrilha': '/exercises/calf-raise.png',
    'Calf Raise': '/exercises/calf-raise.png',

    // --- Core Avançado ---
    'Abdominal Bicicleta': '/exercises/bicycle-crunch.png',
    'Bicicleta no Chão': '/exercises/bicycle-crunch.png',
    'Bicycle Crunch': '/exercises/bicycle-crunch.png',
    'Prancha Lateral': '/exercises/side-plank.png',
    'Side Plank': '/exercises/side-plank.png',
    'Russian Twist': '/exercises/russian-twist.png',
    'Rotação de Tronco': '/exercises/russian-twist.png',
    'Torção Russa': '/exercises/russian-twist.png',

    // --- Postura & Lombar ---
    'Face Pull': '/exercises/face-pull.png',
    'Puxada na Face': '/exercises/face-pull.png',
    'Encolhimento': '/exercises/shrugs.png',
    'Trapézio': '/exercises/shrugs.png',
    'Shrugs': '/exercises/shrugs.png',
    'Super-Homem': '/exercises/superman.png',
    'Superman': '/exercises/superman.png',
    'Extensão Lombar': '/exercises/superman.png',
    'Hiperextensão': '/exercises/superman.png',
    'Lombar': '/exercises/superman.png',

    // --- Funcional ---
    'Kettlebell Swing': '/exercises/kettlebell-swing.png',
    'Swing': '/exercises/kettlebell-swing.png',
    'KB Swing': '/exercises/kettlebell-swing.png',

    // === NOVOS EXERCÍCIOS FINAIS (Máquinas e Isoladores) ===

    // --- Pernas (Máquinas) ---
    'Abdutora': '/exercises/abductor-machine.png',
    'Cadeira Abdutora': '/exercises/abductor-machine.png',
    'Adutora': '/exercises/adductor-machine.png',
    'Cadeira Adutora': '/exercises/adductor-machine.png',
    'Hack': '/exercises/hack-squat.png',
    'Agachamento Hack': '/exercises/hack-squat.png',

    // --- Tronco & Costas ---
    'Pullover': '/exercises/pullover.png',
    'Remada Cavalinho': '/exercises/t-bar-row.png',
    'Barra T': '/exercises/t-bar-row.png',

    // --- Braços & Ombros ---
    'Rosca Concentrada': '/exercises/concentration-curl.png',
    'Concentrada': '/exercises/concentration-curl.png',
    'Tríceps Francês': '/exercises/overhead-tricep.png',
    'Francês': '/exercises/overhead-tricep.png',
    'Desenvolvimento Arnold': '/exercises/arnold-press.png',
    'Arnold': '/exercises/arnold-press.png',

    // --- Core Avançado ---
    'Infra na Barra': '/exercises/hanging-leg-raise.png',
    'Elevação de Pernas na Barra': '/exercises/hanging-leg-raise.png',
};

// --- 1. Schemas Zod Relaxados (Para aceitar dados "sujos") ---
const WgerTranslationSchema = z.object({
    name: z.string().nullish(),
    description: z.string().nullish(),
    language: z.number(),
});

const WgerImageInfoSchema = z.object({
    id: z.number(),
    image: z.string().url(),
    is_main: z.boolean(),
});

const WgerExerciseInfoSchema = z.object({
    id: z.number(),
    translations: z.array(WgerTranslationSchema).optional(),
    images: z.array(WgerImageInfoSchema).optional(),
    category: z.object({ id: z.number() }).optional(),
    muscles: z.array(z.object({ id: z.number() })).optional(),
    equipment: z.array(z.object({ id: z.number() })).optional(),
});

const WgerApiResponseSchema = z.object({
    count: z.number(),
    results: z.array(WgerExerciseInfoSchema)
});

// --- Tipo Final para o Frontend (Rígido e Limpo) ---
export type ExerciseWithImage = {
    id: number;
    name: string; // Aqui garantimos que SEMPRE terá string
    description: string;
    imageUrl: string | null;
    category?: number; // Adicionado de volta para filtros
    muscles?: number[];
    equipment?: number[];
};

// --- Helper: Busca imagem local baseada no nome do exercício ---
function findLocalAsset(exerciseName: string): string | null {
    const normalizedName = exerciseName.toLowerCase().trim();

    // Try exact match first
    for (const [key, path] of Object.entries(LOCAL_ASSETS)) {
        if (normalizedName === key.toLowerCase()) {
            console.log(`✅ Exact match found: "${exerciseName}" → ${path}`);
            return path;
        }
    }

    // Try partial match - check if exercise name contains the key
    for (const [key, path] of Object.entries(LOCAL_ASSETS)) {
        const normalizedKey = key.toLowerCase();
        if (normalizedName.includes(normalizedKey)) {
            console.log(`✅ Partial match found: "${exerciseName}" contains "${key}" → ${path}`);
            return path;
        }
    }

    // Try reverse partial match - check if key contains the exercise name
    for (const [key, path] of Object.entries(LOCAL_ASSETS)) {
        const normalizedKey = key.toLowerCase();
        if (normalizedKey.includes(normalizedName)) {
            console.log(`✅ Reverse match found: "${key}" contains "${exerciseName}" → ${path}`);
            return path;
        }
    }

    // Try word-by-word matching for compound names
    const exerciseWords = normalizedName.split(/\s+/);
    for (const [key, path] of Object.entries(LOCAL_ASSETS)) {
        const keyWords = key.toLowerCase().split(/\s+/);
        const matchingWords = exerciseWords.filter(word =>
            keyWords.some(keyWord => keyWord.includes(word) || word.includes(keyWord))
        );

        // If at least half of the words match, consider it a match
        if (matchingWords.length >= Math.min(exerciseWords.length, keyWords.length) / 2) {
            console.log(`✅ Word match found: "${exerciseName}" ≈ "${key}" → ${path}`);
            return path;
        }
    }

    console.log(`❌ No local asset found for: "${exerciseName}"`);
    return null;
}

// --- Função Principal ---
export async function getWgerExercises(): Promise<ExerciseWithImage[]> {
    console.log("Fetching exercises from Wger API...");
    try {
        const response = await fetch(
            'https://wger.de/api/v2/exerciseinfo/?language=2&limit=200',
            { next: { revalidate: 86400, tags: ['exercises'] } }
        );

        if (!response.ok) {
            throw new Error(`Falha na API. Status: ${response.status}`);
        }

        const rawData = await response.json();

        // Validação Segura
        const parsed = WgerApiResponseSchema.safeParse(rawData);

        if (!parsed.success) {
            console.error("Erro de validação Zod:", parsed.error);
            return [];
        }

        const exercises = parsed.data.results;

        // --- Filtragem e Limpeza ---
        const combinedData: ExerciseWithImage[] = exercises
            .map((ex) => {
                // Extrai nome e descrição da primeira tradução (language=2 = Inglês)
                const translation = ex.translations?.find(t => t.language === 2) || ex.translations?.[0];

                // Extrai imagem principal ou primeira disponível da API
                const apiImage = ex.images?.find(img => img.is_main)?.image ||
                    ex.images?.[0]?.image ||
                    null;

                // --- HYBRID ASSETS STRATEGY ---
                // 1. Tenta encontrar imagem local primeiro
                const localImage = translation?.name ? findLocalAsset(translation.name) : null;

                // 2. Se não encontrar local, usa a da API
                // 3. Se não houver nenhuma, fica null
                const finalImage = localImage || apiImage;

                return {
                    id: ex.id,
                    name: translation?.name || null,
                    description: translation?.description || null,
                    imageUrl: finalImage,
                    category: ex.category?.id,
                    muscles: ex.muscles?.map(m => m.id),
                    equipment: ex.equipment?.map(e => e.id),
                };
            })
            .filter((ex) => {
                // REGRA DE OURO: Se não tem nome, não serve para o app.
                return ex.name && ex.name.trim().length > 0;
            })
            .map((ex) => ({
                id: ex.id,
                name: ex.name!,
                description: ex.description || "Sem descrição detalhada disponível.",
                imageUrl: ex.imageUrl,
                category: ex.category,
                muscles: ex.muscles,
                equipment: ex.equipment
            }));

        console.log(`✅ ${combinedData.length} exercícios válidos encontrados`);
        return combinedData;

    } catch (error) {
        console.error("Erro crítico ao buscar dados da Wger:", error);
        return [];
    }
}

// --- Função para buscar exercício por ID ---
export async function getWgerExerciseById(id: number): Promise<ExerciseWithImage | null> {
    console.log(`Fetching exercise ${id} from Wger API...`);
    try {
        const response = await fetch(
            `https://wger.de/api/v2/exerciseinfo/${id}/`,
            { next: { revalidate: 86400, tags: [`exercise-${id}`] } }
        );

        if (!response.ok) {
            console.warn(`Exercise ${id} not found`);
            return null;
        }

        const rawData = await response.json();
        const parsed = WgerExerciseInfoSchema.safeParse(rawData);

        if (!parsed.success) {
            console.error("Erro de validação Zod:", parsed.error);
            return null;
        }

        const ex = parsed.data;

        // Extrai nome e descrição da primeira tradução (language=2 = Inglês)
        const translation = ex.translations?.find(t => t.language === 2) || ex.translations?.[0];

        // Filtra se não tem nome
        if (!translation?.name || translation.name.trim().length === 0) {
            console.warn(`Exercise ${id} has no name`);
            return null;
        }

        // Extrai imagem principal ou primeira disponível da API
        const apiImage = ex.images?.find(img => img.is_main)?.image ||
            ex.images?.[0]?.image ||
            null;

        // --- HYBRID ASSETS STRATEGY ---
        // 1. Tenta encontrar imagem local primeiro
        const localImage = findLocalAsset(translation.name);

        // 2. Se não encontrar local, usa a da API
        // 3. Se não houver nenhuma, fica null
        const finalImage = localImage || apiImage;

        return {
            id: ex.id,
            name: translation.name,
            description: translation.description || "Sem descrição detalhada disponível.",
            imageUrl: finalImage,
            category: ex.category?.id,
            muscles: ex.muscles?.map(m => m.id),
            equipment: ex.equipment?.map(e => e.id),
        };

    } catch (error) {
        console.error(`Erro ao buscar exercício ${id}:`, error);
        return null;
    }
}

// --- Função para revalidar cache ---

