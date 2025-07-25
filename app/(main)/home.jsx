import { StyleSheet, Text, View, ScrollView, Pressable, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { theme } from '../../constants/theme'
import { Card } from 'react-native-paper'
import LogOutButton from '../../components/LogOutButton'
import LikeButton from '../../components/likeButton'
import { router } from 'expo-router'
import { hp, wp } from '../../helpers/common'
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import PostModal from './postModal'
import RenderHTML from 'react-native-render-html'
import Loading from '../../components/Loading'
import HomePostCard from './homePostCard'
import { getUserImage } from '../../services/userProfileImage'
import { Image } from 'expo-image'
import { fetchNotifications } from '../../services/notificationService'
import { useNotification } from '../../context/NotificationContext'
import TopicLayout from '../../components/TopicLayout'
import TopicCard from './topicCard'
import { useRouter } from 'expo-router'


const Home = ({ }) => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const { user, setAuth } = useAuth();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const { notificationCount, setNotificationCount } = useNotification()


  useEffect(() => {
    setLoading(true)
    fetchData();
    
  }, []);

 

  const fetchData = async () => {
    await fetchTopics();
    setLoading(false);
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title')
      .is('user_id', null);
      
    if (error) {
      console.error('Error fetching topics:', error);
      return;
    }

    setTopics(data);
    const fetchedPostsByTopic = {};
    for (const topic of data) {
      const topicPosts = await fetchPosts(topic, user);
      fetchedPostsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(fetchedPostsByTopic);
  };


  const fetchPosts = async (topic, user) => {

    const { data: blockedUsers, error: blockError } = await supabase
      .from('blocked_users')
      .select('blocked_user_id')
      .eq('user_id', user.id);

    if (blockError) {
      console.error('Error fetching blocked users:', blockError);
      return [];
    }

    const blockedIds = blockedUsers.map(user => user.blocked_user_id);
    const exclusionIds = [...blockedIds, user.id];

    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          name,
          profile_image,
          background_image,
          id,
          bio
        ),
        postLikes(*)
      `)
      .eq('topicId', topic.id)
      .not('userId', 'in', `(${exclusionIds.join(',')})`)
      .order('created_at', { ascending: false })


    if (error) {
      console.error(`Error fetching posts for topic ${topic.id}:`, error);
      return [];
    }

    return data;
  };
  let iconImg = getUserImage('Essences-2.png?t=2024-09-14T02%3A13%3A17.961Z')

  const handleTopicPress = async (topic) => {

    router.push({
      pathname: `/postsByTopic/${topic.id}`,
      params: { topicId: topic.id, title: topic.title }
    });
  };

  const fetchMorePosts = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title')
      .is('user_id', null);


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
      const topicPosts = await fetchPosts(topic, user);
      postsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(postsByTopic);
  }

  return (


    <ScreenWrapper bg={'white'}>
      <View style={styles.header}>
        <Image source={iconImg} style={{
          height: 108,
          width: "50%"
        }} />

        <View style={styles.icons}>
          <Pressable style={styles.buttonStyle} onPress={() => router.push({
              pathname: 'userProfile',
              params: { user: user, id: user.id, profile_img: user.profile_image, background_img: user.background_image ,name: user.name, bio: user.bio}
            }
            )} >
            <Avatar
              uri={user?.profile_image}
              size={hp(4.3)}
              rounded={theme.radius.sm}
              style={{ borderWidth: 2 }} />
          </Pressable>
          <TouchableOpacity style={styles.relateButton} onPress={() => {
            setNotificationCount(0)
            router.push('notifications')
          }}>
            <Icon name="hexagonIcon" fill={theme.colors.likeYellow} />
            {notificationCount > 0 && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <LogOutButton />
        </View>
      </View>

      {loading ? (
        <View style={{ marginVertical: 0}}>
          <Loading />
        </View>) : (
    <SafeAreaView style={styles.topicContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hives</Text>
      </View>       
          <View  style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
              <FlatList
                data={topics}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={{ paddingVertical: 16 }}
                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}      
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
            <TopicCard topic={item} onPress={() => handleTopicPress(item)} />
          )}
        />
      </View>
    
     </SafeAreaView>
      )}
    </ScreenWrapper>
  )
}

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingLeft: '10px'
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(2),
    borderRadius: 28
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  }
  ,
  relateButton: {
    marginHorizontal: 10,
    padding: 4,
    margin: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
    marginBottom: 10,
    marginRight: 10
  },
  uploadIcon: {
    position: 'absolute',
    marginTop: 38,
    botton: 0,
    padding: 4,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  avantarImg: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4)
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text
  },
  usersButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  buttonStyle: {
    marginHorizontal: 10,
  },
  postsContainer: {
    paddingTop: 28
  },
  pill: {
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold
  },
    topicContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  topicsHeader: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  }

})