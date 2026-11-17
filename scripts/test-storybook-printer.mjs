import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const expectedPrinter=JSON.parse(readFileSync('assets/audio/manifest.json','utf8')).printer;
const printerFinished=e=>e.src?.includes('/printer-')&&e.type==='ended'&&Math.abs(e.time-expectedPrinter.durationSeconds)<0.15;
const url=process.argv[2]??'https://tuturno-storybook.pages.dev/?path=/story/venezuela-v20-flujo-aprobado--closing';
// Requiere una instancia de Chrome de pruebas con depuración remota, sin desactivar el bloqueo de reproducción automática.
const debuggerUrl=process.env.CHROME_DEBUG_URL??'http://127.0.0.1:9234';
const page=await fetch(debuggerUrl+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});
let id=0;const pending=new Map(),contexts=new Map(),errors=[];const jobs=[];
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Tiempo agotado: '+method))},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params,...(sessionId?{sessionId}:{})}))});
const probe=`(()=>{window.__ticketTest={events:[],errors:[]};const events=window.__ticketTest.events,seen=new WeakSet();const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){const a=this;if(!seen.has(a)){seen.add(a);for(const type of ['playing','ended','error'])a.addEventListener(type,()=>events.push({type,src:a.src,time:a.currentTime,duration:a.duration,code:a.error?.code}))}const entry={type:'play',src:a.src};events.push(entry);const promise=play.apply(a,args);promise?.catch(e=>entry.error=e.name);return promise};window.addEventListener('error',e=>{if(window.__ticketTest.errors.length<5)window.__ticketTest.errors.push(e.message)});})()`;
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const job=pending.get(m.id);if(!job)return;pending.delete(m.id);clearTimeout(job.timer);m.error?job.reject(Error(JSON.stringify(m.error))):job.resolve(m.result);return}
 if(m.method==='Runtime.executionContextCreated'){const c=m.params.context;if(c.auxData?.isDefault)contexts.set(`${m.sessionId??''}:${c.id}`,{id:c.id,sessionId:m.sessionId,origin:c.origin})}
 if(m.method==='Runtime.executionContextsCleared')for(const [key,value] of contexts)if(value.sessionId===m.sessionId)contexts.delete(key);
 if(m.method==='Runtime.executionContextDestroyed')contexts.delete(`${m.sessionId??''}:${m.params.executionContextId}`);
 if(m.method==='Runtime.exceptionThrown'&&errors.length<5)errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);
 if(m.method==='Target.attachedToTarget')jobs.push((async()=>{const s=m.params.sessionId;await call('Runtime.enable',{},s);})());
});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const evaluate=async(expression,context)=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,...(context?{contextId:context.id}:{})},context?.sessionId);if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value};
try{
 await call('Page.enable');await call('Runtime.enable');await call('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:false,flatten:true});await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url});
 let context;for(let i=0;i<100;i++){context=[...contexts.values()].find(c=>c.origin.includes('tuturno-flujo-venezuela')||c.origin==='http://localhost:5210');if(context&&await evaluate(`!!document.querySelector('[aria-label="Repetir animación"]')`,context).catch(()=>false))break;await pause(200)}
 if(!context)throw Error('No se encontró el flujo incrustado.');await Promise.all(jobs);
 await evaluate(probe,context);console.log('Contexto',context.origin);
 const click=async(label)=>{const box=await evaluate(`(()=>{const name=${JSON.stringify(label)};const b=[...document.querySelectorAll('button,[role="button"]')].find(e=>e.getAttribute('aria-label')===name||e.textContent.trim()===name);if(!b)throw Error('Falta el control');const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,context);
 const offset=await evaluate(`(()=>{const f=document.getElementById('storybook-preview-iframe');if(!f)return {x:0,y:0};const a=f.getBoundingClientRect(),b=f.contentDocument.querySelector('iframe').getBoundingClientRect();return{x:a.x+b.x,y:a.y+b.y}})()`);
 const x=offset.x+box.x,y=offset.y+box.y;await call('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});};
 const sample=()=>evaluate(`(()=>{const t=document.querySelector('[data-testid="closing-presented-ticket"]');return {opacity:t?getComputedStyle(t).opacity:null,transform:t?getComputedStyle(t).transform:null}})()`,context);
 await click('Repetir animación');await pause(200);const early=await sample();await pause(3600);const late=await sample();
 const result=await evaluate('window.__ticketTest',context);const printer=result.events.filter(e=>e.src?.includes('/printer-'));const voice=result.events.filter(e=>e.src?.includes('/tutu_9_'));
 console.log(JSON.stringify({early,late,printer,voice,errors,resultErrors:result.errors},null,2));
 if(Number(early.opacity)!==0||Number(late.opacity)!==1||late.transform===early.transform)throw Error('El tiquete no salió animado.');
 if(!printer.some(printerFinished)||!voice.some(e=>e.type==='ended'))throw Error('No terminaron los audios de impresora y voz.');
 if(errors.length||result.errors.length)throw Error('Hubo errores JavaScript.');
 const served=await fetch(printer.find(printerFinished).src).then(r=>{if(!r.ok)throw Error('No se pudo descargar el audio publicado.');return r.arrayBuffer()});
 if(createHash('sha256').update(Buffer.from(served)).digest('hex')!==expectedPrinter.sha256)throw Error('El audio publicado no coincide con el fragmento elegido.');
 await click('Repetir animación');await pause(3800);
 const twice=await evaluate('window.__ticketTest',context);
 if(twice.events.filter(printerFinished).length<2)throw Error('La segunda impresión no terminó de sonar.');
 await click('Volver');await pause(400);await click('Siguiente');await pause(3800);
 const returned=await evaluate('window.__ticketTest',context);
 if(returned.events.filter(printerFinished).length<3)throw Error('La impresión se interrumpió al volver a entrar.');
 if(errors.length||returned.errors.length)throw Error('Hubo errores al repetir o volver a entrar.');
 const out='docs/verification/storybook-printer';mkdirSync(out,{recursive:true});const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync(out+'/tiquetera.png',Buffer.from(shot.data,'base64'));writeFileSync(out+'/resultado.json',JSON.stringify({correcto:true,url,fecha:new Date().toISOString(),early,late,printer,voice,sonidoElegido:expectedPrinter,repeticionesCompletas:returned.events.filter(printerFinished).length,errors},null,2)+'\n');console.log('CORRECTO: salida de papel, impresora completa y voz en Storybook.');
}finally{ws.close();await fetch(debuggerUrl+'/json/close/'+page.id).catch(()=>{})}
