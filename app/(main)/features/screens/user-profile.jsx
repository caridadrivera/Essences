import { StyleSheet, Text, View, Modal, TouchableOpacity, Pressable, Dimensions } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { theme } from '../../../../constants/theme'
import { supabase } from '../../../../lib/supabase'
import Avatar from '../../../../components/Avatar'
import { router, useLocalSearchParams } from 'expo-router'
import { ScrollView } from 'react-native'
import Icon from '../../../../assets/icons'
import { Image } from 'expo-image'
import { getUserImage } from '../../../../services/userProfileImage'
import ScreenWrapper from '../../../../components/ScreenWrapper'
import PostCard from '../../../../components/postCard'
import Loading from '../../../../components/Loading'
import { getUserData } from '../../../../services/userService'
import { useAuth } from '../../../../context/AuthContext'
import RichTextEditor from '../../../../components/RichTextEditor'
import { analyzeText } from '../../../../services/perspecticeService'
import { createOrUpdatePost } from '../../../../services/postService'



const userProfile = () => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const { user, setAuth } = useAuth()
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [bgImage, setbgImage] = useState(null)
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const { id, profile_img, background_img, name, bio } = useLocalSearchParams()
  const [isPostDeleted, setIsPostDeleted] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);
  const [postMenuOptionVisible, setPostMenuOptionVisible] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState(null); // 'topic' | 'post' | 'newPost'
  const bodyRef = useRef("")
  const editorRef = useRef("")
  const [loading, setLoading] = useState(false)
  const [toxicityScore, setToxicityScore] = useState(null);



  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      await fetchTopics();
    };

    fetchData();
    setbgImage(getUserImage(background_img))

    const postChannel = supabase
      .channel('realtime:posts') // good practice to prefix channels uniquely
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handlePostEvent)
      .subscribe();


    return () => {
      if (postChannel) {
        supabase.removeChannel(postChannel)
      }

    }
  }, [isPostDeleted, user]);

  const handlePostEvent = async (payload) => {
    if (payload.eventType === 'INSERT' && payload?.new?.id) {
      let newPost = { ...payload.new };
      const response = await getUserData(newPost.userId);

      newPost.user = response.success ? response.data : {};
      newPost.postLikes = newPost.postLikes || [];

      setPostsByTopic((prev) => ({
        ...prev,
        [newPost.topicId]: [newPost, ...(prev[newPost.topicId] || [])]
      }));

    }
  };


  const fetchPosts = async (topic) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users (
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
      .select('id, title, user_id')
      .or(`user_id.is.null,user_id.eq.${user.id}`);

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
      setPostMenuOptionVisible(true);
    });
  };

  const closeMenu = () => {
    setPostMenuOptionVisible(false);
  };


  const fetchMorePosts = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, user_id')

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

  const navigateToBlockedList = () => {
    router.push('/features/screens/blocked-list')
  }

  const closeMenus = () => {
    setBottomSheetType(null);

  };


  const onSubmit = async () => {
    if (!bodyRef.current) {
      Alert.alert("Post", "Your post is empty :(");
      return;
    }

    try {
      const score = await analyzeText(bodyRef.current);
      setToxicityScore(score);

      const data = {
        body: bodyRef.current,
        userId: user?.id,
        topicId: selectedTopic, // ✅ use correct ID
        isToxic: score > 0.7
      };

      if (score > 0.7) {
        Alert.alert('Warning', 'The content is considered toxic. It may be taken down');
      } else {
        setBottomSheetType(null);
      }

      await processPost(data); // ✅ ensure errors bubble up

    } catch (error) {
      Alert.alert('Error', 'Unable to submit the post.');
      console.error("Submit error:", error);
    }
  };

  const processPost = async (data) => {
    setLoading(true)
    let response = await createOrUpdatePost(data)
    setLoading(false)

    if (response.success) {
      bodyRef.current = ''
      editorRef.current?.setContentHTML('');
      setPostModalVisible(false);
    } else {
      Alert.alert('Post', response.msg)
    }
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
          <Pressable onPress={() => router.back()}>
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
            onPress={(e) => {
              openMenu();
            }}
            style={styles.iconButton}>
            <Text style={styles.icon}>⋮</Text>
          </TouchableOpacity>
          {postMenuOptionVisible && (
            <Modal
              transparent={true}
              animationType="fade"
              visible={postMenuOptionVisible}
            >
              <Pressable style={styles.overlay} onPress={(e) => {
                e.stopPropagation();
                closeMenu();
              }}>
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
                    style={styles.menuItem}
                    onPress={(e) => {
                      e.stopPropagation();
                      closeMenu();
                      navigateToBlockedList();
                    }}
                  >
                    <Text style={styles.menuText}>Blocked List</Text>
                  </TouchableOpacity>


                  <TouchableOpacity onPress={() => {
                    router.push('/features/screens/edit-profile')
                    closeMenu();
                  }}
                    style={styles.menuItem}
                  >
                    <Text>Edit profile</Text>
                  </TouchableOpacity>


                </View>
              </Pressable>
            </Modal>
          )}
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold' }}>{name}</Text>
        <Text style={{ fontStyle: 'italic' }}>{bio}</Text>
        <Text style={{ fontWeight: 'bold' }}>__________________</Text>
      </View>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {topics.map(topic => (
          <View key={topic.id} >
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              {topic.user_id === user.id ? <Icon name="hexagonIcon" fill={theme.colors.yellow} /> :
                <Icon name="hexagonIcon" />}
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ margin: 4, fontSize: 18, fontWeight: 'bold' }}>{topic.title}</Text>
                <TouchableOpacity key={topic.id} onPress={() => {
                  setSelectedTopic(topic.id);
                  setBottomSheetType('newPost')
                }}>
                  <View style={{ margin: 4, fontSize: 18, fontWeight: 'bold' }}>
                    <Icon name='plusIcon' />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView horizontal={true} >
              {(postsByTopic[topic.id] && postsByTopic[topic.id].length > 0) ? (postsByTopic[topic.id] || []).map(filteredPost => (

                <PostCard
                  key={filteredPost.id}
                  item={filteredPost}
                  router={router}
                  setIsPostDeleted={setIsPostDeleted} />

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
      {bottomSheetType && (
        <Modal transparent animationType="slide" visible onRequestClose={closeMenus}>
          <Pressable style={styles.overlay} onPress={closeMenus}>
            <Pressable style={styles.bottomSheet}>

              <>
                <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body} />
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={onSubmit}
                >
                  <Text style={styles.textStyle}>Post</Text>
                </TouchableOpacity>
              </>

            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ScreenWrapper>


  )
}

export default userProfile;


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
    color: 'red',
  },
  menuItem: {
    padding: 10,
    borderBottomWidth: 1,  // Add a bottom border
    borderBottomColor: 'gray',
    fontSize: 12
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  button: {
    borderRadius: 10,
    padding: 5,
    elevation: 2,
    margin: 5,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  }


})