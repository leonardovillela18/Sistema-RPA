// DOM/event regression checks; does not emulate a browser's layout engine.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('../.test-runtime/ui-tools/node_modules/linkedom');
const CSSOM=require('../.test-runtime/ui-tools/node_modules/cssom');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function scenario(width,height,modern=true) {
 const {document,window:dom}=parseHTML('<html><head></head><body><script id="navigation-script"></script><main><input id="field"></main></body></html>');
 document.currentScript=document.getElementById('navigation-script');
 let focused=document.body,headerHeight=70,resizeObserver;
 Object.defineProperty(document,'activeElement',{get:()=>focused});
 dom.HTMLElement.prototype.focus=function(){focused=this;};
 Object.defineProperty(dom.HTMLElement.prototype,'offsetHeight',{get:()=>headerHeight,configurable:true});
 function events() {const callbacks={};return {addEventListener:(name,callback)=>{(callbacks[name]??=[]).push(callback);},fire:name=>(callbacks[name]||[]).forEach(fn=>fn())};}
 const media={...events(),matches:width<=980||height<=500,addListener(callback){this.addEventListener('change',callback);}};
 const viewport=modern?{...events(),height,offsetTop:0,scale:1}:undefined;
 const location={pathname:'/servicos.html',href:'https://rpa.example/servicos.html'};
 const window={...events(),innerWidth:width,innerHeight:height,matchMedia:()=>media,visualViewport:viewport,location,requestAnimationFrame:callback=>callback()};
 if(modern)window.ResizeObserver=class{constructor(callback){resizeObserver=callback;}observe(){}};
 const context={window,document,location,URL,Event:dom.Event,RPAApi:{ready:Promise.resolve(),getContacts:()=>({}),setCsrf(){},request:async()=>({user:{id:1,name:'Admin',features_ready:true,can_manage_users:true,password_change_required:false},csrf:'test'}),showError(error){throw error;}}};
 vm.runInNewContext(fs.readFileSync('public/assets/js/navigation.js','utf8'),context);
 const header=document.querySelector('header'),toggle=document.querySelector('.menu-toggle'),panel=document.querySelector('.navigation-panel');
 assert.equal(header.firstElementChild,toggle,'Mobile menu precedes the brand');
 assert.equal(toggle.hidden,!media.matches);assert.equal(panel.hidden,media.matches);
 assert.equal(document.documentElement.style.getPropertyValue('--viewport-height'),height+'px');
 if(media.matches){
  toggle.click();assert(!panel.hidden);assert.equal(toggle.getAttribute('aria-expanded'),'true');
  const escape=new dom.Event('keydown',{cancelable:true});escape.key='Escape';document.dispatchEvent(escape);
  assert(panel.hidden);assert.equal(focused,toggle);
  toggle.click();document.querySelector('main').dispatchEvent(new dom.Event('pointerdown',{bubbles:true}));assert(panel.hidden);
  toggle.click();panel.querySelector('a').click();assert(panel.hidden);
  toggle.click();window.fire('orientationchange');assert(panel.hidden);
 }
 vm.runInNewContext(fs.readFileSync('public/assets/js/site-auth.js','utf8'),context);
 await context.window.RPAAuth.ready;
 assert(panel.querySelector('.auth-actions'),'Login/admin actions stay inside the mobile menu');
 assert.equal(panel.querySelectorAll('.auth-actions a').length,2);
 headerHeight=82;if(resizeObserver)resizeObserver();else window.fire('resize');
 assert.equal(document.documentElement.style.getPropertyValue('--header-h'),'82px');
 media.matches=!media.matches;media.fire('change');assert.equal(panel.hidden,media.matches);assert.equal(toggle.hidden,!media.matches);
 if(viewport){
  focused=document.getElementById('field');viewport.height=260;viewport.offsetTop=35;viewport.fire('resize');
  assert.equal(document.documentElement.style.getPropertyValue('--viewport-height'),'260px');
  assert.equal(document.documentElement.style.getPropertyValue('--viewport-top'),'35px');
  assert(document.body.classList.contains('editing-field'));
  viewport.scale=2;viewport.height=130;viewport.fire('resize');
  assert.equal(document.documentElement.style.getPropertyValue('--viewport-height'),height+'px','Pinch zoom does not resize the page to the magnified viewport');
 }
 document.dispatchEvent(new dom.Event('DOMContentLoaded'));await tick();assert(document.querySelector('.whatsapp-float'));
}
(async()=>{
 const sizes=[[320,568],[360,800],[390,844],[430,932],[568,320],[800,360],[844,390],[932,430],[768,1024],[1024,768],[1366,768],[1920,1080]];
 for(const [w,h] of sizes)await scenario(w,h);
 await scenario(375,667,false);
 for(const name of fs.readdirSync('public/assets/css').filter(name=>name.endsWith('.css')))CSSOM.parse(fs.readFileSync('public/assets/css/'+name,'utf8'));
 for(const name of fs.readdirSync('public').filter(name=>name.endsWith('.html'))){
  const {document}=parseHTML(fs.readFileSync('public/'+name,'utf8'));
  assert(document.querySelector('meta[name="viewport"]').content.includes('viewport-fit=cover'));
  const styles=[...document.querySelectorAll('link[rel="stylesheet"]')];assert(styles.at(-1).href.includes('/responsive.css?'));
  for(const node of document.querySelectorAll('[src],[href]')){const url=node.getAttribute('src')||node.getAttribute('href');if(url.startsWith('/assets/'))assert(fs.existsSync('public'+url.split('?')[0]),url);}
 }
 console.log('PASS: responsive menu states across 12 portrait/landscape/desktop sizes; keyboard, outside click, orientation, admin links, viewport/zoom events, legacy fallback, CSS syntax and page assets. No visual layout assertion.');
})().catch(error=>{console.error(error);process.exitCode=1;});
