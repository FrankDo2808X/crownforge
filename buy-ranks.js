const CATEGORIES = [
  { id: 'survival', title: 'Survival', subtitle: 'Click to view', artwork: 'tralers.html' },
  { id: 'lifesteal', title: 'Lifesteal', subtitle: 'Click to view', artwork: 'tralers.html' },
  { id: 'prime', title: 'Prime Ranks', subtitle: 'Click to view', artwork: 'tralers.html' },
  { id: 'tags', title: 'Server Tags', subtitle: 'Click to view', artwork: 'tralers.html' },
  { id: 'coins', title: 'FleetCoins', subtitle: 'Click to view', artwork: 'tralers.html' },
  { id: 'gifts', title: 'Gift Cards', subtitle: 'Click to view', artwork: 'tralers.html' }
];

const RANKS = {
  survival: [
    { id: 'vip', name: 'VIP', price: 99, oldPrice: 199, duration: '30 days', benefits: ['Priority queue','/fly'], commands: ['/kit vip'] },
    { id: 'vip_plus', name: 'VIP+', price: 199, oldPrice: 299, duration: '60 days', benefits: ['More slots','/home'], commands: ['/kit vip+'] }
  ],
  prime: [
    { id: 'mvp', name: 'MVP', price: 499, oldPrice: 699, duration: '30 days', benefits: ['Fast queue','/warp'], commands: ['/kit mvp'] },
    { id: 'mvp_plus', name: 'MVP+', price: 799, oldPrice: 999, duration: '60 days', benefits: ['Extra perks'], commands: ['/kit mvp+'] }
  ],
  lifesteal: [
    { id: 'god', name: 'GOD', price: 999, oldPrice: 1299, duration: '30 days', benefits: ['Top priority'], commands: ['/god'] }
  ],
  tags: [],
  coins: [],
  gifts: []
};

let CART = JSON.parse(localStorage.getItem('cf_cart') || '[]');

function $(s){return document.querySelector(s)}

function updateCartCount(){ $('#cartCount').textContent = CART.reduce((s,i)=>s+i.qty,0); }

function renderCategories(){
  const c = $('#categoriesGrid');
  CATEGORIES.forEach(cat=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<h3>${cat.title}</h3><div class="muted">${cat.subtitle}</div>`;
    card.addEventListener('click',()=>openCategory(cat.id,cat.title));
    c.appendChild(card);
  });
}

function openCategory(id,title){
  $('#categoryTitle').textContent = title;
  const list = RANKS[id] || [];
  const container = $('#ranksGrid'); container.innerHTML = '';
  list.forEach(r=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<h3>${r.name}</h3><div class="muted"><span style="text-decoration:line-through;color:#999">₹${r.oldPrice || ''}</span> <span class="price">₹ ${r.price}</span></div><div class="controls"><button class="btn add" data-id="${r.id}" data-cat="${id}">Add to Cart</button><button class="secondary info" data-id="${r.id}" data-cat="${id}">Info</button></div>`;
    container.appendChild(card);
  });
}

function findRank(cat,id){
  const list = RANKS[cat]||[]; return list.find(r=>r.id===id);
}

function addToCart(cat,id){
  const rank = findRank(cat,id); if(!rank) return;
  const idx = CART.findIndex(i=>i.id===id);
  if(idx>=0) CART[idx].qty += 1; else CART.push({ id: id, cat: cat, name: rank.name, price: rank.price, qty: 1 });
  localStorage.setItem('cf_cart', JSON.stringify(CART));
  updateCartCount();
}

function openInfo(cat,id){
  const rank = findRank(cat,id); if(!rank) return;
  $('#panelContent').innerHTML = `<div style="padding:6px"><h2>${rank.name}</h2><div class="muted">Duration: ${rank.duration}</div><div style="margin-top:8px"><strong>Benefits</strong><ul>${rank.benefits.map(b=>`<li>${b}</li>`).join('')}</ul></div><div style="margin-top:8px"><strong>Commands</strong><pre style="background:transparent;padding:8px;border-radius:6px">${rank.commands.join('\n')}</pre></div><div style="margin-top:10px"><button id="panelAdd" class="btn">Add to Cart</button> <button id="panelGift" class="secondary">Gift this</button></div></div>`;
  $('#panelAdd').addEventListener('click',()=>{ addToCart(cat,id); setTimeout(()=>{ closePanel(); },150); });
  $('#panelGift').addEventListener('click',()=>{ alert('Gift flow not implemented yet'); });
  showPanel();
}

