import {DAY,dn,iso,TODAY,uid,esc,md} from './lib/util.js';
import {createHistory} from './lib/history.js';
import {KEYS,parseFilters,serializeFilters,matches} from './lib/filters.js';
import {wouldCycle,cascade,criticalPath,toICS} from './lib/schedule.js';
import {load,persist,validate,exportJSON} from './lib/storage.js';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const PEOPLE=['Asha','Ben','Chen','Dara'],LABELS={bug:'#c2410c',feature:'#0f766e',design:'#7c3aed',infra:'#475569'};
const T=n=>iso(dn(TODAY)+n);
const mk=(title,col,a,s,d,l,deps=[])=>({id:uid(),title,col,assignee:a,start:T(s),due:T(d),labels:l,desc:'',checklist:[],comments:[],activity:[{t:Date.now(),m:'Created'}],files:[],deps});
function seed(){const c=[mk('Design tokens','done','Dara',-6,-3,['design']),mk('Auth mock screens','doing','Asha',-2,3,['feature']),mk('API contract','doing','Ben',-3,1,['infra']),mk('Board drag & drop','todo','Chen',2,6,['feature']),mk('Fix flaky tests','todo','Ben',1,2,['bug']),mk('Release notes','todo','Dara',7,9,[])];
 c[1].deps=[c[0].id];c[3].deps=[c[1].id];c[5].deps=[c[3].id];c[1].checklist=[{t:'Login',done:true},{t:'Signup',done:false}];c[1].desc='## Goal\nMock **login** and signup.\n- no real auth';
 return{cols:[{id:'todo',name:'To do',wip:0},{id:'doing',name:'In progress',wip:2},{id:'done',name:'Done',wip:0}],cards:c}}
let S=load()??seed();
const save=()=>persist(S),snap=()=>JSON.stringify(S),H=createHistory(100);
const readF=()=>parseFilters(location.search),vis=c=>matches(F,c);
let dragged=false,openId=null,loading=true,calM=TODAY.slice(0,7);
function commit(fn,card,msg){H.push(snap());fn();if(card&&msg)card.activity.push({t:Date.now(),m:msg});save();render()}
const dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click();URL.revokeObjectURL(a.href)};
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),1800)};
function undo(){const p=H.undo(snap());if(!p)return;S=JSON.parse(p);save();render();toast('Undone')}
function redo(){const p=H.redo(snap());if(!p)return;S=JSON.parse(p);save();render();toast('Redone')}
// filters + view synced to URL
let F=readF();if(!F.view)F.view='board';
function setF(p){Object.assign(F,p);history.replaceState(null,'','?'+serializeFilters(F));render()}
addEventListener('popstate',()=>{F=readF();F.view||='board';render()});
const byId=id=>S.cards.find(c=>c.id===id),colOf=id=>S.cols.find(c=>c.id===id);
const lbls=c=>c.labels.map(l=>`<span class=lb style="background:${LABELS[l]||'#555'}">${esc(l)}</span>`).join('');
const av=a=>a?`<span class=av title="${esc(a)}">${esc(a[0])}</span>`:'';
function move(id,col,beforeId){const c=byId(id),t=colOf(col);const n=S.cards.filter(x=>x.col===col&&x.id!==id).length;
 if(t.wip&&n>=t.wip&&c.col!==col){toast(`WIP limit of ${t.wip} reached in ${t.name}`);return}
 commit(()=>{S.cards=S.cards.filter(x=>x.id!==id);const from=c.col;c.col=col;const i=beforeId?S.cards.findIndex(x=>x.id===beforeId):-1;
  if(i>=0)S.cards.splice(i,0,c);else{let j=S.cards.map(x=>x.col).lastIndexOf(col);S.cards.splice(j+1,0,c)}
  if(from!==col)c.activity.push({t:Date.now(),m:`Moved to ${t.name}`})},null)}
