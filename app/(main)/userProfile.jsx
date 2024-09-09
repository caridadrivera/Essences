import { StyleSheet, Text, View, SafeAreaView, StatusBar, Modal, TouchableOpacity, Pressable, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react'
import { PaperProvider, Card } from 'react-native-paper'
import { theme } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/Avatar'
import BackButton from '../../components/BackButton'
import { router } from 'expo-router'
import { ScrollView } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import AddButton from '../../components/AddButton'
import Icon from '../../assets/icons'
import PostModal from './postModal'
import { Image } from 'expo-image'
import { getUserImage } from '../../services/userProfileImage'
import NewPost from './newPost'
import RenderHTML from 'react-native-render-html'
import { wp } from '../../helpers/common'
import ScreenWrapper from '../../components/ScreenWrapper'
import PostCard from './postCard'
import Loading from '../../components/Loading'
import { getUserData } from '../../services/userService'

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


  useEffect(() => {
    const fetchData = async () => {
      await fetchTopics();
    };

    fetchData();
    setbgImage(getUserImage(user.background_image))

  let postChannel;
    if(postModalVisible){
      postChannel = supabase
        .channel('posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
        .subscribe()
    }
    
    return () => {
      if(postChannel){
        supabase.removeChannel(postChannel)
      }
    }


  }, [postModalVisible]);

  const handlePostEvent = async (payload) => {
    if (payload.eventType === 'INSERT' && payload?.new?.id) {
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
          profile_image
        ),
        postLikes(*)
      `)
      .eq('topicId', topic.id)
      .eq('userId', user.id)
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

    const threshold = 100;

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
    const fetchedPostsByTopic = {};
    for (const topic of data) {
      const topicPosts = await fetchPosts(topic);
      fetchedPostsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(fetchedPostsByTopic);
  }

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
          <Pressable onPress={()=> router.push('home')}>
                <Icon name="arrowLeft" />
            </Pressable>
        </View>
        <View style={styles.profilePicContainer}>
          <Avatar
            uri={user?.profile_image}
            style={styles.profilePic} />
        </View>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {topics.map(topic => (
          <View key={topic.id} >
            <View style={{ alignItems: 'center' }}>
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
              <Icon name="hexagonIcon" fill={theme.colors.yellow} />
            </View>
          <ScrollView horizontal={true} >
              {(postsByTopic[topic.id] || []).map(filteredPost => (
                <TouchableOpacity key={filteredPost.id} onPress={() => {
                  setSelectedPost(filteredPost);
                  setModalVisible(true);
                }}>
                  <PostCard
                    item={filteredPost}
                    router={router} />
                </TouchableOpacity>
              ))}
              {hasMorePosts ? (<View style={{ marginVertical: 30 }}>
                <Loading />
              </View>) : (
                <View style={{ marginVertical: 30, alignItems: 'center' }}>
                  <Text >No more posts</Text>
                </View>
              )}
            </ScrollView>
          </View>
        ))}
   
      </ScrollView>

      <PostModal
        isVisible={modalVisible}
        post={selectedPost}
        onClose={() => setModalVisible(false)}
      />

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

})