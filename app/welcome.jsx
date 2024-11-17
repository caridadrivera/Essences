import { View, StyleSheet, Text , Pressable, Modal, Alert, ScrollView, Button} from 'react-native'
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
import { getUserImage } from '../services/userProfileImage'
import { Image } from 'expo-image'

const Welcome = () => {

  const router = useRouter();
  const nameRef = useRef("")
  const emailRef = useRef("")
  const passwordRef = useRef("")
  const [loading, setLoading ] = useState(false)  
  const [modalVisible, setModalVisible] = useState(false);



  const handleSubmit = () => {
    setModalVisible(true);
  };

const handleAccept = () => {
    setModalVisible(false);

    handleRegistration()
};

const handleDecline = () => {
    setModalVisible(false);
    Alert.alert("Registration Failed", "You must accept the EULA to register.");
};





  const handleRegistration = async () =>{
    if(!emailRef.current || !passwordRef.current || !nameRef.current){
      Alert.alert('Sign Up', "All fields must be filled")
      return
    } else {
      
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
       onPress={handleSubmit} 
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
    <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    Alert.alert("Modal has been closed.");
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <ScrollView>
                            <Text style={styles.modalText}>
                                {/* EULA content here */}
                                End User License Agreement (EULA)

                                ... (Last Updated: November 16, 2024 )

                                    This End User License Agreement ("Agreement") is a legal agreement between you (either an individual or a single entity) and Our Essencess ("Company", "we", "us", or "our"), regarding your use of Essences ("Software"), which includes computer software and may include associated media, printed materials, and online or electronic documentation.

                                    By installing, copying, or otherwise using the Software, you agree to be bound by the terms of this Agreement. If you do not agree to the terms of this Agreement, do not install or use the Software.

                                    1. Grant of License
                                    The Software is licensed, not sold, to you by Our Essences. Subject to your compliance with this Agreement, the Company grants you a non-exclusive, non-transferable, limited license to use the Software solely for your personal, non-commercial purposes.
                                   
                                    2. Restrictions
                                    - You may not distribute, sell, lease, rent, lend, or sublicense the Software to anyone.
                                    - You may not modify, decompile, disassemble, reverse engineer, or create derivative works of the Software.
                                    - You may not remove or alter any copyright notices on any copies of the Software.
                                  
                                    3. Content
                                    You agree not to use the Software to upload, post, host, or transmit unsolicited email, SMSs, or "spam" messages.
                                    You are solely responsible for the text content and images that you upload, post, or display on or through the Software. You warrant that you own all rights to the content or have obtained all necessary permissions.
                                   
                                    - You agree not to use the Software to upload, post, host, or transmit any content that is objectionable, including but not limited to content that is harmful, threatening, unlawful, harassing, defamatory, obscene, sexually explicit, or racially, ethnically, or otherwise objectionable.
                                    - You are solely responsible for the content you provide, and you agree to indemnify and hold harmless [Your Company Name] against any claims made in connection with the content you upload.
                                    - You agree not to engage in abusive use of the Software, including but not limited to, using the Software to send unsolicited communications, using the Software in a way that intentionally degrades the performance and functionality, or using the Software for any purpose in violation of local, state, national, or international laws.

                                    4. Enforcement of Content and Conduct Rules
                                    - Our Essences reserves the right to take appropriate action against any user who, in our sole discretion, violates these rules, including without limitation, removing the offending content, suspending or terminating the account of such violators, and reporting you to the law enforcement authorities.

                                                                      
                                    5. Intellectual Property Rights

                                    All copyrights, trademarks, patents, trade secrets, and other intellectual property rights in and to the Software (including but not limited to any content incorporated into the Software) are owned by the Company or its suppliers.
                                    6. Termination

                                    This Agreement is effective until terminated by either you or the Company. Your rights under this Agreement will terminate automatically without notice from the Company if you fail to comply with any term(s) of this Agreement.
                                    7. Disclaimer of Warranties

                                    The Software is provided "as is" and with all faults and without warranty of any kind.
                                    8. Limitation of Liability

                                    In no event shall the Company be liable for any special, incidental, indirect, or consequential damages whatsoever (including, without limitation, damages for loss of business profits, business interruption, loss of business information, or any other pecuniary loss) arising out of the use of or inability to use the Software.
                                    9. Changes to this Agreement

                                    The Company reserves the right to modify this Agreement at any time and such modifications shall be effective immediately upon posting of the modified Agreement.
                                    10. Governing Law

                                    This Agreement shall be governed by and construed in accordance with the laws of New York, New York, United States.
                                    11. Contact Information

                                    If you have any questions about this Agreement, or if you want to contact the Company for any reason, please direct all correspondence to: support@ouressences.com.
                                    Acceptance

                                    I have read and understand the terms of this Agreement and agree to be bound by them. 
                            </Text>
                        </ScrollView>
                        <View style={styles.modalButtonContainer}>
                            <Button title="Accept" onPress={handleAccept} />
                            <Button title="Decline" onPress={handleDecline} color="#f55" />
                        </View>
                    </View>
                </View>
            </Modal>
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
},
modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
},
modalText: {
    marginBottom: 15,
    textAlign: "center"
},
modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
}

})