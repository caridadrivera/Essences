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
        console.log('got error:', error)
        return {success: false, msg: error?.message}
    }
}