function showPanel(){ $('#overlay').style.display='block'; $('#rankPanel').style.display='block'; }
function closePanel(){ $('#overlay').style.display='none'; $('#rankPanel').style.display='none'; }

function renderRankClickHandlers(){
  document.body.addEventListener('click', e=>{
    const btn = e.target.closest('button'); if(!btn) return;
    if(btn.classList.contains('add')){ addToCart(btn.dataset.cat, btn.dataset.id); }
    if(btn.classList.contains('info')){ openInfo(btn.dataset.cat, btn.dataset.id); }
  });
}

function openCartPage(){
  // redirect to basket URL
  window.location.href = '/checkout/basket';
}

function buildCheckoutPanel(){
  const container = $('#checkoutContent');
  const total = CART.reduce((s,i)=>s + i.price * i.qty, 0);
  container.innerHTML = `<div><strong>Items</strong><div style="max-height:220px;overflow:auto;margin-top:8px">${CART.map(it=>`<div style="display:flex;justify-content:space-between;padding:6px 0"><div>${it.name} x${it.qty}</div><div>₹${it.price*it.qty}</div></div>`).join('')}</div><div style="margin-top:12px;display:flex;justify-content:space-between"><strong>Total</strong><strong>₹${total}</strong></div><div style="margin-top:12px"><label>Payment Mode</label><select id="cpPaymentMode"><option value="UPI">UPI</option><option value="CARD">Card</option><option value="NETBANKING">Netbanking</option><option value="WALLET">Wallet</option></select></div><div style="margin-top:12px"><button id="cpPay" class="btn">Pay Now</button></div></div>`;
  $('#cpPay').addEventListener('click', async ()=>{
    await createOrderFromCart($('#cpPaymentMode').value);
  });
}

async function createOrderFromCart(paymentMode){
  if(!firebase || !firebase.auth) { alert('Firebase not configured'); return; }
  const user = firebase.auth().currentUser; if(!user){ alert('Please sign in'); return; }
  const idToken = await user.getIdToken();
  const amount = CART.reduce((s,i)=>s + i.price * i.qty,0);
  const body = { cart: CART.map(i=>({ rankId: i.id, cat: i.cat, qty: i.qty })), amount, currency: 'INR', paymentMode };
  const payBtn = $('#cpPay'); payBtn.disabled = true; payBtn.textContent = 'Processing...';
  try{
    const res = await fetch('/createOrder', { method:'POST', headers:{'content-type':'application/json','authorization':'Bearer '+idToken}, body: JSON.stringify(body) });
    const data = await res.json();
    if(!res.ok){ alert(data.message || 'Order failed'); return; }
    // Prefer redirect URL if provided
    if(data.payment_url){ window.location.href = data.payment_url; return; }
    if(data.payment_session_id){
      // Insert Cashfree embedded checkout call here (merchant should update as per SDK)
      alert('Payment session created. Implement Cashfree checkout SDK to open embedded panel.');
      return;
    }
    alert('Order created. Follow server response.');
  }catch(err){ console.error(err); alert('Error creating order'); }
  finally{ payBtn.disabled=false; payBtn.textContent='Pay Now'; }
}

function init(){
  renderCategories();
  openCategory('survival','Featured Ranks');
  renderRankClickHandlers();
  updateCartCount();
  $('#openCartBtn').addEventListener('click',openCartPage);
  $('#closePanel').addEventListener('click',closePanel);
  $('#overlay').addEventListener('click',closePanel);
  $('#closeCheckout').addEventListener('click',()=>{ $('#checkoutPanel').style.display='none'; $('#overlay').style.display='none'; });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closePanel(); $('#checkoutPanel').style.display='none'; $('#overlay').style.display='none'; } });
}

window.addEventListener('DOMContentLoaded',init);

