import 'dotenv/config';

export default {
  expo: {
    name: 'Essences',
    slug: 'essences',

    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: "2ca4800d-8fd2-46e9-adb1-9b8052b3db68",
      },
    },
  },
};

