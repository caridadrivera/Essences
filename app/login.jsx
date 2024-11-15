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

const Login = () => {

  const router = useRouter();
  const emailRef = useRef("")
  const passwordRef = useRef("")
  const [loading, setLoading ] = useState(false)


  let iconImg= getUserImage('Essences.png?t=2024-09-14T02%3A13%3A17.961Z')



  const onSubmit = async () =>{
    if(!emailRef.current || !passwordRef.current){
      Alert.alert('Login', "All fields must be filled")
    }


    let email = emailRef.current.trim()
    let password = passwordRef.current.trim()

    setLoading(true)

    const {data, error} = await supabase.auth.signInWithPassword({
      email, 
      password
    })
    setLoading(false)

    if(error){
      Alert.alert('login', error.message)
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
    gap: 35, 
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