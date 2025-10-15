import { useRouter, useLocalSearchParams } from 'expo-router';
import PostCard from '../postCard';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, TouchableNativeFeedback, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { theme } from '../../../constants/theme';
import Icon from '../../../assets/icons';
import RichTextEditor from '../../../components/RichTextEditor';
import { useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { analyzeText } from '../../../services/perspecticeService';
import { createOrUpdatePost } from '../../../services/postService';
import { getUserData } from '../../../services/userService';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';



const PostsByTopic = () => {
  const router = useRouter();
  const { topicId, title } = useLocalSearchParams();
  const [posts, setPosts] = useState([]);
  const [bottomSheetType, setBottomSheetType] = useState(null); // 'topic' | 'post' | 'newPost'
  const [selectedPost, setSelectedPost] = useState(null);
  const bodyRef = useRef("")
  const editorRef = useRef("")
  const [loading, setLoading] = useState(false)
  const [toxicityScore, setToxicityScore] = useState(null);
  const { user, setAuth } = useAuth();
  const [postModalVisible, setPostModalVisible] = useState(false);



  useEffect(() => {
    if (!topicId || !user) return;

    getPostsByTopic();

    const postChannel = supabase
      .channel('realtime:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handlePostEvent)
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
    };
  }, [topicId, user]);

  const onSubmit = async () => {
    if (!bodyRef.current) {
      Alert.alert("Post", "Your post is empty :(")
      return
    }

    try {
      const score = await analyzeText(bodyRef.current);

      setToxicityScore(score);

      if (score > 0.7) {
        Alert.alert('Warning', 'The content is considered toxic. It may be taken down');
        const data = {
          body: bodyRef.current,
          userId: user?.id,
          topicId: topicId,
          isToxic: true
        }
        processPost(data)

      } else {
        const data = {
          body: bodyRef.current,
          userId: user?.id,
          topicId: topicId,
          isToxic: false
        }
        processPost(data);
        setBottomSheetType(null);
      }

    } catch (error) {
      Alert.alert('Error', 'Unable to analyze the content.');
    }

  }

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
  const getPostsByTopic = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users (name, id, profile_image),
        postLikes(*)
      `)
      .eq('topicId', topicId)
      .order('created_at', { ascending: false });

    if (!error) setPosts(data);
  };

  const handleDelete = async (postId) => {
    try {
      await supabase.from('posts').delete().match({ id: postId });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      Alert.alert('Deleted', 'Post has been deleted.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFlag = async (postId) => {
    try {
      await supabase.from('posts').update({ isFlagged: true }).match({ id: postId });
      Alert.alert('Flagged', 'Post has been flagged.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const closeMenus = () => {
    setBottomSheetType(null);
    setSelectedPost(null);
  };



  const addPost = () => {
    setBottomSheetType('newPost');
    setPostModalVisible(true);
  };

  const handlePostEvent = async (payload) => {
    if (payload.eventType === 'INSERT' && payload?.new?.id) {
      let newPost = { ...payload.new };
      const response = await getUserData(newPost.userId);

      newPost.user = response.success ? response.data : {};
      newPost.postLikes = newPost.postLikes || [];

      const topicId = newPost.topicId;
      setPosts((prevPosts) => [newPost, ...prevPosts]);

    }
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Icon name="arrowLeft" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={() => setBottomSheetType('topic')}>
          <Text style={{ fontSize: 20, color: '#999' }}>⋯</Text>
        </TouchableOpacity>
      </View>

      {posts.map((post) => (
        <PostCard
          key={post.id}
          item={post}
          openPostMenu={() => {
            setSelectedPost(post.id);
            setBottomSheetType('post');
          }}
        />
      ))}

      {bottomSheetType && (
        <Modal transparent animationType="slide" visible onRequestClose={closeMenus}>
          <Pressable style={styles.overlay} onPress={closeMenus}>
            <Pressable style={styles.bottomSheet}>
              {bottomSheetType === 'topic' && (
                <>
                  <TouchableOpacity onPress={addPost} style={styles.menuItem}>
                    <Text style={styles.menuText}>Add Post</Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity onPress={closeMenus} style={styles.menuItem}>
                    <Text style={styles.menuText}>Follow Hive</Text>
                  </TouchableOpacity> */}
                </>
              )}
              {bottomSheetType === 'post' && selectedPost && (() => {
                const post = posts.find(p => p.id === selectedPost);
                if (!post) return null;

                return (
                  <>
                    {post.userId === user?.id && (
                      <TouchableOpacity onPress={() => { closeMenus(); handleDelete(selectedPost); }} style={styles.menuItem}>
                        <Text style={styles.menuText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => { closeMenus(); handleFlag(selectedPost); }} style={styles.menuItem}>
                      <Text style={styles.menuText}>Flag</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
              {bottomSheetType === 'newPost' && (
                <>
                  <KeyboardAwareScrollView
                    contentContainerStyle={styles.scrollContainer}
                    enableOnAndroid={true}
                    extraScrollHeight={100}
                    keyboardShouldPersistTaps="handled"
                  >
                    <KeyboardAvoidingView
                      behavior={Platform.OS === "ios" ? "padding" : "height"}
                      style={{ flex: 1 }}
                    >
                      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>


                        <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body} />
                      </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                  </KeyboardAwareScrollView>

                  <TouchableOpacity
                    style={[styles.button, styles.buttonClose]}
                    onPress={onSubmit}
                  >
                    <Text style={styles.textStyle}>Post</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ScreenWrapper>
  );
};

export default PostsByTopic;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
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
  },
});
