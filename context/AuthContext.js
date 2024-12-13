import { createContext, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signUp, signIn } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Handle user signup
  const signup = async (name, email, password) => {
    try {
      const data = await signUp(name, email, password);

      // Save token to AsyncStorage
      await AsyncStorage.setItem("authToken", data.token);

      // Update
      setUser(data.user);
    } catch (error) {
      console.error("Signup error:", error);
      throw error; // Re-throw for the calling component to handle
    }
  };

  // Handle user login
  const login = async (email, password) => {
    try {
      const data = await signIn(email, password);
  
      console.log("Login API Response:", data);
  
      // Extract the access token and user from the response
      const accessToken = data.session?.session?.access_token;
      const user = data.session?.user;
  
      if (!accessToken || !user) {
        throw new Error("Invalid login response structure");
      }
  
      // Save token to AsyncStorage
      await AsyncStorage.setItem("authToken", accessToken);
  
      // Update user state
      setUser(user);
    } catch (error) {
      console.error("Login error:", error.message);
      throw error; // Re-throw for the calling component to handle
    }
  };
  

  // Handle logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Restore user on app load
  const restoreUser = async () => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      try {
        // Optionally validate the token or fetch the user data here
        const response = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data.user);
      } catch (error) {
        console.error("Failed to restore user:", error);
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, restoreUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);




// import { createContext, useState, useContext } from "react";


// const AuthContext = createContext()

// export const AuthProvider = ({children}) =>{
//     const [user, setUser] = useState(null)

//     const setAuth = authUser =>{
//         setUser(authUser)
//     }

//     const setUserData = userData =>{
//         setUser({...userData})
//     }

//     return (
//         <AuthContext.Provider value={{user, setAuth, setUserData}}>
//             {children}
//         </AuthContext.Provider>
//     )
// }

// export const useAuth = () => useContext(AuthContext)