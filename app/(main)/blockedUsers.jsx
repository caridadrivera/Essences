import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { fetchNotifications } from '../../services/notificationService'
import { useAuth } from '../../context/AuthContext'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import Icon from '../../assets/icons'
import { supabase } from '../../lib/supabase'
import BlockedUserItem from '../../components/BlockedUserItem'

const blockedUsers = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [blockedUsers, setBlockedUsers] = useState([])

  useEffect(() => {
    getBlockedUsers()
    
  }, [])

  const getBlockedUsers = async () => {
    try {
      const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        blocked_user_id,
        created_at,
        users (
          id,
          name,
          profile_image,
          email,
          bio
        )
      `)
      .eq('user_id', user.id); 
  
      if (error) {
        console.error('Error fetching blocked users:', error);
        return [];
      }
      
      setBlockedUsers(data)

    } catch (err) {
      console.error('Unexpected error:', err);
      return [];
    }
  
  }

  


  return (
    <ScreenWrapper>
      <TouchableOpacity style={styles.relateButton} onPress={() => { router.back() }}>
        <Icon name="arrowLeft"></Icon>
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <Text>Blocked Users</Text>
      </View>

      <View style={styles.container}>
        <ScrollView showsVertricalScrollIndicator={false} contentContainerStyle={styles.listStyle}>
          {
            blockedUsers.map(item => {
              return (
                <BlockedUserItem
                  item={item}
                  key={item.id}
                  router={router} />
              )
            })
          }{
            blockedUsers.length === 0 && (
              <Text style={styles.noData}> Looks like you haven't blocked any users yet</Text>
            )
          }
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default blockedUsers

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4)
  },
  listStyle: {
    paddingVertical: 20,
    gap: 10
  },
  noData: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    textAlign: 'center'
  }
})