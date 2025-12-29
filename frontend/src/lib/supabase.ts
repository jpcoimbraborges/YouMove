import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão configuradas
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Logs de debug apenas no cliente
if (typeof window !== 'undefined' && !isConfigured) {
    console.warn(
        '[YouMove] Supabase não configurado. Verifique as variáveis de ambiente:\n' +
        '- NEXT_PUBLIC_SUPABASE_URL\n' +
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
}

// Tipo do cliente Supabase
type BrowserClient = ReturnType<typeof createBrowserClient>;

// Cria um stub vazio que implementa a interface básica do supabase
// Isso evita erros de runtime quando o supabase não está configurado
const createEmptyClient = (): BrowserClient => {
    const emptyResponse = { data: null, error: { message: 'Supabase not configured' } };
    const emptyQuery = () => ({
        select: () => emptyQuery(),
        insert: () => emptyQuery(),
        update: () => emptyQuery(),
        upsert: () => emptyQuery(),
        delete: () => emptyQuery(),
        eq: () => emptyQuery(),
        neq: () => emptyQuery(),
        single: () => Promise.resolve(emptyResponse),
        maybeSingle: () => Promise.resolve(emptyResponse),
        order: () => emptyQuery(),
        limit: () => emptyQuery(),
        range: () => emptyQuery(),
        then: (resolve: (value: typeof emptyResponse) => void) => Promise.resolve(emptyResponse).then(resolve),
    });

    return {
        from: () => emptyQuery(),
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
            signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
            signOut: async () => ({ error: null }),
            signInWithOAuth: async () => ({ data: { provider: '', url: '' }, error: { message: 'Supabase not configured' } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        storage: {
            from: () => ({
                upload: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
                download: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
            }),
        },
    } as unknown as BrowserClient;
};

// Cria o cliente real ou um stub vazio
export const supabase = isConfigured
    ? createBrowserClient(supabaseUrl!, supabaseAnonKey!)
    : createEmptyClient();

// Helper para verificar se o Supabase está disponível 
export const isSupabaseConfigured = () => isConfigured;

// Re-exporta o tipo do cliente
export type SupabaseClient = BrowserClient;
