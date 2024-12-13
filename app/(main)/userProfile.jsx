import { StyleSheet, Text, View, SafeAreaView, StatusBar, Modal, TouchableOpacity, Pressable, Dimensions, Alert } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { PaperProvider, Card } from 'react-native-paper'
import { theme } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/Avatar'
import { router, useLocalSearchParams} from 'expo-router'
import { ScrollView } from 'react-native'
import Icon from '../../assets/icons'
import PostModal from './postModal'
import { Image } from 'expo-image'
import { getUserImage } from '../../services/userProfileImage'
import NewPost from './newPost'
import ScreenWrapper from '../../components/ScreenWrapper'
import PostCard from './postCard'
import Loading from '../../components/Loading'
import { getUserData } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const userProfile = () => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const { user, setAuth } = useAuth()
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const [bgImage, setbgImage] = useState(null)
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const { id, profile_img, background_img, name, bio} = useLocalSearchParams()

  const [isPostDeleted, setIsPostDeleted] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);

  
  
  useEffect(() => {
    
    const fetchData = async () => {
      await fetchTopics();
    };


    fetchData();
    setbgImage(getUserImage(background_img))

    let postChannel;
    if (postModalVisible) {
      postChannel = supabase
        .channel('posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
        .subscribe()
    }

    return () => {
      if (postChannel) {
        supabase.removeChannel(postChannel)
      }

    }
  }, [postModalVisible, isPostDeleted]);

  const handlePostEvent = async (payload) => {
    if ((payload.eventType === 'INSERT') && payload?.new?.id) {
      let newPost = { ...payload.new };
      let response = await getUserData(newPost.userId);
      newPost.user = response.success ? response.data : {};

      const topicId = newPost.topicId;

      setPostsByTopic((prevPosts) => ({
        ...prevPosts,
        [topicId]: [newPost, ...(prevPosts[topicId] || [])],
      }));
    }
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
          bio
        ),
        postLikes(*)
      `)
      .eq('topicId', topic.id)
      .eq('userId', user.id)
      .order('created_at', { ascending: false })

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
      return;
    }

    setTopics(data);

    const postsByTopic = {};
    for (const topic of data) {
      const topicPosts = await fetchPosts(topic);
      postsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(postsByTopic);
    setHasMorePosts(false)
  };

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const screenHeight = Dimensions.get('window').height;

    const threshold = 100;

    if (y + screenHeight + threshold >= contentHeight) {
      fetchMorePosts()
    }

    setScrollPosition(y);
  };


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const openMenu = () => {
  iconRef.current.measure((fx, fy, width, height, px, py) => {

    let top = py + height;
    let left = px;

    const menuWidth = 120;
    const menuHeight = 50; 
    if (left + menuWidth > screenWidth) {
      left = screenWidth - menuWidth - 10; 
    }
    if (top + menuHeight > screenHeight) {
      top = screenHeight - menuHeight - 10; 
    }

    setMenuPosition({ top, left });
    setMenuVisible(true);
  });
};


    
  const closeMenu = () => {
    setMenuVisible(false);
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
    const fetchedPostsByTopic = {};
    for (const topic of data) {
      const topicPosts = await fetchPosts(topic);
      fetchedPostsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(fetchedPostsByTopic);
  }

  const navigateToBlockedList = () =>{
    router.push('blockedUsers')
  }

  const deleteMyAccount = async () => {

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and will delete all corresponding data.',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('User cancelled account deletion'),
          style: 'cancel',
        },
        {
          text: 'Yes, Delete',
          onPress: async () => {
            try {
        

            const response = await axios.delete(`http://localhost:3000/delete-user/${id}`);
            console.log(response);
            
              router.replace('/welcome');
            } catch (error) {
              console.error('Error during account deletion:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };


  return (
    <ScreenWrapper >
      <View style={styles.header}>
        <View style={styles.backgroundImgContainer}>
          <Image
            source={bgImage}
            style={{
              height: 228,
              width: "100%"
            }} />
          <Pressable onPress={() => router.push('home')}>
            <Icon name="arrowLeft" />
          </Pressable>
        </View>
        <View style={styles.profilePicContainer}>
          <Avatar
            uri={profile_img}
            style={styles.profilePic} />
        </View>
      
        <View>
    <TouchableOpacity
      ref={iconRef}
      onPress={menuVisible ? closeMenu : openMenu}
      style={styles.iconButton}>
      <Text style={styles.icon}>⋮</Text>
    </TouchableOpacity>
    {menuVisible && (
      <Modal
        transparent={true}
        animationType="fade"
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <Pressable onPress={closeMenu} style={{ flex: 1 }}>
          <View>
            <View
              style={[
                styles.menu,
                {
                  position: 'absolute',
                  top: menuPosition.top,
                  left: menuPosition.left,
                },
              ]}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  navigateToBlockedList();
                }}
              >
                <Text style={styles.menuText}>Blocked List</Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  deleteMyAccount()
                  closeMenu();

                }}
              >
                <Text style={styles.menuText}>Delete My Account</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    )}
  </View>

      </View>

      <View style={{ alignItems: 'center'}}>
        <Text style={{ fontWeight: 'bold' }}>{name}</Text>
        <Text style={{ fontStyle: 'italic'}}>{bio}</Text>
        <Text style={{ fontWeight: 'bold' }}>__________________</Text>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {topics.map(topic => (
          <View key={topic.id} >
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Icon name="hexagonIcon" fill={theme.colors.yellow} />
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ margin: 4, fontSize: 18, fontWeight: 'bold' }}>{topic.title}</Text>
                <TouchableOpacity key={topic.id} onPress={() => {
                  setSelectedTopic(topic.id);
                  setPostModalVisible(true);
                }}>
                  <View style={{ margin: 4, fontSize: 18, fontWeight: 'bold' }}>
                    <Icon name='plusIcon' />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView horizontal={true} >
              {(postsByTopic[topic.id] && postsByTopic[topic.id].length > 0) ? (postsByTopic[topic.id] || []).map(filteredPost => (
                <TouchableOpacity key={filteredPost.id} onPress={() => {
                  setSelectedPost(filteredPost);
                  setModalVisible(true);
                }}>
                  <PostCard
                    item={filteredPost}
                    router={router}
                    setIsPostDeleted={setIsPostDeleted} />
                </TouchableOpacity>
              )):(
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

      <NewPost
        isVisible={postModalVisible}
        user={user}
        topicId={selectedTopic}
        onClose={() => setPostModalVisible(false)}
      />

    </ScreenWrapper>



  )
}

export default userProfile


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
 
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,

  },
  menu: {
    position: 'absolute',
    width: 120,
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    padding: 10,
  },
  

  menuText: {
    fontSize: 12,
    color: 'red',
  },
  iconButton: {
    left: 188
  },
  icon: {
    fontSize: 28,
    fontWeight: 'bolder',
    color: 'blue',
  },

})