import type {ReactNode} from 'react';
import {View,StyleSheet} from 'react-native';
import Animated,{useReducedMotion,cubicBezier} from 'react-native-reanimated';
export function PortraitLayer({state,children}:{state:string;children:ReactNode}) {
 const reduced=useReducedMotion();
 return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,{opacity:state==='active'?1:0,zIndex:state==='active'?2:state==='previous'?1:0,transitionProperty:'opacity',transitionDuration:state==='active'?(reduced?200:480):0,transitionDelay:state==='previous'?(reduced?200:480):0,transitionTimingFunction:cubicBezier(0.23,1,0.32,1)}]}>{children}</Animated.View>;
}
export function Testimonials({children}:{children:ReactNode}) {return <View style={{height:84}}>{children}</View>}
export function TestimonialLayer({active,children}:{active:boolean;children:ReactNode}) {
 const reduced=useReducedMotion();
 return <Animated.View accessibilityElementsHidden={!active} importantForAccessibility={active?'auto':'no-hide-descendants'} style={[StyleSheet.absoluteFill,{opacity:active?1:0,transitionProperty:'opacity',transitionDuration:reduced?120:active?180:100,transitionDelay:active&&!reduced?100:0}]}>{children}</Animated.View>;
}
