import { StatusBar, StyleSheet, Text, View, Image, SafeAreaView, ScrollView, Pressable, TouchableOpacity} from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import ButtonComponent from '../../components/Button'
import { Alert } from 'react-native'
import { theme } from '../../constants/theme'
import profilePic from '../../assets/images/download.jpeg'
import bgImg from '../../assets/images/bg.jpeg'
import Topics from './topics'
import { PaperProvider, Card } from 'react-native-paper'
import LogOutButton from '../../components/LogOutButton'
import UserProfileButton from '../../components/UserProfileButton'
import LikeButton from '../../components/likeButton'
import { router } from 'expo-router'
import { hp, wp } from '../../helpers/common'
import AddButton from '../../components/AddButton'
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import PostModal from './postModal'


const Home = ({posts}) => {
  const [topics, setTopics] = useState([]);
  const [postsByTopic, setPostsByTopic] = useState({});
  const {user, setAuth} = useAuth();

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
      const topicPosts = await fetchPosts(topic);
      postsByTopic[topic.id] = topicPosts;
    }

    setPostsByTopic(postsByTopic);
  };


  const fetchPosts = async (topic) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (
          name
        )
      `)
      .eq('topicId', topic.id)
    if (error) {
      console.error(`Error fetching posts for topic ${topic.id}:`, error);
      return [];
    }

    return data;
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
};


  const leftComponent = ({ size }) => (
    //on click of left image, push to User profile sending filteredPost.userId to get images and posts for that specific user
    <Avatar 
    uri={user?.profile_image} 
    style={{ width: size, height: size, borderRadius: size / 2 }}/>
  
  );

  return (
 
     <ScreenWrapper> 
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Essences</Text>  
            <Pressable onPress={()=>{router.push('editProfile') } }>
              <Icon name="settingsIcon"/>
            </Pressable>  
          </View>
            
          <View style={styles.icons}>
            <Pressable onPress={()=>{router.push('userProfile') } } style={styles.buttonStyle} >
              <Avatar
                uri={user?.profile_image}
                size={hp(4.3)}
                rounded={theme.radius.sm}
                style={{borderWidth: 2}}/>
            </Pressable> 
            <LikeButton/>
            <LogOutButton/>
          </View>    
        </View>
        {/* user profile component will be used in two ways: 
          when clicking userProfile icon under the profile pic,
         I take the userId of the logged in user. if click on image on card (leftComponent),
          grab post.userId 
         and get that users obj to display userprofile)*/}
        <ScrollView  style={styles.postsContainer}>
          {topics.map(topic => (
            <View key={topic.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: 'bold'}}>{topic.title}</Text>
                <AddButton/>
              </View>
              <ScrollView horizontal={true}>
                {(postsByTopic[topic.id] || []).map(filteredPost => (   
                  <TouchableOpacity key={filteredPost.id} onPress={() => openModal(filteredPost)}>   
                    <Card style={{ margin: 20, width: 300, height: 200}} key={filteredPost.id}>
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
                          ellipsizeMode="tail" >{filteredPost.body}</Text>
                      </Card.Content>
                    </Card>
                </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}

          <PostModal
                isVisible={modalVisible}
                post={selectedPost}
                onClose={() => setModalVisible(false)}
            />
        </ScrollView>
      </View>
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
  headerText:{
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
    shadowOffset: {width: 0, height: 5},
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
  }
  

})