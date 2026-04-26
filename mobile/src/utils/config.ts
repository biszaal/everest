import Constants from 'expo-constants';

const fromEnv = (key: string) => process.env[key];

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const pick = (envKey: string, extraKey: string): string => {
  const v = fromEnv(envKey) ?? extra[extraKey];
  if (!v || v.startsWith('$')) return '';
  return v;
};

export const config = {
  // Supabase values are only required when switching services/* to ./remote.
  // In the default local-only mode they can be left blank.
  supabaseUrl: pick('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl'),
  supabaseAnonKey: pick('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey'),
};
