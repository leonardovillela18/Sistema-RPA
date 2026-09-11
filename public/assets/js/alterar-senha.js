(() => {
 const form=document.getElementById('passwordForm'),message=document.getElementById('authMessage'),button=form.querySelector('button');
 message.setAttribute('role','alert');
 RPAAuth.ready.then(()=>{
  const user=RPAAuth.currentUser();
  if(!user) {location.replace('/acesso.html');return;}
  if(!user.password_change_required) {location.replace(RPAAuth.getRedirectTarget());return;}
  button.disabled=false;
 }).catch(error=>message.textContent=error.message);
 form.addEventListener('submit',async event=>{
  event.preventDefault(); if(button.disabled) return; button.disabled=true;message.textContent='';
  try {
   await RPAApi.request('/api/auth/change-password.php',Object.fromEntries(new FormData(form)));
   form.reset();await RPAAuth.loadSession();location.replace(RPAAuth.getRedirectTarget());
  } catch(error) {message.textContent=error.message;if(error.status===401)location.replace('/acesso.html');}
  finally {button.disabled=false;}
 });
})();
