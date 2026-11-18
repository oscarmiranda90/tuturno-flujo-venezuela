import {useCallback,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,AppState} from 'react-native';
import Sound from 'react-native-sound';
import storage from '../platform/storage';
const MUTE='tuturno.v20.muted';
const KEYS=['4a','4b','4c_1','4c_2','4c_3','5','6_1','6_2','6_3','7','7b','8','9','10','11'];
export const APPROVED_TUTU_AUDIO:Readonly<Record<string,string>>=Object.fromEntries(KEYS.map(k=>[`tutu_${k}_ve`,`tutu_${k}_ve.mp3`]));
export function useTutuAudio(){
 const [muted,setMuted]=useState(false),[ready,setReady]=useState(false),[key,setKey]=useState<string|null>(null);
 const [playing,setPlaying]=useState(false),[error,setError]=useState<string|null>(null);
 const hydrated=useRef(false),pendingPrint=useRef(false);
 const preference=useRef(false),reader=useRef(false),current=useRef<string|null>(null);
 const voice=useRef<Sound|null>(null),printerMedia=useRef<Sound|null>(null),generation=useRef(0),printerGeneration=useRef(0);
 const stopVoice=useCallback(()=>{generation.current++;voice.current?.release();voice.current=null;setPlaying(false)},[]);
 const stop=useCallback(()=>{pendingPrint.current=false;stopVoice();printerGeneration.current++;printerMedia.current?.release();printerMedia.current=null},[stopVoice]);
 const play=useCallback((k:string)=>{
  stopVoice();if(AppState.currentState!=='active'||preference.current||reader.current||!APPROVED_TUTU_AUDIO[k])return;
  const token=generation.current;setError(null);
  const sound=new Sound(APPROVED_TUTU_AUDIO[k],Sound.MAIN_BUNDLE,(failure)=>{
   if(token!==generation.current){sound.release();return}
   if(failure){setError('No se pudo reproducir el audio.');sound.release();return}
   setPlaying(true);sound.play(success=>{if(token===generation.current){setPlaying(false);if(!success)setError('No se pudo reproducir el audio.')}});
  });voice.current=sound;
 },[stopVoice]);
 const select=useCallback((k:string|null)=>{stopVoice();current.current=k;setKey(k)},[stopVoice]);
 useEffect(()=>{let alive=true;Promise.all([storage.getItem(MUTE),AccessibilityInfo.isScreenReaderEnabled()]).then(([value,enabled])=>{if(!alive)return;preference.current=value==='true';reader.current=enabled;hydrated.current=true;setMuted(preference.current);setReady(true)}).catch(()=>{if(!alive)return;preference.current=true;hydrated.current=true;setMuted(true);setReady(true);setError('No se pudo recuperar la preferencia de audio.')});const sub=AccessibilityInfo.addEventListener('screenReaderChanged',enabled=>{reader.current=enabled;if(enabled)stop()});return()=>{alive=false;sub.remove()}},[stop]);
 useEffect(()=>{if(!ready||!key||muted)return;const timer=setTimeout(()=>play(key),key==='tutu_4a_ve'?0:380);return()=>{clearTimeout(timer);stopVoice()}},[key,ready,muted,play,stopVoice]);
 const toggle=useCallback(()=>{preference.current=!preference.current;setMuted(preference.current);void storage.setItem(MUTE,String(preference.current));stop()},[stop]);
 const replay=useCallback(()=>{if(preference.current){preference.current=false;setMuted(false);void storage.setItem(MUTE,'false')}else if(current.current)play(current.current)},[play]);
 const printer=useCallback(()=>{
  if(!hydrated.current){pendingPrint.current=true;return}
  if(preference.current||reader.current)return;
  const token=++printerGeneration.current;printerMedia.current?.release();
  const sound=new Sound('printer.mp3',Sound.MAIN_BUNDLE,failure=>{if(token!==printerGeneration.current){sound.release();return}if(failure){setError('No se pudo reproducir la tiquetera.');return}sound.play(success=>{if(!success&&token===printerGeneration.current)setError('No se pudo reproducir la tiquetera.')})});printerMedia.current=sound;
 },[]);
 useEffect(()=>{if(ready&&pendingPrint.current){pendingPrint.current=false;printer()}},[ready,printer]);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state!=='active')stop()});return()=>{sub.remove();stop()}},[stop]);
 return {select,stop,stopVoice,toggle,replay,printer,muted,audioKey:key,playing,blocked:false,error};
}
