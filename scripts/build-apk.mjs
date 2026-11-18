import {execFileSync} from 'node:child_process';
import {copyFileSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

execFileSync('npm',['run','android:preparar'],{stdio:'inherit'});
execFileSync('./gradlew',['--no-daemon',':app:assembleRelease'],{cwd:'android',stdio:'inherit'});
mkdirSync('descargas',{recursive:true});
const target='descargas/TuTurno-v20-Android.apk';
copyFileSync('android/app/build/outputs/apk/release/app-release.apk',target);
const sha=createHash('sha256').update(readFileSync(target)).digest('hex');
writeFileSync(target+'.sha256',sha+'  TuTurno-v20-Android.apk\n');
console.log('APK generado: '+target+'\nSHA256: '+sha);
