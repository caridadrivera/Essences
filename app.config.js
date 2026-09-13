import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const appJson = require('./app.json');

const getEnv = (key) => {
  const val = process.env[key] || process.env[`EXPO_PUBLIC_${key}`];
  if (!val) return undefined;
  return String(val).replace(/^['"]|['"]$/g, '').trim();
};

export default {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    SUPABASE_URL: getEnv('SUPABASE_URL'),
    SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY'),
    OPENAI_API_KEY: getEnv('OPENAI_API_KEY'),
    ANTHROPIC_API_KEY: getEnv('ANTHROPIC_API_KEY'),
  },
};

