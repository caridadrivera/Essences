import { StyleSheet, Text, View, TouchableOpacity} from 'react-native'
import { Card } from 'react-native-paper'
import React from 'react'
import Avatar from '../../components/Avatar'
import RenderHTML from 'react-native-render-html'
import { wp } from '../../helpers/common'
import Icon from '../../assets/icons'
import { theme } from '../../constants/theme'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createPostLike, removePostLike } from '../../services/postService'
import { Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

const PostCard = ({item, router}) => {
   
 const {user} = useAuth()
   const leftComponent = ({ size }) => (
     <Avatar 
       uri={item?.users.profile_image} 
       style={{ width: size, height: size, borderRadius: size / 2 }} />
      );

    
   const [likes, setLikes] = useState([]);



    useEffect(()=>{
     setLikes(item?.postLikes)
    }, [])

    const onLike = async () => {
      if(liked){
        let updatedLikes = likes.filter(like => like.userId !== user?.id)
       
        setLikes([...updatedLikes])
        
        let res = await removePostLike(user?.id, item?.id)
        
          if(!res.success){
            Alert.alert('Post', 'Something went wrong')
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
        }
      }
      

    }

    const liked = likes.some(like => like.userId == user?.id ? true : false );

    const [showDeleteButton, setShowDeleteButton] = useState(false);

    const handleDelete = async () => {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .match({ id: item.id, userId: user.id });
  
        if (error) throw error;
        
        router.push('userProfile')
        setShowDeleteButton(false); 
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }

  return (
  
    <Card style={{ margin: 20, width: 300 }} key={item.id}>
      <Card.Title
        subtitle={item.users? item.users.name : item.name}
        titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
        subtitleStyle={{ fontSize: 14 }}
        left={leftComponent}  
        right={() =>
          user.id === item.users.id  && ( 
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
          numberOfLines={3} 
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
          <Icon name="hexagonIcon" fill={liked? theme.colors.likeYellow : 'none'}/>
        </TouchableOpacity>
        <Text style={styles.count}>
          {
            likes?.length
          }
        </Text>

      </Card.Actions>
    </Card>
  )
}

export default PostCard

const styles = StyleSheet.create({})