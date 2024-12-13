require('dotenv').config(); // Load environment variables


const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('supabaseUrl or supabaseKey is not set in the environment variables.');
}

 const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
  res.send('Server is running!');
});


app.post('/signup', async (req, res) => {
  const { email, password, name } = req.body; // Expect email, password, and name from the client

  try {
    // Create the user
    const { data: user, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Custom user metadata
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Success
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body; 

  try {
    const { data: session, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/topics', async (req, res) => {
  try {
    const { data, error } = await supabase.from('topics').select('id, title');

    if (error) {
      console.error('Error fetching topics:', error);
      return res.status(500).json({ error: 'Failed to fetch topics' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/posts', async (req, res) => {
  const { topicId, excludeUserId } = req.query;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          name,
          profile_image,
          background_image,
          id,
          bio
        ),
        postLikes(*)
      `)
      .eq('topicId', topicId)
      .not('userId', 'eq', excludeUserId);

    if (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});








app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
