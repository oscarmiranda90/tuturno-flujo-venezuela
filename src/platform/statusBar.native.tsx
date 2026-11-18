import {StatusBar as NativeStatusBar} from 'react-native';
export function StatusBar({style}:{style?:string}){return <NativeStatusBar barStyle={style==='light'?'light-content':'dark-content'}/>;}
