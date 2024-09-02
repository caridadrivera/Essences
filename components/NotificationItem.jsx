import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { hp, wp } from '../helpers/common'
import { theme } from '../constants/theme'
import Avatar from './Avatar'
import { supabase } from '../lib/supabase'
import PostModal from '../app/(main)/postModal'
import ScreenWrapper from './ScreenWrapper'

const NotificationItem = ({ item, router }) => {
  const [post, setPost] = useState()
  const [modalVisible, setModalVisible] = useState(false);
 

  const handleNotificationClick = async () => {
    let { postId } = JSON.parse(item?.data)

    const { data, error } = await supabase
      .from('posts')
      .select(`
              *,
              users (
                name,
                id,
                profile_image
              ),
              postLikes(*)
            `)
      .eq('id', postId)

    if (error) {
      console.error(`Error fetching posts for topic ${postId}:`, error);
      return [];
    }

    setPost(data[0])
 

  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  const createdAt = formatDate(item?.created_at)


  return (

    <View>
      <TouchableOpacity style={styles.container} onPress={() =>{
        handleNotificationClick()
        setModalVisible(true)
        }}>
        <Avatar uri={item?.sender?.profile_image} />
        <View style={styles.nameTitle}>
          <Text style={styles.text}>
            {
              item?.sender?.name
            }
          </Text >

          <Text style={[styles.text, { color: theme.colors.textDark }]}>
            {
              item?.title
            }
          </Text>
        </View>

        <Text style={[styles.text, { color: theme.colors.textLight }]}>
          {createdAt}
        </Text>
      </TouchableOpacity>

      <PostModal
         isVisible={modalVisible}
         post={post}
         onClose={() => setModalVisible(false)}
     />

    </View>



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