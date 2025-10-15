import 'dotenv/config';

export default {
  expo: {
    name: 'Essences',
    slug: 'essences',
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  },
};
