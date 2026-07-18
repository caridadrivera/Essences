import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { fetchComments, createComment, deleteComment } from '../services/commentService';
import { theme } from '../constants/theme';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const CommentsSheet = ({ visible, onClose, postId, postAuthorId, onCommentCountChange }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    const res = await fetchComments(postId);
    if (res.success) {
      setComments(res.data);
      onCommentCountChange?.(res.data.length);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await createComment({ postId, userId: user.id, text: text.trim() });
    setSending(false);
    if (res.success) {
      const updated = [...comments, res.data];
      setComments(updated);
      onCommentCountChange?.(updated.length);
      setText('');
    } else {
      Alert.alert('Error', res.msg || 'Could not post comment');
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteComment(commentId, user.id, postAuthorId);
          if (res.success) {
            const updated = comments.filter((c) => c.id !== commentId);
            setComments(updated);
            onCommentCountChange?.(updated.length);
          } else {
            Alert.alert('Error', res.msg || 'Could not delete comment');
          }
        },
      },
    ]);
  };

  const renderComment = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={() => {
        if (item.userId === user?.id || postAuthorId === user?.id) handleDeleteComment(item.id);
      }}
    >
      <View style={styles.commentRow}>
        <Avatar
          uri={item.users?.profile_image}
          size={32}
          style={styles.commentAvatar}
        />
        <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{item.users?.name || 'User'}</Text>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
        <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title}>Comments</Text>

            <FlatList
              data={comments}
              keyExtractor={(item) => item.id?.toString()}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.empty}>No comments yet. Be the first!</Text>
              }
              renderItem={renderComment}
            />

            <View style={styles.inputRow}>
              <Avatar uri={user?.profile_image} size={30} style={styles.inputAvatar} />
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor={theme.colors.textLight}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                disabled={!text.trim() || sending}
              >
                <Text style={styles.sendText}>Post</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.darkLight,
    alignSelf: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
    marginBottom: 12,
    color: theme.colors.textDark,
  },
  list: {
    flexGrow: 0,
    maxHeight: 380,
  },
  listContent: {
    paddingBottom: 8,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.textLight,
    paddingVertical: 24,
    fontSize: 14,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  commentAvatar: {
    marginRight: 8,
    borderRadius: 16,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: theme.colors.gray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAuthor: {
    fontWeight: theme.fonts.semibold,
    fontSize: 12,
    color: theme.colors.textDark,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginLeft: 6,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.darkLight,
    paddingTop: 10,
    marginTop: 4,
    gap: 8,
  },
  inputAvatar: {
    borderRadius: 15,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textDark,
    backgroundColor: theme.colors.gray,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.darkLight,
  },
  sendText: {
    color: '#fff',
    fontWeight: theme.fonts.semibold,
    fontSize: 13,
  },
});

export default CommentsSheet;
