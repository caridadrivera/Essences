import { StyleSheet, Text, View, SafeAreaView, StatusBar, Modal, TouchableOpacity, Pressable, Dimensions } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { PaperProvider, Card } from 'react-native-paper'
import { theme } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import Avatar from '../../../components/Avatar'
import BackButton from '../../../components/BackButton'
import { ScrollView } from 'react-native'
import { useAuth } from '../../../context/AuthContext'
import PostModal from '../postModal'
import { Image } from 'expo-image'
import { getUserImage } from '../../../services/userProfileImage'
import { useRouter, useLocalSearchParams } from 'expo-router';
import PostCard from '../postCard'
import ScreenWrapper from '../../../components/ScreenWrapper'
import Loading from '../../../components/Loading'
import Icon from '../../../assets/icons'
import { Alert } from 'react-native'
import { err } from 'react-native-svg'

const Profile = () => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [bgImage, setbgImage] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const {user} = useAuth();
  
  const router = useRouter()
  const { id, profile_img, background_img, user_name, user_bio } = useLocalSearchParams()

  useEffect(() => {
    fetchData();
    setbgImage(getUserImage(background_img))
  }, []);


  const fetchData = async () => {
    await fetchTopics();
  };

  const fetchPosts = async (topic) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          name,
          id, 
          profile_image,
          background_image,
          bio
        ),
        postLikes(*)
      `)
      .eq('topicId', topic.id)
      .eq('userId', id)
      .order('created_at', {ascending: false})

    if (error) {
      console.error(`Error fetching posts for topic ${topic.id}:`, error);
      return [];
    }
    return data;
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title');

    if (error) {
      console.error('Error fetching topics:', error);
      return;
    }

    setTopics(data);

    const postsByTopic = {};
    for (const topic of data) {
      const topicPosts = await fetchPosts(topic);
      postsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(postsByTopic);
  };

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const screenHeight = Dimensions.get('window').height;

    const threshold = 5;

    if (y + screenHeight + threshold >= contentHeight) {
      fetchMorePosts()
    }

    setScrollPosition(y);
  };

  const fetchMorePosts = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title')

    if (error) {
      console.error('Error fetching topics:', error);
      return;
    }

    if (data.length == topics.length) {
      setHasMorePosts(false)
    }

    setTopics(data);
    const postsByTopic = {};
    for (const topic of data) {
      const topicPosts = await fetchPosts(topic);
      postsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(postsByTopic);
  }

  const openMenu = () => {
    iconRef.current.measure((x, y, width, height, pageX, pageY) => {
      const screen = Dimensions.get('window');
      const menuWidth = 150;
      const menuHeight = 50; 

      let top = pageY + height;
      let left = pageX;

     if (left + menuWidth > screen.width) {
        left = screen.width - menuWidth - 10;
      }
      if (top + menuHeight > screen.height) {
        top = screen.height - menuHeight - 10; 
      }

      setMenuPosition({ top, left });
      setMenuVisible(true);
    });
  };

    
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const blockUser = async () => {

    const { data, error } = await supabase
      .from('blocked_users')
      .insert([{ user_id: user.id, blocked_user_id: id }]);
  
    if (error) {
      Alert.alert('Error blocking user', error);
      return false;
    }
  
    Alert.alert('User blocked');
    router.push('home')
    return true;
  };
  



  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.backgroundImgContainer}>
          <Image
            source={bgImage}
            style={{
              height: 228,
              width: "100%"
            }} />
            <Pressable  onPress={()=> router.push('home')}>
                <Icon name="arrowLeft" />
            </Pressable>
        </View>
        <View style={styles.profilePicContainer}>
          <Avatar
            uri={profile_img}
            style={styles.profilePic} />
        </View>
        <TouchableOpacity
              ref={iconRef}
              onPress={openMenu}
              style={styles.iconButton}>
              <Text style={styles.icon}>⋮</Text>
          </TouchableOpacity>
      <View>
      {menuVisible && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={menuVisible}
            onRequestClose={closeMenu}
          >
            <Pressable onPress={closeMenu}>
              <View
                style={[
                  styles.menu,
                  {
                    top: menuPosition.top,
                    left: menuPosition.left,
                  },
                ]}
              >

                <TouchableOpacity
                  onPress={() => {
                    closeMenu();
                    blockUser();
                  }}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuText}>Block {user_name}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}
     
      </View>
      
      </View>
      <View style={{ alignItems: 'center', marginBottom: 5}}>
        <Text style={{fontWeight: 'bold' }}>{user_name}</Text>
        <Text style={{fontStyle: 'italic' }}>{user_bio}</Text>
        <Text style={{fontWeight: 'bold' }}>__________________</Text>
      </View>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {topics.map(topic => (
          <View key={topic.id} >
            <View style={{ alignItems: 'center' }}>
              <Icon name="hexagonIcon" fill={theme.colors.yellow} />
              <Text style={{ margin: 4, fontSize: 18, fontWeight: 'bold' }}>{topic.title}</Text>
         
            </View>
            <ScrollView horizontal={true}>
              {(postsByTopic[topic.id] && postsByTopic[topic.id].length > 0) ? ( 
                postsByTopic[topic.id] || []).map(filteredPost => (           
                <View key={filteredPost.id}>
                  <PostCard
                    item={filteredPost}       
                    router={router}
                  />
                </View>
              )) : (
                  <View style={{ alignItems: 'center', marginLeft: 35 }}>
                    <Text >No posts on this topic yet</Text>
                  </View>
              )}
            </ScrollView>
          </View>
        ))}

        {hasMorePosts ? (<View style={{ marginVertical: 30 }}>
          <Loading />
        </View>) : (
          <View style={{ marginVertical: 30, alignItems: 'center' }}>
            <Text >No more posts</Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  )
}

export default Profile


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white'
  },
  statusBar: {
    backgroundColor: theme.colors.dark
  },
  backgroundImgContainer: {
    width: '100%'
  },
  profilePicContainer: {
    flex: 1,
    alignItems: 'center'
  },
  profilePic: {
    height: 155,
    width: 155,
    borderRadius: 999,
    borderBlockColor: theme.colors.primaryDark,
    borderWidth: 2,
    marginTop: -140
  },
  editIcon: {
    position: 'absolute',
    botton: 0,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  postsContainer: {
    paddingTop: 28,
    marginTop: 10
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,

  },
  iconButton: {
    left: 188
  },
  icon: {
    fontSize: 28,
    fontWeight: 'bolder',
    color: 'blue',
  },
  overlay: {
    flex: 1,
  },
  menu: {
    width: 120,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    shadowColor: '#000',
    paddingRight: 10,
    marginLeft: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
     alignSelf: 'flex-start'
  },
  menuItem: {
    paddingVertical: 5,
  },
  menuText: {
    fontSize: 12,
    color: 'red',
  },
  
  

})