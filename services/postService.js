import { supabase } from "../lib/supabase"
import { createNotification } from './notificationService'

export const fetchGlobalTopics = async () => {
    try {
        const { data, error } = await supabase
            .from('topics')
            .select('id, title')
            .is('user_id', null)

        if (error) return { success: false, msg: 'Could not fetch hives' }
        return { success: true, data }
    } catch (error) {
        return { success: false, msg: 'Could not fetch hives' }
    }
}

// Picks the Hive whose title best matches the mood keyword; falls back to the first Hive.
// [ASSUMPTION] Hive titles contain mood-related words (e.g. "Gratitude", "Calm") - not confirmed with product.
export const matchHiveToMood = (topics, mood) => {
    if (!topics?.length) return null
    const byMood = topics.find(t => t.title?.toLowerCase().includes(mood))
    return byMood || topics[0]
}

export const createOrUpdatePost = async (post)=>{

    try{
        const {data, error} = await supabase
                .from('posts')
                .upsert(post)
                .select(`
                    *,
                    users (
                        id,
                        name,
                        profile_image,
                        bio
                    ),
                    postLikes(*)
                `)
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