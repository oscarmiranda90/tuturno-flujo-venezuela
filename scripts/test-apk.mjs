import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
// Ejecutar únicamente sobre un dispositivo de revisión: inicia pantallas y conserva el San existente.
const adb=process.env.ADB??'adb',serial=process.env.ANDROID_SERIAL??'emulator-5554';
const app='com.tuturno.flujo.v20',out=process.env.TUTURNO_VERIFY_OUT??'docs/verification/android-native';
mkdirSync(out,{recursive:true});
const command=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:30000}).trim();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const entries=JSON.parse(readFileSync('src/catalog.json','utf8'));
const report=[];
const settings=['animator_duration_scale','transition_animation_scale'];
const original=settings.map(key=>command('shell','settings','get','global',key));
try {
 for(const key of settings)command('shell','settings','put','global',key,'0');
for(const entry of entries){
 command('shell','am','force-stop',app);
 command('logcat','-c');
 command('shell','am','start','-W','-n',app+'/com.tuturno.flujo.MainActivity','--es','screen',entry.screen,'--es','variant',entry.variant);
 await pause(2300);
 const pid=command('shell','pidof',app);assert(/^\d+$/.test(pid),'La app se cerró en '+entry.id);
 const logs=command('logcat','-d','--pid='+pid);
 assert(!/FATAL EXCEPTION|JavascriptException|ReactNativeJS:.*(?:Error:|TypeError|ReferenceError)/.test(logs),'Error nativo en '+entry.id+'\n'+logs);
 command('shell','rm','-f','/sdcard/tuturno-native.xml');
 const dump=command('shell','uiautomator','dump','/sdcard/tuturno-native.xml');
 assert(dump.includes('dumped'),'No se pudo leer la jerarquía nativa de '+entry.id);
 const xml=command('shell','cat','/sdcard/tuturno-native.xml');
 assert(!xml.includes('android.webkit.WebView'),'Se encontró un WebView');
 assert(xml.includes('android.widget.TextView'),'La pantalla no contiene textos nativos: '+entry.id);
 const scrollables=[...xml.matchAll(/<node\s+([^>]+)>?/g)].map(m=>m[1]).filter(n=>n.includes('package="'+app+'"')&&n.includes('scrollable="true"'));
 assert(entry.screen==='11'||entry.screen==='11b'||scrollables.length===0,'Scroll exterior en '+entry.id);
 writeFileSync(out+'/'+entry.id+'.xml',xml);
 writeFileSync(out+'/'+entry.id+'.png',execFileSync(adb,['-s',serial,'exec-out','screencap','-p']));
 report.push({pantalla:entry.id,correcto:true,textosNativos:(xml.match(/android.widget.TextView/g)??[]).length});
 console.log('Pantalla nativa correcta:',entry.id);
}
writeFileSync(out+'/pantallas.json',JSON.stringify({motor:'React Native / Hermes',android:command('shell','getprop','ro.build.version.release'),dispositivo:command('shell','getprop','ro.product.model'),modoAvion:command('shell','settings','get','global','airplane_mode_on'),escalaAnimaciones:command('shell','settings','get','global','animator_duration_scale'),pantallas:report},null,2)+'\n');
console.log('Las 33 pantallas se ejecutaron sin errores nativos y sin WebView.');

} finally {
 for(let i=0;i<settings.length;i++) {
  if(original[i]==='null')command('shell','settings','delete','global',settings[i]);
  else command('shell','settings','put','global',settings[i],original[i]);
 }
}
