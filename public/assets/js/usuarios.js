(() => {
 const panel=document.getElementById('usersPanel');
 const rows=document.getElementById('usersRows');
 const message=document.getElementById('usersMessage');
 const dialog=document.getElementById('userDialog');
 const form=document.getElementById('userForm');
 const formMessage=document.getElementById('formMessage');
 const profileFields=document.getElementById('profileFields');
 const passwordFields=document.getElementById('passwordFields');
 const saveButton=document.getElementById('saveUser');
 let users=[],mode='create',selectedId=null,busy=false;
 const redirect=() => { panel.hidden=true; dialog.close(); location.replace(RPAAuth.currentUser() ? '/index.html' : '/acesso.html?next=usuarios.html'); };
 function showError(error,target=message) {
  if(error.status===401 || error.status===403) { redirect(); return; }
  target.textContent=error.message || 'Não foi possível concluir a operação.';
  target.classList.add('error');
 }
 const endpoint=action=>'/api/admin/users/'+action+'.php';
 function formatDate(value) {
  // MySQL fornece hora local sem fuso; preserve o horário registrado pelo servidor.
  const match=/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(value||'');
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}` : '—';
 }
 function render() {
  rows.replaceChildren();
  const query=document.getElementById('userSearch').value.trim().toLocaleLowerCase('pt-BR');
  const filtered=users.filter(user=>[user.name,user.login,user.email].some(value=>value.toLocaleLowerCase('pt-BR').includes(query)));
  document.getElementById('usersCount').textContent=`${filtered.length} de ${users.length} administradores`;
  if(!filtered.length) { const row=rows.insertRow(); const cell=row.insertCell(); cell.colSpan=9; cell.textContent='Nenhum administrador encontrado.'; }
  for(const user of filtered) {
   const row=document.createElement('tr');
   const self=Number(user.id)===Number(RPAAuth.currentUser().id);
   for(const value of [user.id,user.name,user.login,user.email,user.role==='superadmin'?'Superadmin':'Admin',Number(user.must_change_password)?'Obrigatória':'Não solicitada',formatDate(user.created_at),formatDate(user.updated_at)]) {
    const cell=document.createElement('td'); cell.textContent=value; row.append(cell);
   }
   if(self) { const badge=document.createElement('span'); badge.className='self-badge'; badge.textContent='Você'; row.children[1].append(badge); }
   const cell=document.createElement('td'),actions=document.createElement('div'); actions.className='row-actions';
   for(const [action,label] of [['update','Editar'],['change-password','Alterar senha'],['delete','Excluir']]) {
    const button=document.createElement('button'); button.type='button'; button.textContent=label;
    button.dataset.action=action; button.dataset.id=user.id; button.className=action==='delete'?'danger':'secondary';
    if(action==='delete' && (self || (user.role==='superadmin' && users.filter(item=>item.role==='superadmin').length===1))) { button.disabled=true; button.title=self?'Você não pode excluir a própria conta.':'Não é permitido excluir o último superadmin.'; }
    actions.append(button);
   }
   cell.append(actions); row.append(cell); rows.append(row);
  }
 }
 async function reload() { users=(await RPAApi.request(endpoint('list'))).data; render(); }
 function openForm(action,user=null) {
  if(busy) return;
  mode=action; selectedId=user?.id??null; form.reset(); formMessage.textContent='';
  profileFields.hidden=profileFields.disabled=action==='change-password';
  passwordFields.hidden=passwordFields.disabled=false;
  form.elements.password.required=form.elements.confirmPassword.required=action!=='update';
  document.getElementById('passwordHint').textContent=action==='update'?'Deixe a senha em branco para manter a atual. Para redefinir, use de 12 caracteres a 72 bytes e confirme abaixo.':'Pelo menos 12 caracteres e no máximo 72 bytes.';
  document.getElementById('dialogTitle').textContent=action==='create'?'Novo administrador':action==='update'?'Editar administrador':`Alterar senha — ${user.name}`;
  if(user) for(const key of ['name','login','email','role']) form.elements[key].value=user[key];
  form.elements.must_change_password.checked=user?Boolean(Number(user.must_change_password)):false;
  form.elements.role.querySelector('[value="admin"]').disabled=Boolean(user && Number(user.id)===Number(RPAAuth.currentUser().id));
  if(!user) form.elements.role.value='admin';
  dialog.showModal();
  (action==='change-password'?form.elements.password:form.elements.name).focus();
 }
 document.getElementById('userSearch').addEventListener('input',render);
 document.getElementById('newUser').addEventListener('click',()=>openForm('create'));
 for(const id of ['closeDialog','cancelDialog']) document.getElementById(id).addEventListener('click',()=>{if(!busy) dialog.close();});
 dialog.addEventListener('cancel',event=>{if(busy) event.preventDefault();});
 dialog.addEventListener('close',()=>form.reset());
 rows.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-action]'); if(!button || busy) return;
  const user=users.find(item=>String(item.id)===button.dataset.id); if(!user) return;
  if(button.dataset.action!=='delete') { openForm(button.dataset.action,user); return; }
  if(!confirm(`Excluir o administrador "${user.name}" (${user.login})? Esta ação não pode ser desfeita.`)) return;
  busy=true; button.disabled=true; message.textContent='';
  try { await RPAApi.request(endpoint('delete'),{id:user.id}); await reload(); message.classList.remove('error'); message.textContent='Administrador excluído.'; }
  catch(error) { showError(error); button.disabled=false; }
  finally { busy=false; }
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault(); if(busy) return;
  const data=Object.fromEntries(new FormData(form)); if(selectedId!==null) data.id=selectedId;
  data.must_change_password=form.elements.must_change_password.checked;
  if(mode!=='update' || data.password || data.confirmPassword) {
   if([...data.password].length<12) { formMessage.textContent='A senha deve ter pelo menos 12 caracteres.'; return; }
   if(new TextEncoder().encode(data.password).length>72) { formMessage.textContent='A senha deve ter no máximo 72 bytes.'; return; }
   if(data.password!==data.confirmPassword) { formMessage.textContent='As senhas não coincidem.'; return; }
  }
  busy=true; saveButton.disabled=true; formMessage.textContent='';
  try {
   await RPAApi.request(endpoint(mode),data);
   dialog.close(); await RPAAuth.loadSession(); if(!RPAAuth.isSuperAdmin()) { redirect(); return; } await reload(); message.classList.remove('error'); message.textContent=mode==='change-password'?'Senha alterada.':'Administrador salvo.';
  } catch(error) { showError(error,dialog.open?formMessage:message); }
  finally { busy=false; saveButton.disabled=false; }
 });
 let auditNext=null;
 async function loadAudit(append=false) {
  const button=document.getElementById(append?'moreAudit':'refreshAudit'); button.disabled=true;
  const status=document.getElementById('auditMessage'); status.textContent='';
  try {
   const result=await RPAApi.request('/api/admin/audit/list.php'+(append?'?before='+auditNext:''));
   const container=document.getElementById('auditRows'); if(!append) container.replaceChildren();
   const actions={create:'Criação',update:'Edição',delete:'Exclusão',password_reset:'Senha redefinida',password_changed:'Senha alterada pelo usuário'};
   const entities={admins:'Usuários',products:'Produtos',site_contacts:'Contatos',about:'Sobre nós'};
   for(const item of result.data) {
    const details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('pre');
    summary.textContent=formatDate(item.created_at)+' — '+item.actor_login+' — '+(actions[item.action]||item.action)+' — '+(entities[item.entity]||item.entity)+' #'+item.record_id;
    const labels={name:'Nome',login:'Login',email:'E-mail',role:'Perfil',must_change_password:'Exigir troca de senha',password_reset:'Senha redefinida',price:'Preço',short_description:'Descrição curta',details:'Descrição completa',image_path:'Imagem',image_alt:'Descrição da imagem',phoneLabel:'Telefone',phoneLink:'Link do telefone',emailLabel:'E-mail',emailLink:'Link do e-mail',instagramLabel:'Instagram',instagramLink:'Link do Instagram',address:'Endereço',mapsLink:'Link do mapa',mapsEmbed:'Mapa incorporado',intro:'Introdução',blocks:'Blocos',intro_title:'Título da introdução',intro_text:'Texto da introdução',title:'Título',text:'Texto',badge:'Destaque',id:'ID',position:'Posição',inversed:'Layout invertido',updated_at:'Atualização'};
    const describe=(value,prefix='')=>Object.entries(value).flatMap(([key,val])=>{
     const label=prefix+(labels[key]||key);
     if(val!==null && typeof val==='object') return describe(val,label+' / ');
     if(['must_change_password','password_reset','inversed'].includes(key)) val=Number(val)?'Sim':'Não';
     return [label+': '+val];
    }).join('\n');
    body.textContent=describe(JSON.parse(item.details))||'Ação registrada; não há detalhes adicionais.'; details.append(summary,body); container.append(details);
   }
   auditNext=result.next; document.getElementById('moreAudit').hidden=!auditNext;
   if(!container.children.length) status.textContent='Nenhuma alteração registrada ainda.';
  } catch(error) { showError(error,status); } finally { button.disabled=false; }
 }
 document.getElementById('refreshAudit').addEventListener('click',()=>loadAudit());
 document.getElementById('moreAudit').addEventListener('click',()=>loadAudit(true));
 RPAAuth.ready.then(async()=>{
  if(!RPAAuth.isSuperAdmin()) { redirect(); return; }
  await reload(); document.getElementById('loading').hidden=true; panel.hidden=false; await loadAudit();
 }).catch(error=>{ document.getElementById('loading').textContent='Não foi possível carregar os administradores. Recarregue a página para tentar novamente.'; showError(error); });
})();
