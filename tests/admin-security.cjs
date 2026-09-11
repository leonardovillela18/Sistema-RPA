// Executar somente contra a instância local descartável descrita na documentação.
const assert=require('node:assert/strict');
const base='http://127.0.0.1:18079',u='/api/admin/users/',a={},b={},old={};
async function r(c,p,d,status=200,csrf=true){
 const response=await fetch(base+p,{method:d===undefined?'GET':'POST',headers:{Cookie:c.cookie||'','Content-Type':'application/json',...(csrf?{'X-CSRF-Token':c.csrf||''}:{})},body:d===undefined?undefined:JSON.stringify(d)});
 for(const v of response.headers.getSetCookie())if(v.startsWith('rpa_session='))c.cookie=v.split(';')[0];
 const text=await response.text();assert.equal(response.status,status,p+text);const j=JSON.parse(text);if(j.csrf)c.csrf=j.csrf;return j;
}
async function login(c,login,password){await r(c,'/api/auth/me.php');await r(c,'/api/auth/login.php',{login,password});return (await r(c,'/api/auth/me.php')).user;}
(async()=>{
 assert.equal((await r(a,'/api/auth/me.php')).user,null);
 const me=await login(a,'leonardo.villela','Test-password-123');assert.equal(me.role,'superadmin');
 const profile={name:'Teste Admin',login:'security_test',email:'security@example.test',role:'admin',must_change_password:true,password:'Temporary-pass-123',confirmPassword:'Temporary-pass-123'};
 const id=(await r(a,u+'create.php',profile,201)).data.id;
 let user=await login(b,profile.login,profile.password);assert.equal(user.must_change_password,true);
 for(const [path,data] of [[u+'list.php',undefined],['/api/admin/audit/list.php',undefined],['/api/admin/contacts/save.php',{}],['/api/admin/products/save.php',{}],['/api/admin/products/delete.php',{}],['/api/admin/about/save.php',{}]]) assert.equal((await r(b,path,data,403)).code,'PASSWORD_CHANGE_REQUIRED');
 const change={currentPassword:profile.password,password:'Personal-pass-456',confirmPassword:'Personal-pass-456'};
 await r(b,'/api/auth/change-password.php',change,403,false);
 await r(b,'/api/auth/change-password.php',{...change,currentPassword:'wrong'},422);
 await r(b,'/api/auth/change-password.php',{currentPassword:profile.password,password:profile.password,confirmPassword:profile.password},422);
 await r(b,'/api/auth/change-password.php',change);user=(await r(b,'/api/auth/me.php')).user;assert.equal(user.must_change_password,false);
 await r(b,u+'list.php',undefined,403);await r(b,'/api/admin/audit/list.php',undefined,403);
 for(const action of ['create','update','delete','change-password'])await r(b,u+action+'.php',{id},403);
 await login(old,profile.login,change.password);
 const snapshot=(await r(b,'/api/public/snapshot.php')).data;
 await r(b,'/api/admin/contacts/save.php',snapshot.contacts);
 const about=snapshot.about,aboutData={introTitle:about.introTitle,introText:about.introText};
 for(let i=0;i<3;i++){const block=about.blocks[i];aboutData['badge'+(i+1)]=block.badge;aboutData['title'+(i+1)]=block.title;aboutData['text'+(i+1)]=block.text;}
 await r(b,'/api/admin/about/save.php',aboutData);
 const product=snapshot.products[0];await r(b,'/api/admin/products/save.php',{id:product.id,name:product.name,price:String(product.price),shortDescription:product.shortDescription,details:product.details,imageAlt:product.imageAlt});
 let logs=(await r(a,'/api/admin/audit/list.php')).data;for(const entity of ['products','site_contacts','about'])assert.ok(logs.some(x=>x.actor_login===profile.login&&x.entity===entity));
 assert.ok(!JSON.stringify(logs).includes(profile.password));assert.ok(!JSON.stringify(logs).includes(change.password));
 await r(a,u+'update.php',{id,name:profile.name,login:profile.login,email:profile.email,role:'admin',must_change_password:true,password:'Reset-password-789',confirmPassword:'Reset-password-789'});
 assert.equal((await r(old,'/api/auth/me.php')).user,null);assert.equal((await r(b,'/api/auth/me.php')).user,null);
 await r(b,'/api/auth/login.php',{login:profile.login,password:change.password},401);
 user=await login(b,profile.login,'Reset-password-789');assert.equal(user.must_change_password,true);
 await r(b,'/api/auth/change-password.php',{currentPassword:'Reset-password-789',password:'Final-password-012',confirmPassword:'Final-password-012'});
 await r(a,u+'update.php',{id,name:profile.name,login:profile.login,email:profile.email,role:'superadmin',must_change_password:false});
 assert.equal((await r(b,'/api/auth/me.php')).user.role,'superadmin');await r(b,u+'list.php');
 await r(a,u+'update.php',{id,name:profile.name,login:profile.login,email:profile.email,role:'admin',must_change_password:false});await r(b,u+'list.php',undefined,403);
 await r(a,u+'update.php',{id:me.id,name:me.name,login:me.login,email:me.email,role:'admin',must_change_password:false},409);
 await r(a,u+'delete.php',{id:me.id},409);
 await r(a,u+'change-password.php',{id,password:'Another-reset-123',confirmPassword:'Another-reset-123',must_change_password:true});
 await r(a,u+'delete.php',{id});logs=(await r(a,'/api/admin/audit/list.php')).data;assert.ok(logs.some(x=>x.actor_login===profile.login));
 await r(a,'/api/auth/logout.php',{});assert.equal((await r(a,'/api/auth/me.php')).user,null);
 console.log('PASS: migration login, forced password, permissions, CSRF, personal password, reset/revocation, role changes, protected superadmin, content audit and logout.');
})().catch(e=>{console.error(e);process.exitCode=1});
