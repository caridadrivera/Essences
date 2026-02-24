const { createClient } = require('@supabase/supabase-js');
// load .env if present
try{
  require('dotenv').config({ path: process.cwd() + '/.env' })
}catch(e){ }

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in the environment or add them to a .env file at project root');
  process.exit(1);
}

const supabase = createClient(url, key);

const [,, postId, senderId, receiverId] = process.argv;

if (!postId || !senderId || !receiverId) {
  console.error('Usage: node scripts/insert_test_like.js <postId> <senderId> <receiverId>');
  process.exit(1);
}

async function run(){
  try{
    console.log('Skipping postLikes insert (RLS may block anon inserts).');

    console.log('Inserting notification...');
    const notif = {
      receiverId: receiverId,
      senderId: senderId,
      title: 'Someone liked your post',
      data: JSON.stringify({ postId: postId.toString() }),
      created_at: new Date().toISOString()
    };

    const { data: ndata, error: nerror } = await supabase
      .from('notifications')
      .insert(notif)
      .select()
      .single();

    if (nerror) console.error('notifications insert error', nerror);
    else console.log('notification inserted:', ndata);

  }catch(err){
    console.error(err);
  }
}

run();
