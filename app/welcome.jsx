import { View, StyleSheet, Text , Pressable} from 'react-native'
import React , {useState, useRef} from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import {hp,wp} from '../helpers/common'
import { theme } from '../constants/theme'
import MainHexagon from '../assets/icons/Main'
import ButtonComponent from '../components/Button'
import { router } from 'expo-router'
import Input from '../components/Input'
import Icon from '../assets/icons'
import { useRouter } from 'expo-router'
import {supabase} from  '../lib/supabase'
import { Alert } from 'react-native'
import { getUserImage } from '../services/userProfileImage'
import { Image } from 'expo-image'

const Welcome = () => {

  const router = useRouter();
  const nameRef = useRef("")
  const emailRef = useRef("")
  const passwordRef = useRef("")
  const [loading, setLoading ] = useState(false)  




  const onSubmit = async () =>{
    if(!emailRef.current || !passwordRef.current || !nameRef.current){
      Alert.alert('Sign Up', "All fields must be filled")
      return
    }

    let name = nameRef.current.trim()
    let email = emailRef.current.trim()
    let password = passwordRef.current.trim()

    setLoading(true)

    const {data: {session}, error} = await supabase.auth.signUp({
      email, 
      password,
      options: {
        data: {
          name
        }
      }
    })
    setLoading(false)

    if(error){
      Alert.alert('singup', error.message)
    }
  }



  let iconImg= getUserImage('Essences.png?t=2024-09-14T02%3A13%3A17.961Z')


  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark"/>
      <View style={styles.container}>


     <View style={{gap: 8}}>
      <Image source={iconImg} style={{ height: 208, width: "100%"}} />
      <Text style={styles.punchline}> Your place to share stories... </Text>
     </View>


     <View style={styles.form}>
          <Input 
            icon={<Icon name="userIcon" size={26} strokeWidth={1.6}/>} 
            placeholder="Enter your name"
            onChangeText={value=> nameRef.current = value}
            />
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



     <ButtonComponent 
       onPress={onSubmit} 
       loading={loading}
       title="Get Started"
       buttonStyle={{marginHorizontal: wp(3)}}
      />


  <View style={styles.footer}>
       <View style={styles.buttonTextContainer}>
        <Text style={styles.loginText}>
          Been here?
        </Text>

        <Pressable onPress={()=> router.push('login')}>
          <Text style={[styles.loginText, {color:theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]}>
            Login
          </Text>
        </Pressable>
       </View>
     </View>
    
      </View>
    </ScreenWrapper>
  )
}

export default Welcome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 38, 
    paddingHorizontal: wp(4)
  },
  welcomeImage: {
    height: hp(30),
    width: wp(100)
  }, 
  title: {
    color: theme.colors.text,
    fontSize: hp(4),
    textAlign: 'center',
    fontWeight: theme.fonts.extrabold,
    marginTop: hp(10)
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(10),
    fontSize: hp(1.7),
    color: theme.colors.text
  },
  footer: {
    gap: 38, 
    width:"80%"
  },
  buttonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems:'center',
    gap: 5,
    paddingLeft:  wp(18)
  },
  loginText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(1.6)
  },
  form: {
    gap: 18, 
    paddingTop: wp(8),
  },
  // footerText: {
  //   textAlign: 'center',
  //   color: theme.colors.text, 
  //   fontSize: hp(1.6)
  // }

})