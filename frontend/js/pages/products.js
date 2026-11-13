'use strict';
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const products=CATALOG.map(([name,category,image,source],i)=>[escapeText(name),category,'','#ffffff',[['Unit katalog',null]],image,source,i]);
const $=id=>document.getElementById(id),rp=n=>'Rp'+n.toLocaleString('id-ID');
function read(key,fallback){try{return JSON.parse(localStorage.getItem('tws-reference-v1-'+key))||fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem('tws-reference-v1-'+key,JSON.stringify(value))}catch{}}
let limit=24;let cart=read('cart',{}),favorites=read('favorites',[]),category='Semua';
if(!Array.isArray(favorites))favorites=[];
if(!cart||typeof cart!=='object'||Array.isArray(cart))cart={};
for(const [key,n] of Object.entries(cart)){const [i,v]=key.split('-');if(!/^\d+-\d+$/.test(key)||!products[i]?.[4][v]||!Number.isInteger(n)||n<1||n>999)delete cart[key]}
function pack(p){return '<span role="img" aria-label="'+p[0]+'" class="photo" style="background-image:url(/assets/sheet-'+Math.floor(p[7]/16)+'.webp);background-position:'+((p[7]%4)*100/3)+'% '+(Math.floor((p[7]%16)/4)*100/3)+'%"></span>'}
function button(label,action,cls=''){const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=action;return b}
function render(){updateChat();const f=$('filters');f.replaceChildren();for(const c of ['Semua','Favorit',...new Set(products.map(p=>p[1]))])f.append(button(c,()=>{category=c;limit=24;render()},category===c?'active':''));const grid=$('grid');grid.replaceChildren();let matched=0;products.forEach((p,i)=>{if((category==='Favorit'?!favorites.includes(i):category!=='Semua'&&category!==p[1])||!p[0].toLowerCase().includes($('search').value.trim().toLowerCase()))return;matched++;if(matched>limit)return;const el=document.createElement('article');el.className='card';el.innerHTML='<button class="art" style="--tint:'+p[3]+'" aria-label="Detail '+p[0]+'">'+pack(p)+'</button><small>'+p[1]+' · Tangerang</small><h3>'+p[0]+'</h3><p><small>Harga belum tersedia</small></p><div class="row"></div>';el.firstChild.onclick=()=>detail(i);const fav=button(favorites.includes(i)?'♥':'♡',()=>{favorites=favorites.includes(i)?favorites.filter(x=>x!==i):[...favorites,i];save('favorites',favorites);render()});fav.setAttribute('aria-label','Favorit '+p[0]);fav.setAttribute('aria-pressed',favorites.includes(i));el.lastChild.append(button('Lihat produk',()=>detail(i)),fav);grid.append(el)});$('more').hidden=matched<=limit;$('status').textContent=matched+' produk · '+Math.min(matched,limit)+' ditampilkan';if(!grid.children.length)grid.textContent='Belum ada produk yang cocok.';$('basketCount').textContent=Object.values(cart).reduce((a,b)=>a+b,0);$('favoriteCount').textContent=favorites.length}
function modal(title,html,productId=null){chatView={title,productId};$('heading').textContent=title;$('panel').innerHTML=html;if(!$('box').open)$('box').showModal();updateChat()}
function detail(i){const p=products[i];modal(p[0],'<div class="art imgdetail" style="--tint:'+p[3]+'">'+pack(p)+'</div><small><a target="_blank" rel="noopener" href="'+p[5]+'">Buka foto ukuran asli</a> · Sumber: <a rel="noopener" target="_blank" href="'+p[6]+'">Mitra Sembako Indonesia</a>. Stok dan harga Tangerang belum dikonfirmasi.</small><form id="choose"><label>Kemasan<select id="variant">'+p[4].map(([s,n],v)=>'<option value="'+v+'">'+s+' · harga menunggu konfirmasi</option>').join('')+'</select></label><label>Jumlah<input id="qty" type="number" min="1" max="999" value="1" required></label><button class="primary full">Tambah ke keranjang</button></form>',i);$('choose').onsubmit=e=>{e.preventDefault();const k=i+'-'+$('variant').value;cart[k]=Math.min(999,(cart[k]||0)+Number($('qty').value));save('cart',cart);render();basket()}}
function subtotal(){return Object.entries(cart).reduce((sum,[k,n])=>{const [i,v]=k.split('-');return sum+n*products[i][4][v][1]},0)}
function basket(){modal('Keranjang belanja','');if(!Object.keys(cart).length){$('panel').textContent='Keranjang masih kosong. Pilih produk dari katalog.';return}for(const [k,n] of Object.entries(cart)){const [i,v]=k.split('-'),p=products[i],line=document.createElement('div');line.className='line';line.innerHTML='<b>'+p[0]+'</b> · '+p[4][v][0]+'<div class="row"><span>'+'Harga belum tersedia'+'</span><span></span></div>';const controls=line.querySelector('.row').lastChild;for(const d of [-1,0,1]){if(!d){controls.append(' '+n+' ');continue}const b=button(d<0?'−':'+',()=>{cart[k]=Math.min(999,cart[k]+d);if(!cart[k])delete cart[k];save('cart',cart);render();basket()});b.setAttribute('aria-label',(d<0?'Kurangi ':'Tambah ')+p[0]);controls.append(b)}$('panel').append(line)}$('panel').append(button('Coba checkout',checkout,'primary full'))}
function checkout(){modal('Checkout simulasi','<aside>Gunakan data contoh. Seluruh proses berlangsung di perangkat ini.</aside><form id="order"><label>Nama penerima<input required placeholder="Nama contoh"></label><label>Alamat tujuan<textarea required placeholder="Jalan, kota, kode pos contoh"></textarea></label><label>Pengiriman simulasi<select id="delivery"><option value="12000">Reguler · Rp12.000</option><option value="22000">Ekspres · Rp22.000</option></select></label><label>Pembayaran simulasi<select id="pay"><option>Virtual account</option><option>QRIS</option><option>Transfer bank</option></select></label><div id="total" class="notice"></div><button class="primary full">Buat pesanan simulasi</button></form>');const update=()=>{$('total').textContent='Ongkir contoh '+rp(+$('delivery').value)+'. Total akhir menunggu harga produk.'};update();$('delivery').onchange=update;$('order').onsubmit=e=>{e.preventDefault();const amount=subtotal()+Number($('delivery').value),method=$('pay').value;cart={};save('cart',cart);render();modal('Ringkasan pesanan simulasi','<b>simulasi-'+Date.now().toString(36).toUpperCase()+'</b><p>Ongkir simulasi <strong>'+rp(amount)+'</strong><br>Total pesanan menunggu harga produk.<br>Metode simulasi: '+method+'</p><aside>Simulasi selesai. Tidak ada tagihan atau pengiriman barang.</aside>')}}
let chatView=null;
function productKey(index){return new URL(CATALOG[index][3]).pathname.split('/').pop()}
function chatOrigin(){
  const url=new URL(location.pathname,location.origin);
  let label='Katalog utama',product='';
  if(chatView && $('box').open){
    label=chatView.title;
    if(chatView.productId!==null){
      product=CATALOG[chatView.productId][0];
      label='Detail produk';
      url.hash='produk='+encodeURIComponent(productKey(chatView.productId));
    }
  }else if(category!=='Semua'){
    label=category==='Favorit'?'Favorit':'Kategori '+category;
    url.hash='kategori='+encodeURIComponent(category);
  }
  if(!$('box').open && $('search').value.trim())label+=' · hasil pencarian';
  return {label,product,url:url.href};
}
function updateChat(){
  const {label,product,url}=chatOrigin();
  const message=['Halo Admin Teman Warung Sembako, saya ingin bertanya.',product && 'Produk: '+product,'Asal halaman: '+label,'Tautan: '+url].filter(Boolean).join('\n');
  for(const id of ['waFloat','waDialog'])$(id).href='https://wa.me/6289696211179?text='+encodeURIComponent(message);
}
function trackChat(){
  updateChat();
  const {label,product,url}=chatOrigin();
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push({event:'whatsapp_click',source_view:label,product_name:product,source_url:url});
}
function openSharedView(){
  const params=new URLSearchParams(location.hash.slice(1));
  const key=params.get('produk');
  if(key){
    const found=CATALOG.findIndex((_,i)=>productKey(i)===key);
    if(found>=0){detail(found);return}
  }
  const selected=params.get('kategori');
  if(selected==='Favorit'||CATALOG.some(item=>item[1]===selected)){category=selected;render()}
}
$('box').addEventListener('close',()=>{chatView=null;updateChat()});
for(const id of ['waFloat','waDialog'])$(id).addEventListener('click',trackChat);$('favoriteTop').onclick=()=>{category='Favorit';location.hash='favorit';$('katalog').scrollIntoView({behavior:'smooth'});render()};$('accountTop').onclick=()=>window.TWSAuth?.open();$('headerSearch').addEventListener('submit',e=>{e.preventDefault();$('search').value=$('searchTop').value;limit=24;render();$('katalog').scrollIntoView({behavior:'smooth'})});$('search').addEventListener('input',()=>{$('searchTop').value=$('search').value});
$('more').onclick=()=>{limit+=24;render()};$('search').oninput=()=>{limit=24;render()};$('basket').onclick=basket;$('closeBox').onclick=()=>$('box').close();const initialQuery=new URLSearchParams(location.search).get('q');if(initialQuery){$('search').value=initialQuery;$('searchTop').value=initialQuery}render();openSharedView();
