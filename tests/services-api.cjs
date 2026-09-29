const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const base='http://127.0.0.1:18081',admin={},operator={},anonymous={}; let checks=0;
async function request(session,url,body,status=200,csrf=true) {
 const multipart=body instanceof FormData;
 const response=await fetch(base+url,{method:body===undefined?'GET':'POST',headers:{Cookie:session.cookie||'',...(csrf?{'X-CSRF-Token':session.csrf||''}:{}),...(!multipart&&body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:multipart?body:JSON.stringify(body)});
 for(const cookie of response.headers.getSetCookie()) if(cookie.startsWith('rpa_session='))session.cookie=cookie.split(';')[0];
 const raw=await response.text(); assert.equal(response.status,status,url+' '+raw);
 const json=JSON.parse(raw); if(json.csrf)session.csrf=json.csrf; checks++; return json;
}
async function login(session,login){await request(session,'/api/auth/me.php');await request(session,'/api/auth/login.php',{login,password:'Service-test-12345'});return request(session,'/api/auth/me.php');}
const save='/api/admin/services/save.php',del='/api/admin/services/delete.php',list='/api/public/services.php';
const sections=[{heading:'Informações',text:'Descrição com acentos e\n\nparágrafos separados.',items:['Primeiro item','Segundo item']}];
function multipart(service,files=[]) {const form=new FormData();form.append('service',JSON.stringify(service));for(const [content,name,type] of files)form.append('media[]',new Blob([content],{type}),name);return form;}
(async()=>{
 let initial=await request(anonymous,list); assert.equal(initial.services.length,9);assert.equal(initial.revision,0);
 await request(anonymous,save,{title:'Unauthorized'},401);await request(anonymous,del,{},401);await request(anonymous,'/api/admin/users/create.php',{},401);
 await login(admin,'admin'); await login(operator,'operator');
 for(const url of [save,del,'/api/admin/users/create.php','/api/admin/users/update.php','/api/admin/users/delete.php','/api/admin/users/change-password.php']) await request(operator,url,{},403);
 await request(operator,'/api/admin/users/list.php',undefined,403);
 await request(admin,save,{},403,false);
 await request(admin,save,{revision:0,title:'Invalid',sections:[]},422);
 let catalog=await request(admin,save,{revision:0,title:'Novo serviço',sections,keepMedia:[]});
 const created=catalog.services.at(-1);assert.equal(catalog.services.length,10);assert.equal(catalog.revision,1);
 const png=fs.readFileSync('public/assets/img/migrated-product.png');
 catalog=await request(admin,save,multipart({id:created.id,revision:1,title:'Serviço editado',sections,keepMedia:[],mediaOrder:['new:0']},[[png,'photo.png','image/png']]));
 const image=catalog.services.at(-1).media[0];assert.equal(image.type,'image');assert(fs.existsSync(path.join(process.env.RPA_SERVICE_TEST_ROOT,image.url)));
 await request(admin,save,{id:created.id,revision:1,title:'Stale edit',sections,keepMedia:[image.id]},409);
 await request(admin,save,{id:created.id,revision:2,title:'Foreign media',sections,keepMedia:['original-cardan']},422);
 await request(admin,save,multipart({id:created.id,revision:2,title:'Bad upload',sections,keepMedia:[image.id]},[['<?php echo "bad"; ?>','fake.mp4','video/mp4']]),422);
 await request(admin,save,multipart({id:created.id,revision:2,title:'Bad upload',sections,keepMedia:[image.id]},[['<svg onload="alert(1)"></svg>','bad.svg','image/svg+xml']]),422);
 const dir=path.join(process.env.RPA_SERVICE_TEST_ROOT,'uploads/services');
 const count=fs.readdirSync(dir).length;
 await request(admin,save,multipart({id:created.id,revision:2,title:'Bad order',sections,keepMedia:[image.id],mediaOrder:[image.id,'new:7']},[[png,'photo.png','image/png']]),422);
 assert.equal(fs.readdirSync(dir).length,count,'Failed save must clean new uploads');
 // ISO media header used to exercise MIME validation and video persistence, not playback.
 const mp4=Buffer.from('000000206674797069736f6d0000020069736f6d69736f32617663316d7034310000000866726565000000086d646174','hex');
 catalog=await request(admin,save,multipart({id:created.id,revision:2,title:'Com vídeo',sections,keepMedia:[image.id],mediaOrder:['new:0',image.id]},[[mp4,'clip.mp4','video/mp4']]));
 const media=catalog.services.at(-1).media;assert.equal(media[0].type,'video');assert.equal(media[1].id,image.id);
 const persisted=await request(anonymous,list);assert.equal(persisted.services.at(-1).title,'Com vídeo');assert.deepEqual(persisted.services.at(-1).sections,sections);
 catalog=await request(admin,save,{id:created.id,revision:3,title:'Sem mídia',sections,keepMedia:[]});assert.equal(catalog.services.at(-1).media.length,0);
 for(const item of media)assert(!fs.existsSync(path.join(process.env.RPA_SERVICE_TEST_ROOT,item.url)),'Removed uploads must be deleted');
 await request(admin,del,{id:created.id,revision:3},409);
 catalog=await request(admin,del,{id:created.id,revision:4});assert.equal(catalog.services.length,9);
 // Persist deletion of the full catalog: never resurrect the bundled seed.
 for(const service of [...catalog.services])catalog=await request(admin,del,{id:service.id,revision:catalog.revision});
 assert.equal((await request(anonymous,list)).services.length,0);
 console.log(`PASS: ${checks} HTTP checks with isolated MySQL; CRUD, uploads, rollback cleanup, persistence, conflicts and admin-only permissions.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
