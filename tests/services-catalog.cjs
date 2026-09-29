// DOM/event checks. Native dialog rendering and keyboard trapping still need browser QA.
// Install test dependency: npm install --prefix .test-runtime/ui-tools linkedom
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('../.test-runtime/ui-tools/node_modules/linkedom');
const seed=JSON.parse(fs.readFileSync('public/api/services-seed.json','utf8'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function scenario(admin) {
 const {window,document}=parseHTML('<html><body><main><section data-services-grid></section></main></body></html>');
 let catalog={revision:0,services:structuredClone(seed)},sent;
 const requests=[];
 const create=document.createElement.bind(document);
 document.createElement=tag=>{
  const node=create(tag);
  if(tag==='dialog') {
   node.showModal=()=>{node.open=true;};node.close=()=>{node.open=false;node.dispatchEvent(new window.Event('close'));};
   node.getBoundingClientRect=()=>({left:100,right:900,top:100,bottom:700});
  }
  if(tag==='video')node.pause=()=>{};
  return node;
 };
 const context={document,window:{RPAAuth:{canManageUsers:()=>admin,ready:Promise.resolve()},RPAApi:{getContacts:()=>({phoneLink:'https://wa.me/5516991058868'})}},location:{origin:'http://localhost'},URL,FormData,confirm:()=>true};
 context.RPAApi={request:async(url,data)=>{
  requests.push(url);
  if(url==='/api/public/services.php')return structuredClone(catalog);
  assert(admin);
  if(url.endsWith('/save.php')) {
   sent=JSON.parse(data.get('service'));const index=catalog.services.findIndex(s=>s.id===sent.id);
   const service={id:sent.id||'created-test',title:sent.title,sections:sent.sections,media:[]};
   if(index<0)catalog.services.push(service);else catalog.services[index]=service;
  } else catalog.services=catalog.services.filter(s=>s.id!==data.id);
  catalog.revision++;return structuredClone(catalog);
 }};
 vm.runInNewContext(fs.readFileSync('public/assets/js/servicos.js','utf8'),context);
 await tick();
 const cards=()=>[...document.querySelectorAll('.service-card')];
 assert.equal(cards().length,9);assert.equal(document.querySelector('.services-admin-toolbar').hidden,!admin);
 cards()[0].click();
 const dialog=document.querySelector('dialog');assert(dialog.open);
 assert.equal(document.querySelector('#service-title').textContent,seed[0].title);
 assert.equal(document.querySelector('.service-media-stage img').src,seed[0].media[0].url);
 assert(document.querySelectorAll('.service-description p').length>=2);
 assert.equal(document.querySelector('.service-admin-actions').hidden,!admin);
 assert(new URL(document.querySelector('.service-quote').href).searchParams.get('text').includes(seed[0].title));
 document.querySelector('.service-close').click();assert(!dialog.open);
 cards()[1].click();assert.equal(document.querySelector('#service-title').textContent,seed[1].title);
 const cancel=new window.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);assert(!dialog.open);
 if(!admin){assert.equal(requests.length,1);return;}
 const form=document.querySelector('form');
 Object.defineProperty(form,'elements',{get:()=>({title:form.querySelector('[name="title"]')})});form.reset=()=>{};
 cards()[0].click();
 document.querySelector('.service-admin-actions button').click();assert(!form.hidden);
 assert.equal(form.elements.title.value,seed[0].title);
 assert.equal(document.querySelectorAll('.service-section-editor').length,seed[0].sections.length);
 form.elements.title.value='Cardan atualizado';
 document.querySelector('.service-section-editor [data-field="text"]').value='Descrição editada\n\nSegundo parágrafo.';
 document.querySelector('.service-add-section').click();
 const last=[...document.querySelectorAll('.service-section-editor')].at(-1);
 last.querySelector('[data-field="heading"]').value='Aplicação';last.querySelector('[data-field="items"]').value='Caminhões\nCarretas';
 document.querySelector('.service-media-item .service-danger').click();assert.equal(document.querySelectorAll('.service-media-item').length,0);
 const files=document.querySelector('.service-files');
 Object.defineProperty(files,'files',{value:[new File(['test-video'],'clip.mp4',{type:'video/mp4'})]});
 files.dispatchEvent(new window.Event('change'));
 assert.equal(document.querySelectorAll('.service-media-item video').length,1);
 form.dispatchEvent(new window.Event('submit',{cancelable:true}));await tick();
 assert.equal(sent.title,'Cardan atualizado');assert.equal(sent.keepMedia.length,0);assert.equal(sent.sections.at(-1).items[1],'Carretas');
 assert.deepEqual(sent.mediaOrder,['new:0']);
 assert.equal(document.querySelector('#service-title').textContent,'Cardan atualizado');assert(form.hidden);
 document.querySelector('.service-admin-actions .service-danger').click();await tick();assert(!dialog.open);assert.equal(cards().length,8);
 document.querySelector('.services-admin-toolbar button').click();assert(!form.hidden);form.elements.title.value='Novo serviço';
 document.querySelector('[data-field="text"]').value='Descrição do novo serviço';
 form.dispatchEvent(new window.Event('submit',{cancelable:true}));await tick();assert.equal(cards().length,9);assert.equal(document.querySelector('#service-title').textContent,'Novo serviço');
}
(async()=>{
 await scenario(false);await scenario(true);
 for(const service of seed)for(const media of service.media)assert(fs.existsSync('public'+media.url));
 for(const filename of fs.readdirSync('public').filter(name=>name.endsWith('.html'))) {
  const html=fs.readFileSync('public/'+filename,'utf8');
  for(const [,url] of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g))assert(fs.existsSync('public'+url.split('?')[0]),url);
 }
 console.log('PASS: visitor/admin DOM flows; dialog, gallery, paragraphs, edit/create/delete, media removal, auth visibility and asset references.');
})().catch(error=>{console.error(error);process.exitCode=1;});
