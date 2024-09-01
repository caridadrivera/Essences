import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { hp , wp} from '../helpers/common'
import { theme } from '../constants/theme'
import Avatar from './Avatar'
import moment from 'moment'

const NotificationItem = ({item, router}) => {

    const handleNotificationClick = async () =>{
        let {postId, commentId} = JSON.parse(item?.data)
    }

    const createdAt = moment(item?.created_at).format('MMM d')

  return (
    <TouchableOpacity style={styles.container} onPress={handleNotificationClick}>
      <Avatar uri={item?.sender?.profile_image} />
      <View  style={styles.nameTitle}>
        <Text style={styles.text}>
            {
                item?.sender?.name
            }
        </Text >
            
        <Text style={[styles.text, {color: theme.colors.textDark}]}>
            {
                item?.title
            }
        </Text>
      </View>

      <Text style={[styles.text, {color: theme.colors.textLight}]}>
            {createdAt}
      </Text>
    </TouchableOpacity>
  )
}

export default NotificationItem

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.darkLight,
        padding: 15,
        borderRadius: theme.radius.xxl,
        borderCurve: 'continuous'
        
      },
      listStyle: {
        paddingVertical: 20,
        gap: 10
      },
      noData: {
        fontSize: hp(1.8),
        fontWeight: theme.fonts.medium,
        color: theme.colors.text,
        textAlign: 'center'
      },
      nameTitle: {
        flex: 1,
        gap: 2
      },
      text: {
        fontSize: hp(1.6),
        fontWeight: theme.fonts.medium,
        color: theme.colors.text
      }
})