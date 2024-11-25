import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Modal } from 'react-native';
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);

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

  const openMenu = () => {
    iconRef.current.measure((fx, fy, width, height, px, py) => {
      setMenuPosition({ top: py + height, left: px });
      setMenuVisible(true);
    });
  };
  
  const closeMenu = () => {
    setMenuVisible(false);
  };

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
              params: { id: item.users.id, profile_img: item.users.profile_image, background_img: item.users.background_image , 
              likes: item.postLikes, user_name: item.users.name, user_bio: item.users.bio }
              }
            )}>
              <Avatar uri={item.users.profile_image} />
            </Pressable>
          )}

          right={() =>
            <TouchableOpacity
              ref={iconRef}
              onPress={openMenu}
              style={styles.iconButton}>
              <Text style={styles.icon}>⋮</Text>
            </TouchableOpacity>
          
        }
        />

          {/* Dropdown Menu */}
          {menuVisible && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={menuVisible}
            onRequestClose={closeMenu}
          >
            <Pressable style={styles.overlay} onPress={closeMenu}>
              <View
                style={[
                  styles.menu,
                  {
                    top: menuPosition.top,
                    left: menuPosition.left,
                  },
                ]}
              >
               {user?.id === item.users.id && ( <TouchableOpacity
                  onPress={() => {
                    closeMenu();
                    handleDelete();
                  }}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuText}>Delete</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    closeMenu();
                    handleFlag();
                  }}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuText}>Flag</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}

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
    container: {
        maxHeight: 50,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
    },
    iconButton: {
      padding: 10,
    },
    icon: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'red',
    },
    overlay: {
      flex: 1,
    },
    menu: {
      position: 'absolute',
      backgroundColor: 'white',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    menuItem: {
      paddingVertical: 10,
    },
    menuText: {
      fontSize: 16,
      color: '#333',
    },
    
});

export default HomePostCard;
