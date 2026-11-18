import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
// Solo recursos nativos: Metro genera el código Hermes durante assembleRelease.
await rm('android/app/src/main/assets',{recursive:true,force:true});
await mkdir('android/app/src/main/assets/fonts',{recursive:true});
await cp('assets/fonts','android/app/src/main/assets/fonts',{recursive:true});
await mkdir('android/app/src/main/res/raw',{recursive:true});
const {voices}=JSON.parse(await (await import('node:fs/promises')).readFile('assets/audio/manifest.json','utf8'));
for(const file of [...voices.map(v=>v.file),'printer.mp3'])await cp('assets/audio/'+file,'android/app/src/main/res/raw/'+file);
const commit=process.env.TUTURNO_SOURCE_COMMIT??execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await writeFile('android/app/src/main/assets/compilacion.json',JSON.stringify({commit,version:'20.0.3',motor:'React Native / Hermes'},null,2));
console.log('Fuentes y 16 audios nativos preparados.');
