import { supabase } from "../lib/supabase"
import { createNotification } from './notificationService'

export const createOrUpdatePost = async (post)=>{

    try{
        const {data, error} = await supabase
        .from('posts')
        .upsert(post)
        .select()
        .single()
    
        if(error){
            return {success: false, msg: 'could not create your post'}
        }
    
    
        return {success: true, data: data}
    }
    catch(error){
        return {success: false, msg: 'Could not create your post' }
    }
 


}

export const createPostLike= async (postLike) => {
    try{    
        const { data, error } = await supabase
        .from('postLikes')
        .insert(postLike)
        .select()
        .single()

        if(error){
            return {success: false, msg: 'Could not like the post'}
        }

                // create a notification for the post owner when their post is liked
                try{
                    const notification = {
                        receiverId: data.postOwnerId || data.post?.userId || postLike.postOwnerId || null,
                        senderId: postLike.userId,
                        type: 'like',
                        message: 'Your post was liked',
                        postId: data.postId || postLike.postId,
                        created_at: new Date().toISOString()
                    }
                    if(notification.receiverId){
                        await createNotification(notification)
                    }
                }catch(err){
                    // non-fatal: don't block like on notification failure
                    console.warn('createNotification failed', err)
                }
  
        return {success: true, data: data}
    }
    catch(error) {
        return {success: false, msg: 'Could not like the post'}

    }

}

export const removePostLike = async (userId, postId) => {
    try{    
        const { error } = await supabase
        .from('postLikes')
        .delete()
        .eq('userId', userId)
        .eq('postId', postId)

        if(error){
           return {success: false, msg: error}
        }
  
        return {success: true}
    }
    catch(error) {
      return {success: false, msg: 'Could not unlike the post'}

    }

};