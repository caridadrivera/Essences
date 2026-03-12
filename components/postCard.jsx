import { StyleSheet, Text, View, TouchableOpacity, Modal, Pressable, Alert, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Avatar from './Avatar';
import RenderHTML from 'react-native-render-html';
import { wp } from '../helpers/common';
import Icon from '../assets/icons';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { createPostLike, removePostLike } from '../services/postService';
import { createRepost, removeRepost } from '../services/repostService';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import CommentsSheet from './CommentsSheet';

const PostCard = ({ item, setIsPostDeleted }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [likes, setLikes] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (item?.postLikes) setLikes(item.postLikes);
  }, [item]);

  useEffect(() => {
    if (!item?.id) return;
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('postId', item.id)
      .then(({ count }) => {
        if (count !== null) setCommentCount(count);
      });
  }, [item?.id]);

  useEffect(() => {
    if (!item?.id) return;
    supabase
      .from('reposts')
      .select('id, userId')
      .eq('postId', item.id)
      .then(({ data, error }) => {
       if (data) setReposts(data);
      });
  }, [item?.id]);

  const htmlSource = useMemo(() => ({ html: item.body || '' }), [item.body]);

  const liked = likes?.some(like => like.userId === user?.id);
  const isReposted = reposts?.some((r) => r.userId === user?.id);

  const onLike = async () => {
    const previousLikes = [...likes];
    if (!user?.id || !item?.id) return;
    if (liked) {
      const updatedLikes = likes.filter(like => like.userId !== user.id);
      setLikes(updatedLikes);
      const res = await removePostLike(user.id, item.id);
      if (!res.success) setLikes(previousLikes);
    } else {
      const newLike = { userId: user.id, postId: item.id };
      setLikes([...likes, newLike]);
      const res = await createPostLike(newLike);
      if (!res.success) setLikes(previousLikes);
    }
  };

  const onRepost = async () => {
    if (!user?.id || !item?.id) return;
    const previousReposts = [...reposts];
    if (isReposted) {
      setReposts(reposts.filter((r) => r.userId !== user.id));
      const res = await removeRepost(user.id, item.id);
      if (!res.success) setReposts(previousReposts);
    } else {
      const newRepost = { userId: user.id, postId: item.id };
      setReposts([...reposts, newRepost]);
      const res = await createRepost(newRepost);
      if (!res.success) setReposts(previousReposts);
    }
  };

  const openMenu = () => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const MENU_WIDTH = 160;
    const estimatedMenuHeight = 60;

    if (!iconRef.current || !iconRef.current.measure) {
      const left = Math.max(8, Math.min((screenWidth - MENU_WIDTH) / 2, screenWidth - MENU_WIDTH - 8));
      const top = Math.max(8, Math.min(80, screenHeight - estimatedMenuHeight - 8));
      setMenuPosition({ top, left });
      setMenuVisible(true);
      return;
    }

    iconRef.current.measure((fx, fy, width, height, px, py) => {
      let left = px;
      if (left + MENU_WIDTH > screenWidth - 8) left = Math.max(8, screenWidth - MENU_WIDTH - 8);
      if (left < 8) left = 8;
      let top = py + height;
      if (top + estimatedMenuHeight > screenHeight - 8) top = Math.max(8, py - estimatedMenuHeight);
      setMenuPosition({ top, left });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => setMenuVisible(false);

  const handleFlag = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ isFlagged: true })
        .match({ id: item.id, userId: user.id });
      if (error) throw error;
      Alert.alert('Flag', 'This post has been flagged');
      router.push('/features/screens/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async () => {
    try {
      if (!user?.id) throw new Error('Not authorized');
      const { error } = await supabase
        .from('posts')
        .delete()
        .match({ id: item.id, userId: user.id });
      if (error) throw error;
      Alert.alert('Deleted', 'Post deleted');
      setIsPostDeleted(true);
      setMenuVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.card}>
      {item?.isRepost && (
        <View style={styles.repostBanner}>
          <Icon name="repostIcon" size={14} color={theme.colors.textLight} />
          <Text style={styles.repostText}>Reposted</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/users/[id]',
              params: {
                id: item?.users?.id,
                profile_img: item?.users?.profile_image,
                background_img: item?.users?.background_image,
                user_name: item?.users?.name,
                user_bio: item?.users?.bio,
              },
            })
          }
        >
          <Avatar
            uri={item?.users?.profile_image}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', fontSize: 13 }}>{item?.users?.name || item?.name}</Text>
            <TouchableOpacity ref={iconRef} onPress={openMenu}>
              <Text style={{ fontSize: 18, color: '#999' }}>⋯</Text>
            </TouchableOpacity>

            {menuVisible && (
              <Modal transparent animationType="fade" visible={menuVisible}>
                <Pressable
                  style={styles.overlay}
                  onPress={(e) => {
                    e.stopPropagation();
                    closeMenu();
                  }}
                >
                  <View style={[styles.menu, { top: menuPosition.top, left: menuPosition.left }]}>
                    {user?.id === item?.users?.id ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          closeMenu();
                          handleDelete();
                        }}
                        style={styles.menuItem}
                      >
                        <Text style={styles.menuText}>Delete</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          closeMenu();
                          handleFlag();
                        }}
                        style={styles.menuItem}
                      >
                        <Text style={styles.menuText}>Flag</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Pressable>
              </Modal>
            )}
          </View>

          <View style={{ marginTop: 6 }}>
            {item?.body ? (
              <RenderHTML
                contentWidth={wp(100)}
                source={htmlSource}
                baseStyle={{ fontSize: 14, lineHeight: 20, color: '#333' }}
              />
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setCommentsVisible(true)} style={styles.actionBtn}>
              <Icon name="commentIcon" size={20} color="#777" />
              <Text style={styles.actionCount}>{commentCount || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRepost} style={styles.actionBtn}>
              <Icon
                name="repostIcon"
                size={20}
                color={isReposted ? theme.colors.primaryDark : '#777'}
              />
              <Text style={[styles.actionCount, isReposted && { color: theme.colors.primaryDark }]}>
                {reposts?.length || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLike} style={styles.actionBtn}>
              <Icon name="hexagonIcon" size={20} fill={liked ? 'yellow' : 'white'} />
              <Text style={styles.actionCount}>{likes?.length || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CommentsSheet
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        postId={item?.id}
        onCommentCountChange={(count) => setCommentCount(count)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginVertical: 8,
    marginHorizontal: 2,
  },
  overlay: { flex: 1 },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 140,
  },
  menuItem: { paddingVertical: 8, paddingHorizontal: 12 },
  menuText: { fontSize: 14, color: '#333' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    gap: 14,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 12, color: '#777' },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  repostText: { fontSize: 12, color: theme.colors.textLight },
});

export default React.memo(PostCard);
