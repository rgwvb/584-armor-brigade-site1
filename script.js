const menuBtn=document.getElementById("menuBtn"),navLinks=document.getElementById("navLinks");
menuBtn?.addEventListener("click",()=>{const o=navLinks?.classList.toggle("open");menuBtn.setAttribute("aria-expanded",String(!!o))});
document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>navLinks?.classList.remove("open")));
const year=document.getElementById("year");if(year)year.textContent=new Date().getFullYear();

const SHEET_ID="1s2RIXumsiaTy0pqeXfuHQgHk6YNs6YeEk4eTNxQFR6c";
function truthy(v){return v===true||v===1||String(v).toLowerCase()==="true"||String(v)==="1";}
async function loadSheet(sheet){
  const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}&t=${Date.now()}`;
  const txt=await fetch(url,{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.text()});
  const start=txt.indexOf("{"),end=txt.lastIndexOf("}");
  const data=JSON.parse(txt.slice(start,end+1));
  const headers=data.table.cols.map((c,i)=>c.label||c.id||("col"+i));
  return data.table.rows.map(r=>{
    const obj={};
    headers.forEach((h,i)=>obj[h]=r.c?.[i]?.v ?? "");
    return obj;
  });
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function catKey(label){
  if(/人事|升遷/.test(label))return "personnel";
  if(/演訓|訓練/.test(label))return "training";
  if(/榮譽|檢閱/.test(label))return "honor";
  return "general";
}
function albumClass(title){
  if(title.includes("機步"))return "mech";
  if(title.includes("戰車"))return "tank";
  if(title.includes("砲兵"))return "arty";
  if(title.includes("檢閱"))return "review";
  return "";
}
function galleryCat(label){
  if(label==="連隊")return "unit";
  if(label==="檢閱")return "review";
  return "training";
}

async function syncNews(){
  const list=document.querySelector(".news-list");
  const home=document.querySelector(".announcement-feed");
  if(!list&&!home)return;
  const rows=(await loadSheet("公告")).filter(r=>truthy(r["是否顯示"])).sort((a,b)=>String(b["日期"]).localeCompare(String(a["日期"])));
  if(list){
    list.innerHTML=rows.map(r=>`<article class="news-row" data-category="${catKey(r["分類"])}" data-search="${esc([r["標題"],r["分類"],r["內容摘要"]].join(" "))}"><time>${esc(r["日期"])}</time><span>${esc(r["分類"])}</span><div class="news-main"><h3>${esc(r["標題"])}</h3><p>${esc(r["內容摘要"]||"")}</p></div><a href="${esc(r["連結"]||"#")}">${r["連結"]?"查看":"—"}</a></article>`).join("");
    setupNewsFilters();
  }
  if(home){
    home.innerHTML=rows.slice(0,6).map(r=>`<article><time>${esc(r["日期"])}</time><div><b>[${esc(r["分類"])}]</b> ${esc(r["標題"])}</div><a href="${esc(r["連結"]||"news.html")}">查看</a></article>`).join("");
  }
}
function setupNewsFilters(){
  const search=document.getElementById("newsSearch"),buttons=[...document.querySelectorAll("[data-filter]")];
  let f="all";
  function apply(){
    const q=(search?.value||"").toLowerCase();
    document.querySelectorAll(".news-row").forEach(r=>r.classList.toggle("is-hidden",!((f==="all"||r.dataset.category===f)&&(!q||(r.dataset.search||"").toLowerCase().includes(q)))));
  }
  buttons.forEach(b=>b.onclick=()=>{buttons.forEach(x=>x.classList.remove("active"));b.classList.add("active");f=b.dataset.filter;apply()});
  if(search)search.oninput=apply;
}

