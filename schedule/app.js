const days=['一','二','三','四','五','六'];
const dayNames={一:'週一',二:'週二',三:'週三',四:'週四',五:'週五',六:'週六'};
const qs=new URLSearchParams(location.search);
const capture=qs.get('capture')==='1';
if(capture) document.body.classList.add('capture');
function taipeiDay(){const s=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',weekday:'short'}).format(new Date());return s.replace('週','').replace('星期','');}
function todayText(){return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('/','/');}
function signature(list){return JSON.stringify(list.map(x=>[x.course,x.start,x.end,x.teacher,x.room,x.credits]));}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function boot(){const data=await fetch('./data/schedule.json?ts='+Date.now()).then(r=>r.json());let selected=qs.get('day')||taipeiDay();if(!days.includes(selected))selected='一';
 const people=Object.keys(data.people); const buckets=new Map();
 for(const name of people){const list=data.people[name][selected]||[];const sig=signature(list);if(!buckets.has(sig))buckets.set(sig,{names:[],courses:list});buckets.get(sig).names.push(name);}
 const groups=[...buckets.values()]; const allSame=groups.length===1;
 document.querySelector('#weekday-label').textContent=dayNames[selected];document.querySelector('#date-label').textContent=todayText();document.querySelector('#page-title').textContent=capture?'今日課表':'課表預覽';
 document.querySelector('#summary-pill').textContent=allSame?'今日所有人課表相同':'今日課表不完全相同，依相同課表分組顯示';
 document.querySelectorAll('[data-day]').forEach(b=>{b.classList.toggle('active',b.dataset.day===selected);b.onclick=()=>{const u=new URL(location.href);u.searchParams.set('day',b.dataset.day);location.href=u;}});
 const root=document.querySelector('#groups');root.innerHTML='';
 for(const g of groups){const sec=document.createElement('section');sec.className='group';const names=allSame?'共同課表':g.names.join('／');const head=document.createElement('div');head.className='group-head';head.innerHTML=`<span>👤 ${esc(names)}</span><span class="count">${g.courses.length} 門課</span>`;sec.appendChild(head);const wrap=document.createElement('div');wrap.className='courses';
 if(!g.courses.length){wrap.innerHTML='<div class="empty">今日無課</div>';}else for(const c of g.courses){const card=document.createElement('article');card.className='course';card.innerHTML=`<h3>📘 ${esc(c.course)}</h3><div class="meta"><span>🕒 ${esc(c.start)}–${esc(c.end)}</span><span>👨‍🏫 ${esc(c.teacher)}</span><span>📍 ${esc(c.room==='未填'?'教室未填':c.room)}</span><span>🎓 ${esc(c.credits==='未填'?'學分未填':c.credits+'學分')}</span></div>`;wrap.appendChild(card);}sec.appendChild(wrap);root.appendChild(sec);}
 window.__scheduleReady=true;}
boot().catch(e=>{document.querySelector('#groups').innerHTML=`<div class="empty">讀取失敗：${esc(e.message)}</div>`;window.__scheduleReady=true;});
