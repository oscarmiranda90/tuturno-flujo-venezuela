import {useId} from 'react';
import {View,StyleSheet,type ViewProps} from 'react-native';
import Svg,{Defs,LinearGradient as Gradient,Stop,Rect} from 'react-native-svg';
export function LinearGradient({colors,locations,start={x:0,y:0},end={x:0,y:1},style,children,...props}:ViewProps & {colors:readonly string[];locations?:readonly number[];start?:{x:number;y:number};end?:{x:number;y:number}}) {
 const id=useId();
 return <View {...props} style={style}><Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%"><Defs><Gradient id={id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>{colors.map((color,i)=><Stop key={i} offset={locations?.[i]??i/(colors.length-1)} stopColor={color}/>)}</Gradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`}/></Svg>{children}</View>;
}
