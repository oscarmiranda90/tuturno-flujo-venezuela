/** Captura geometría y estilos reales del catálogo; no convierte pantallas en imágenes. */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const pw=process.env.TUTURNO_PLAYWRIGHT_PATH;
const {chromium}=await import(pw?pathToFileURL(pw).href:'playwright');
const origin=process.env.TUTURNO_FIGMA_URL??'http://localhost:5210';
const entries=JSON.parse(readFileSync('src/catalog.json','utf8'));
const assets={}; const results=[];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:360,height:800},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const entry of entries){
  await page.goto(`${origin}/?screen=${entry.screen}&variant=${entry.variant}&lector=1`);
  await page.waitForFunction(()=>document.querySelector('#root')?.innerText.length>30);
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(entry.screen==='9'?2000:300);
  const slides=entry.id==='1'?[0,1,2,3,4]:[null];
  for(const slide of slides){
   if(slide!==null)await page.evaluate(index=>{
    document.querySelectorAll('.login-portrait').forEach((p,i)=>{p.dataset.state=i===index?'active':'hidden';p.style.transition='none';});
    document.querySelectorAll('.login-testimonial').forEach((p,i)=>{p.dataset.active=String(i===index);p.setAttribute('aria-hidden',String(i!==index));p.style.transition='none';});
   },slide);
   const scene=await page.evaluate(async()=>{
    const round=n=>Math.round(n*1000)/1000;
    const rect=e=>{const r=e.getBoundingClientRect();return{x:round(r.x),y:round(r.y),w:round(r.width),h:round(r.height)}};
    async function embed(url){if(!url)return null;if(url.startsWith('data:'))return url;const res=await fetch(url);if(!res.ok)throw Error('No se pudo cargar '+url);const blob=await res.blob();if(blob.type==='image/webp'){const im=new Image();im.src=URL.createObjectURL(blob);await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);URL.revokeObjectURL(im.src);return c.toDataURL('image/png');}return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)});}
    async function svgMarkup(el){const copy=el.cloneNode(true);const source=[el,...el.querySelectorAll('*')],target=[copy,...copy.querySelectorAll('*')];
     for(let i=0;i<target.length;i++){const cs=getComputedStyle(source[i]);const t=target[i];
      if(t.getAttribute('fill')==='currentColor')t.setAttribute('fill',cs.color);
      if(t.getAttribute('stroke')==='currentColor')t.setAttribute('stroke',cs.color);
      if(t.hasAttribute('class'))t.removeAttribute('class');
      if(t.tagName.toLowerCase()==='image'){const uri=source[i].getAttribute('href')??source[i].getAttribute('xlink:href');const data=await embed(uri);t.setAttribute('href',data);t.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',data);}
     }
     copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');const box=rect(el);copy.setAttribute('width',box.w);copy.setAttribute('height',box.h);copy.removeAttribute('style');return new XMLSerializer().serializeToString(copy);
    }
    async function photoPng(svg,w,h){const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await im.decode();const c=document.createElement('canvas');c.width=Math.ceil(w*2);c.height=Math.ceil(h*2);c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/png');}
    const styleOf=el=>{const c=getComputedStyle(el);return{background:c.backgroundColor,backgroundImage:c.backgroundImage,imageMode:c.backgroundSize==='contain'?'FIT':'FILL',opacity:Number(c.opacity),radius:[c.borderTopLeftRadius,c.borderTopRightRadius,c.borderBottomRightRadius,c.borderBottomLeftRadius].map(parseFloat),borders:['Top','Right','Bottom','Left'].map(side=>({w:parseFloat(c['border'+side+'Width']),color:c['border'+side+'Color']})),shadow:c.boxShadow,overflow:c.overflow,z:c.zIndex==='auto'?0:Number(c.zIndex)}};
    function textStyle(el){const c=getComputedStyle(el);return{family:c.fontFamily,size:parseFloat(c.fontSize),weight:c.fontWeight,italic:c.fontStyle==='italic',color:c.color,lineHeight:c.lineHeight==='normal'?null:parseFloat(c.lineHeight),spacing:parseFloat(c.letterSpacing)||0,decoration:c.textDecorationLine,align:c.textAlign};}
    function lines(node){const str=node.textContent;const range=document.createRange();const groups=[];let group=null;
     for(let i=0;i<str.length;i++){range.setStart(node,i);range.setEnd(node,i+1);const box=range.getBoundingClientRect();if(box.width===0&&str[i]!=='\n')continue;
      if(!group||Math.abs(group.y-box.y)>2){group={text:'',x:box.x,y:box.y,w:0,h:box.height};groups.push(group);}group.text+=str[i];group.w=Math.max(group.w,box.right-group.x);group.h=Math.max(group.h,box.height);
     }
     return groups.filter(g=>g.text.trim()).map(g=>({...g,x:round(g.x),y:round(g.y),w:round(g.w),h:round(g.h)}));
    }
    async function walk(el,depth=0){
     if(depth>60)throw Error('Jerarquía demasiado profunda');if(['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName))return null;
     const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)<0.001||el.getAttribute('aria-hidden')==='true'&&el.classList.contains('login-testimonial'))return null;
     if(el.classList.contains('login-portrait')&&el.dataset.state!=='active')return null;
     const box=rect(el);if(box.w<.01||box.h<.01)return null;
     const name=el.getAttribute('aria-label')??(el.tagName==='SVG'?'Ilustración':el.getAttribute('role')==='button'?'Botón · '+el.textContent.slice(0,55):'Contenedor');
     const result={type:'frame',name,box,style:styleOf(el),children:[]};
     if(el.tagName.toLowerCase()==='svg'){
      const svg=await svgMarkup(el);if(el.querySelector('image')){result.type='image';result.image=await photoPng(svg,box.w,box.h);result.name='Fotografía del testimonio';}
      else{result.type='svg';result.svg=svg;result.name=el.getAttribute('aria-label')??'Ilustración vectorial';}return result;
     }
     if(el.tagName==='IMG') {result.type='image';result.image=await embed(el.currentSrc||el.src);result.name=el.alt||'Imagen';return result;}
     const bg=cs.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);if(bg){result.image=await embed(bg[1]);result.style.backgroundImage='none';}
     if(el.tagName==='INPUT'||el.tagName==='TEXTAREA'){
      const placeholder=!el.value;const ts=textStyle(el);if(placeholder)ts.color=getComputedStyle(el,'::placeholder').color;
      const x=box.x+parseFloat(cs.paddingLeft)+parseFloat(cs.borderLeftWidth),y=box.y+(box.h-ts.size*1.25)/2;
      result.children.push({type:'text',name:el.getAttribute('aria-label')??'Campo de texto',box:{x:round(x),y:round(y),w:round(box.w-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)),h:round(ts.size*1.25)},text:el.value||el.placeholder,textStyle:ts});return result;
     }
     let order=0;
     for(const child of el.childNodes){
      if(child.nodeType===1){const layer=await walk(child,depth+1);if(layer){layer.order=order++;result.children.push(layer);}}
      else if(child.nodeType===3&&child.textContent.trim()){
       for(const line of lines(child)){result.children.push({type:'text',name:'Texto · '+line.text.trim().slice(0,60),text:line.text,textStyle:textStyle(el),box:{x:line.x,y:line.y,w:line.w,h:line.h},order:order++});}
      }
     }
     result.children.sort((a,b)=>(a.style?.z??0)-(b.style?.z??0)||a.order-b.order);
     return result;
    }
    return{width:innerWidth,height:innerHeight,tree:await walk(document.getElementById('root'))};
   });
   const collect=node=>{if(node.image){const hash=createHash('sha256').update(node.image).digest('hex').slice(0,24);assets[hash]=node.image;node.image=hash;}for(const c of node.children??[])collect(c);};collect(scene.tree);
   const suffix=slide>0?'-'+['mary','carolina','deivy','bernardo','yenifer'][slide]:'';
   const id=entry.id+suffix;
   const doc=readFileSync(`docs/screens/${entry.id}.md`,'utf8');const lines=doc.split('## Instrucciones aprobadas del documento original\n\n').at(-1).split('\n');const title=`${entry.id} · ${lines[1] || 'Pantalla v20'}`;
   results.push({id,screen:entry.screen,variant:entry.variant,name:entry.id==='1'?`1 · Inicio · ${['Mary','Carolina','Deivy','Bernardo','Yenifer'][slide]}`:title,...scene});
   if(['1','4a','6','9','13'].includes(entry.id)&&!suffix)await page.screenshot({path:`docs/verification/figma-plugin/origen-${entry.id}.png`});
   console.log('Exportada',id);
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 const data={schema:1,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),createdAt:new Date().toISOString(),width:360,height:800,assets,screens:results};
 writeFileSync('figma-plugin/recursos/pantallas.json',JSON.stringify(data));
 console.log(`${results.length} pantallas y estados, ${Object.keys(assets).length} imágenes, sin errores.`);
}finally{await browser.close();}