async function syncRoles(){
  const container=document.getElementById("rolesDynamic");
  if(!container)return;
  const rows=(await loadSheet("人員表")).filter(r=>truthy(r["是否顯示"])).sort((a,b)=>(Number(a["排序"])||999)-(Number(b["排序"])||999));
  const groups={};
  rows.forEach(r=>{const g=r["單位"]||"其他";(groups[g]??=[]).push(r)});
  container.innerHTML=Object.entries(groups).map(([g,items])=>`
    <section class="role-section">
      <div class="portal-heading"><div><span>PERSONNEL</span><h2>${esc(g)}</h2></div></div>
      <div class="profile-grid">
        ${items.map(r=>{
          const name=esc(r["姓名/帳號"]||"職務資料待補");
          const period=[r["任期開始"],r["任期結束"]||"現任"].filter(Boolean).map(esc).join(" ～ ");
          const photo=r["照片網址"]?esc(r["照片網址"]):"";
          const account=esc(r["Roblox/Discord"]||"");
          const profile=esc(r["個人頁連結"]||"");
          return `<article class="profile-card">
            <div class="profile-head">
              <div class="profile-photo" ${photo?`style="background-image:url('${photo}')"`:""}>${photo?"":"584"}</div>
              <div>
                <span class="profile-role">${esc(r["職務"])}</span>
                <h3>${name}</h3>
                <small>${esc(r["英文職稱"]||"")}</small>
              </div>
            </div>
            <div class="profile-meta">
              ${period?`<div><b>任期</b><span>${period}</span></div>`:""}
              ${account?`<div><b>帳號</b><span>${account}</span></div>`:""}
            </div>
            ${r["個人簡介"]?`<p class="profile-bio">${esc(r["個人簡介"])}</p>`:""}
            <details class="profile-details">
              <summary>查看完整經歷</summary>
              <div class="profile-detail-body">
                <div><b>歷任職務</b><p>${esc(r["歷任職務"]||"尚未填寫")}</p></div>
                <div><b>重要經歷</b><p>${esc(r["重要經歷"]||"尚未填寫")}</p></div>
                <div><b>備註</b><p>${esc(r["備註"]||"—")}</p></div>
              </div>
            </details>
            <a class="profile-link" href="person.html?role=${encodeURIComponent(r["職務"])}">查看完整經歷 →</a>${profile?`<a class="profile-link secondary" href="${profile}" target="_blank" rel="noopener">外部個人頁 ↗</a>`:""}
          </article>`;
        }).join("")}
      </div>
    </section>`).join("");
}

async function syncRecords(){
  const timeline=document.getElementById("recordsDynamic")||document.querySelector(".portal-timeline");
  if(!timeline)return;
  const rows=(await loadSheet("檢閱紀錄")).filter(r=>truthy(r["是否顯示"])).sort((a,b)=>String(b["日期"]).localeCompare(String(a["日期"])));
  timeline.innerHTML=rows.map(r=>`<article><time>${esc(r["日期"])}</time><div><b>${esc(r["屆次"])}</b><p>${esc(r["成績"])}${r["成績"]==="冠軍"?" 👑":""}${r["備註"]?" · "+esc(r["備註"]):""}</p></div></article>`).join("");
}

async function syncUnits(){
  const grid=document.getElementById("unitsDynamic")||document.querySelector(".unit-detail-grid");
  const home=document.querySelector(".portal-unit-grid");
  if(!grid&&!home)return;
  const rows=(await loadSheet("單位資料")).filter(r=>truthy(r["是否顯示"])).sort((a,b)=>(Number(a["排序"])||999)-(Number(b["排序"])||999));
  if(grid){
    grid.innerHTML=rows.map(r=>`<article class="unit-detail-card"><div class="unit-detail-cover ${albumClass(r["單位名稱"])}"></div><div class="unit-detail-body"><h2>${esc(r["單位名稱"])}</h2><p>${esc(r["英文名稱"]||"")}</p><p>${esc(r["簡介"]||"")}</p><a href="gallery.html">查看相簿 →</a></div></article>`).join("");
  }
  if(home){
    home.innerHTML=rows.map(r=>`<a href="units.html"><b>${esc(r["單位名稱"])}</b><small>${esc(r["英文名稱"]||"")}</small></a>`).join("");
  }
}

