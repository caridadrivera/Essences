import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from '../lib/supabase'



export const getUserImage = imagePath =>{
    if(imagePath){
        return getSupabaseFileUrl(imagePath)
    } else {
        return  require('../assets/images/download.jpeg')
    }
}

export const getSupabaseFileUrl = filePath =>{
    const supabaseUrl = 'https://fxogjvujmqcpjdhyiawl.supabase.co'
    if(filePath){
        return {uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`}
    }
    return null
}

export const uploadFile = async (folderName, fileUri, isImage = true) =>{
  try{
    let fileName = getFilePath(folderName, isImage)
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
    })
    let imageData = decode(fileBase64)

    let {data, error} = await supabase
    .storage
    .from('uploads')
    .upload(fileName, imageData, {
        cacheControl: '3600',
        upsert: false, 
        contentType: isImage ? 'image/*' :'video/*'
    })
    if(error){
        console.log('file upload error', error)
        return {success: false, msg: 'could not upload img'}
    }

         return {success: true, data: data.path}

  }catch(error){
    return {success: false, msg: 'could not upload'}
  }
}

export const getFilePath = (folderName, isImage)=>{
    return `${folderName}/${(new Date()).getTime()}${isImage ? '.png' : '.mp4'}`
}