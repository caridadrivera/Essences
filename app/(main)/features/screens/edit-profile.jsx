import { StyleSheet, Text, View, Pressable, Alert, ScrollView, Modal, Button } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../../../components/ScreenWrapper'
import Avatar from '../../../../components/Avatar'
import { theme } from '../../../../constants/theme'
import { hp, wp } from '../../../../helpers/common'
import bgImg from '../../../../assets/images/bg.jpeg'
import BackButton from '../../../../components/BackButton'
import { router, useRouter } from 'expo-router'
import { useAuth } from '../../../../context/AuthContext'
import Icon from '../../../../assets/icons'
import { getUserImage, uploadFile } from '../../../../services/userProfileImage'
import Input from '../../../../components/Input'
import ButtonComponent from '../../../../components/Button'
import { updateUserData } from '../../../../services/userService'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfile = () => {
    const { user: currentUser, setUserData } = useAuth()
    const [user, setUser] = useState({
        name: '',
        profile_image: null,
        background_image: null,
        bio: ''
    });
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState('No response yet');
    const router = useRouter()
    const [modalVisible, setModalVisible] = useState(false);
    const [permissionStringModalVisible, setpermissionStringModalVisible] = useState(false);
    const [isChangeProfilePic, setIsChangedProfilePic] = useState(false)
    
    useEffect(() => {
        if (currentUser) {
            setUser({
                name: currentUser.name || '',
                profile_image: currentUser.profile_image || null,
                bio: currentUser.bio || '',
                background_image: currentUser.background_image || null
            })
        }
    }, [currentUser])

    const deleteUser = async () => {
        try {
            const res = await axios.post('https://fxogjvujmqcpjdhyiawl.supabase.co/functions/v1/delete-user', {
                userId: currentUser.id
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });


            if (res.status === 200) {
                await logoutUser();

                Alert.alert('Account Deleted', 'Sorry to see you go!')
            } else {
                setResponse('Failed to delete user: ' + res.data.message);
            }
        } catch (error) {
            console.error('API call failed:', error);
            setResponse('Failed to delete user: ' + error.message);
        }
    };
    const logoutUser = async () => {
        try {
            await AsyncStorage.removeItem('userToken');

            router.push('/features/auth/login');
        } catch (error) {
            console.error('Failed to clear user session:', error);
        }
    };

    const processProfilePic = async () => {
           const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if(status !== 'granted'){
                alert('Sorry, we need photo library permissions to make this work!');
            } else {
                let result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });
    
                if (!result.canceled) {
                    setUser({ ...user, profile_image: result.assets[0] })
                }
            }
    }
    
    const processBackgroundPic = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if(status !== 'granted'){
            alert('Sorry, we need photo library permissions to make this work!');
        } else {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setUser({ ...user, background_image: result.assets[0] })
            }
        }
    }

    const pickProfileImage = async () => {
        const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    
        if(existingStatus !== 'granted'){
            setpermissionStringModalVisible(true)     
            setIsChangedProfilePic(true)
            
        } else {

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setUser({ ...user, profile_image: result.assets[0] })
            }
        }
   
    }
    const pickBackgroundImage = async () => {
        const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    
        if(existingStatus !== 'granted'){
            setpermissionStringModalVisible(true)
                 
        } else {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
              });
    
            if (!result.canceled) {
                setUser({ ...user, background_image: result.assets[0] })
            }
         
        }
    }

    const onSubmit = async () => {
        let userData = { ...user }
        let { name, profile_image, background_image, bio } = userData;
        if (!name || !bio || !profile_image || !background_image) {
            Alert.alert('Profile', "Please fill out all fields")
            return
        }
        setLoading(true)

        if (typeof profile_image == 'object') {
            let imageRes = await uploadFile('profiles', profile_image?.uri, true)
            if (imageRes.success) userData.profile_image = imageRes.data
            else userData.profile_image = null
        }

        if (typeof background_image == 'object') {
            let imageRes = await uploadFile('backgrounds', background_image?.uri, true)
            if (imageRes.success) userData.background_image = imageRes.data
            else userData.background_image = null
        }

        const res = await updateUserData(currentUser?.id, userData)
        setLoading(false)

        if (res.success) {
            setUserData({ ...currentUser, ...userData })
            router.back()
        }
    }
    const handleAccept = () => {
        setModalVisible(false);
        deleteUser();
    };
    const handleDecline = () => {
        setModalVisible(false)
    };
    const handleAcceptPermission = () =>{
        setpermissionStringModalVisible(false)
        if(isChangeProfilePic){
            processProfilePic()
        } else {
            processBackgroundPic()
        }
    
    };
    const handleDeclinePermission = () =>{
        setpermissionStringModalVisible(false)
    };


    let backgroundImgSrc = user.background_image && typeof user.background_image == 'object' ? user.background_image.uri : getUserImage(user.background_image)
    let profileImgSrc = user.profile_image && typeof user.profile_image == 'object' ? user.profile_image.uri : getUserImage(user.profile_image)


    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={styles.backgroundImgContainer}>
                    <Image
                        source={backgroundImgSrc}
                        style={{ height: 228, width: "100%" }}
                    />
                    <View>
                    <Pressable onPress={() => { router.back() }}>
                        <Icon name="arrowLeft" />
                    </Pressable>
                    </View>
                    <Pressable
                        style={[styles.iconContainer, { top: 10, right: 10 }]}
                        onPress={pickBackgroundImage}>
                        <Icon name="uploadImageIcon" />
                    </Pressable>
                </View>

                <View style={styles.profilePicContainer}>
                    <Image
                        source={profileImgSrc}
                        style={styles.profilePic} />
                    <Pressable style={styles.editIcon}
                        onPress={pickProfileImage}>
                        <Icon name="uploadImageIcon" />
                    </Pressable>
                    <View>
                        <Pressable
                            style={styles.iconButton}
                            onPress={() => setModalVisible(true)}>
                            <Icon name="deleteIcon" />
                        </Pressable>
                    </View>
                </View>
            </View>
            {/* form */}
            <View style={styles.form}>
                <Input
                    icon={<Icon name="userIcon" />}
                    placeholder='enter name'
                    value={user.name}
                    onChangeText={value => setUser({ ...user, name: value })} />
                <Input
                    placeholder='Enter your bio'
                    value={user.bio}
                    multiline={true}
                    containerStyle={styles.bio}
                    onChangeText={value => setUser({ ...user, bio: value })} />
                <ButtonComponent title="Update" loading={loading} onPress={onSubmit} />

                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}>
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalText}>
                                Are you sure you want to delete your account?
                                This action is permanent and will delete all of your photos and posts.
                            </Text>
                            <View style={styles.modalButtonContainer}>
                                <Button title="Accept" onPress={handleAccept} />
                                <Button title="Decline" onPress={handleDecline} color="#f55" />
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>

                <Modal
                    visible={permissionStringModalVisible}
                    animationType="slide"
                    transparent={true}>
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                        <Text style={styles.modalText}>
                            Allow Essences to access your photo album
                            {'\n'}<Text style={{fontWeight: 'bold'}}>How you'll use this:</Text>
                            {'\n'}   To upload background and profile photos for your profile
                            {'\n'}<Text style={{fontWeight: 'bold'}}>How Essences will use this:</Text>
                            {'\n'}   We will use access to your photos exclusively to allow you to choose and images for your profile.
                            {'\n'}<Text style={{fontWeight: 'bold'}}>How these settings work:</Text>
                            {'\n'}   You can change your choices at any time in your device's photo settings
                        </Text>

                            <View style={styles.modalButtonContainer}>
                                <Button title="Accept" onPress={handleAcceptPermission} />
                                <Button title="Decline" onPress={handleDeclinePermission} color="#f55" />
                            </View>
                        </View>
                    </View>
                </Modal>

        </ScreenWrapper>
    )
}

