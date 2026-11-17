import React from 'react';
import {createRoot} from 'react-dom/client';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {VenezuelaFlow} from './flow/Flow';
import entries from './catalog.json';
import {useReviewBridge} from './reviewBridge';
import './styles.css';
const query=new URLSearchParams(location.search);
const catalog=location.pathname==='/catalog';
let saved:unknown=null;try{saved=JSON.parse(localStorage.getItem('tuturno.v20.demo.san')??'null')}catch{}
const previousScreen=(saved as {screen?:string}|null)?.screen;
const ideaValue=query.get('idea');
const previewIdea=ideaValue!==null && /^[0-5]$/.test(ideaValue)?Number(ideaValue):null;
const start=query.get('screen')??(previousScreen&&!['1','2','3'].includes(previousScreen)?'4a':'1');
function ReviewFlow({screen,variant}:{screen:string;variant?:string}) {
 const bridge=useReviewBridge(screen,variant);
 return <VenezuelaFlow initialScreen={screen as never} initialVariant={variant as never} savedSan={query.has('screen')?(previewIdea===null?undefined:{idea:previewIdea}):catalog?undefined:saved} onState={bridge.onState} onAudio={bridge.onAudio} review />;
}
const flow=(screen:string,variant?:string)=> <ReviewFlow screen={screen} variant={variant}/>;
const content=catalog?<main className="catalog">{entries.map(e=><section key={e.id} className="catalog-entry"><h2>{e.id}</h2><div className="catalog-screen" data-screen={e.id}><SafeAreaProvider style={{flex:1}}>{flow(e.screen,e.variant)}</SafeAreaProvider></div></section>)}</main>:<SafeAreaProvider>{flow(start,query.get('variant')??undefined)}</SafeAreaProvider>;
createRoot(document.getElementById('root')!).render(content);
