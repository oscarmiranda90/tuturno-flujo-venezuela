import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

// El APK incorpora la misma compilación web, incluidos sus quince audios.
execFileSync('npm',['run','build','--','--base=/app/','--outDir=dist-android','--emptyOutDir'],{stdio:'inherit'});
await rm('android/app/src/main/assets',{recursive:true,force:true});
await mkdir('android/app/src/main/assets',{recursive:true});
await cp('dist-android/index.html','android/app/src/main/assets/index.html');
await cp('dist-android/assets','android/app/src/main/assets/assets',{recursive:true});
const commit=process.env.TUTURNO_SOURCE_COMMIT??execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('La revisión de origen debe ser una huella Git válida.');
await writeFile('android/app/src/main/assets/compilacion.json',JSON.stringify({repositorio:'https://github.com/oscarmiranda90/tuturno-flujo-venezuela',commit,version:'20.0.1'},null,2));
console.log('Recursos Android preparados; no se copian credenciales ni los paquetes de entrega.');
