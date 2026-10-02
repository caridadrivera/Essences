import { StyleSheet, Text, View, Modal, TouchableOpacity, Pressable, Dimensions, TouchableWithoutFeedback, Keyboard, Alert, FlatList } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { theme } from '../../../../constants/theme'
import { supabase } from '../../../../lib/supabase'
import Avatar from '../../../../components/Avatar'
import BackButton from '../../../../components/BackButton'
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
import { createOrUpdatePost } from '../../../../services/postService'
import { canPostContent } from '../../../../services/moderationService'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import TopicTabs from '../../../../components/TopicTabs'



const userProfile = () => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const [selectedTopicId, setSelectedTopicId] = useState(null)
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



  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      await fetchTopics();
      // reset delete flag after refresh so future deletes re-trigger
      setIsPostDeleted(false)
    };

    fetchData();
    setbgImage(getUserImage(background_img))

    const postChannel = supabase
      .channel('realtime:posts') // good practice to prefix channels uniquely
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handlePostEvent)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, handlePostDelete)
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

      // match the shape returned by `fetchPosts` and PostCard which expect `users`
      newPost.users = response.success ? response.data : {};
      newPost.postLikes = newPost.postLikes || [];

      setPostsByTopic((prev) => ({
        ...prev,
        [newPost.topicId]: [newPost, ...(prev[newPost.topicId] || [])]
      }));

    }
  };

  const handlePostDelete = (payload) => {
    if (payload?.old?.id) {
      const deletedPostId = payload.old.id;
      const deletedTopicId = payload.old.topicId;

      setPostsByTopic((prev) => ({
        ...prev,
        [deletedTopicId]: (prev[deletedTopicId] || []).filter(
          (post) => post.id !== deletedPostId
        )
      }));
    }
  };


  const fetchPosts = async (topic) => {
    if (!user) return [];

    // Fetch user's own posts
    const { data: ownPosts, error: ownError } = await supabase
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
      .order('created_at', { ascending: false });

    if (ownError) {
      console.error(`Error fetching posts for topic ${topic.id}:`, ownError);
      return [];
    }

    // Fetch reposted posts — get repost rows then fetch each post
    const { data: repostRows, error: repostError } = await supabase
      .from('reposts')
      .select('postId, created_at')
      .eq('userId', user.id);

    let repostPostIds = [];
    let repostDateMap = {};
    if (!repostError && repostRows) {
      repostPostIds = repostRows.map((r) => r.postId);
      repostRows.forEach((r) => { repostDateMap[r.postId] = r.created_at; });
    }

    let repostedPostsData = [];
    if (repostPostIds.length > 0) {
      const { data: rpData, error: rpError } = await supabase
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
        .in('id', repostPostIds);
      if (!rpError && rpData) repostedPostsData = rpData;
    }

    let repostedPosts = repostedPostsData
      .filter((p) => String(p.topicId) === String(topic.id))
      .map((p) => ({ ...p, isRepost: true, repostedAt: repostDateMap[p.id] }));

    // Merge and sort by most recent first
    const merged = [...ownPosts, ...repostedPosts].sort(
      (a, b) => new Date(b.repostedAt || b.created_at) - new Date(a.repostedAt || a.created_at)
    );

    return merged;
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
    if (data?.length) setSelectedTopicId(prev => prev ?? data[0].id)
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

  const onTopicChange = (topicId, posts) => {
    setSelectedTopicId(topicId)
    setPostsByTopic(prev => ({ ...prev, [topicId]: posts }))
  }

  const selectedHive = topics.find(topic => topic.id === selectedTopicId)
  const selectedPosts = postsByTopic[selectedTopicId] || []
  const storiesLoaded = Boolean(selectedTopicId && Object.prototype.hasOwnProperty.call(postsByTopic, selectedTopicId))
  const topicCounts = Object.fromEntries(
    topics.map(topic => [topic.id, postsByTopic[topic.id]?.length])
  )

  const closeMenus = () => {
    setBottomSheetType(null);

  };


  const onSubmit = async () => {
    if (!bodyRef.current) {
      Alert.alert("Post", "Your post is empty :(");
      return;
    }

    try {
      const moderationCheck = await canPostContent(bodyRef.current);

      if (!moderationCheck.canPost) {
        Alert.alert('Content Policy', moderationCheck.message)
        return
      }

      const data = {
        body: bodyRef.current,
        userId: user?.id,
        topicId: selectedTopic, // ✅ use correct ID
      };

      setBottomSheetType(null);
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
    <ScreenWrapper bg={theme.colors.surfaceBase}>
      <View style={styles.header}>
        <View style={styles.backgroundImgContainer}>
          <Image
            source={bgImage}
            style={{
              height: 228,
              width: "100%"
            }} />
          <BackButton router={router} fallbackRoute="/features/screens/home" />
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
                      router.push('/features/screens/blocked-users');
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
      <View style={styles.profileSummary}>
        {!!name && <Text style={styles.profileName}>{name}</Text>}
        {!!bio?.trim() && <Text style={styles.profileBio}>{bio}</Text>}
      </View>
      <View style={styles.contentContainer}>
        {topics.length > 0 ? (
          <View style={styles.topicHeader}>
          <TopicTabs
            topics={topics}
            fetchPosts={fetchPosts}
            user={user}
            initialTopicId={selectedTopicId}
            onPostsLoaded={onTopicChange}
            onTopicSelect={setSelectedTopicId}
            topicCounts={topicCounts}
          />
          </View>
        ) : (
          <View style={styles.emptyHiveState}>
            <Text style={styles.emptyHiveText}>Your Hives will appear here.</Text>
          </View>
        )}

        <View style={styles.postsWrapper}>
          <View style={styles.storiesHeader}>
            <View style={styles.storiesHeadingText}>
              <Text style={styles.sectionEyebrow}>IN {selectedHive?.title?.toUpperCase() || 'YOUR HIVES'}</Text>
              <View style={styles.storiesTitleRow}>
                <Text style={styles.sectionTitle}>Stories</Text>
                {storiesLoaded && <Text style={styles.storyCount}>{selectedPosts.length}</Text>}
              </View>
            </View>
            {storiesLoaded && selectedPosts.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedTopic(selectedTopicId)
                  setBottomSheetType('newPost')
                }}
                style={styles.writeStoryButton}
                accessibilityRole="button"
                accessibilityLabel={`Write a story${selectedHive ? ` in ${selectedHive.title}` : ''}`}
              >
                <Icon name="plusIcon" size={17} color={theme.colors.surfaceRaised} />
                <Text style={styles.writeStoryText}>Write story</Text>
              </TouchableOpacity>
            )}
          </View>

          {topics.length === 0 ? (
            <View style={styles.emptyStoriesState}>
              <Text style={styles.emptyStoriesTitle}>Your story space is ready</Text>
              <Text style={styles.emptyStoriesCopy}>Choose or join a Hive to start collecting stories here.</Text>
            </View>
          ) : storiesLoaded && selectedPosts.length > 0 ? (
            <FlatList
              data={selectedPosts}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={({ item }) => <PostCard item={item} setIsPostDeleted={setIsPostDeleted} />}
              contentContainerStyle={styles.storyListContent}
              showsVerticalScrollIndicator={false}
            />
          ) : storiesLoaded ? (
            <View style={styles.emptyStoriesState}>
              <View style={styles.emptyStoryMark}>
                <Icon name="hexResonate" size={24} active />
              </View>
              <Text style={styles.emptyStoriesTitle}>No stories in this Hive yet</Text>
              <Text style={styles.emptyStoriesCopy}>Start the conversation with a story of your own.</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedTopic(selectedTopicId)
                  setBottomSheetType('newPost')
                }}
                style={styles.emptyWriteButton}
                accessibilityRole="button"
              >
                <Text style={styles.emptyWriteText}>Write the first story</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loadingStoriesState}>
              <Loading />
            </View>
          )}
        </View>
      </View>
      {bottomSheetType && (
        <Modal transparent animationType="slide" visible onRequestClose={closeMenus}>
          <KeyboardAwareScrollView
            contentContainerStyle={{ flex: 1 }}
            enableOnAndroid={true}
            extraScrollHeight={200}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={closeMenus}>
              <Pressable style={styles.overlay} onPress={closeMenus}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <Pressable style={styles.bottomSheet}>
                    <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body} />
                    <TouchableOpacity
                      style={[styles.button, styles.buttonClose]}
                      onPress={onSubmit}
                    >
                      <Text style={styles.textStyle}>Post</Text>
                    </TouchableOpacity>
                  </Pressable>
                </TouchableWithoutFeedback>
              </Pressable>
            </TouchableWithoutFeedback>
          </KeyboardAwareScrollView>
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
  profileSummary: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: theme.colors.surfaceBase,
  },
  profileName: {
    color: theme.colors.inkPrimary,
    fontFamily: theme.fonts.display,
    fontSize: 24,
    textAlign: 'center',
  },
  profileBio: {
    maxWidth: 340,
    marginTop: 6,
    color: theme.colors.inkSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
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
    backgroundColor: theme.colors.surfaceBase,
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
    fontWeight: 'bold',
    color: 'blue',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 23, 19, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: theme.colors.surfaceRaised,
    padding: 20,
    borderTopLeftRadius: theme.designRadius.lg,
    borderTopRightRadius: theme.designRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    width: '100%',
    minHeight: '80%',
  },
  button: {
    borderRadius: theme.designRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonClose: {
    backgroundColor: theme.colors.rust,
  },
  textStyle: {
    color: "white",
    fontWeight: theme.fonts.bold,
    textAlign: "center",
    fontSize: 15,
  },
  contentContainer: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: theme.colors.surfaceBase,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionEyebrow: {
    color: theme.colors.rust,
    fontSize: 10,
    fontWeight: theme.fonts.bold,
    letterSpacing: 1,
  },
  sectionTitle: {
    marginTop: 2,
    color: theme.colors.inkPrimary,
    fontFamily: theme.fonts.display,
    fontSize: 21,
  },
  sectionMeta: {
    marginBottom: 3,
    color: theme.colors.inkSecondary,
    fontSize: 12,
  },
  topicHeader: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  emptyHiveState: {
    minHeight: 52,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  emptyHiveText: {
    color: theme.colors.inkSecondary,
    fontSize: 13,
  },
  postsWrapper: {
    flex: 1,
    minHeight: 0,
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 8,
  },
  storiesHeadingText: {
    flex: 1,
    minWidth: 0,
  },
  storiesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyCount: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
    borderRadius: theme.designRadius.full,
    backgroundColor: theme.colors.peach,
    color: theme.colors.inkPrimary,
    fontSize: 11,
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
  },
  writeStoryButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: theme.designRadius.full,
    backgroundColor: theme.colors.rust,
  },
  writeStoryText: {
    color: theme.colors.surfaceRaised,
    fontSize: 12,
    fontWeight: theme.fonts.semibold,
  },
  storyListContent: {
    paddingTop: 2,
    paddingBottom: 20,
  },
  emptyStoriesState: {
    flex: 1,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  emptyStoryMark: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderRadius: theme.designRadius.full,
    backgroundColor: theme.colors.sage,
  },
  emptyStoriesTitle: {
    color: theme.colors.inkPrimary,
    fontFamily: theme.fonts.display,
    fontSize: 18,
    textAlign: 'center',
  },
  emptyStoriesCopy: {
    marginTop: 5,
    color: theme.colors.inkSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyWriteButton: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: theme.designRadius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  emptyWriteText: {
    color: theme.colors.inkPrimary,
    fontSize: 12,
    fontWeight: theme.fonts.semibold,
  },
  loadingStoriesState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})