/**
 * YOUMOVE - Wger to Supabase Sync Script
 * 
 * Sincroniza exercícios da API Wger para o banco Supabase
 * 
 * Uso:
 * - npm run sync:wger (produção)
 * - npm run sync:wger:dev (desenvolvimento)
 * - node scripts/sync-wger.js --dry-run (teste sem salvar)
 */

// Carrega variáveis de ambiente do .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getWgerExercises } from '../src/services/wger';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    console.error('Necessário: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// TIPOS
// ============================================================================

interface WgerExerciseRow {
    id: number;
    name: string;
    name_pt: string | null;
    description: string;
    image_url: string | null;
    category: number | null;
    muscles: number[] | null;
    equipment: number[] | null;
    last_synced: string;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Detecta se o nome está em português
 */
function isPortuguese(text: string): boolean {
    const ptIndicators = [
        'ção', 'ões', 'ã', 'õ', 'á', 'é', 'í', 'ó', 'ú',
        'com', 'para', 'de', 'em', 'no', 'na',
    ];

    const lowerText = text.toLowerCase();
    return ptIndicators.some(indicator => lowerText.includes(indicator));
}

/**
 * Traduz categoria de número para enum
 */
function mapCategoryToMuscleGroup(categoryId: number | undefined): string {
    const categoryMap: Record<number, string> = {
        8: 'arms',      // Arms
        10: 'legs',     // Legs
        11: 'core',     // Abs
        12: 'back',     // Back
        13: 'shoulders', // Shoulders
        14: 'chest',    // Chest
        15: 'calves',   // Calves
    };

    return categoryMap[categoryId || 0] || 'other';
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function syncWgerToSupabase(dryRun = false) {
    console.log('\n🚀 Iniciando sincronização Wger → Supabase\n');
    console.log(`Modo: ${dryRun ? '🧪 DRY RUN (não salvará)' : '💾 PRODUÇÃO'}\n`);

    const startTime = Date.now();

    try {
        // 1. Buscar exercícios da Wger
        console.log('📡 Buscando exercícios da Wger...');
        const wgerExercises = await getWgerExercises();
        console.log(`✅ ${wgerExercises.length} exercícios obtidos\n`);

        if (wgerExercises.length === 0) {
            console.error('❌ Nenhum exercício retornado da Wger!');
            return;
        }

        // 2. Buscar exercícios existentes no Supabase
        console.log('📊 Verificando exercícios existentes no Supabase...');
        const { data: existingExercises, error: fetchError } = await supabase
            .from('wger_exercises')
            .select('id');

        if (fetchError) {
            console.error('❌ Erro ao buscar exercícios existentes:', fetchError);
            return;
        }

        const existingIds = new Set(existingExercises?.map(ex => ex.id) || []);
        console.log(`✅ ${existingIds.size} exercícios já existem\n`);

        // 3. Preparar dados para inserção/atualização
        console.log('🔄 Preparando dados...');

        const toInsert: WgerExerciseRow[] = [];
        const toUpdate: WgerExerciseRow[] = [];

        for (const exercise of wgerExercises) {
            const row: WgerExerciseRow = {
                id: exercise.id,
                name: exercise.name,
                name_pt: isPortuguese(exercise.name) ? exercise.name : null,
                description: exercise.description,
                image_url: exercise.imageUrl,
                category: exercise.category || null,
                muscles: exercise.muscles || null,
                equipment: exercise.equipment || null,
                last_synced: new Date().toISOString(),
            };

            if (existingIds.has(exercise.id)) {
                toUpdate.push(row);
            } else {
                toInsert.push(row);
            }
        }

        console.log(`📝 Novos: ${toInsert.length}`);
        console.log(`🔄 Atualizar: ${toUpdate.length}\n`);

        if (dryRun) {
            console.log('🧪 DRY RUN - Mostrando preview dos primeiros 5:\n');
            console.log('Novos:');
            console.table(toInsert.slice(0, 5).map(ex => ({
                id: ex.id,
                name: ex.name,
                name_pt: ex.name_pt,
                has_image: ex.image_url ? '✅' : '❌',
            })));

            console.log('\nAtualizar:');
            console.table(toUpdate.slice(0, 5).map(ex => ({
                id: ex.id,
                name: ex.name,
                name_pt: ex.name_pt,
                has_image: ex.image_url ? '✅' : '❌',
            })));

            console.log('\n✅ DRY RUN concluído. Nenhuma alteração foi feita.\n');
            return;
        }

        // 4. Inserir novos exercícios
        if (toInsert.length > 0) {
            console.log(`📥 Inserindo ${toInsert.length} novos exercícios...`);

            const { error: insertError } = await supabase
                .from('wger_exercises')
                .insert(toInsert);

            if (insertError) {
                console.error('❌ Erro ao inserir:', insertError);
            } else {
                console.log(`✅ ${toInsert.length} exercícios inseridos\n`);
            }
        }

        // 5. Atualizar exercícios existentes
        if (toUpdate.length > 0) {
            console.log(`🔄 Atualizando ${toUpdate.length} exercícios...`);

            // Atualiza em lotes de 100
            const batchSize = 100;
            for (let i = 0; i < toUpdate.length; i += batchSize) {
                const batch = toUpdate.slice(i, i + batchSize);

                const { error: updateError } = await supabase
                    .from('wger_exercises')
                    .upsert(batch);

                if (updateError) {
                    console.error(`❌ Erro ao atualizar lote ${i / batchSize + 1}:`, updateError);
                } else {
                    console.log(`✅ Lote ${i / batchSize + 1} atualizado (${batch.length} exercícios)`);
                }
            }

            console.log('');
        }

        // 6. Estatísticas finais
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('═══════════════════════════════════════');
        console.log('✨ Sincronização concluída!');
        console.log('═══════════════════════════════════════');
        console.log(`📊 Total processado: ${wgerExercises.length}`);
        console.log(`📥 Novos inseridos: ${toInsert.length}`);
        console.log(`🔄 Atualizados: ${toUpdate.length}`);
        console.log(`⏱️  Tempo: ${elapsed}s`);
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    }
}

// ============================================================================
// EXECUTAR
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

syncWgerToSupabase(dryRun)
    .then(() => {
        console.log('✅ Script finalizado com sucesso');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script falhou:', error);
        process.exit(1);
    });