export default EditProfile

const styles = StyleSheet.create({
    backgroundImgContainer: {
        width: '100%', // Required for absolute positioning to work
    },
    welcomeText: {
        fontSize: hp(4),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text
    },
    form: {
        marginTop: 48,
        marginHorizontal: 18,
        gap: 25,
    },
    input: {
        flexDirection: 'row',
        borderWidth: 0.4
    }
    ,
    imageWrapper: {
        position: 'relative',
        height: 228,
        width: '100%',
    },
    iconContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        borderRadius: 5,
        zIndex: 1,
    },
    profilePicContainer: {
        flex: 1,
        alignItems: 'center'
    },
    profilePic: {
        height: 155,
        width: 155,
        borderRadius: 999,
        borderBlockColor: theme.colors.primaryDark,
        borderWidth: 2,
        marginTop: -140
    },
    editIcon: {
        position: 'absolute',
        botton: 0,
        padding: 7,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: theme.colors.textLight,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7
    },

    header: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,

    },

    editBackground: {
        alignItems: 'center',
        fontSize: 18,
        borderRadius: 50,
        shadowColor: theme.colors.textLight,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7,
        color: theme.colors.dark,
        fontWeight: 'bold'
    },

    bio: {
        flexDirection: 'row',
        height: hp(15),
        alignItems: 'flex-start',
        paddingVertical: 15
    },
    iconButton: {
        left: 180,
        top: -35
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