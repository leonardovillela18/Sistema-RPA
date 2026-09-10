document.getElementById('loginForm').addEventListener('submit',async event => {
 event.preventDefault(); const button=event.target.querySelector('button'); button.disabled=true;
 const message=document.getElementById('authMessage'); message.setAttribute('role','alert');
 try { await RPAAuth.ready; await RPAAuth.login(document.getElementById('loginUser').value.trim(),document.getElementById('loginPassword').value); location.href=RPAAuth.getRedirectTarget(); }
 catch(error) { message.textContent=error.message; } finally { button.disabled=false; document.getElementById('loginPassword').value=''; }
});
