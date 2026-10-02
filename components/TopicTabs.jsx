import React, { useEffect, useState } from 'react'
import { ScrollView, Pressable, Text, View, ActivityIndicator, StyleSheet } from 'react-native'
import { theme } from '../constants/theme'

const TopicTabs = ({ topics = [], fetchPosts, user, initialTopicId = null, onPostsLoaded, onTopicSelect, topicCounts = {} }) => {
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
            onPress={() => {
              setSelectedId(topic.id)
              onTopicSelect?.(topic.id)
            }}
            style={[styles.tab, selectedId === topic.id && styles.selectedTab]}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedId === topic.id }}
          >
            <Text
              numberOfLines={1}
              style={[styles.tabText, selectedId === topic.id && styles.selectedTabText]}
            >
              {topic.title}
            </Text>
            {Number.isFinite(topicCounts[topic.id]) && (
              <Text style={[styles.tabCount, selectedId === topic.id && styles.selectedTabCount]}>
                {topicCounts[topic.id]}
              </Text>
            )}
            {selectedId === topic.id && loading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  tab: {
    maxWidth: 240,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.designRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceRaised,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectedTab: { backgroundColor: theme.colors.rust, borderColor: theme.colors.rust },
  tabText: { color: theme.colors.inkSecondary, fontSize: 13 },
  selectedTabText: { color: theme.colors.surfaceRaised, fontWeight: theme.fonts.semibold },
  tabCount: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
    borderRadius: theme.designRadius.full,
    backgroundColor: theme.colors.surfaceBase,
    color: theme.colors.inkSecondary,
    fontSize: 10,
    fontWeight: theme.fonts.semibold,
  },
  selectedTabCount: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    color: theme.colors.surfaceRaised,
  }
})

export default TopicTabs
