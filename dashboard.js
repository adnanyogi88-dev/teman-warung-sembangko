import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "/auth-config.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"Rp"+Number(n||0).toLocaleString("id-ID");
const status=(s)=>{ $("status").textContent=s; };
const table=(headers,rows)=>rows.length?'<table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table>':'<p class="muted">Belum ada data.</p>';
let currentUser=null, profile=null;
async function init(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){location.href="/";return;}
 currentUser=session.user;
 const {data,error}=await supabase.from("profiles").select("id,display_name,role,created_at").eq("id",currentUser.id).single();
 if(error||!data){status("Profil belum dapat dibaca: "+(error?.message||"data tidak ditemukan"));return;}
 profile=data;
 $("welcome").textContent="Halo, "+(profile.display_name||currentUser.email.split("@")[0]);
 $("identity").textContent=currentUser.email;
 $("roleBadge").textContent="Hak akses: "+profile.role;
 $("displayName").value=profile.display_name||"";
 $("favoriteCount").textContent=(()=>{try{return JSON.parse(localStorage.getItem("tws-reference-v1-favorites")||"[]").length}catch{return 0}})();
 $("memberView").classList.remove("hidden");
 if(profile.role==="affiliate"){$("memberView").classList.add("hidden");$("affiliateView").classList.remove("hidden");await loadAffiliate();}
 if(profile.role==="admin"){$("memberView").classList.add("hidden");$("adminView").classList.remove("hidden");await loadAdmin();}
 if(profile.role==="member")await loadApplication();
 status("Dashboard siap. Data ditampilkan sesuai hak akses akun.");
}
async function loadApplication(){
 const {data,error}=await supabase.from("affiliate_applications").select("status,created_at").eq("user_id",currentUser.id).maybeSingle();
 if(error){$("applicationStatus").textContent="Status pengajuan belum tersedia.";return;}
 $("applicationStatus").textContent=data?"Status pengajuan: "+data.status:"Belum ada pengajuan affiliate.";
 $("affiliateForm").classList.toggle("hidden",!!data);
}
$("profileForm").addEventListener("submit",async e=>{
 e.preventDefault();const display_name=$("displayName").value.trim();
 const {error}=await supabase.from("profiles").update({display_name,updated_at:new Date().toISOString()}).eq("id",currentUser.id);
 if(error)status("Gagal menyimpan profil: "+error.message);else{$("welcome").textContent="Halo, "+display_name;status("Profil berhasil diperbarui.");}
});
$("affiliateForm").addEventListener("submit",async e=>{
 e.preventDefault();const motivation=$("motivation").value.trim();
 const {error}=await supabase.from("affiliate_applications").insert({user_id:currentUser.id,motivation});
 if(error)status("Pengajuan gagal: "+error.message);else{status("Pengajuan affiliate terkirim dan menunggu pemeriksaan admin.");await loadApplication();}
});
async function loadAffiliate(){
 const [{data:account,error:aErr},{data:refs,error:rErr},{data:comm,error:cErr}]=await Promise.all([
  supabase.from("affiliate_accounts").select("referral_code,status").eq("user_id",currentUser.id).single(),
  supabase.from("affiliate_referrals").select("id,created_at").eq("affiliate_user_id",currentUser.id).order("created_at",{ascending:false}),
  supabase.from("affiliate_commissions").select("amount,status,note,created_at,paid_at").eq("affiliate_user_id",currentUser.id).order("created_at",{ascending:false})
 ]);
 if(aErr){status("Data affiliate belum tersedia: "+aErr.message);return;}
 const link=location.origin+"/?ref="+encodeURIComponent(account.referral_code);
 $("refLink").textContent=link;$("copyRef").onclick=async()=>{try{await navigator.clipboard.writeText(link);status("Link referral disalin.");}catch{status("Salin link secara manual dari kotak link.");}};
 if(rErr||cErr){status("Sebagian data affiliate belum dapat dimuat.");return;}
 $("referralCount").textContent=refs.length;
 const total=comm.reduce((s,x)=>s+Number(x.amount),0),pending=comm.filter(x=>x.status==="pending"||x.status==="approved").reduce((s,x)=>s+Number(x.amount),0);
 $("commissionTotal").textContent=money(total);$("pendingTotal").textContent=money(pending);
 $("affiliateCommissions").innerHTML=table(["Tanggal","Nominal","Status","Tanggal dibayar","Catatan"],comm.map(x=>'<tr><td>'+esc(new Date(x.created_at).toLocaleDateString("id-ID"))+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.status)+'</td><td>'+(x.paid_at?esc(new Date(x.paid_at).toLocaleDateString("id-ID")):"—")+'</td><td>'+esc(x.note)+'</td></tr>'));
 $("affiliateReferrals").innerHTML=table(["Tanggal bergabung","Status"],refs.map(x=>'<tr><td>'+esc(new Date(x.created_at).toLocaleDateString("id-ID"))+'</td><td>Terdaftar</td></tr>'));
}
async function loadAdmin(){
 const [{data:members,error:mErr},{data:apps,error:aErr},{data:comm,error:cErr},{data:affs,error:fErr}]=await Promise.all([
  supabase.from("profiles").select("id,display_name,role,created_at").order("created_at",{ascending:false}),
  supabase.from("affiliate_applications").select("user_id,motivation,status,created_at").eq("status","pending").order("created_at",{ascending:true}),
  supabase.from("affiliate_commissions").select("id,amount,status,created_at,affiliate_user_id,paid_at").order("created_at",{ascending:false}),
  supabase.from("affiliate_accounts").select("user_id,referral_code,status")
 ]);
 if(mErr||aErr||cErr||fErr){status("Gagal memuat data admin. Periksa migrasi SQL dan kebijakan akses.");return;}
 $("memberTotal").textContent=members.length;$("applicationTotal").textContent=apps.length;
 $("adminCommissionTotal").textContent=money(comm.reduce((s,x)=>s+Number(x.amount),0));
 const emailMap={}; // Email sengaja tidak diambil dari auth.users di browser.
 $("membersTable").innerHTML=table(["Nama","Role","Terdaftar","ID pengguna"],members.map(m=>'<tr><td>'+esc(m.display_name||"—")+'</td><td><select data-role-user="'+esc(m.id)+'"><option value="member" '+(m.role==="member"?"selected":"")+'>member</option><option value="affiliate" '+(m.role==="affiliate"?"selected":"")+'>affiliate</option><option value="admin" '+(m.role==="admin"?"selected":"")+'>admin</option></select></td><td>'+esc(new Date(m.created_at).toLocaleDateString("id-ID"))+'</td><td><small>'+esc(m.id)+'</small></td></tr>'));
 $("membersTable").querySelectorAll("[data-role-user]").forEach(sel=>sel.addEventListener("change",async()=>{const {error}=await supabase.rpc("admin_set_user_role",{p_user_id:sel.dataset.roleUser,p_role:sel.value});if(error){status("Role gagal diubah: "+error.message);await loadAdmin();}else{status("Role pengguna berhasil diperbarui.");await loadAdmin();}}));
 $("applicationsTable").innerHTML=table(["ID pengguna","Motivasi","Tanggal","Tindakan"],apps.map(x=>'<tr><td><small>'+esc(x.user_id)+'</small></td><td>'+esc(x.motivation)+'</td><td>'+esc(new Date(x.created_at).toLocaleDateString("id-ID"))+'</td><td><button class="primary" data-review="'+esc(x.user_id)+'" data-approve="true">Setujui</button> <button data-review="'+esc(x.user_id)+'" data-approve="false">Tolak</button></td></tr>'));
 $("applicationsTable").querySelectorAll("[data-review]").forEach(b=>b.onclick=async()=>{const {error}=await supabase.rpc("admin_review_affiliate",{p_user_id:b.dataset.review,p_approve:b.dataset.approve==="true"});if(error)status("Review gagal: "+error.message);else status("Pengajuan affiliate diperbarui.");await loadAdmin();});
 $("commissionAffiliate").innerHTML=affs.filter(a=>a.status==="active").map(a=>'<option value="'+esc(a.user_id)+'">'+esc(a.referral_code)+'</option>').join("");
 $("adminCommissions").innerHTML=table(["Affiliate","Nominal","Status","Tanggal","Tindakan"],comm.map(x=>{const action=x.status==="pending"?'<button class="primary" data-commission-id="'+x.id+'" data-next-status="approved">Setujui</button> <button data-commission-id="'+x.id+'" data-next-status="rejected">Tolak</button>':x.status==="approved"?'<button class="primary" data-commission-id="'+x.id+'" data-next-status="paid">Tandai dibayar</button>':"—";return '<tr><td><small>'+esc(x.affiliate_user_id)+'</small></td><td>'+money(x.amount)+'</td><td>'+esc(x.status)+'</td><td>'+esc(new Date(x.created_at).toLocaleDateString("id-ID"))+'</td><td>'+action+'</td></tr>';}));
 $("adminCommissions").querySelectorAll("[data-commission-id]").forEach(b=>b.onclick=async()=>{if(b.dataset.nextStatus==="paid"&&!confirm("Pastikan transfer benar-benar sudah dilakukan. Lanjut tandai dibayar?"))return;b.disabled=true;const {error}=await supabase.rpc("admin_update_commission_status",{p_commission_id:Number(b.dataset.commissionId),p_status:b.dataset.nextStatus});if(error)status("Status komisi gagal diperbarui: "+error.message);else status("Status komisi berhasil diperbarui.");await loadAdmin();});
}
$("commissionForm").addEventListener("submit",async e=>{
 e.preventDefault();const affiliate_user_id=$("commissionAffiliate").value,amount=Number($("commissionAmount").value),note=$("commissionNote").value.trim();
 if(!affiliate_user_id||!Number.isFinite(amount)||amount<=0){status("Pilih affiliate dan nominal komisi yang valid.");return;}
 const {error}=await supabase.from("affiliate_commissions").insert({affiliate_user_id,amount,note});
 if(error)status("Komisi gagal dicatat: "+error.message);else{status("Komisi berhasil dicatat.");$("commissionAmount").value="";$("commissionNote").value="";await loadAdmin();}
});
$("logout").onclick=async()=>{await supabase.auth.signOut();location.href="/";};
supabase.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"||!session)location.href="/";});
init().catch(e=>status("Terjadi kesalahan: "+e.message));
