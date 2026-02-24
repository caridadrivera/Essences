import React, { useEffect, useState } from 'react'
import { ScrollView, Pressable, Text, View, ActivityIndicator, StyleSheet } from 'react-native'
import { theme } from '../constants/theme'

const TopicTabs = ({ topics = [], fetchPosts, user, initialTopicId = null, onPostsLoaded }) => {
  const [selectedId, setSelectedId] = useState(initialTopicId)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if(!selectedId && topics?.length) setSelectedId(initialTopicId ?? topics[0].id)
  }, [topics, initialTopicId])

  useEffect(()=>{
    // when selectedId changes, fetch posts for it
    const topic = topics.find(t => t.id === selectedId)
    if(topic && fetchPosts && typeof fetchPosts === 'function'){
      setLoading(true)
      fetchPosts(topic, user).then(posts => {
        setLoading(false)
        onPostsLoaded && onPostsLoaded(topic.id, posts)
      }).catch(()=> setLoading(false))
    }
  }, [selectedId])

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
        {topics.map(topic => (
          <Pressable
            key={topic.id}
            onPress={() => setSelectedId(topic.id)}
            style={[styles.tab, selectedId === topic.id && styles.selectedTab]}
          >
            <Text style={[styles.tabText, selectedId === topic.id && styles.selectedTabText]}>{topic.title}</Text>
            {selectedId === topic.id && loading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectedTab: { backgroundColor: '#1E40AF' },
  tabText: { color: theme.colors.text },
  selectedTabText: { color: '#fff' }
})

export default TopicTabs
