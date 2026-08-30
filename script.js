
// Official 584AB favicon
if(!document.querySelector('link[data-584-favicon]')){
  const favicon=document.createElement("link");
  favicon.rel="icon";
  favicon.type="image/png";
  favicon.href="assets/images/584AB.png";
  favicon.dataset["584Favicon"]="";
  document.head.appendChild(favicon);
}

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

  const [allRows,historyRows]=await Promise.all([
    loadSheet("人員表"),
    loadSheet("歷屆幹部")
  ]);

  const personnel=allRows
    .filter(r=>truthy(r["是否顯示"]))
    .sort((a,b)=>(Number(a["排序"])||999)-(Number(b["排序"])||999));

  const history=historyRows.filter(r=>truthy(r["是否顯示"]));

  const requested=new URLSearchParams(location.search).get("group")||"旅部";
  const allowed=["旅部","營部","連部"];
  const group=allowed.includes(requested)?requested:"旅部";

  document.querySelectorAll("[data-role-group]").forEach(a=>{
    a.classList.toggle("active",a.dataset.roleGroup===group);
  });

  const rows=personnel.filter(r=>{
    const unit=String(r["單位"]||"");
    if(group==="旅部")return unit==="旅部";
    if(group==="營部")return unit==="營部";
    return ["機步連","戰車連","砲兵連","通訊連","支援"].includes(unit);
  });

  const titles={
    "旅部":["BRIGADE HEADQUARTERS","旅部"],
    "營部":["BATTALION HEADQUARTERS","營部"],
    "連部":["COMPANY COMMAND","連部"]
  };
  const [enTitle,zhTitle]=titles[group];

  const historyRoleMap={
    "旅長":[{key:"旅長",termKey:"旅長任期"}],
    "副旅長":[
      {key:"作戰副旅長",termKey:"作戰副旅長任期",label:"作戰副旅長"},
      {key:"後勤副旅長",termKey:"後勤副旅長任期",label:"後勤副旅長"}
    ],
    "參謀長":[{key:"參謀長",termKey:"參謀長任期"}],
    "副參謀長（1）":[{key:"作戰副參謀長",termKey:"作戰副參謀長任期",label:"作戰副參謀長"}],
    "副參謀長（2）":[{key:"後勤副參謀長",termKey:"後勤副參謀長任期",label:"後勤副參謀長"}],
    "聯合兵種第一營營長":[{key:"聯合兵種第一營營長",termKey:"聯合兵種第一營營長任期"}],
    "聯合兵種第一營副營長":[{key:"聯合兵種第一營副營長",termKey:"聯合兵種第一營副營長任期"}],
    "砲兵營營長":[{key:"砲兵營營長",termKey:"砲兵營營長任期"}],
    "砲兵營副營長":[{key:"砲兵營副營長",termKey:"砲兵營副營長任期"}],
    "士官督導長":[{key:"士官督導長",termKey:"士官督導長任期"}],
    "機步連連長":[{key:"機步連連長",termKey:"機步連連長任期"}],
    "戰車連連長":[{key:"戰車連連長",termKey:"戰車連連長任期"}],
    "砲兵連連長":[{key:"砲兵連連長",termKey:"砲兵連連長任期"}],
    "通訊連連長":[{key:"通訊連連長",termKey:"通訊連連長任期"}],
    "後勤組組長":[{key:"後勤組組長",termKey:"後勤組組長任期"}],
    "保修組組長":[{key:"保修組組長",termKey:"保修組組長任期"}]
  };

  function cleanHistName(v){
    const s=String(v||"").trim();
    return !s||s==="缺職"?"":s;
  }

  function prettyTerm(v){
    return String(v||"")
      .replace(/\s*~\s*/g," ～ ")
      .replace(/-(?=\d{4}\/)/g," ～ ");
  }

  function getRoleHistory(role){
    const lanes=historyRoleMap[role]||[];
    const sections=[];

    lanes.forEach(lane=>{
      const seen=new Set();
      const items=[];

      history.forEach(row=>{
        const name=cleanHistName(row[lane.key]);
        if(!name)return;

        const term=String(row[lane.termKey]||"").trim();
        const id=name+"|"+term;
        if(seen.has(id))return;
        seen.add(id);

        items.push({name,term});
      });

      if(items.length){
        sections.push({
          label:lane.label||"",
          items
        });
      }
    });

    return sections;
  }

  function renderHistory(role){
    const sections=getRoleHistory(role);
    const total=sections.reduce((n,s)=>n+s.items.length,0);
    if(!total)return "";

    return `<details class="role-history-detail">
      <summary>
        <span>歷屆幹部</span>
        <b>${total} 任</b>
      </summary>
      <div class="role-history-body">
        ${sections.map(section=>`
          <div class="role-history-lane">
            ${section.label?`<div class="role-history-lane-title">${esc(section.label)}</div>`:""}
            <div class="role-history-list">
              ${section.items.map((item,i)=>`
                <div class="role-history-item">
                  <span>${esc(chineseOrdinal(i+1))}</span>
                  <strong>${esc(item.name)}</strong>
                  <small>${esc(prettyTerm(item.term)||"任期待補")}</small>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </details>`;
  }

  const cards=rows.map(r=>{
    const name=esc(r["姓名/帳號"]||"職務資料待補");
    const roleRaw=String(r["職務"]||"");
    const role=esc(roleRaw);
    const en=esc(r["英文職稱"]||"");
    const unit=esc(r["單位"]||"");
    const photo=r["照片網址"]?esc(r["照片網址"]):"";
    const account=esc(r["Roblox/Discord"]||"");
    const period=[r["任期開始"],r["任期結束"]||"現任"].filter(Boolean).map(esc).join(" ～ ");

    return `<article class="role-horizontal-card">
      <div class="role-horizontal-top">
        <div class="role-horizontal-photo" ${photo?`style="background-image:url('${photo}')"`:""}>
          ${photo?"":"<span>584</span>"}
        </div>
        <div class="role-horizontal-identity">
          <span class="role-horizontal-unit">${unit}</span>
          <b>${role}</b>
          <h3>${name}</h3>
          <small>${en}</small>
        </div>
      </div>

      <div class="role-horizontal-meta">
        <div><span>任期</span><b>${period||"現任"}</b></div>
        ${account?`<div><span>帳號</span><b>${account}</b></div>`:""}
      </div>

      ${r["個人簡介"]?`<p class="role-horizontal-bio">${esc(r["個人簡介"])}</p>`:""}

      ${renderHistory(roleRaw)}

      <a class="role-horizontal-link" href="person.html?role=${encodeURIComponent(roleRaw)}">查看完整經歷 →</a>
    </article>`;
  }).join("");

  container.innerHTML=`
    <div class="roles-section-heading">
      <span>${enTitle}</span>
      <h2>${zhTitle}</h2>
      <p>現任資料與歷屆幹部紀錄整合顯示；展開卡片即可查看歷任人員與任期。</p>
    </div>

    <div class="role-horizontal-rail" tabindex="0">
      ${cards||'<div class="roles-empty">目前沒有可顯示的人員資料。</div>'}
    </div>

    <div class="role-rail-hint">
      <span>SCROLL</span><i></i><small>可左右滑動查看更多職務</small>
    </div>
  `;
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
    grid.innerHTML=rows.map(r=>`<article class="unit-detail-card"><div class="unit-detail-cover ${albumClass(r["單位名稱"])}"></div><div class="unit-detail-body"><h2>${esc(r["單位名稱"])}</h2><p>${esc(r["英文名稱"]||"")}</p><p>${esc(r["簡介"]||"")}</p><a href="album.html?album=${encodeURIComponent(r["單位名稱"])}">打開相簿 →</a></div></article>`).join("");
  }
  if(home){
    home.innerHTML=rows.map(r=>`<a href="units.html"><b>${esc(r["單位名稱"])}</b><small>${esc(r["英文名稱"]||"")}</small></a>`).join("");
  }
}

