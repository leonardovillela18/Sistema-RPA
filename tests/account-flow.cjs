// Teste HTTP com fixtures; não conecta a MySQL nem executa SQL.
const fs=require('node:fs'),assert=require('node:assert/strict');
const fixture=process.env.RPA_TEST_FIXTURE;
if(!fixture)throw Error('Informe RPA_TEST_FIXTURE da cópia temporária de teste.');
const base='http://127.0.0.1:18079',u='/api/admin/users/',a={},b={},other={};let checks=0;
async function request(c,path,data,status=200,csrf=true){
 const result=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{Cookie:c.cookie||'','Content-Type':'application/json',...(csrf?{'X-CSRF-Token':c.csrf||''}:{})},body:data===undefined?undefined:JSON.stringify(data)});
 for(const cookie of result.headers.getSetCookie())if(cookie.startsWith('rpa_session='))c.cookie=cookie.split(';')[0];
 const raw=await result.text();assert.equal(result.status,status,path+raw);const json=JSON.parse(raw);if(json.csrf)c.csrf=json.csrf;checks++;return json;
}
async function login(c,login,password){await request(c,'/api/auth/me.php');await request(c,'/api/auth/login.php',{login,password});return (await request(c,'/api/auth/me.php')).user;}
(async()=>{
 assert.equal((await request(a,'/api/auth/me.php')).user,null);
 let me=await login(a,'admin_test','Test-password-123');assert.equal(me.features_ready,false);
 assert.equal((await request(a,u+'list.php',undefined,409)).code,'ACCOUNT_SETUP_REQUIRED');
 assert.equal((await request(a,'/api/public/snapshot.php')).ok,true);
 const contacts=(await request(a,'/api/public/snapshot.php')).data.contacts;
 await request(a,'/api/admin/contacts/save.php',contacts);
 // Apenas fixture JSON de teste: simula a presença dos dois campos propostos.
 let state=JSON.parse(fs.readFileSync(fixture,'utf8'));for(const user of Object.values(state.admins)){user.can_manage_users=1;user.password_change_required=0;}fs.writeFileSync(fixture,JSON.stringify(state));
 me=(await request(a,'/api/auth/me.php')).user;assert.equal(me.features_ready,true);
 const profile={name:'Operator',login:'operator_test',email:'operator@example.test',function:'operator',password:'Temporary-password-123',confirmPassword:'Temporary-password-123',password_change_required:false};
 const id=(await request(a,u+'create.php',profile,201)).data.id;
 let user=await login(b,profile.login,profile.password);assert.equal(user.can_manage_users,false);assert.equal(user.password_change_required,true);assert.ok(!('password_hash'in user));
 for(const [path,data] of [[u+'list.php',undefined],['/api/admin/contacts/save.php',contacts],['/api/admin/products/save.php',{}],['/api/admin/products/delete.php',{}],['/api/admin/about/save.php',{}]]) assert.equal((await request(b,path,data,403)).code,'PASSWORD_CHANGE_REQUIRED');
 const change={currentPassword:profile.password,password:'Personal-password-456',confirmPassword:'Personal-password-456'};
 await request(b,'/api/auth/change-password.php',change,403,false);
 await request(b,'/api/auth/change-password.php',{...change,currentPassword:'wrong'},422);
 await request(b,'/api/auth/change-password.php',{...change,password:profile.password,confirmPassword:profile.password},422);
 await request(b,'/api/auth/change-password.php',{...change,confirmPassword:'different'},422);
 await request(b,'/api/auth/change-password.php',{...change,id:me.id});
 user=(await request(b,'/api/auth/me.php')).user;assert.equal(user.password_change_required,false);
 await request(b,u+'list.php',undefined,403);for(const action of ['create','update','change-password','delete'])await request(b,u+action+'.php',{id:me.id},403);
 await request(b,'/api/admin/contacts/save.php',contacts);
 await request(b,'/api/admin/contacts/save.php',contacts,403,false);
 await login(other,profile.login,change.password);
 await request(a,u+'update.php',{id,name:'Edited',login:profile.login,email:profile.email,function:'admin'});
 assert.equal((await request(b,'/api/auth/me.php')).user.can_manage_users,true);await request(b,u+'list.php');
 await request(a,u+'update.php',{id,name:'Edited',login:profile.login,email:profile.email,function:'operator'});await request(b,u+'list.php',undefined,403);
 await request(a,u+'update.php',{id:me.id,name:me.name,login:me.login,email:me.email,function:'operator'},409);await request(a,u+'delete.php',{id:me.id},409);
 await request(a,u+'change-password.php',{id,password:'Reset-password-789',confirmPassword:'Reset-password-789',password_change_required:false});
 assert.equal((await request(other,'/api/auth/me.php')).user,null);assert.equal((await request(b,'/api/auth/me.php')).user,null);
 await request(b,'/api/auth/login.php',{login:profile.login,password:change.password},401);
 user=await login(b,profile.login,'Reset-password-789');assert.equal(user.password_change_required,true);
 await request(b,'/api/auth/change-password.php',{currentPassword:'Reset-password-789',password:'Final-password-012',confirmPassword:'Final-password-012'});
 await request(b,'/api/auth/logout.php',{});await login(b,profile.login,'Final-password-012');
 const list=(await request(a,u+'list.php')).data;assert.ok(list.every(item=>!('password_hash'in item)));
 await request(a,u+'delete.php',{id});assert.equal((await request(b,'/api/auth/me.php')).user,null);
 await request(a,u+'delete.php',{id:me.id},409);
 for(const page of ['index','produtos','contato','sobre','servicos','usuarios','acesso','alterar-senha'])assert.equal((await fetch(base+'/'+page+'.html')).status,200);
 await request(a,'/api/auth/logout.php',{});assert.equal((await request(a,'/api/auth/me.php')).user,null);
 console.log('PASS: '+checks+' verificações HTTP simuladas + 8 páginas; nenhum SQL executado.');
})().catch(error=>{console.error(error);process.exitCode=1});
