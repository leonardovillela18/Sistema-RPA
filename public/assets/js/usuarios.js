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
 const redirect=() => { panel.hidden=true; dialog.close(); location.replace(RPAAuth.currentUser()?.password_change_required ? '/alterar-senha.html' : RPAAuth.currentUser() ? '/index.html' : '/acesso.html?next=usuarios.html'); };
 function showError(error,target=message) {
  if(error.status===401) { location.replace('/acesso.html?next=usuarios.html'); return; }
  if(error.code==='PASSWORD_CHANGE_REQUIRED') { location.replace('/alterar-senha.html'); return; }
  if(error.status===403) { redirect(); return; }
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
  document.getElementById('usersCount').textContent=`${filtered.length} de ${users.length} usuários`;
  if(!filtered.length) { const row=rows.insertRow(); const cell=row.insertCell(); cell.colSpan=9; cell.textContent='Nenhum usuário encontrado.'; }
  for(const user of filtered) {
   const row=document.createElement('tr');
   const self=Number(user.id)===Number(RPAAuth.currentUser().id);
   for(const value of [user.id,user.name,user.login,user.email,Number(user.can_manage_users)?'Admin':'Operador',Number(user.password_change_required)?'Pendente':'Não pendente',formatDate(user.created_at),formatDate(user.updated_at)]) {
    const cell=document.createElement('td'); cell.textContent=value; row.append(cell);
   }
   if(self) { const badge=document.createElement('span'); badge.className='self-badge'; badge.textContent='Você'; row.children[1].append(badge); }
   const cell=document.createElement('td'),actions=document.createElement('div'); actions.className='row-actions';
   for(const [action,label] of [['update','Editar'],['change-password','Alterar senha'],['delete','Excluir']]) {
    const button=document.createElement('button'); button.type='button'; button.textContent=label;
    button.dataset.action=action; button.dataset.id=user.id; button.className=action==='delete'?'danger':'secondary';
    if(action==='delete' && (self || (Number(user.can_manage_users) && users.filter(item=>Number(item.can_manage_users)).length===1))) { button.disabled=true; button.title=self?'Você não pode excluir a própria conta.':'Não é permitido excluir o último administrador.'; }
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
  passwordFields.hidden=passwordFields.disabled=action==='update';
  document.getElementById('dialogTitle').textContent=action==='create'?'Novo usuário':action==='update'?'Editar usuário':`Alterar senha — ${user.name}`;
  if(user) for(const key of ['name','login','email']) form.elements[key].value=user[key];
  form.elements.function.value=user && Number(user.can_manage_users)?'admin':'operator';
  form.elements.function.querySelector('[value="operator"]').disabled=Boolean(user && Number(user.id)===Number(RPAAuth.currentUser().id));
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
  if(!confirm(`Excluir o usuário "${user.name}" (${user.login})? Esta ação não pode ser desfeita.`)) return;
  busy=true; button.disabled=true; message.textContent='';
  try { await RPAApi.request(endpoint('delete'),{id:user.id}); await reload(); message.classList.remove('error'); message.textContent='Usuário excluído.'; }
  catch(error) { showError(error); button.disabled=false; }
  finally { busy=false; }
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault(); if(busy) return;
  const data=Object.fromEntries(new FormData(form)); if(selectedId!==null) data.id=selectedId;
  if(mode!=='update') {
   if([...data.password].length<12) { formMessage.textContent='A senha deve ter pelo menos 12 caracteres.'; return; }
   if(new TextEncoder().encode(data.password).length>72) { formMessage.textContent='A senha deve ter no máximo 72 bytes.'; return; }
   if(data.password!==data.confirmPassword) { formMessage.textContent='As senhas não coincidem.'; return; }
  }
  busy=true; saveButton.disabled=true; formMessage.textContent='';
  try {
   await RPAApi.request(endpoint(mode),data);
   dialog.close(); await RPAAuth.loadSession(); if(!RPAAuth.currentUser()) { redirect(); return; } if(RPAAuth.currentUser().password_change_required) return; await reload(); message.classList.remove('error'); message.textContent=mode==='change-password'?'Senha alterada.':'Usuário salvo.';
  } catch(error) { showError(error,dialog.open?formMessage:message); }
  finally { busy=false; saveButton.disabled=false; }
 });
 RPAAuth.ready.then(async()=>{
  if(!RPAAuth.canManageUsers()) { redirect(); return; }
  if(!RPAAuth.currentUser().features_ready) { document.getElementById('loading').textContent='O gerenciamento de usuários aguarda a atualização manual aprovada do banco. O login e as páginas do site continuam disponíveis.'; return; }
  await reload(); document.getElementById('loading').hidden=true; panel.hidden=false;
 }).catch(error=>{ document.getElementById('loading').textContent='Não foi possível carregar os usuários. Recarregue a página para tentar novamente.'; showError(error); });
})();
