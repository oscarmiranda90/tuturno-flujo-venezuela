import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
const stateSource=readFileSync(new URL('../src/flow/state.ts',import.meta.url),'utf8');
const stateModule=ts.transpileModule(stateSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {initialState,paymentTerms,previous,paymentFailed,restoreSan}=await import('data:text/javascript;base64,'+Buffer.from(stateModule).toString('base64'));
assert.deepEqual(paymentTerms('weekly'),{quota:10,service:1.74,total:11.74,seats:10});
assert.deepEqual(paymentTerms('fortnightly'),{quota:20,service:3.48,total:23.48,seats:5});
for(const screen of ['4c','6']) for(const rule of [1,2]) assert.equal(previous({...initialState(screen),rule}).rule,rule-1);
assert.equal(previous(initialState('5')).rule,2);
const accepted={...initialState('12'),idea:4,frequency:'fortnightly',termsRead:true,accepted:[true,true,true]};
assert.deepEqual(paymentFailed(accepted),{...accepted,screen:'12c'});
const restored=restoreSan(accepted,'4a');assert.equal(restored.screen,'4a');assert.equal(restored.idea,4);assert.equal(restored.frequency,'fortnightly');assert.deepEqual(restored.accepted,[true,true,true]);
assert.deepEqual(restoreSan({accepted:[true,true,true],termsRead:false},'4a').accepted,[false,false,false]);
const scripts=JSON.parse(readFileSync('assets/audio/manifest.json','utf8'));assert.equal(scripts.voices.length,15);
for(const voice of scripts.voices)assert(existsSync('assets/audio/'+voice.file),voice.file);
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));assert(!Object.keys(lock.packages).some(k=>/(^|\/)node_modules\/(expo(?:-[^/]+)?|@expo\/[^/]+)$/.test(k)),'Se encontró una dependencia de Expo');
console.log('Verificación del flujo correcta: precios, retroceso, conservación de consentimientos y San, 15 audios y ninguna dependencia de Expo.');

const pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.equal(pkg.dependencies['react-native'],'0.86.3');
assert(readFileSync('android/app/src/main/java/com/tuturno/flujo/MainActivity.kt','utf8').includes('ReactActivity()'));
assert(!readFileSync('android/app/build.gradle','utf8').includes('androidx.webkit'));
const login=readFileSync('src/screens/auth/RegistrationV3.tsx','utf8');
assert(login.includes('Con mi turno compré el horno y hoy vendo mis postres.'));
assert(!login.includes('<div'));
console.log('Contrato nativo correcto: React Native, actividad nativa y frase aprobada de Mary.');

const layoutSource=readFileSync('src/flow/layout.ts','utf8');
const layoutModule=ts.transpileModule(layoutSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {frameLayout}=await import('data:text/javascript;base64,'+Buffer.from(layoutModule).toString('base64'));
for(const width of [320,360,390,411,480,768])for(const height of [568,640,740,800,914,1024])for(const native of [true,false]){
 const layout=frameLayout(width,height,native?48:0,native?24:0,native);
 assert(layout.contentHeight<=layout.viewportHeight+0.01,`La pantalla se desborda: ${width} × ${height}`);
 assert(layout.physicalWidth<=width);
 assert(layout.scale>0&&layout.scale<=1);
}
console.log('Todas las medidas del recorrido caben en el ancho y el alto disponibles sin scroll exterior.');
