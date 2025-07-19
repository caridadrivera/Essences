import { useRouter, useLocalSearchParams } from 'expo-router';
import PostCard from '../postCard';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, TouchableOpacity, Modal, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { theme } from '../../../constants/theme';
import Icon from '../../../assets/icons';

const PostsByTopic = () => {
  const router = useRouter();
  const { topicId, title } = useLocalSearchParams();
  const [posts, setPosts] = useState([]);
  const [bottomSheetType, setBottomSheetType] = useState(null); // 'topic' | 'post'
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (!topicId) return;
    getPostsByTopic();
  }, []);

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
                  <TouchableOpacity onPress={closeMenus} style={styles.menuItem}>
                    <Text style={styles.menuText}>Add Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeMenus} style={styles.menuItem}>
                    <Text style={styles.menuText}>Follow Hive</Text>
                  </TouchableOpacity>
                </>
              )}
              {bottomSheetType === 'post' && selectedPost && (
                <>
                  <TouchableOpacity onPress={() => { closeMenus(); handleDelete(selectedPost); }} style={styles.menuItem}>
                    <Text style={styles.menuText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { closeMenus(); handleFlag(selectedPost); }} style={styles.menuItem}>
                    <Text style={styles.menuText}>Flag</Text>
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
    paddingVertical: 20,
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
});
