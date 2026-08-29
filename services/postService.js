import { supabase } from "../lib/supabase"
import { suggestHiveTitle } from './sentimentService'

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

// Finds the Hive whose title contains the mood keyword, or null if none match.
export const matchHiveToMood = (topics, mood) => {
    if (!topics?.length) return null
    return topics.find(t => t.title?.toLowerCase().includes(mood)) || null
}

export const matchHiveByTitle = (topics, requestedTitle) => {
    const requested = requestedTitle?.trim().toLowerCase()
    if (!requested || !topics?.length) return null
    return topics.find(t => t.title?.trim().toLowerCase() === requested)
        || topics.find(t => t.title?.toLowerCase().includes(requested))
        || null
}

// Finds a fitting existing Hive for the mood, or proposes a new one (not yet created) if nothing fits.
export const findOrCreateHiveForMood = async (mood) => {
    const topicsRes = await fetchGlobalTopics()
    if (!topicsRes.success) return { success: false, msg: topicsRes.msg }

    const topics = topicsRes.data
    const existing = matchHiveToMood(topics, mood)
    if (existing) return { success: true, data: existing, isNew: false }

    const suggestedTitle = suggestHiveTitle(mood)
    const duplicate = topics.find(t => t.title?.toLowerCase() === suggestedTitle.toLowerCase())
    if (duplicate) return { success: true, data: duplicate, isNew: false }

    return { success: true, data: { title: suggestedTitle }, isNew: true }
}

// Actually creates the proposed Hive — only called once the user commits to sharing.
export const createHive = async (title) => {
    try {
        const { data, error } = await supabase
            .from('topics')
            .insert({ title, user_id: null })
            .select('id, title')
            .single()

        if (error) return { success: false, msg: 'Could not create a new Hive' }
        return { success: true, data }
    } catch (error) {
        return { success: false, msg: 'Could not create a new Hive' }
    }
}

export const createOrUpdatePost = async (post)=>{

    try{
        if (!post?.userId || !post?.topicId) {
            return { success: false, msg: 'Choose a Hive before posting' }
        }

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
            console.error('Create post error:', error)
            return {success: false, msg: error.message || 'Could not create your post'}
        }
    
    
        return {success: true, data: data}
    }
    catch(error){
        console.error('Create post exception:', error)
        return {success: false, msg: error.message || 'Could not create your post' }
    }
 


}

export const createPostLike = async (postLike) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .insert(postLike)
            .select()
            .single()

        if (error) return { success: false, msg: error.message || 'Could not like the post' }

        return { success: true, data }
    } catch (error) {
        return { success: false, msg: error.message || 'Could not like the post' }
    }
}

export const removePostLike = async (userId, postId) => {
    try {
        const { error } = await supabase
            .from('postLikes')
            .delete()
            .eq('userId', userId)
            .eq('postId', postId)

        if (error) return { success: false, msg: error.message || 'Could not unlike the post' }
        return { success: true }
    } catch (error) {
        return { success: false, msg: error.message || 'Could not unlike the post' }
    }
}