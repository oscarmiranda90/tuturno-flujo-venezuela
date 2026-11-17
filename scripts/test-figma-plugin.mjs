/** Pruebas del contrato del plugin con un anfitrión simulado de la API de Figma. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(readFileSync('figma-plugin/recursos/pantallas.json','utf8'));
const runtime=readFileSync('figma-plugin/src/runtime.js','utf8');
const source='const CATALOGO='+JSON.stringify(data)+';\n'+runtime;
const cases=[];
function host({missingFont=false,brokenSvg=false,cancelAt=null}={}){
 let n=0;const messages=[];const nodes=[];const fonts=[];
 class Node{
  constructor(type){this.id=String(++n);this.type=type;this.children=[];this.removed=false;this.width=100;this.height=100;this.x=0;this.y=0;this.data={};nodes.push(this);}
  resize(w,h){assert(Number.isFinite(w)&&w>0);assert(Number.isFinite(h)&&h>0);this.width=w;this.height=h;}
  appendChild(node){if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);this.children.push(node);node.parent=this;}
  setPluginData(key,value){this.data[key]=value;}
  setRelaunchData(value){this.relaunch=value;}
  remove(){this.removed=true;if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);}
  set fills(paints){assert(Array.isArray(paints));for(const p of paints){assert(['SOLID','GRADIENT_LINEAR','IMAGE'].includes(p.type));if(p.opacity!==undefined)assert(p.opacity>=0&&p.opacity<=1);if(p.type==='GRADIENT_LINEAR'){assert(p.gradientStops.length>=2);assert(p.gradientTransform.flat().every(Number.isFinite));for(const s of p.gradientStops){assert(s.position>=0&&s.position<=1);assert(Object.values(s.color).every(c=>Number.isFinite(c)&&c>=0&&c<=1));}}}this._fills=paints;}
  get fills(){return this._fills??[];}
 }
 const root=new Node('DOCUMENT');const page=new Node('PAGE');const existing=new Node('FRAME');page.appendChild(existing);existing.name='Contenido previo';
 const make=type=>{const node=new Node(type);page.appendChild(node);return node;};
 const figma={root,currentPage:page,viewport:{center:{x:2000,y:2000},scrollAndZoomIntoView:()=>{}},showUI:()=>{},notify:()=>{},ui:{postMessage:m=>{messages.push(m);if(cancelAt&&m.message?.startsWith(`Creando ${cancelAt} de`))void figma.ui.onmessage({type:'cancel'});}},
 createFrame:()=>make('FRAME'),createRectangle:()=>make('RECTANGLE'),createText:()=>make('TEXT'),
 createNodeFromSvg:svg=>{if(brokenSvg)throw Error('SVG de prueba inválido');assert(svg.includes('<svg'));return make('VECTOR_SVG');},
 base64Decode:text=>new Uint8Array(Buffer.from(text,'base64')),
 createImage:bytes=>{assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);return{hash:'imagen-'+bytes.length};},
 listAvailableFontsAsync:async()=>missingFont?[]:['Outfit','Inter'].flatMap(family=>['Regular','Medium','SemiBold','Bold','ExtraBold'].map(style=>({fontName:{family,style}}))),
 loadFontAsync:async font=>fonts.push(font)};
 const context=vm.createContext({figma,__html__:'',setTimeout});vm.runInContext(source,context);
 return{figma,page,messages,nodes,existing,fonts,send:m=>figma.ui.onmessage(m)};
}
const flatten=root=>{const out=[];const queue=[root];while(queue.length){const node=queue.pop();out.push(node);queue.push(...node.children);}return out;};
assert.equal(data.screens.length,37);assert.equal(new Set(data.screens.map(s=>s.id)).size,37);
for(const s of data.screens){assert.equal(s.width,360);assert.equal(s.height,800);}
{
 const h=host();await h.send({type:'ready'});assert.equal(h.messages.at(-1).count,37);
 await h.send({type:'generate',screen:'all',columns:4});
 const batch=h.page.children.find(n=>n.data.tuturno);assert(batch);assert.equal(batch.children.length,37);
 const all=flatten(batch),texts=all.filter(n=>n.type==='TEXT'),vectors=all.filter(n=>n.type==='VECTOR_SVG');
 assert(texts.length>800);assert(vectors.length>300);assert(texts.some(n=>n.characters.includes('Tu turno está garantizado')));
 assert.equal(h.messages.at(-1).count,37);assert(h.fonts.some(f=>f.family==='Outfit'));
 await h.send({type:'generate',screen:'9',columns:1});assert.equal(h.page.children.filter(n=>n.data.tuturno).length,2);assert(h.page.children.includes(h.existing));
 await h.send({type:'generate',screen:'pantalla-inexistente',columns:1});assert(h.messages.at(-1).error);assert.equal(h.page.children.filter(n=>n.data.tuturno).length,2);
 await h.send({type:'generate',screen:'1',columns:999});assert(h.messages.at(-1).error);
 await h.send({type:'generate',screen:'1',columns:1.5});assert(h.messages.at(-1).error);
 cases.push({caso:'Todo el catálogo, capas editables y ejecuciones independientes',correcto:true,pantallas:37,textos:texts.length,ilustracionesVectoriales:vectors.length});
}
{
 const h=host({missingFont:true});await h.send({type:'generate',screen:'1',columns:1});assert(h.messages.at(-1).error);assert(h.messages.at(-1).message.includes('Falta la fuente'));assert.equal(h.page.children.length,1);
 cases.push({caso:'Fuente ausente: mensaje útil antes de crear capas',correcto:true});
}
{
 const h=host({brokenSvg:true});await h.send({type:'generate',screen:'1',columns:1});assert(h.messages.at(-1).error);assert.equal(h.page.children.length,1);assert(h.page.children.includes(h.existing));
 cases.push({caso:'Fallo de importación: retirada del lote incompleto y conservación del contenido previo',correcto:true});
}
{
 const h=host({cancelAt:2});await h.send({type:'generate',screen:'all',columns:4});assert(h.messages.at(-1).error);assert(h.messages.at(-1).message.includes('cancelada'));assert.equal(h.page.children.length,1);
 cases.push({caso:'Cancelación: retirada únicamente del lote en curso',correcto:true});
}
mkdirSync('docs/verification/figma-plugin',{recursive:true});
writeFileSync('docs/verification/figma-plugin/contrato.json',JSON.stringify({fecha:new Date().toISOString(),correcto:true,anfitrion:'Simulación de la API; no es una ejecución en el editor de Figma',sourceCommit:data.sourceCommit,cases},null,2)+'\n');
for(const c of cases)console.log('CORRECTO:',c.caso);
