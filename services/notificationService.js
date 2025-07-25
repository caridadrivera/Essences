import { supabase } from "../lib/supabase";


export const createNotification = async (notification) => {
    try{    
        const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()

        if(error){
            return {success: false, msg: 'Error with notification'}
        }
  
        return {success: true, data: data}
    }
    catch(error) {
        return {success: false, msg: 'Could not like the post'}
    }

  }





  export const fetchNotifications = async (receiverId) =>{
    try{
      const {data, error} = await supabase
      .from('notifications')
      .select(`
        *, 
        sender: senderId(id, name, profile_image),
        created_at 
        `)
      .eq('receiverId', receiverId)
      .order("created_at", {ascending: false});

      if(error){
        return {success: false, msg: error?.message}
      }
      return {success: true, data: data}
    }
    catch(error){
        return {success: false, msg: error?.message}
    }
}


export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('myNotificationChannel', {
      name: 'A channel is needed for the permissions prompt to appear',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}