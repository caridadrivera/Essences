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