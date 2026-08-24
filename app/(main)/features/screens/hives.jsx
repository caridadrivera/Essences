import { StyleSheet, Text, View, Pressable, TouchableOpacity, StatusBar, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../../../components/ScreenWrapper'
import { supabase } from '../../../../lib/supabase'
import { useAuth } from '../../../../context/AuthContext'
import { theme } from '../../../../constants/theme'
import LogOutButton from '../../../../components/LogOutButton'
import { router } from 'expo-router'
import { hp, wp } from '../../../../helpers/common'
import Icon from '../../../../assets/icons'
import Avatar from '../../../../components/Avatar'
import Loading from '../../../../components/Loading'
import { getUserImage } from '../../../../services/userProfileImage'
import { Image } from 'expo-image'
import { useNotification } from '../../../../context/NotificationContext'
import { useRouter } from 'expo-router'
import TopicTabs from '../../../../components/TopicTabs'
import PostCard from '../../../../components/postCard'
import PostModal from '../../../../components/postModal'

const Hives = () => {
  const [topics, setTopics] = useState([])
  const [postsByTopic, setPostsByTopic] = useState({})
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const { user } = useAuth()
  const router = useRouter()
  const [selectedPost, setSelectedPost] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const { notificationCount, setNotificationCount } = useNotification()

  let iconImg = getUserImage('Essences-2.png?t=2024-09-14T02%3A13%3A17.961Z')

  useEffect(() => {
    setLoading(true)
    fetchTopics().then(() => setLoading(false))

    const postChannel = supabase
      .channel('realtime:posts:hives')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, handlePostDelete)
      .subscribe()

    return () => { supabase.removeChannel(postChannel) }
  }, [])

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title')
      .is('user_id', null)
    if (error) { console.error('Error fetching topics:', error); return }
    setTopics(data)
    if (data?.length) setSelectedTopicId(prev => prev ?? data[0].id)
  }

  const fetchPosts = async (topic, user) => {
    const { data: blockedUsers } = await supabase
      .from('blocked_users')
      .select('blocked_user_id')
      .eq('user_id', user.id)

    const blockedIds = (blockedUsers || []).map(u => u.blocked_user_id)
    const exclusionIds = [...blockedIds, user.id]

    const { data, error } = await supabase
      .from('posts')
      .select(`*, users(name, profile_image, background_image, id, bio), postLikes(*)`)
      .eq('topicId', topic.id)
      .not('userId', 'in', `(${exclusionIds.join(',')})`)
      .order('created_at', { ascending: false })

    if (error) { console.error('Error fetching posts:', error); return [] }
    return data
  }

  const onTopicChange = (topicId, posts) => {
    setSelectedTopicId(topicId)
    setPostsByTopic(prev => ({ ...prev, [topicId]: posts }))
  }

  const handlePostDelete = (payload) => {
    if (payload?.old?.id) {
      setPostsByTopic(prev => ({
        ...prev,
        [payload.old.topicId]: (prev[payload.old.topicId] || []).filter(p => p.id !== payload.old.id)
      }))
    }
  }

  return (
    <ScreenWrapper bg={theme.colors.surfaceBase}>
      <View style={styles.header}>
        <Image source={iconImg} style={{ height: 108, width: '50%' }} />
        <View style={styles.icons}>
          <Pressable style={styles.buttonStyle} onPress={() => router.push({
            pathname: '/features/screens/user-profile',
            params: { user, id: user.id, profile_img: user.profile_image, background_img: user.background_image, name: user.name, bio: user.bio }
          })}>
            <Avatar uri={user?.profile_image} size={hp(4.3)} rounded={theme.designRadius.full} style={{ borderWidth: 2, borderColor: theme.colors.hairline }} />
          </Pressable>
          <TouchableOpacity style={styles.relateButton} onPress={() => { setNotificationCount(0); router.push('/features/screens/notifications') }}>
            <Icon name="hexResonate" size={22} active={true} />
            {notificationCount > 0 && (
              <View style={styles.pill}><Text style={styles.pillText}>{notificationCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.relateButton} onPress={() => router.replace('/features/screens/home')}>
            <Icon name="editIcon" size={22} color={theme.colors.inkSecondary} />
          </TouchableOpacity>
          <LogOutButton />
        </View>
      </View>

      {loading ? (
        <View style={{ marginVertical: 0 }}><Loading /></View>
      ) : (
        <View style={styles.topicContainer}>
          <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surfaceBase} />
          <Text style={styles.headerTitle}>Hives</Text>
          <TopicTabs
            topics={topics}
            fetchPosts={fetchPosts}
            user={user}
            initialTopicId={selectedTopicId}
            onPostsLoaded={onTopicChange}
            tabStyle={styles.hiveTab}
            selectedTabStyle={styles.hiveTabSelected}
            tabTextStyle={styles.hiveTabText}
            selectedTabTextStyle={styles.hiveTabTextSelected}
          />
          <View style={styles.postsWrapper}>
            {postsByTopic[selectedTopicId]?.length > 0 ? (
              <FlatList
                data={postsByTopic[selectedTopicId]}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <PostCard item={item} openPostMenu={() => { setSelectedPost(item); setModalVisible(true) }} />
                )}
              />
            ) : (
              <Text style={styles.noPosts}>No posts for this topic yet.</Text>
            )}
          </View>
          {modalVisible && <PostModal post={selectedPost} visible={modalVisible} onClose={() => setModalVisible(false)} />}
        </View>
      )}
    </ScreenWrapper>
  )
}

export default Hives

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(4),
  },
  icons: { flexDirection: 'row', alignItems: 'center' },
  buttonStyle: { marginHorizontal: 8 },
  relateButton: {
    position: 'relative',
    marginHorizontal: 8,
    padding: 4,
    borderRadius: theme.designRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  pill: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.dangerWarm,
  },
  pillText: { color: '#fff', fontSize: hp(1.1), fontWeight: theme.fonts.bold },
  topicContainer: { flex: 1, paddingHorizontal: 16, marginTop: 4, backgroundColor: theme.colors.surfaceBase },
  headerTitle: { fontSize: 24, fontFamily: theme.fonts.display, color: theme.colors.inkPrimary, marginBottom: 8 },
  hiveTab: { borderRadius: theme.designRadius.full, backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.hairline },
  hiveTabSelected: { backgroundColor: theme.colors.inkPrimary, borderColor: theme.colors.inkPrimary },
  hiveTabText: { color: theme.colors.inkSecondary },
  hiveTabTextSelected: { color: theme.colors.surfaceBase },
  postsWrapper: { marginTop: 12, flex: 1 },
  noPosts: { fontSize: hp(2), textAlign: 'center', color: theme.colors.inkSecondary, marginTop: 40 },
})
