import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { wp, hp } from '../../helpers/common';
import { Card } from 'react-native-paper';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { htmlToText } from 'html-to-text';
import { theme } from '../../constants/theme';
import { BorderFullIcon } from '@hugeicons/react-native-pro';
import { createPostLike, removePostLike } from '../../services/postService';
import { Alert } from 'react-native';
import { createNotification } from '../../services/notificationService';

const HomePostCard = ({ user, item, router}) => {
    
  const [likes, setLikes] = useState([])


  useEffect(()=>{
    setLikes(item?.postLikes)
  }, [])
  


  const onLike = async () => {
    if(liked){
      let updatedLikes = likes.filter(like => like.userId !== user?.id)

      setLikes([...updatedLikes])

      let res = await removePostLike(user?.id, item?.id)
      if(!res.success){
        Alert.alert('Post', 'Could not remove like')
      }
    } else {
      let data = {
        userId: user?.id,
        postId: item?.id
      }

      setLikes([...likes, data])
      let res = await createPostLike(data)

      if(!res.success){
        Alert.alert('Post', 'Something went wrong')
      } else {
        //create notification if the like comes from other user
        if(!liked){
          let notify = {
            senderId: user.id,
            receiverId: item.users.id,
            title: 'relates to your post',
            data: JSON.stringify({postId: item.id,  commentId: res?.data?.id})
          }

          createNotification(notify)
        }
      }
    }
    

  }


 
  const liked = likes.some(like => like.userId == user?.id ? true : false)

    return (
        <Card style={{ margin: 20, width: 300 }} key={item.id}>
        <Card.Title
          subtitle={item.users? item.users.name : item.name}
          titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
          subtitleStyle={{ fontSize: 14 }}
          left={() => (
         
            <Pressable onPress={() => router.push({
              pathname: '/users/[id]',
              params: { id: item.users.id, profile_img: item.users.profile_image, background_img: item.users.background_image , likes: item.postLikes, user_name: item.users.name, user_bio: item.users.bio }
            }
            )}>

              <Avatar uri={item.users.profile_image}  />
            </Pressable>
          )}
          right={() =>
            user?.id === !item.users.id  && ( 
              <TouchableOpacity onPress={handleDelete}>
                  <Icon name="deleteIcon" style={{ color: 'red', margin: 18, size: 4  }}/>
              </TouchableOpacity>
            ) 
          }
        />

        <Card.Content
          style={{
            margin: 10,
            padding: 10,
            backgroundColor: 'lightgrey',
            borderRadius: 10,
          }}>
          <Text
            style={{ fontSize: 14 }}
            numberOfLines={3} // Limits the number of lines
            ellipsizeMode="tail"
          >
            {item?.body && (
              <RenderHTML
                contentWidth={wp(100)}
                source={{ html: item?.body }}
              />
            )}
          </Text>
        </Card.Content>
  
        <Card.Actions>
          <TouchableOpacity onPress={onLike}>
            <Icon name="hexagonIcon" fill={liked? theme.colors.likeYellow : 'none'} style={{BorderFullIcon: "bold"}}/>
          </TouchableOpacity>
          <Text style={styles.count}>
            {
              likes?.length
            }
          </Text>
  
        </Card.Actions>
      </Card>
    );
};

const styles = StyleSheet.create({
});

export default HomePostCard;