async function syncGallery(){
  const grid=document.getElementById("albumGrid")||document.querySelector(".album-grid");
  if(!grid)return;
  const rows=(await loadSheet("相簿")).filter(r=>truthy(r["是否顯示"])).sort((a,b)=>(Number(a["排序"])||999)-(Number(b["排序"])||999));
  grid.innerHTML=rows.map(r=>`<article class="album-card ${albumClass(r["標題"])}" data-gallery-category="${galleryCat(r["分類"])}" ${r["封面圖片"]?`style="background-image:url('${esc(r["封面圖片"])}')"`:""}><div><span>${esc(r["分類"])}</span><h3>${esc(r["標題"])}</h3>${r["相簿網址"]?`<p><a href="${esc(r["相簿網址"])}" target="_blank" rel="noopener" style="color:#fff">開啟相簿 →</a></p>`:""}</div></article>`).join("");
  setupGalleryFilters();
}
function setupGalleryFilters(){
  const buttons=[...document.querySelectorAll("[data-gallery-filter]")];
  buttons.forEach(b=>b.onclick=()=>{buttons.forEach(x=>x.classList.remove("active"));b.classList.add("active");const c=b.dataset.galleryFilter;document.querySelectorAll("[data-gallery-category]").forEach(a=>a.classList.toggle("is-hidden",!(c==="all"||a.dataset.galleryCategory===c)))});
}

async function syncPersonPage(){
  const root=document.getElementById("personPage");
  if(!root)return;

  const role=new URLSearchParams(location.search).get("role")||"旅長";
  const rows=(await loadSheet("人員表"))
    .filter(r=>truthy(r["是否顯示"]))
    .sort((a,b)=>(Number(a["排序"])||999)-(Number(b["排序"])||999));

  const r=rows.find(x=>String(x["職務"])===role) || rows[0];
  if(!r){root.innerHTML="<div class=\"container\"><p>找不到人員資料。</p></div>";return;}

  document.title=(r["職務"]||"人物經歷")+"｜584";

  const photo=r["照片網址"]?esc(r["照片網址"]):"";
  const history=String(r["歷任職務"]||"").split(/\n|、|，|;/).map(s=>s.replace(/^[•●▪◦\\-]\\s*/,"").trim()).filter(Boolean);
  const current=String(r["重要經歷"]||"").split(/\n|、|，|;/).map(s=>s.replace(/^[•●▪◦\\-]\\s*/,"").trim()).filter(Boolean);
  const awards=String(r["勳章獎章"]||"").split(/\n|、|，|;/).map(s=>s.replace(/^[•●▪◦\\-]\\s*/,"").trim()).filter(Boolean);
  const period=[r["任期開始"],r["任期結束"]||"現任"].filter(Boolean).map(esc).join(" ～ ");

  const tabs=rows.slice(0,8).map((x,i)=>{
    const active=String(x["職務"])===String(r["職務"]);
    const cls=["cmd-tab","cmd-tab-"+((i%3)+1),active?"active":""].filter(Boolean).join(" ");
    return `<a class="${cls}" href="person.html?role=${encodeURIComponent(x["職務"])}">${esc(x["職務"])}</a>`;
  }).join("");

  const combined=[
    ...current.map(x=>({text:x,current:/現任/.test(x)})),
    ...history.map(x=>({text:x,current:false}))
  ];

  root.innerHTML=`
    <section class="cmd-page">
      <div class="cmd-tabs">${tabs}</div>

      <div class="container cmd-shell">
        <article class="cmd-card">
          <aside class="cmd-left">
            <div class="cmd-photo" ${photo?`style="background-image:url('${photo}')"`:""}>
              ${photo?"":'<span>584</span>'}
            </div>
            <h1>${esc(r["職務"])}</h1>
            <div class="cmd-name">${esc(r["姓名/帳號"]||"職務資料待補")}</div>
            ${r["英文職稱"]?`<small>${esc(r["英文職稱"])}</small>`:""}
            ${period?`<div class="cmd-period">${period}</div>`:""}
          </aside>

          <section class="cmd-right">
            <div class="cmd-watermark">584</div>

            <div class="cmd-section">
              <h2>經歷：</h2>
              <ul class="cmd-career-list">
                ${combined.length?combined.map(item=>`<li>${esc(item.text)}${item.current?'<strong>（現任）</strong>':""}</li>`).join(""):"<li>尚未填寫</li>"}
              </ul>
            </div>

            ${r["個人簡介"]?`
            <div class="cmd-section cmd-intro">
              <h2>簡介：</h2>
              <p>${esc(r["個人簡介"])}</p>
            </div>`:""}

            <div class="cmd-section">
              <h2 class="awards-title">勳章＆獎章</h2>
              <ul class="cmd-award-list">
                ${awards.length?awards.map(x=>`<li>${esc(x)}</li>`).join(""):"<li class=\"muted\">尚未填寫</li>"}
              </ul>
            </div>

            ${r["備註"]?`<div class="cmd-note">${esc(r["備註"])}</div>`:""}

            <div class="cmd-actions">
              <a href="roles.html">← 返回部門職務</a>
              ${r["個人頁連結"]?`<a href="${esc(r["個人頁連結"])}" target="_blank" rel="noopener">外部個人頁 ↗</a>`:""}
            </div>
          </section>
        </article>
      </div>
    </section>`;
}


