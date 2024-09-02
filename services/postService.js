import { supabase } from "../lib/supabase"

export const createOrUpdatePost = async (post)=>{

    try{
        const {data, error} = await supabase
        .from('posts')
        .upsert(post)
        .select()
        .single()
    
        if(error){
            console.log('createPost error: ', error)
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