async function syncGallery(){
  const grid=document.getElementById("albumGrid")||document.querySelector(".album-grid");
  if(!grid)return;
  const rows=(await loadSheet("相簿")).filter(r=>truthy(r["是否顯示"])).sort((a,b)=>(Number(a["排序"])||999)-(Number(b["排序"])||999));
  grid.innerHTML=rows.map(r=>`<a class="album-card album-link ${albumClass(r["標題"])}" data-gallery-category="${galleryCat(r["分類"])}" href="album.html?album=${encodeURIComponent(r["標題"])}" ${r["封面圖片"]?`style="background-image:url('${esc(r["封面圖片"])}')"`:""}><div><span>${esc(r["分類"])}</span><h3>${esc(r["標題"])}</h3><p>打開相簿 →</p></div></a>`).join("");
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
  let interrupted=false;
  rows.forEach(r=>{
    const names=cleanHistoryNames(r[key]);
    if(!names){
      interrupted=true;
      return;
    }
    const current=String(r["任期"]||"").includes("至今");
    const last=groups[groups.length-1];
    if(last&&!interrupted&&last.names===names){
      last.end=r;
      last.current=last.current||current;
    }else{
      groups.push({names,start:r,end:r,current});
    }
    interrupted=false;
  });
  return groups;
}
function chineseOrdinal(n){
  const nums=["零","一","二","三","四","五","六","七","八","九","十"];
  if(n<=10)return "第"+nums[n]+"任";
  if(n<20)return "第十"+nums[n-10]+"任";
  if(n===20)return "第二十任";
  return "第"+n+"任";
}
function termStart(v){
  const m=String(v||"").match(/^(.+?)(?:~|～|\s+-\s+|-(?=\d{4}\/))/);
  return m?m[1].trim():"";
}
function termEnd(v){
  const m=String(v||"").match(/(?:~|～|\s+-\s+|-(?=\d{4}\/))(.+)$/);
  return m?m[1].trim():"";
}
function leadershipPeriod(g,lane){
  const exact=lane?.termKey ? String(g.start[lane.termKey]||"").trim() : "";
  if(exact){
    const start=termStart(exact);
    const end=termEnd(exact);
    if(start||end)return `${start||"?"} ～ ${end||"?"}`;
    return exact;
  }
  const start=termStart(g.start["任期"]);
  const end=termEnd(g.end["任期"]);
  if(!start&&!end)return "";
  return `${start||"?"} ～ ${end||"?"}`;
}
function renderHistoryLane(rows,lane){
  const groups=compactLeadership(rows,lane.key);
  if(!groups.length&&lane.optional)return "";
  const terms=groups.length
    ? groups.map((g,i)=>`<div class="history-term ${g.current?"current":""}">
        <b>${esc(chineseOrdinal(i+1))}</b>
        <strong>${esc(g.names)}</strong>
        <small>${esc(leadershipPeriod(g,lane))}</small>
        ${g.current?'<em>現任</em>':""}
      </div>`).join("")
    : '<span class="history-no-data">尚無歷屆資料</span>';
  return `<div class="history-lane ${lane.legacy?"legacy":""}">
    ${lane.label?`<div class="history-lane-label">${esc(lane.label)}</div>`:""}
    <div class="history-tenure-strip">${terms}</div>
  </div>`;
}

