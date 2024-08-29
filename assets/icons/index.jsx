import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import HomeIcon from './HomeIcon'
import { theme } from '../../constants/theme'
import ArrowLeft from './ArrowLeft'
import ImageIcon from './ImageIcon'
import CameraIcon from './CameraIcon'
import UserCircleIcon from './userIcon'
import editIcon from './editIcon'
import PlusIcon from './plusIcon'
import HeartCheckIcon from './heartIcon'
import DeleteIcon from './deleteIcon'
import LogoutIcon from './logOutIcon'
import MailIcon from './Mail'
import SquareLockIcon from './Lock'
import HexagonIcon from './Hexagon'
import UploadImageIcon from './uploadImageIcon'
import UserSettingsIcon from './Settings'
import MoreHorizontalIcon from './MoreHorizontalIcon'

const icons = {
    home: HomeIcon, 
    arrowLeft: ArrowLeft,
    imageIcon: ImageIcon,
    cameraIcon:  CameraIcon,
    userIcon: UserCircleIcon, 
    editIcon: editIcon,
    plusIcon: PlusIcon,
    heartIcon: HeartCheckIcon, 
    deleteIcon: DeleteIcon,
    logoutIcon: LogoutIcon,
    mailIcon: MailIcon,
    lockIcon: SquareLockIcon,
    hexagonIcon: HexagonIcon,
    uploadImageIcon: UploadImageIcon,
    settingsIcon: UserSettingsIcon,
    moreIcon: MoreHorizontalIcon
}
const Icon = ({name, ...props}) => {
    const IconComponent = icons[name]
  return (
    <IconComponent
        height={props.size || 24}
        width={props.size || 24}
        strokeWidth={props.strokeWidth || 1.9}
        color={theme.colors.textLight}
        {...props}
        />
  )
}

export default Icon;

const styles = StyleSheet.create({})