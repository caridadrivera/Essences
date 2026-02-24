
import ScreenWrapper from '../components/ScreenWrapper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import SignUp from './(main)/features/auth/sign-up'


const index = () => {
  
  return (
    <GestureHandlerRootView>
        <ScreenWrapper>
            <SignUp/>
       </ScreenWrapper >
    </GestureHandlerRootView>
  )
}

export default index