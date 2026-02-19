import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';

import Avatar from './Avatar';
import RenderHTML from 'react-native-render-html';
import { wp } from '../helpers/common';
import Icon from '../assets/icons';
import { useAuth } from '../context/AuthContext';
import { createPostLike, removePostLike } from '../services/postService';

const PostCard = ({ item, openPostMenu }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    if (item?.postLikes) setLikes(item.postLikes);
  }, [item]);

  const liked = likes?.some(like => like.userId === user?.id);

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

  return (
    <View style={{ backgroundColor: '#fff', borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row' }}>
        <Avatar uri={item?.user.profile_image} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', fontSize: 15 }}>{item.user?.name || item.name}</Text>
            <TouchableOpacity onPress={openPostMenu}>
              <Text style={{ fontSize: 20, color: '#999' }}>⋯</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 8 }}>
            {item?.body && (
              <RenderHTML contentWidth={wp(100)} source={{ html: item?.body }} baseStyle={{ fontSize: 15, lineHeight: 22, color: '#333' }} />
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity onPress={onLike} style={{ marginRight: 8 }}>
              <Icon name="hexagonIcon" fill={liked ? 'yellow' : 'white'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 13, color: '#777' }}>{likes?.length || 0}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PostCard;
