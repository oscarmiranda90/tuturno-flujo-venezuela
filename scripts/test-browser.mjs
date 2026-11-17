import {execFileSync} from 'node:child_process';import{writeFileSync}from'node:fs';
const orca='/Applications/Orca.app/Contents/Resources/bin/orca',page=process.env.ORCA_BROWSER_PAGE??'',out=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function evaluate(expression){const r=JSON.parse(execFileSync(orca,['eval','--page',page,'--expression',expression,'--json'],{encoding:'utf8',maxBuffer:3e6}));if(!r.ok)throw Error(JSON.stringify(r));let v=r.result.result;try{return JSON.parse(v)}catch{return v}}
function state(){return evaluate('document.body.innerText')}
async function press(label){const expression=`(()=>{const label=${JSON.stringify(label)};const n=Array.from(document.querySelectorAll('[role="button"],button,[role="checkbox"]')).filter(e=>(e.getAttribute('aria-label')===label||e.textContent.trim().replace(/\\s+/g,' ')===label)&&e.getAttribute('aria-disabled')!=='true'&&!e.disabled).at(-1);if(!n)throw Error('Missing enabled '+label);n.click();return true})()`;evaluate(expression);out.push({action:label,at:Date.now()});await wait(180)}
async function until(text,ms=18000){const end=Date.now()+ms;while(Date.now()<end){if(state().includes(text)){console.log('PASS',text);out.push({assertion:text,at:Date.now()});return}await wait(200)}throw Error('Missing text '+text+' '+state().slice(-500))}
async function next(delay=150){await press('Siguiente');await wait(delay)}
try{
 evaluate(`(()=>{const input=document.querySelector('input[type="email"]');if(input){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'nuevo@ejemplo.com');input.dispatchEvent(new Event('input',{bubbles:true}));}return true})()`);await wait(120);
 await press('Continuar →');await until('Revisa tu correo');await press('Autocompletar código 482915');await until('Crea tu clave');
 for(const n of '628194')await press(n);await until('Repite tu clave');for(const n of '628194')await press(n);
 await until('¿Qué harías con €100');await press('Montar mi negocio');await until('¡Increíble!');await until('¿Seguimos?');await press('Ahora no');
 await until('Todos ponen lo mismo');await press('Silenciar voz de Tutu');await next();await until('Uno cobra todo junto');
 if(!evaluate('!!document.querySelector(\'[aria-label="Activar voz de Tutu"]\')'))throw Error('Mute not persisted');
 await press('Activar voz de Tutu');await next();await until('Todos cobran. Tú también.');await next();
 await until('Garantía y servicio\nya van en tu cuota.');await next();await until('De una sola cuenta');await next();await until('Es por el grupo');await next();await until('¡Pruébalo tú!');await next();
 await press('Toca para simular tu turno');await wait(2300);await next();await until('Práctica · No se cobra nada');await until('Tu primera cuota, con\ngarantía y servicio.');await next();await press('Pagar €11,74');
 await until('PRÁCTICA\nSUPERADA');await until('¡Así de fácil!');await next();await until('Aquí todos están verificados');await until('Falta lo mejor:\ntu turno.');await wait(2500);await next();await next();
 await until('¡Ya sabes cómo cobrar tus €100!');await press('Repetir animación');await wait(1400);await press('Cobrar mi turno');
 await until('La más elegida');if(state().includes('Si te retiras'))throw Error('Retirement text leaked into10');await press('Escoger San quincenal');await until('Lo que aceptas');
 const scrolled=evaluate(`(()=>{const all=Array.from(document.querySelectorAll('div'));const n=all.find(e=>e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY==='auto'&&e.textContent.includes('TÉRMINOS GENERALES'));if(!n)throw Error('Terms viewport missing');n.scrollTop=n.scrollHeight;n.dispatchEvent(new Event('scroll'));return true})()`);
 await until('Llegaste al final');
 const labels=evaluate(`Array.from(document.querySelectorAll('[role="checkbox"]')).map(e=>e.getAttribute('aria-label'))`);for(const label of labels)await press(label);await press('Acepto');
 await until('€23,48');if(!state().includes('para montar tu negocio'))throw Error('Idea not retained');await press('Pagar €23,48');await until('Volver al pago');await press('Simular regreso con pago fallido');await until('Tu pago no se completó.');
 if(!state().includes('€23,48'))throw Error('Frequency lost after failure');await press('¿Hoy no tienes la plata? Te lo recordamos después.');await until('Listo, te avisamos');await press('Entendido');await until('€23,48');
 console.log('FULL FLOW PASS');writeFileSync('docs/verification/interaction.json',JSON.stringify({passed:true,actions:out},null,2));
}catch(e){console.error(e);writeFileSync('docs/verification/interaction.json',JSON.stringify({passed:false,error:String(e),actions:out},null,2));process.exitCode=1}
