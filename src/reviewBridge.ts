import {useEffect,useRef} from 'react';
import type {FlowState} from './flow/state';
import type {useTutuAudio} from './onboarding/tutuAudio';

type Audio = ReturnType<typeof useTutuAudio>;
const allowedOrigin = (origin:string) => /^https:\/\/(?:[a-z0-9-]+\.)?tuturno-storybook\.pages\.dev$/.test(origin)
  || /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin);

/** Reutiliza el flujo aislado dentro de Storybook sin copiar su implementación. */
export function useReviewBridge(screen:string,variant?:string) {
  const audio=useRef<Audio|null>(null),state=useRef<FlowState|null>(null);
  const actions=useRef<string[]>([]);
  let origin:string|null=null;
  if(new URLSearchParams(location.search).get('review')==='1' && window.parent!==window) {
    try {const candidate=new URL(document.referrer).origin;if(allowedOrigin(candidate))origin=candidate;} catch {}
  }
  const send=(value:unknown)=>{if(origin)window.parent.postMessage(value,origin)};
  useEffect(()=>{
    if(!origin)return;
    const track=(event:MouseEvent)=>{
      const target=event.target instanceof Element?event.target.closest('button,[role="button"],[role="checkbox"],a'):null;
      const label=target?.getAttribute('aria-label')||(target as HTMLElement|null)?.innerText;
      if(label){actions.current.push(label.slice(0,160));actions.current=actions.current.slice(-20)}
    };
    const receive=async(event:MessageEvent)=>{
      if(event.source!==window.parent||event.origin!==origin||event.data?.type!=='tuturno:v20-command')return;
      if(event.data.command==='toggle')audio.current?.toggle();
      if(event.data.command==='replay')audio.current?.replay();
      if(event.data.command==='capture' && typeof event.data.id==='string'){
        const id=event.data.id;
        try {
          await document.fonts.ready;
          const {toPng}=await import('html-to-image');
          const width=window.innerWidth,height=window.innerHeight;
          const image=await toPng(document.body,{width,height,pixelRatio:2,backgroundColor:'#ffffff',
            style:{margin:'0',width:`${width}px`,height:`${height}px`,overflow:'hidden'},
            filter:node=>!['SCRIPT','NOSCRIPT'].includes(node.nodeName)});
          send({type:'tuturno:v20-capture',id,capture:{image,visibleText:document.body.innerText.slice(0,24000),width,height,
            initialState:`v20:${state.current?.screen??screen}:${variant??'live'}`,country:'VE',audioKey:audio.current?.audioKey??null,actions:[...actions.current]}});
        }catch(error){send({type:'tuturno:v20-capture',id,error:error instanceof Error?error.message:String(error)})}
      }
    };
    window.addEventListener('message',receive);document.addEventListener('click',track,true);
    return()=>{window.removeEventListener('message',receive);document.removeEventListener('click',track,true)};
  },[origin,screen,variant]);
  return {
    onState:(value:FlowState)=>{state.current=value},
    onAudio:(value:Audio)=>{audio.current=value;send({type:'tuturno:v20-audio',audioKey:value.audioKey,muted:value.muted,playing:value.playing,blocked:value.blocked,error:value.error})},
  };
}
