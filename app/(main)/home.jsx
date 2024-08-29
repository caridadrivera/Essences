import { StyleSheet, Text, View, ScrollView, Pressable, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { theme } from '../../constants/theme'
import { Card } from 'react-native-paper'
import LogOutButton from '../../components/LogOutButton'
import LikeButton from '../../components/likeButton'
import { router } from 'expo-router'
import { hp, wp } from '../../helpers/common'
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import PostModal from './postModal'
import RenderHTML from 'react-native-render-html'
import Loading from '../../components/Loading'

const Home = ({ filteredPost }) => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const { user, setAuth } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      await fetchTopics();
      setLoading(false);
    };
    fetchData();
  }, [user]);


  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title');

    if (error) {
      console.error('Error fetching topics:', error);
      return;
    }

    setTopics(data);

    const postsByTopic = {};
    for (const topic of data) {
      const topicPosts = await fetchPosts(topic, user);
      postsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(postsByTopic);
  };


  const fetchPosts = async (topic, user) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          name,
          profile_image,
          background_image,
          id
        )
      `)
      .eq('topicId', topic.id)
      .not('userId', 'eq', user.id);

    if (error) {
      console.error(`Error fetching posts for topic ${topic.id}:`, error);
      return [];
    }

    return data;
  };


  return (

    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Essences</Text>
          <Pressable onPress={() => { router.push('editProfile') }}>
            <Icon name="settingsIcon" />
          </Pressable>
        </View>

        <View style={styles.icons}>
          <Pressable onPress={() => { router.push('userProfile') }} style={styles.buttonStyle} >
            <Avatar
              uri={user?.profile_image}
              size={hp(4.3)}
              rounded={theme.radius.sm}
              style={{ borderWidth: 2 }} />
          </Pressable>
          <LikeButton />
          <LogOutButton />
        </View>
      </View>


      <ScrollView>
        {topics.map(topic => (
          <View key={topic.id}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: 'bold' }}>{topic.title}</Text>
            </View>
            <ScrollView horizontal={true}>
              {(postsByTopic[topic.id] || []).map(filteredPost => (
                <TouchableOpacity key={filteredPost.id} onPress={() => {
                  setSelectedPost(filteredPost);
                  setModalVisible(true);
                }}>

                  <Card style={{ margin: 20, width: 300, height: 200 }} key={filteredPost.id}>
                    <Card.Title
                      subtitle={filteredPost.users.name}
                      titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
                      subtitleStyle={{ fontSize: 14 }}
                      left={() => (
                        <Pressable onPress={() => router.push({
                          pathname: '/users/[id]',
                          params: { id: filteredPost.users.id, profile_img: filteredPost.users.profile_image, background_img: filteredPost.users.background_image }
                        }
                        )}>
                          <Avatar uri={filteredPost.users.profile_image} />
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

                      <View
                        style={{
                          maxHeight: 50,
                        }}
                      >
                        {filteredPost?.body && (
                          
                             <RenderHTML
                            contentWidth={wp(100)}
                            source={{ html: filteredPost?.body }}
                            baseStyle={{
                              fontSize: 14,
                              lineHeight: 20, 
                            }}
                            style={{ maxHeight: hp(10) }} 
                          />

                         
                         
                        )}
                      </View>


                    </Card.Content>

                    <Card.Actions style={styles.footer}>
                      <TouchableOpacity>
                        <Icon name="hexagonIcon" />
                      </TouchableOpacity>

                    </Card.Actions>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
        <View style={{marginVertical: 30}}>
          <Loading/>
        </View>
      </ScrollView>


      <PostModal
        isVisible={modalVisible}
        post={selectedPost}
        onClose={() => setModalVisible(false)}
      />
    </ScreenWrapper>


  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingLeft: '10px'
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(4)
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  }
  ,
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
    marginBottom: 10,
    marginRight: 10
  },
  uploadIcon: {
    position: 'absolute',
    marginTop: 38,
    botton: 0,
    padding: 4,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  avantarImg: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4)
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text
  },
  usersButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  buttonStyle: {
    marginHorizontal: 10,
  },
  postsContainer: {
    paddingTop: 28
  },
  footer: {

  }



})