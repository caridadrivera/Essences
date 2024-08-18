import * as React from "react"
import Svg, { Path } from "react-native-svg";

const UploadImageIcon = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={44} height={44} color="#c7c16c" fill="none" {...props}>
    <Path d="M5 21C9.20998 16.2487 13.9412 9.9475 21 14.6734" stroke="currentColor" strokeWidth="1.5" />
    <Path d="M17 4.50012C17.4915 3.99442 18.7998 2.00012 19.5 2.00012M22 4.50012C21.5085 3.99442 20.2002 2.00012 19.5 2.00012M19.5 2.00012V10.0001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.9999 13C20.998 17.147 20.9472 19.2703 19.6088 20.6088C18.2175 22 15.9783 22 11.5 22C7.02166 22 4.78249 22 3.39124 20.6088C2 19.2175 2 16.9783 2 12.5C2 8.02166 2 5.78249 3.39124 4.39124C4.78249 3 7.02166 3 11.5 3C11.6699 3 14 3.00008 14 3.00008" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export default UploadImageIcon;
