(() => {
 const form=document.getElementById('userForm');
 const password=document.getElementById('userPassword');
 const confirmation=document.getElementById('confirmPassword');
 const generate=document.getElementById('generatePassword');
 const copy=document.getElementById('copyPassword');
 const toggle=document.getElementById('togglePassword');
 const message=document.getElementById('passwordToolsMessage');
 const save=document.getElementById('saveUser');
 let revision=0;
 function visible(show) {
  password.type=show?'text':'password';
  toggle.textContent=show?'Ocultar senha':'Mostrar senha';
  toggle.setAttribute('aria-pressed',String(show));
 }
 function randomPassword() {
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?+-=';
  const limit=256-256%alphabet.length;
  let value;
  do {
   value='';
   while(value.length<20) {
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    for(const byte of bytes) {
     if(byte<limit) value+=alphabet[byte%alphabet.length];
     if(value.length===20) break;
    }
   }
  } while(!/[A-Z]/.test(value)||!/[a-z]/.test(value)||!/[0-9]/.test(value)||!/[!@#$%&*?+\-=]/.test(value));
  return value;
 }
 generate.addEventListener('click',()=>{
  if(save.disabled) return;
  try {
   const value=randomPassword();
   revision++; password.value=confirmation.value=value; copy.disabled=false;
   visible(true);
   message.textContent='Senha gerada e confirmação preenchida. Copie a senha e clique em Salvar para ativá-la.';
  } catch {
   message.textContent='Não foi possível gerar a senha neste navegador. Digite uma senha ou tente outro navegador.';
  }
 });
 copy.addEventListener('click',async()=>{
  if(!password.value || save.disabled) return;
  const current=revision;
  try {
   await navigator.clipboard.writeText(password.value);
   if(current===revision) message.textContent='Senha copiada. Ela só será ativada quando você clicar em Salvar.';
  } catch {
   if(current!==revision) return;
   visible(true); password.focus(); password.select();
   message.textContent='Não foi possível copiar automaticamente. Copie a senha selecionada manualmente.';
  }
 });
 toggle.addEventListener('click',()=>visible(password.type==='password'));
 password.addEventListener('input',()=>{revision++; copy.disabled=!password.value; message.textContent='';});
 form.addEventListener('reset',()=>{revision++; visible(false); copy.disabled=true; message.textContent='';});
})();
