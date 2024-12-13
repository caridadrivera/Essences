import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { wp, hp } from '../helpers/common'
import Input from '../components/Input'
import ButtonComponent from '../components/Button'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { getUserImage } from '../services/userProfileImage'
import { Image } from 'expo-image'
import { useAuth } from '../context/AuthContext'

const Login = () => {

  const router = useRouter();
  const emailRef = useRef("")
  const passwordRef = useRef("")
  const [loading, setLoading ] = useState(false)
  const [error, setError] = useState(null);

  let iconImg = getUserImage('Essences.png?t=2024-09-14T02%3A13%3A17.961Z')

  const {login} = useAuth()

  const onSubmit = async () =>{
    if(!emailRef.current || !passwordRef.current){
      Alert.alert('Login', "All fields must be filled")
    }


    let email = emailRef.current.trim()
    let password = passwordRef.current.trim()
      setLoading(true)
    try {
      const response = await login(email, password);
      setLoading(false);

      router.push('home');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'An error occurred during login.');
    }
  }
  return (
    <ScreenWrapper bg="white"> 
       <View style={styles.container}>
        <BackButton router={router}/>
        <View>
             <Image source={iconImg} style={{ height: 180, width: "100%"}} />
        </View>
        <View>
          <Text style={styles.welcomeText}>Hey,</Text>
          <Text style={styles.welcomeText}>Good to see you back!</Text>
        </View>
        {/* form */}

        <View style={styles.form}>
          <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
            Please login to continue...
          </Text>
          <Input 
            icon={<Icon name="mailIcon" size={26} strokeWidth={1.6}/>} 
            placeholder="Enter your email"
            onChangeText={value=> emailRef.current = value}
            />
            <Input 
            icon={<Icon name="lockIcon" size={26} strokeWidth={1.6}/>} 
            placeholder="Enter your password"
            secureTextEntry
            onChangeText={value=>passwordRef.current = value}
            />
        </View>

        <Pressable style={styles.forgotPassword} onPress={()=> router.push('ForgotPassword')}>
          <Text>
             Forgot Password     
          </Text>
        </Pressable>

        <ButtonComponent title={'Login'} loading={loading} onPress={onSubmit}/>

        {/* footer */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            No account yet? Let's change that!
          </Text>
          <Pressable onPress={()=> router.push('welcome')}>
            <Text style={[styles.footerText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]}> Sign Up</Text>
          </Pressable>
        </View>
      </View>

    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    gap: 20, 
    paddingHorizontal: wp(5)
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text
  },
  form: {
    gap: 20, 
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.text, 
    fontSize: hp(1.6)
  }
})