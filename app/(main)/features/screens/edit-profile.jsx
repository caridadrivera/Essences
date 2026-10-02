import { StyleSheet, Text, View, Pressable, Alert, ScrollView, Modal, Button, KeyboardAvoidingView, Platform } from 'react-native'
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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

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
        if (!name) {
            Alert.alert('Profile', "Your name can't be empty")
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
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={120}
                showsVerticalScrollIndicator={false}
            >
            <View style={styles.header}>
                <View style={styles.backgroundImgContainer}>
                    <Image
                        source={backgroundImgSrc}
                        style={styles.coverImage}
                    />
                    <View style={styles.coverActions}>
                    <BackButton router={router} fallbackRoute="/features/screens/user-profile" />
                    <Pressable
                        style={styles.changeCoverButton}
                        onPress={pickBackgroundImage}
                        accessibilityRole="button"
                        accessibilityLabel="Change cover photo"
                    >
                        <Icon name="uploadImageIcon" size={18} color={theme.colors.inkPrimary} />
                        <Text style={styles.imageActionText}>Change cover</Text>
                    </Pressable>
                    </View>
                </View>

                <View style={styles.profilePicContainer}>
                    <Image
                        source={profileImgSrc}
                        style={styles.profilePic} />
                    <Pressable
                        style={styles.changeAvatarButton}
                        onPress={pickProfileImage}
                        accessibilityRole="button"
                        accessibilityLabel="Change profile photo"
                    >
                        <Icon name="uploadImageIcon" size={18} color={theme.colors.surfaceRaised} />
                    </Pressable>
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

                <View style={styles.dangerZone}>
                    <View style={styles.dangerCopy}>
                        <Text style={styles.dangerTitle}>Delete account</Text>
                        <Text style={styles.dangerDescription}>Permanently remove your profile, photos, and posts.</Text>
                    </View>
                    <Pressable
                        style={styles.deleteAccountButton}
                        onPress={() => setModalVisible(true)}
                        accessibilityRole="button"
                    >
                        <Icon name="deleteIcon" size={18} color={theme.colors.dangerWarm} />
                        <Text style={styles.deleteAccountText}>Delete</Text>
                    </Pressable>
                </View>

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
            </KeyboardAwareScrollView>

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
        position: 'relative',
        width: '100%',
        height: 228,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverActions: {
        position: 'absolute',
        top: 12,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    imageActionIcon: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.designRadius.full,
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: theme.colors.hairline,
    },
    changeCoverButton: {
        minHeight: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingHorizontal: 13,
        borderRadius: theme.designRadius.full,
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: theme.colors.hairline,
    },
    imageActionText: {
        color: theme.colors.inkPrimary,
        fontSize: 12,
        fontWeight: theme.fonts.semibold,
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
        width: '100%',
        height: 104,
        alignItems: 'center',
        marginTop: -52,
        zIndex: 1,
    },
    profilePic: {
        height: 104,
        width: 104,
        borderRadius: theme.designRadius.full,
        borderColor: theme.colors.surfaceBase,
        borderWidth: 4,
    },
    changeAvatarButton: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        width: 36,
        height: 36,
        marginLeft: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.designRadius.full,
        backgroundColor: theme.colors.rust,
        borderWidth: 2,
        borderColor: theme.colors.surfaceBase,
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
    dangerZone: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(154, 51, 36, 0.24)',
        borderRadius: theme.designRadius.md,
        backgroundColor: 'rgba(154, 51, 36, 0.05)',
    },
    dangerCopy: {
        flex: 1,
    },
    dangerTitle: {
        color: theme.colors.dangerWarm,
        fontSize: 14,
        fontWeight: theme.fonts.semibold,
    },
    dangerDescription: {
        marginTop: 3,
        color: theme.colors.inkSecondary,
        fontSize: 12,
        lineHeight: 17,
    },
    deleteAccountButton: {
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingHorizontal: 10,
        borderRadius: theme.designRadius.sm,
        backgroundColor: theme.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: 'rgba(154, 51, 36, 0.3)',
    },
    deleteAccountText: {
        color: theme.colors.dangerWarm,
        fontSize: 12,
        fontWeight: theme.fonts.semibold,
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