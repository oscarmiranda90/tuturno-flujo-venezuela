import React,{useEffect,useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {VenezuelaFlow} from './flow/Flow';
import storage from './platform/storage';
export default function NativeApp({screen,variant}:{screen?:string;variant?:string}) {
 const [restored,setRestored]=useState<{value:unknown}|null>(null);
 useEffect(()=>{storage.getItem('tuturno.v20.demo.san').then(value=>{try{setRestored({value:value?JSON.parse(value):null})}catch{setRestored({value:null})}}).catch(()=>setRestored({value:null}))},[]);
 if(!restored)return null;
 const previous=(restored.value as {screen?:string}|null)?.screen;
 return <SafeAreaProvider><VenezuelaFlow initialScreen={(screen??(previous&&!['1','2','3'].includes(previous)?'4a':'1')) as never} initialVariant={variant as never} savedSan={screen?undefined:restored.value} review /></SafeAreaProvider>;
}
