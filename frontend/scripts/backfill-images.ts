/**
 * YOUMOVE - Backfill Images Script
 * 
 * Este script percorre a tabela de exercícios e preenche as imagens faltantes
 * utilizando o sistema de busca inteligente (Local -> Wger -> Unsplash).
 * 
 * Uso:
 * npm run backfill:images
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega variáveis de ambiente
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { getExerciseImageByName } from '../src/lib/wger';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backfillImages() {
    console.log('🚀 Iniciando preenchimento de imagens...');

    // 1. Buscar todos os exercícios (focando nos sem imagem ou com imagem placeholder)
    // Ajuste 'exercises' para a tabela correta se necessário (ex: wger_exercises)
    const { data: exercises, error } = await supabase
        .from('exercises')
        .select('id, name, thumbnail_url, name_pt');

    if (error) {
        console.error('❌ Erro ao buscar exercícios:', error);
        return;
    }

    console.log(`📊 Encontrados ${exercises.length} exercícios sem imagem.`);

    let updatedCount = 0;

    // 2. Processar cada exercício
    for (const exercise of exercises) {
        const searchTerm = exercise.name_pt || exercise.name;
        console.log(`\n🔍 Buscando imagem para: ID ${exercise.id} - "${searchTerm}"`);

        try {
            // Usa nossa função inteligente (Local -> Wger -> Unsplash)
            const imageUrl = await getExerciseImageByName(searchTerm);

            if (imageUrl) {
                console.log(`   ✅ Imagem encontrada: ${imageUrl.substring(0, 50)}...`);

                // 3. Atualizar no banco
                const { error: updateError } = await supabase
                    .from('exercises')
                    .update({ thumbnail_url: imageUrl })
                    .eq('id', exercise.id);

                if (updateError) {
                    console.error(`   ❌ Erro ao atualizar:`, updateError.message);
                } else {
                    console.log(`   💾 Salvo com sucesso!`);
                    updatedCount++;
                }
            } else {
                console.log(`   ⚠️ Nenhuma imagem encontrada.`);
            }

            // Pequeno delay para não estourar rate limits
            await new Promise(r => setTimeout(r, 500));

        } catch (err) {
            console.error(`   ❌ Erro no processamento:`, err);
        }
    }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`✨ Concluído! ${updatedCount} exercícios atualizados.`);
    console.log(`═══════════════════════════════════════`);
}

backfillImages();
