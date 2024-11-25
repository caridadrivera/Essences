import { StyleSheet, Text, View, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native'
import { Card, Provider } from 'react-native-paper'
import React from 'react'
import Avatar from '../../components/Avatar'
import RenderHTML from 'react-native-render-html'
import { wp } from '../../helpers/common'
import Icon from '../../assets/icons'
import { theme } from '../../constants/theme'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createPostLike, removePostLike } from '../../services/postService'
import { Alert } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Provider as PaperProvider, Menu, IconButton } from 'react-native-paper';


const PostCard = ({ item, router }) => {

  const { user } = useAuth()

  const leftComponent = ({ size }) => (
    <Avatar uri={item?.users.profile_image} style={{ width: size, height: size, borderRadius: size / 2 }} />
  );
  const [likes, setLikes] = useState([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const [showDeleteButton, setShowDeleteButton] = useState(false);

  useEffect(() => {
    setLikes(item?.postLikes)
  }, [])

  const onLike = async () => {
    if (liked) {
      let updatedLikes = likes.filter(like => like.userId !== user?.id)

      setLikes([...updatedLikes])

      let res = await removePostLike(user?.id, item?.id)

      if (!res.success) {
        Alert.alert('Post', 'Something went wrong')
      }
    } else {
      let data = {
        userId: user?.id,
        postId: item?.id
      }
      setLikes([...likes, data])
      let res = await createPostLike(data)

      if (!res.success) {
        Alert.alert('Post', 'Something went wrong')
      }
    }


  }

  const liked = likes.some(like => like.userId == user?.id ? true : false);


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
  const handleFlag = () => {

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



  return (
    <PaperProvider>
      <Card style={{ margin: 20, width: 300 }} key={item.id}>
        <Card.Title
          subtitle={item.users ? item.users.name : item.name}
          titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
          subtitleStyle={{ fontSize: 14 }}
          left={leftComponent}
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
            <Icon name="hexagonIcon" fill={liked ? theme.colors.likeYellow : 'none'} />
          </TouchableOpacity>
          <Text style={styles.count}>
            {
              likes?.length
            }
          </Text>

        </Card.Actions>
      </Card>
    </PaperProvider>

  )
}

export default PostCard
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
