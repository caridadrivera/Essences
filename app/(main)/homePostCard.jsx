import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { wp, hp } from '../../helpers/common';
import { Card } from 'react-native-paper';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { htmlToText } from 'html-to-text';
import { theme } from '../../constants/theme';
import { BorderFullIcon } from '@hugeicons/react-native-pro';

const HomePostCard = ({ item, router }) => {
    
    const liked = true
    const likes = []

    return (
        <Card style={{ margin: 20, width: 300 }} key={item.id}>
        <Card.Title
          subtitle={item.users? item.users.name : item.name}
          titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
          subtitleStyle={{ fontSize: 14 }}
          left={() => (
            <Pressable onPress={() => router.push({
              pathname: '/users/[id]',
              params: { id: item.users.id, profile_img: item.users.profile_image, background_img: item.users.background_image }
            }
            )}>
              <Avatar uri={item.users.profile_image} />
            </Pressable>
          )}
          right={() => (
            <TouchableOpacity>
              <Icon name="moreIcon" style={{ margin: 18 }} />
            </TouchableOpacity>
          )}
        />
        <Card.Content
          style={{
            margin: 10,
            padding: 10,
            backgroundColor: 'lightgrey',
            borderRadius: 10,
          }}>
          <Text
            style={{ fontSize: 14 }}
            numberOfLines={3} // Limits the number of lines
            ellipsizeMode="tail"
          >
            {item?.body && (
              <RenderHTML
                contentWidth={wp(100)}
                source={{ html: item?.body }}
              />
            )}
          </Text>
        </Card.Content>
  
        <Card.Actions>
          <TouchableOpacity>
            <Icon name="hexagonIcon" fill={theme.colors.likeYellow}  style={{BorderFullIcon: "bold"}}/>
          </TouchableOpacity>
          <Text style={styles.count}>
            {
              likes?.length
            }
          </Text>
  
        </Card.Actions>
      </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 50,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
    },
    
});

export default HomePostCard;
