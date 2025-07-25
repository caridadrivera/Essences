import { StyleSheet, Text, View, FlatList, ScrollView, Alert } from 'react-native'
import React, {useEffect, useState} from 'react'
import { supabase } from '../../lib/supabase';
const topics = () => {
    const [titles, setTitles] = useState([]);

    useEffect(() => {
      const getTitles = async () => {
        const { data, error } = await supabase
          .from('topics')
          .select('id, title');
  
        if (error) {
          Alert.alert('Error', 'Unable to fetch topics.');
        } else {
          setTitles(data);
        }
      };
  
      getTitles();
    }, []);
    
  return (
    <ScrollView style={styles.container}>
    {titles.map(topic => (
     <Post key={topic.id} topic={topic} />
    ))}
  </ScrollView>
  )
}

export default topics

const styles = StyleSheet.create({
 container: {
    flex: 1
 }
})