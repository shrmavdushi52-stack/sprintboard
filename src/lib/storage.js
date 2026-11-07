export const VERSION=2,KEY='sprintboard:v2';
const arr=v=>Array.isArray(v)?v:[],str=v=>typeof v==='string'?v:'';
export function validate(d){if(!d||!Array.isArray(d.cols)||!Array.isArray(d.cards))throw new Error('Expected {cols, cards}');
 const cols=d.cols.filter(c=>c&&typeof c.id==='string').map(c=>({id:c.id,name:String(c.name??c.id),wip:Math.max(0,+c.wip||0)})),ids=new Set(cols.map(c=>c.id));
 d.cards.forEach(c=>{if(!c||!c.id||typeof c.title!=='string'||!ids.has(c.col))throw new Error(`Invalid card: ${c?.title??c?.id}`)});
 return{cols,cards:d.cards.map(c=>({id:String(c.id),title:c.title,col:c.col,assignee:str(c.assignee),desc:str(c.desc),start:str(c.start),due:str(c.due),
  labels:arr(c.labels).filter(x=>typeof x==='string'),deps:arr(c.deps).filter(x=>typeof x==='string'),files:arr(c.files).filter(x=>typeof x==='string'),
  checklist:arr(c.checklist).filter(x=>x&&typeof x.t==='string').map(x=>({t:x.t,done:!!x.done})),
  comments:arr(c.comments).filter(x=>x&&typeof x.m==='string').map(x=>({t:+x.t||Date.now(),m:x.m})),
  activity:arr(c.activity).filter(x=>x&&typeof x.m==='string').map(x=>({t:+x.t||Date.now(),m:x.m}))}))}}
export function load(store=globalThis.localStorage){try{const raw=store.getItem(KEY)??store.getItem('sb');return raw?validate(JSON.parse(raw)):null}catch{return null}}
export function persist(S,store=globalThis.localStorage){try{store.setItem(KEY,JSON.stringify({v:VERSION,...S}))}catch{}}
export const exportJSON=S=>JSON.stringify({v:VERSION,...S},null,2);
