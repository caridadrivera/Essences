import { StyleSheet, Text, View, Pressable, Alert, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Avatar from '../../components/Avatar'
import { theme } from '../../constants/theme'
import { hp, wp } from '../../helpers/common'
import bgImg from '../../assets/images/bg.jpeg'
import BackButton from '../../components/BackButton'
import { router, useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import Icon from '../../assets/icons'
import { getUserImage, uploadFile } from '../../services/userProfileImage'
import Input from '../../components/Input'
import ButtonComponent from '../../components/Button'
import { updateUserData } from '../../services/userService'
import * as imagePicker from 'expo-image-picker'
import { Image } from 'expo-image'

const EditProfile = () => {
    const { user: currentUser, setUserData } = useAuth()
    const [user, setUser] = useState({
        name: '',
        profile_image: null,
        background_image: null,
        bio: ''
    });
    const [loading, setLoading] = useState(false)
    const router = useRouter()

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


    const pickProfileImage = async () => {
        let result = await imagePicker.launchImageLibraryAsync({
            mediaTypes: imagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7
        })

        if (!result.canceled) {
            setUser({ ...user, profile_image: result.assets[0] })
        }
    }

    const pickBackgroundImage = async () => {
        let result = await imagePicker.launchImageLibraryAsync({
            mediaTypes: imagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7
        })

        if (!result.canceled) {
            setUser({ ...user, background_image: result.assets[0] })
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

        //update user
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

    let backgroundImgSrc = user.background_image && typeof user.background_image == 'object' ? user.background_image.uri : getUserImage(user.background_image)
    let profileImgSrc = user.profile_image && typeof user.profile_image == 'object' ? user.profile_image.uri : getUserImage(user.profile_image)


    return (
        <ScreenWrapper>
            <View style={styles.profilePicContainer}>
                <View style={styles.imageWrapper}>
                    <Image
                        source={backgroundImgSrc}
                        style={{ height: 228, width: "100%" }}
                    />
                    <Pressable
                        style={[styles.iconContainer, { top: 10, right: 10 }]}
                        onPress={pickBackgroundImage}>
                        <Icon name="uploadImageIcon" />
                    </Pressable>
                </View>
                <BackButton router={router} />
            </View>

            <View style={styles.profilePicContainer}>
                <Image
                    source={profileImgSrc}
                    style={styles.profilePic} />
                <Pressable style={styles.editIcon} 
                    onPress={pickProfileImage}>
                    <Icon name="uploadImageIcon"  />
                </Pressable>
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
            </View>

        </ScreenWrapper>
    )
}

export default EditProfile

const styles = StyleSheet.create({
    backgroundImgContainer: {
        position: 'relative', // Required for absolute positioning to work
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
        position: 'relative', 
        alignItems: 'center', 
        justifyContent: 'center', 
    },
    profilePic: {
        height: 150, 
        width: 150, 
        borderRadius: 75, 
        borderRadius: 999,
        borderBlockColor: theme.colors.primaryDark,
        borderWidth: 2,
        marginTop: -100
    },
    editIcon: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        padding: 8,
        borderRadius: 20, 
        zIndex: 1, 
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
    }

})