// ---------- render
function render(){const cs=S.cards.filter(vis);
 const people=PEOPLE.map(p=>`<option ${F.assignee===p?'selected':''}>${p}</option>`).join(''),lb=Object.keys(LABELS).map(l=>`<option ${F.label===l?'selected':''}>${l}</option>`).join('');
 $('#app').innerHTML=`<header><h1>Sprintboard</h1>${['board','timeline','calendar','list'].map((v,i)=>`<button data-a=view data-v=${v} class="${F.view===v?'on':''}" title="Key ${i+1}">${v}</button>`).join('')}<span class=sp></span>
 <input id=q type=search placeholder="Search ( / )" value="${esc(F.q)}" aria-label=Search><select data-f=assignee aria-label=Assignee><option value="">Anyone</option>${people}</select><select data-f=label aria-label=Label><option value="">Any label</option>${lb}</select>
 <input type=date data-f=from value="${F.from}" aria-label="Due from"><input type=date data-f=to value="${F.to}" aria-label="Due to">
 <button data-a=undo ${H.canUndo()?'':'disabled'} title="Ctrl+Z">Undo</button><button data-a=redo ${H.canRedo()?'':'disabled'} title="Ctrl+Shift+Z">Redo</button>
 <button data-a=newcard title="N">+ Card</button><button data-a=newcol>+ Column</button><button data-a=theme title="T">Theme</button><button data-a=export>Export</button><button data-a=import>Import</button><button data-a=ics>.ics</button><button data-a=help>?</button></header><main>${loading?skel():{board,timeline,calendar,list}[F.view](cs)}</main>`;
 if(openId)drawer();bindDnD()}
const skel=()=>`<div class=board>${[1,2,3].map(()=>`<div class=col>${'<div class=sk></div>'.repeat(3)}</div>`).join('')}</div>`;
const empty=m=>`<div class=empty>${m}<br><br><button data-a=newcard>Add a card</button> <button data-a=clear>Clear filters</button></div>`;
const cardHTML=c=>{const d=c.checklist.filter(x=>x.done).length;return`<div class=card draggable=true data-id=${c.id} data-a=open tabindex=0><div class=t>${esc(c.title)}</div><div class=meta>${lbls(c)}${c.due?`<span class="${c.due<TODAY&&c.col!=='done'?'late':''}">${c.due}</span>`:''}${c.checklist.length?`<span>☑ ${d}/${c.checklist.length}</span>`:''}<span class=sp></span>${av(c.assignee)}</div></div>`};
function board(cs){if(!S.cards.length)return empty('No cards yet.');
 return`<div class=board>${S.cols.map(col=>{const all=S.cards.filter(c=>c.col===col.id).length,list=cs.filter(c=>c.col===col.id);
 return`<section class="col ${col.wip&&all>=col.wip?'full':''}" data-col=${col.id}><h3><span data-a=rename data-id=${col.id} title="Click to rename">${esc(col.name)}</span><span class=n>${all}${col.wip?'/'+col.wip:''}</span><span class=sp></span><button data-a=wip data-id=${col.id} title="Set WIP limit">WIP</button><button data-a=delcol data-id=${col.id} aria-label="Delete column">×</button></h3><div class=cards>${list.map(cardHTML).join('')||'<div class=empty>Drop cards here</div>'}</div></section>`}).join('')}</div>`}
const ZOOM={day:36,week:14,month:5};let zoom='week';
function timeline(cs){const L=cs.filter(c=>c.start&&c.due);if(!L.length)return empty('No scheduled cards match.');
 const crit=criticalPath(L),pd=ZOOM[zoom],r0=Math.min(...L.map(c=>dn(c.start)))-5,r1=Math.max(...L.map(c=>dn(c.due)))+10,W=(r1-r0)*pd,step={day:1,week:7,month:30}[zoom];
 const x=d=>(d-r0)*pd,row=new Map(L.map((c,i)=>[c.id,i]));let ticks='';for(let d=r0;d<r1;d+=step)ticks+=`<div class=tick style="left:${x(d)}px">${iso(d).slice(zoom==='month'?0:5)}</div>`;
 let arrows='';L.forEach(c=>c.deps.forEach(p=>{const a=byId(p);if(!a||!row.has(p))return;const x1=x(dn(a.due)+1),y1=row.get(p)*40+20,x2=x(dn(c.start)),y2=row.get(c.id)*40+20;arrows+=`<path d="M${x1} ${y1}C${x1+20} ${y1} ${x2-20} ${y2} ${x2} ${y2}" fill=none stroke="var(--mute)" stroke-width=1.5 marker-end="url(#h)"/>`}));
 return`<p>Red outline = critical path. Zoom ${Object.keys(ZOOM).map(z=>`<button data-a=zoom data-v=${z} class="${z===zoom?'on':''}">${z}</button>`).join(' ')}</p><div class=tl><div style="width:${W}px"><div class=hd style=position:relative>${ticks}</div>
 ${L.map(c=>`<div class=row><div class=bar data-id=${c.id} data-a=open style="left:${x(dn(c.start))}px;width:${(dn(c.due)-dn(c.start)+1)*pd}px;background:${LABELS[c.labels[0]]||'var(--acc)'};${crit.has(c.id)?'box-shadow:0 0 0 2px var(--bad)':''}" title="${crit.has(c.id)?'On critical path':''}"><i class=l></i>${esc(c.title)}<i class=r></i></div></div>`).join('')}
 <div class=today style="left:${x(dn(TODAY))}px;top:0"></div><svg width=${W} height=${L.length*40}><defs><marker id=h markerWidth=8 markerHeight=8 refX=6 refY=3 orient=auto><path d="M0 0L6 3 0 6z" fill="var(--mute)"/></marker></defs>${arrows}</svg></div></div>`}
