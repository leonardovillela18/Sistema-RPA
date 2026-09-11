window.RPAApi = (() => {
 let data={products:[],contacts:{},about:{blocks:[]}}, csrf='';
 function showError(error) { let box=document.getElementById('apiError'); if(!box) { box=document.createElement('p'); box.id='apiError'; box.setAttribute('role','alert'); document.querySelector('main')?.prepend(box); } box.textContent=error.message; }
 async function request(url,payload) {
  const options={credentials:'same-origin',headers:{Accept:'application/json'}};
  if(payload!==undefined) { options.method='POST'; options.headers['X-CSRF-Token']=csrf;
   if(payload instanceof FormData) options.body=payload; else {options.headers['Content-Type']='application/json'; options.body=JSON.stringify(payload);}
  }
  const response=await fetch(url,options); let result;
  try {result=await response.json();} catch {throw new Error('Resposta inválida do servidor. Verifique a configuração PHP.');}
  if(!response.ok || !result.ok) {
   const error=new Error(result.message || 'Não foi possível concluir a operação.');
   error.status=response.status;
   throw error;
  }
  return result;
 }
 async function reload() { data=(await request('/api/public/snapshot.php')).data; }
 async function save(endpoint,payload) { await request('/api/admin/'+endpoint+'.php',payload); await reload(); }
 const ready=reload(); ready.catch(showError);
 return {request,ready,showError,setCsrf:value=>csrf=value,getProducts:()=>data.products,getContacts:()=>data.contacts,getAboutContent:()=>data.about,save};
})();