async function syncLeadershipHistory(){
  const grid=document.getElementById("leadershipHistoryGrid");
  if(!grid)return;
  const rows=(await loadSheet("歷屆幹部")).filter(r=>truthy(r["是否顯示"]));

  const roleRows=[
    {title:"旅長",en:"Commander",lanes:[{key:"旅長",termKey:"旅長任期"}]},
    {title:"副旅長",en:"Deputy Commander",lanes:[
      {key:"作戰副旅長",label:"作戰副旅長",termKey:"作戰副旅長任期"},
      {key:"後勤副旅長",label:"後勤副旅長",termKey:"後勤副旅長任期"}
    ]},
    {title:"參謀長",en:"Chief of Staff",lanes:[{key:"參謀長",termKey:"參謀長任期"}]},
    {title:"副參謀長",en:"Deputy Chief of Staff",lanes:[
      {key:"作戰副參謀長",label:"作戰副參謀長",termKey:"作戰副參謀長任期"},
      {key:"後勤副參謀長",label:"後勤副參謀長",termKey:"後勤副參謀長任期"}
    ]},
    {title:"聯合兵種第一營營長",en:"Battalion Commander",lanes:[{key:"聯合兵種第一營營長",termKey:"聯合兵種第一營營長任期"}]},
    {title:"聯合兵種第一營副營長",en:"Deputy Battalion Commander",lanes:[{key:"聯合兵種第一營副營長",termKey:"聯合兵種第一營副營長任期"}]},
    {title:"砲兵營營長",en:"Artillery Battalion Commander",lanes:[{key:"砲兵營營長",termKey:"砲兵營營長任期"}]},
    {title:"砲兵營副營長",en:"Deputy Artillery Battalion Commander",lanes:[{key:"砲兵營副營長",termKey:"砲兵營副營長任期"}]},
    {title:"士官督導長",en:"Command Sergeant Major",lanes:[{key:"士官督導長",termKey:"士官督導長任期"}]},
    {title:"機步連連長",en:"Mechanized Infantry Company Commander",lanes:[{key:"機步連連長",termKey:"機步連連長任期"}]},
    {title:"戰車連連長",en:"Tank Company Commander",lanes:[{key:"戰車連連長",termKey:"戰車連連長任期"}]},
    {title:"砲兵連連長",en:"Artillery Company Commander",lanes:[{key:"砲兵連連長",termKey:"砲兵連連長任期"}]},
    {title:"通訊連連長",en:"Signal Company Commander",lanes:[{key:"通訊連連長",termKey:"通訊連連長任期"}]},
    {title:"後勤組組長",en:"Logistics Lead",lanes:[{key:"後勤組組長",termKey:"後勤組組長任期"}]},
    {title:"保修組組長",en:"Maintenance Lead",lanes:[{key:"保修組組長",termKey:"保修組組長任期"}]}
  ];

  grid.innerHTML=roleRows.map(role=>`<article class="history-role-section">
    <header class="history-role-header">
      <h2>${esc(role.title)}</h2>
      <p>${esc(role.en)}</p>
    </header>
    <div class="history-role-content">
      ${role.lanes.map(lane=>renderHistoryLane(rows,lane)).join("")}
    </div>
  </article>`).join("");
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
// ===== Wheel gallery controls =====
function initWheelGalleries(){
  const rails=[...document.querySelectorAll("[data-wheel-gallery]")];

  rails.forEach(rail=>{
    rail.addEventListener("wheel",e=>{
      if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
      const max=rail.scrollWidth-rail.clientWidth;
      if(max<=2)return;

      const dir=Math.sign(e.deltaY);
      const atStart=rail.scrollLeft<=2;
      const atEnd=rail.scrollLeft>=max-2;

      if((dir<0&&atStart)||(dir>0&&atEnd))return;

      e.preventDefault();
      rail.scrollBy({left:e.deltaY*1.25,behavior:"smooth"});
    },{passive:false});

    rail.addEventListener("keydown",e=>{
      if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
      e.preventDefault();
      rail.scrollBy({
        left:(e.key==="ArrowRight"?1:-1)*rail.clientWidth*.72,
        behavior:"smooth"
      });
    });
  });

  document.querySelectorAll("[data-wheel-prev],[data-wheel-next]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.dataset.wheelPrev||btn.dataset.wheelNext;
      const rail=document.getElementById(id);
      if(!rail)return;
      const dir=btn.dataset.wheelNext?1:-1;
      rail.scrollBy({left:dir*rail.clientWidth*.72,behavior:"smooth"});
    });
  });
}
initWheelGalleries();
