import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

const clean = (val) => (val ? String(val).replace(/^['"]|['"]$/g, '').trim() : undefined);

export const supabaseUrl =
  clean(process.env.EXPO_PUBLIC_SUPABASE_URL) ||
  clean(extra.SUPABASE_URL) ||
  clean(process.env.SUPABASE_URL) ||
  'https://fxogjvujmqcpjdhyiawl.supabase.co';

export const supabaseAnonKey =
  clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  clean(extra.SUPABASE_ANON_KEY) ||
  clean(process.env.SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4b2dqdnVqbXFjcGpkaHlpYXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4MTM1OTEsImV4cCI6MjAzODM4OTU5MX0.oiKZvF2vb9e1uWn2s0aJi942OMG4BmG5CCosObEygJM';

