import { StyleSheet, Text, View, SafeAreaView, StatusBar, Modal, TouchableOpacity, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { PaperProvider, Card } from 'react-native-paper'
import { theme } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import Avatar from '../../../components/Avatar'
import BackButton from '../../../components/BackButton'

import { ScrollView } from 'react-native'
import { useAuth } from '../../../context/AuthContext'
import AddButton from '../../../components/AddButton'
import PostModal from '../postModal'
import { Image } from 'expo-image'
import { getUserImage } from '../../../services/userProfileImage'
import NewPost from '../newPost'

import { useRouter, useLocalSearchParams} from 'expo-router';
import Icon from '../../../assets/icons'

const Profile = () => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const { user, setAuth } = useAuth()
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const [bgImage, setbgImage] = useState(null)
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null)

  const router = useRouter()
  const {id} = useLocalSearchParams()
 
  useEffect(() => {
    const fetchData = async () => {
      await fetchTopics();
    };
    fetchData();
    setbgImage(getUserImage(user.background_image))
  }, []);



  const fetchPosts = async (topic) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          name,
          id
        )
      `)
      .eq('topicId', topic.id)
      .eq('userId', id)

    if (error) {
      console.error(`Error fetching posts for topic ${topic.id}:`, error);
      return [];
    }

    return data;
  };

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
      const topicPosts = await fetchPosts(topic);
      postsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(postsByTopic);
  };


  const leftComponent = ({ size }) => (
    <Avatar
      uri={user?.profile_image}
      style={{ width: size, height: size, borderRadius: size / 2 }} />
  );



  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style={styles.statusBar} />
        <View style={styles.backgroundImgContainer}>
          <Image
            source={bgImage}
            style={{
              height: 228,
              width: "100%"
            }} />
          <BackButton router={router} />

        </View>
        <View style={styles.profilePicContainer}>
          <Avatar
            uri={user?.profile_image}
            style={styles.profilePic} />     
        </View>

        <ScrollView>
          {topics.map(topic => (
            <View key={topic.id} style={styles.postsContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: 'bold' }}>{topic.title}</Text>
                <TouchableOpacity key={topic.id} onPress={() => {
                    setSelectedTopic(topic.id);
                    setPostModalVisible(true);
                  }}>
                    <View>
                      <Icon name='plusIcon'/>
                    </View>
                     
                  </TouchableOpacity>
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
                        left={leftComponent}
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
                          numberOfLines={3} 
                          ellipsizeMode="tail">{filteredPost.body}</Text>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
        <PostModal
          isVisible={modalVisible}
          post={selectedPost}
          onClose={() => setModalVisible(false)}
        />

        <NewPost
          isVisible={postModalVisible}
          user={user}
          topicId = {selectedTopic}
          onClose={() => setPostModalVisible(false)}
        />

      </SafeAreaView>
    </PaperProvider>
  )
}

export default Profile


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white'
  },
  statusBar: {
    backgroundColor: theme.colors.dark
  },
  backgroundImgContainer: {
    width: '100%'
  },
  profilePicContainer: {
    flex: 1,
    alignItems: 'center'
  },
  profilePic: {
    height: 155,
    width: 155,
    borderRadius: 999,
    borderBlockColor: theme.colors.primaryDark,
    borderWidth: 2,
    marginTop: -140
  },
  editIcon: {
    position: 'absolute',
    botton: 0,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  postsContainer: {
    paddingTop: 28,
    marginTop: 10
  }

})