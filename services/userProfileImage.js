export const getUserImage = imagePath =>{
    if(imagePath){
        return {uri: imagePath}
    } else {
        return  require('../assets/images/download.jpeg')
    }
}