function calendar(cs){const [y,m]=calM.split('-').map(Number),first=dn(`${calM}-01`),start=first-((new Date(first*DAY).getUTCDay()+6)%7);
 let h=`<p><button data-a=calprev>‹</button> <b>${calM}</b> <button data-a=calnext>›</button></p><div class=cal>`+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class=dh>${d}</div>`).join('');
 for(let i=0;i<42;i++){const d=iso(start+i);h+=`<div data-day=${d} class="${d.slice(0,7)!==calM?'dim':''} ${d===TODAY?'td':''}">${+d.slice(8)}${cs.filter(c=>c.due===d).map(c=>`<div class=chip draggable=true data-id=${c.id} data-a=open>${esc(c.title)}</div>`).join('')}</div>`}return h+'</div>'}
function list(cs){const k=F.sort||'due',dir=k[0]==='-'?-1:1,key=k.replace('-',''),g=c=>key==='col'?colOf(c.col)?.name:c[key]??'';
 const rows=[...cs].sort((a,b)=>String(g(a)).localeCompare(String(g(b)))*dir);if(!rows.length)return empty('No cards match.');
 return`<table><tr>${['title','col','assignee','start','due'].map(h=>`<th data-a=sort data-v=${h===key&&dir===1?'-'+h:h}>${h}${h===key?dir>0?' ▲':' ▼':''}</th>`).join('')}</tr>${rows.map(c=>`<tr data-id=${c.id} data-a=open><td>${esc(c.title)} ${lbls(c)}</td><td>${esc(colOf(c.col)?.name)}</td><td>${esc(c.assignee)}</td><td>${c.start||''}</td><td>${c.due||''}</td></tr>`).join('')}</table>`}
// ---------- drawer
function drawer(){const c=byId(openId),d=$('#drawer'),st=d.scrollTop;if(!c){openId=null;d.classList.remove('open');return}
 const o=(arr,v)=>arr.map(x=>`<option value="${x[0]??x}" ${(x[0]??x)===v?'selected':''}>${x[1]??x}</option>`).join('');
 d.innerHTML=`<button data-a=close style=float:right>Close (Esc)</button><h2>Card</h2><label>Title</label><input type=text data-e=title value="${esc(c.title)}">
 <label>Column</label><select data-e=col>${o(S.cols.map(x=>[x.id,x.name]),c.col)}</select><label>Assignee</label><select data-e=assignee><option value="">Unassigned</option>${o(PEOPLE,c.assignee)}</select>
 <label>Start</label><input type=date data-e=start value="${c.start||''}"><label>Due</label><input type=date data-e=due value="${c.due||''}">
 <label>Labels</label>${Object.keys(LABELS).map(l=>`<label style="display:inline;margin-right:8px"><input type=checkbox data-lb=${l} ${c.labels.includes(l)?'checked':''}> ${l}</label>`).join('')}
 <label>Depends on</label><select multiple data-e=deps>${S.cards.filter(x=>x.id!==c.id).map(x=>`<option value=${x.id} ${c.deps.includes(x.id)?'selected':''}>${esc(x.title)}</option>`).join('')}</select>
 <label>Description (Markdown)</label><textarea data-e=desc rows=5>${esc(c.desc)}</textarea><div class=md>${md(c.desc)||'<span style="color:var(--mute)">Preview appears here</span>'}</div>
 <label>Checklist</label>${c.checklist.map((x,i)=>`<div><input type=checkbox data-ck=${i} ${x.done?'checked':''}> ${esc(x.t)}</div>`).join('')}<input type=text data-add=check placeholder="Add item, press Enter">
 <label>Attachments (mock)</label>${c.files.map(f=>`<div>📎 ${esc(f)}</div>`).join('')}<button data-a=attach>Attach file</button>
 <label>Comments</label>${c.comments.map(x=>`<div class=cm>${esc(x.m)}<div class=ac>${new Date(x.t).toLocaleString()}</div></div>`).join('')}<input type=text data-add=comment placeholder="Write a comment, press Enter">
 <label>Activity</label>${[...c.activity].reverse().map(x=>`<div class=ac>${new Date(x.t).toLocaleString()} · ${esc(x.m)}</div>`).join('')}<p><button data-a=del style="color:var(--bad)">Delete card</button></p>`;
 d.classList.add('open');d.scrollTop=st}
// ---------- events
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const a=el.dataset.a,id=el.dataset.id;if(dragged&&a==='open')return;
 const A={view:()=>setF({view:el.dataset.v}),undo,redo,theme:()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.theme=t},
 open:()=>{openId=id;render()},close:()=>{openId=null;$('#drawer').classList.remove('open')},zoom:()=>{zoom=el.dataset.v;render()},
 sort:()=>setF({sort:el.dataset.v}),clear:()=>setF({assignee:'',label:'',from:'',to:'',q:''}),calprev:()=>{calM=iso(dn(calM+'-01')-1).slice(0,7);render()},calnext:()=>{calM=iso(dn(calM+'-01')+32).slice(0,7);render()},
 newcard:()=>{const c=mk('New card',S.cols[0]?.id,'',0,2,[]);if(!S.cols.length)return toast('Create a column first');commit(()=>S.cards.push(c));openId=c.id;render()},
 newcol:()=>{const n=prompt('Column name');n&&commit(()=>S.cols.push({id:uid(),name:n,wip:0}))},
 rename:()=>{const c=colOf(id),n=prompt('Rename column',c.name);n&&commit(()=>c.name=n)},
 wip:()=>{const c=colOf(id),n=prompt('WIP limit (0 = none)',c.wip);n!==null&&commit(()=>c.wip=Math.max(0,+n||0))},
 delcol:()=>{if(S.cards.some(c=>c.col===id))return toast('Move or delete the cards first');commit(()=>S.cols=S.cols.filter(c=>c.id!==id))},
 attach:()=>{const c=byId(openId),n=prompt('File name','spec.pdf');n&&commit(()=>c.files.push(n),c,`Attached ${n}`)},
 del:()=>{if(confirm('Delete this card?')){const i=openId;openId=null;commit(()=>S.cards=S.cards.filter(c=>c.id!==i))}},
 export:()=>dl('sprintboard.json',exportJSON(S),'application/json'),ics:()=>dl('sprintboard.ics',toICS(S.cards),'text/calendar'),
 import:()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{try{const d=validate(JSON.parse(await i.files[0].text()));commit(()=>{S=d});toast('Imported')}catch(x){toast('Import failed: '+x.message)}};i.click()},
 help:()=>alert('N new card · / search · 1-4 views · T theme · Ctrl+Z undo · Ctrl+Shift+Z redo · Alt+←/→ move focused card · Esc close · ? help')};
 if(a==='open'&&e.target.closest('button,input'))return;A[a]?.()});
document.addEventListener('change',e=>{const t=e.target,c=byId(openId);
 if(t.dataset.f)return setF({[t.dataset.f]:t.value});if(!c)return;
 if(t.dataset.e){const k=t.dataset.e;
  if(k==='col'){const prev=c.col;move(c.id,t.value);if(c.col===prev)render();return}if(k==='deps'){const v=[...t.selectedOptions].map(o=>o.value);if(v.some(d=>wouldCycle(S.cards,c.id,d)))return toast('That dependency would create a cycle'),render();}
  commit(()=>{c[k]=k==='deps'?[...t.selectedOptions].map(o=>o.value):t.value;if(k==='start'||k==='due'){if(c.start&&c.due&&c.due<c.start)c.due=c.start;const n=cascade(S.cards,c.id).length;if(n)toast(`Shifted ${n} dependent card${n>1?'s':''}`)}},c,`Edited ${k}`)}
 if(t.dataset.lb)commit(()=>c.labels=t.checked?[...c.labels,t.dataset.lb]:c.labels.filter(l=>l!==t.dataset.lb),c,`Label ${t.dataset.lb}`);
 if(t.dataset.ck)commit(()=>c.checklist[t.dataset.ck].done=t.checked,c,`Checklist: ${c.checklist[t.dataset.ck].t}`)});
document.addEventListener('input',e=>{if(e.target.dataset.e==='desc'){$('#drawer .md').innerHTML=md(e.target.value)||'<span style="color:var(--mute)">Preview appears here</span>'}
 if(e.target.id==='q'){const p=e.target.selectionStart;setF({q:e.target.value});const q=$('#q');q.focus();q.setSelectionRange(p,p)}});
document.addEventListener('keydown',e=>{const t=e.target,c=byId(openId);
 if(e.key==='Enter'&&t.dataset.add&&t.value.trim()){const v=t.value.trim(),k2=t.dataset.add;commit(()=>t.dataset.add==='check'?c.checklist.push({t:v,done:false}):c.comments.push({t:Date.now(),m:v}),c,t.dataset.add==='check'?'Added checklist item':'Commented');$('#drawer [data-add='+k2+']')?.focus();return}
 if(e.altKey&&t.dataset.id&&t.classList.contains('card')&&/Arrow(Left|Right)/.test(e.key)){const c=byId(t.dataset.id),i=S.cols.findIndex(x=>x.id===c.col)+(e.key==='ArrowRight'?1:-1);if(S.cols[i]){e.preventDefault();move(c.id,S.cols[i].id);setTimeout(()=>$(`.card[data-id=${c.id}]`)?.focus())}return}
 if(/INPUT|TEXTAREA|SELECT/.test(t.tagName)){if(e.key==='Escape')t.blur();return}
 const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if((e.ctrlKey||e.metaKey)&&k==='y')redo();
 else if(e.metaKey||e.ctrlKey||e.altKey)return;
 else if(k==='escape')document.querySelector('[data-a=close]')?.click();else if(k==='n')$('[data-a=newcard]').click();else if(k==='t')$('[data-a=theme]').click();else if(k==='?')$('[data-a=help]').click();
 else if(k==='/'){e.preventDefault();$('#q').focus()}else if('1234'.includes(k)&&k)setF({view:['board','timeline','calendar','list'][k-1]});
 else if(k==='enter'&&t.dataset.a==='open')t.click()});
// drag and drop (board cards + calendar chips)
function bindDnD(){let dragId=null;
 $$('[draggable]').forEach(el=>{el.ondragstart=e=>{dragId=el.dataset.id;el.classList.add('drag');e.dataTransfer.setData('text/plain',dragId)};el.ondragend=()=>el.classList.remove('drag')});
 $$('.col').forEach(col=>{col.ondragover=e=>{e.preventDefault();col.classList.add('over')};col.ondragleave=()=>col.classList.remove('over');
  col.ondrop=e=>{e.preventDefault();col.classList.remove('over');const others=$$('.card',col).filter(x=>x.dataset.id!==dragId);
   const before=others.find(x=>{const r=x.getBoundingClientRect();return e.clientY<r.top+r.height/2});move(dragId,col.dataset.col,before?.dataset.id)}});
 $$('[data-day]').forEach(cell=>{cell.ondragover=e=>e.preventDefault();cell.ondrop=e=>{e.preventDefault();const c=byId(dragId);if(!c)return;const sh=dn(cell.dataset.day)-dn(c.due);
  commit(()=>{c.due=cell.dataset.day;if(c.start)c.start=iso(dn(c.start)+sh);const n=cascade(S.cards,c.id).length;if(n)toast(`Shifted ${n} dependent card${n>1?'s':''}`)},c,`Rescheduled to ${cell.dataset.day}`)}});
 $$('.bar').forEach(b=>b.onpointerdown=e=>{e.preventDefault();const c=byId(b.dataset.id),mode=e.target.classList.contains('r')?'r':e.target.classList.contains('l')?'l':'m',x0=e.clientX,s0=dn(c.start),d0=dn(c.due),pd=ZOOM[zoom],before=snap();let moved=false;
  const mv=ev=>{const dd=Math.round((ev.clientX-x0)/pd);if(!dd&&!moved)return;moved=true;
   if(mode==='m'){c.start=iso(s0+dd);c.due=iso(d0+dd)}else if(mode==='r')c.due=iso(Math.max(s0,d0+dd));else c.start=iso(Math.min(d0,s0+dd));render()};
  const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(moved){H.push(before);cascade(S.cards,c.id);c.activity.push({t:Date.now(),m:`Rescheduled ${c.start} → ${c.due}`});save();dragged=true;setTimeout(()=>dragged=false,80);render()}};
  addEventListener('pointermove',mv);addEventListener('pointerup',up);if(!moved)setTimeout(()=>{},0)});}
document.documentElement.dataset.theme=localStorage.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
render();setTimeout(()=>{loading=false;render()},700);
