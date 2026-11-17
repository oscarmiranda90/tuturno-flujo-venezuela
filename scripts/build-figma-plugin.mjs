/** Empaqueta el plugin sin herramientas de compilación ni conexión a servicios. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='figma-plugin';
const data=JSON.parse(readFileSync(`${root}/recursos/pantallas.json`,'utf8'));
if(data.schema!==1||data.screens.length!==37)throw Error('El catálogo debe contener los 37 estados aprobados.');
const runtime=readFileSync(`${root}/src/runtime.js`,'utf8');
writeFileSync(`${root}/code.js`,'/* TuTurno · Venezuela v20. Generado con npm run figma:compilar. */\nconst CATALOGO = '+JSON.stringify(data)+';\n'+runtime);
execFileSync(process.execPath,['--check',`${root}/code.js`]);
mkdirSync(`${root}/Fuentes`,{recursive:true});
for(const name of ['Outfit_400Regular.ttf','Outfit_500Medium.ttf','Outfit_600SemiBold.ttf','Outfit_700Bold.ttf','Outfit_800ExtraBold.ttf','Inter.ttf','Inter-LICENSE.txt','Outfit-LICENSE.txt'])copyFileSync(`assets/fonts/${name}`,`${root}/Fuentes/${name}`);
mkdirSync('descargas',{recursive:true});
const target='descargas/TuTurno-Plugin-Figma-v20.zip';
// Sustituye solo el paquete propio para no conservar entradas obsoletas del ZIP.
const {rmSync}=await import('node:fs');rmSync(target,{force:true});
execFileSync('/usr/bin/zip',['-q','-r',target,root+'/manifest.json',root+'/code.js',root+'/ui.html',root+'/LEEME.md',root+'/Fuentes'],{cwd:'.'});
const bytes=readFileSync(target);const hash=createHash('sha256').update(bytes).digest('hex');
writeFileSync(target+'.sha256',hash+'  TuTurno-Plugin-Figma-v20.zip\n');
console.log(`Plugin listo: ${data.screens.length} estados, ${(bytes.length/1024/1024).toFixed(2)} MB. SHA-256 ${hash}`);
