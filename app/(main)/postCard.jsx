import { StyleSheet, Text, View, TouchableOpacity} from 'react-native'
import { Card } from 'react-native-paper'
import React from 'react'
import Avatar from '../../components/Avatar'
import RenderHTML from 'react-native-render-html'
import { wp } from '../../helpers/common'
import Icon from '../../assets/icons'
import { theme } from '../../constants/theme'
import { useState } from 'react'

const PostCard = ({item, user, router}) => {


    const leftComponent = ({ size }) => (
        <Avatar
          uri={user?.profile_image}
          style={{ width: size, height: size, borderRadius: size / 2 }} />
      );

      const liked = true
      const likes = []

      {console.log(item, 'whats filteredpost in here')}
    
    
  return (
  
    <Card style={{ margin: 20, width: 300 }} key={item.id}>
      <Card.Title
        subtitle={item.users? item.users.name : item.name}
        titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
        subtitleStyle={{ fontSize: 14 }}
        left={leftComponent}
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
          <Icon name="hexagonIcon" fill={liked? theme.colors.yellow : theme.colors.textLight} color={liked? theme.colors.yellow : theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.count}>
          {
            likes?.length
          }
        </Text>

      </Card.Actions>
    </Card>
  )
}

export default PostCard

const styles = StyleSheet.create({})