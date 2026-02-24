import { StyleSheet, Text, View, ScrollView, Pressable, TouchableOpacity, useWindowDimensions, SafeAreaView, StatusBar, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../../../components/ScreenWrapper'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../context/AuthContext'
import { theme } from '../../../../constants/theme'
import LogOutButton from '../../../../components/LogOutButton'
import { router } from 'expo-router'
import { hp, wp } from '../../../../helpers/common'
import Icon from '../../../../assets/icons'
import Avatar from '../../../../components/Avatar'
import Loading from '../../../../components/Loading'
import { getUserImage } from '../../../../services/userProfileImage'
import { Image } from 'expo-image'
import { useNotification } from '../../../../context/NotificationContext'
import { useRouter } from 'expo-router'
import TopicTabs from '../../../../components/TopicTabs'
import PostCard from '../../../../components/postCard'
import PostModal from '../../../../components/postModal'
//on click of a topic, do api call to 

const Home = ({ }) => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const { user, setAuth } = useAuth();
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
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
    if (data?.length) setSelectedTopicId(prev => prev ?? data[0].id)
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
      pathname: `/posts-by-topic/${topic.id}`,
      params: { topicId: topic.id, title: topic.title }
    });
  };

  const onTopicChange = (topicId, posts) =>{
    setSelectedTopicId(topicId)
    setPostsByTopic(prev => ({ ...prev, [topicId]: posts }))
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
              pathname: '/features/screens/user-profile',
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
            router.push('/features/screens/notifications')
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
    <View style={styles.topicContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hives</Text>
      </View>     

        <TopicTabs
          topics={topics}
          fetchPosts={fetchPosts}
          user={user}
          initialTopicId={selectedTopicId}
          onPostsLoaded={onTopicChange}
        />

        <View style={styles.postsWrapper}>
          {postsByTopic[selectedTopicId] && postsByTopic[selectedTopicId].length > 0 ? (
            <FlatList
              data={postsByTopic[selectedTopicId]}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <PostCard item={item} openPostMenu={() => { setSelectedPost(item); setModalVisible(true); }} />
              )}
           />
          ) : (
            <Text style={styles.noPosts}>No posts for this topic..</Text>
          )}
        </View>

     
    
     </View>
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
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.amber
  },
  pillText: {
    color: '#fff',
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

  ,
  simpleTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    width: '100%'
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent'
  }

  ,
  postsWrapper: {
    marginTop: 12,
    flex: 1
  },
  postItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  postTitle: {
    fontSize: hp(2.1),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text
  },
  postExcerpt: {
    marginTop: 6,
    color: theme.colors.textLight
  }

})