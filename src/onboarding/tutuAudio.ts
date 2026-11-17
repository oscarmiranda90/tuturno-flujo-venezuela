import {useCallback,useEffect,useRef,useState} from 'react';
import {createWebVoicePlayer,type WebVoiceStatus} from './webVoicePlayer';
import audio0 from '../../assets/audio/tutu_4a_ve.mp3';
import audio1 from '../../assets/audio/tutu_4b_ve.mp3';
import audio2 from '../../assets/audio/tutu_4c_1_ve.mp3';
import audio3 from '../../assets/audio/tutu_4c_2_ve.mp3';
import audio4 from '../../assets/audio/tutu_4c_3_ve.mp3';
import audio5 from '../../assets/audio/tutu_5_ve.mp3';
import audio6 from '../../assets/audio/tutu_6_1_ve.mp3';
import audio7 from '../../assets/audio/tutu_6_2_ve.mp3';
import audio8 from '../../assets/audio/tutu_6_3_ve.mp3';
import audio9 from '../../assets/audio/tutu_7_ve.mp3';
import audio10 from '../../assets/audio/tutu_7b_ve.mp3';
import audio11 from '../../assets/audio/tutu_8_ve.mp3';
import audio12 from '../../assets/audio/tutu_9_ve.mp3';
import audio13 from '../../assets/audio/tutu_10_ve.mp3';
import audio14 from '../../assets/audio/tutu_11_ve.mp3';
import printerUri from '../../assets/audio/printer.mp3';
export const APPROVED_TUTU_AUDIO:Readonly<Record<string,string>>={
 'tutu_4a_ve': audio0,
 'tutu_4b_ve': audio1,
 'tutu_4c_1_ve': audio2,
 'tutu_4c_2_ve': audio3,
 'tutu_4c_3_ve': audio4,
 'tutu_5_ve': audio5,
 'tutu_6_1_ve': audio6,
 'tutu_6_2_ve': audio7,
 'tutu_6_3_ve': audio8,
 'tutu_7_ve': audio9,
 'tutu_7b_ve': audio10,
 'tutu_8_ve': audio11,
 'tutu_9_ve': audio12,
 'tutu_10_ve': audio13,
 'tutu_11_ve': audio14,
};
const MUTE='tuturno.v20.muted';
/** Browsers expose neither the system ringer nor screen-reader detection. Hosts can explicitly suppress speech. */
const readerActive=()=>new URLSearchParams(location.search).get('lector')==='1'||location.pathname==='/catalog';
export function useTutuAudio(){
 const [status,setStatus]=useState<WebVoiceStatus>({playing:false,blocked:false,error:null});
 const [muted,setMuted]=useState(()=>{try{return localStorage.getItem(MUTE)==='true'}catch{return false}});
 const skipNextAuto=useRef(false);
 const preference=useRef(muted),current=useRef<string|null>(null);
 const [key,setKey]=useState<string|null>(null);
 const media=useRef<ReturnType<typeof createWebVoicePlayer>|null>(null);
 if(!media.current)media.current=createWebVoicePlayer(setStatus);
 const printerMedia=useRef<HTMLAudioElement|null>(null);
 const stop=useCallback(()=>{media.current?.stop();printerMedia.current?.pause()},[]);
 const play=useCallback((k:string)=>{if(!preference.current&&!readerActive()&&APPROVED_TUTU_AUDIO[k])media.current?.play(APPROVED_TUTU_AUDIO[k])},[]);
 const select=useCallback((k:string|null)=>{stop();skipNextAuto.current=false;current.current=k;setKey(k)},[stop]);
 useEffect(()=>{if(!key||muted)return;if(skipNextAuto.current){skipNextAuto.current=false;return}const t=setTimeout(()=>play(key),key==='tutu_4a_ve'?0:380);return()=>{clearTimeout(t);stop()}},[key,muted,play,stop]);
 const toggle=useCallback(()=>{preference.current=!preference.current;setMuted(preference.current);try{localStorage.setItem(MUTE,String(preference.current))}catch{}stop();if(!preference.current&&current.current){skipNextAuto.current=true;play(current.current)}},[play,stop]);
 const replay=useCallback(()=>{if(preference.current){preference.current=false;setMuted(false);try{localStorage.setItem(MUTE,'false')}catch{}}if(current.current){skipNextAuto.current=true;play(current.current)}},[play]);
 const printer=useCallback(()=>{if(preference.current||readerActive())return;printerMedia.current??=new Audio(printerUri);printerMedia.current.currentTime=0;void printerMedia.current.play().catch(()=>{})},[]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);media.current?.dispose();printerMedia.current?.pause()}},[stop]);
 return {select,stop,toggle,replay,printer,muted,audioKey:key,playing:status.playing,blocked:status.blocked,error:status.error};
}
