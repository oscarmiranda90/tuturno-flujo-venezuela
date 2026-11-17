import {View,StyleSheet,type ViewProps} from 'react-native';
export function LinearGradient({colors,locations,start,end,style,...props}:ViewProps & {colors:readonly string[];locations?:readonly number[];start?:{x:number;y:number};end?:{x:number;y:number}}) {
 const angle=start&&end ? Math.atan2(end.x-start.x,-(end.y-start.y))*180/Math.PI : 180;
 const backgroundImage=`linear-gradient(${angle}deg, ${colors.map((c,i)=>c+(locations ? ` ${locations[i]*100}%`:'')).join(',')})`;
 return <View {...props} style={[StyleSheet.flatten(style),{backgroundImage} as never]} />;
}