function cleanHistoryNames(v){
  return String(v||"").split(/[、,，]/).map(x=>x.trim()).filter(x=>x&&x!=="缺職").join("、");
}
function compactLeadership(rows,key){
  const groups=[];
  rows.forEach(r=>{
    const names=cleanHistoryNames(r[key]);
    if(!names)return;
    const current=String(r["任期"]||"").includes("至今");
    const last=groups[groups.length-1];
    if(last&&last.names===names){
      last.end=r;
      last.current=last.current||current;
    }else{
      groups.push({names,start:r,end:r,current});
    }
  });
  return groups;
}
function leadershipRangeLabel(g){
  const a=String(g.start["屆次"]||"");
  const b=String(g.end["屆次"]||"");
  return a===b?a:`${a} → ${b}`;
}
function leadershipPeriod(g){
  const a=`${g.start["年度"]||""} ${g.start["任期"]||""}`.trim();
  const b=`${g.end["年度"]||""} ${g.end["任期"]||""}`.trim();
  return a===b?a:`${a} ～ ${b}`;
}
async function syncLeadershipHistory(){
  const grid=document.getElementById("leadershipHistoryGrid");
  if(!grid)return;
  const rows=(await loadSheet("歷屆幹部")).filter(r=>truthy(r["是否顯示"]));
  const roles=[
    ["旅長","Commander"],
    ["副旅長","Deputy Commander"],
    ["旅執行官","Executive Officer"],
    ["副旅執行官","Deputy Executive Officer"]
  ];
  grid.innerHTML=roles.map(([key,en])=>{
    const groups=compactLeadership(rows,key);
    return `<article class="history-leader-card">
      <header><h2>${esc(key)}</h2><p>${esc(en)}</p></header>
      <div class="history-leader-list">
        ${groups.length?groups.map(g=>`<div class="history-leader-row ${g.current?"current":""}">
          <div class="history-tenure">
            <b>${g.current?"現任":esc(leadershipRangeLabel(g))}</b>
            <small>${esc(leadershipPeriod(g))}</small>
          </div>
          <strong>${esc(g.names)}</strong>
        </div>`).join(""):'<div class="history-empty">暫無資料</div>'}
      </div>
    </article>`;
  }).join("");
}

(async()=>{
  try{
    await Promise.all([syncNews(),syncRoles(),syncRecords(),syncUnits(),syncGallery(),syncPersonPage(),syncLeadershipHistory()]);
    document.documentElement.dataset.sheetStatus="ok";
  }catch(err){
    console.warn("Google Sheet 同步失敗，保留頁面內建資料：",err);
    document.documentElement.dataset.sheetStatus="fallback";
    setupNewsFilters();
    setupGalleryFilters();
  }
})();