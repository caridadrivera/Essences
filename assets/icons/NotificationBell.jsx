import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

const NotificationBell = (props) => (
  <Svg viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 21h4"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
)

export default NotificationBell