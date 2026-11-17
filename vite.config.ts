import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
function assets():Plugin{return {name:'browser-assets',enforce:'pre',transform(code,id){
 if(id.includes('/node_modules/')||!/[.][jt]sx?$/.test(id))return;
 const imports:string[]=[];
 const result=code.replace(/require\((['"])([^'"]+\.(?:png|jpe?g|webp|gif|mp3|ttf|otf))\1\)/g,(_all,_quote,file)=>{const name=`__asset${imports.length}`;imports.push(`import ${name} from ${JSON.stringify(file+'?url')};`);return name});
 if(imports.length)return {code:imports.join('\n')+'\n'+result,map:null};
}};}
export default defineConfig({plugins:[
 assets(),
 react({babel:{plugins:['@babel/plugin-transform-export-namespace-from','react-native-worklets/plugin']}})
],resolve:{alias:{'react-native':'react-native-web'},extensions:['.web.tsx','.web.ts','.web.jsx','.web.js','.tsx','.ts','.jsx','.js','.mjs','.json'],dedupe:['react','react-dom','react-native-web']},define:{global:'globalThis',__DEV__:'true','process.env.NODE_ENV':JSON.stringify(process.env.NODE_ENV??'development')},optimizeDeps:{esbuildOptions:{resolveExtensions:['.web.tsx','.web.ts','.web.jsx','.web.js','.tsx','.ts','.jsx','.js','.mjs','.json']}},assetsInclude:['**/*.mp3','**/*.ttf'],server:{port:5210,fs:{deny:['**/.env','**/.env.*','**/.git/**']}}});