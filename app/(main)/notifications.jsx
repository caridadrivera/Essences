import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { fetchNotifications } from '../../services/notificationService'
import { useAuth } from '../../context/AuthContext'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import NotificationItem from '../../components/NotificationItem'
import { useRouter } from 'expo-router'
import { Header } from '@react-navigation/stack'
import Icon from '../../assets/icons'


const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    getNotifications()
  }, [])

  const getNotifications = async () => {
    let response = await fetchNotifications(user.id)

    if (response.success) {
      setNotifications(response.data)
    }
  }


  return (
    <ScreenWrapper>

      <TouchableOpacity style={styles.relateButton} onPress={() => { router.back() }}>
        <Icon name="arrowLeft"></Icon>
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <Text >Notifications</Text>
      </View>

      <View style={styles.container}>
        <ScrollView showsVertricalScrollIndicator={false} contentContainerStyle={styles.listStyle}>
          {
            notifications.map(item => {
              return (
                <NotificationItem
                  item={item}
                  key={item.id}
                  router={router} />
              )
            })
          }{
            notifications.length === 0 && (
              <Text style={styles.noData}> No notifications yet</Text>
            )
          }
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default Notifications

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