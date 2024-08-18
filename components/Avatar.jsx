import React from 'react';
import profilePic from '../assets/images/download.jpeg'
import { hp } from '../helpers/common';
import { theme } from '../constants/theme';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { getUserImage } from '../services/userProfileImage';

const Avatar = ({ 
  uri, 
  size=hp(4.5),
  rounded=theme.radius.md, 
  style={} }) => {
 
  return (
   <Image
     source={getUserImage(uri)}
     transition={100}
     style={[styles.avantarImg, {height: size, width: size, borderRadius: rounded}, style]}/>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avantarImg: {
    borderCurve: 'continuous',
    borderColor: theme.colors.darkLight, 
    borderWidth: 1
  },
})
