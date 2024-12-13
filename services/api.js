import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Adjust for your backend URL (server)

export const getUsers = async () => {
  const response = await axios.get(`${API_URL}/users`);
  return response.data;
};


export const signUp = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  export const signIn = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      return response.data;
    } catch (error) {
      console.error('Error during login:', error.response?.data || error.message);
      throw error;
    }
  };


  export const getTopics = async () => {
    try {
      const response = await axios.get(`${API_URL}/topics`);

      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error.response?.data || error.message);
      throw error;
    }
  };
  

  export const getPosts = async (topic, user) => {
    try {
 
      const queryParams = new URLSearchParams({
        topicId: topic.id,
        excludeUserId: user.id, 
      });
  
   
      const response = await axios.get(`${API_URL}/posts?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching posts for topic ${topic.id}:`, error.response?.data || error.message);
      throw error;  }
  };
  
  
  
