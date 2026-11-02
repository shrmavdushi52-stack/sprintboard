import {dn,iso} from './util.js';
const dur=c=>dn(c.due)-dn(c.start)+1,dated=c=>c.start&&c.due;
/** True if making `id` depend on `depId` would create a cycle. */
export function wouldCycle(cards,id,depId){if(id===depId)return true;const m=new Map(cards.map(c=>[c.id,c])),seen=new Set(),st=[depId];
 while(st.length){const x=st.pop();if(x===id)return true;if(seen.has(x))continue;seen.add(x);(m.get(x)?.deps||[]).forEach(d=>st.push(d))}return false}
/** Push successors later so each starts after its predecessors end; durations are preserved. Returns changed ids. */
export function cascade(cards,rootId){const changed=[],q=[rootId];let guard=cards.length*cards.length+10;
 while(q.length&&guard--){const pid=q.shift(),p=cards.find(c=>c.id===pid);if(!p||!dated(p))continue;
  for(const s of cards.filter(c=>c.deps?.includes(p.id)&&dated(c))){const need=dn(p.due)+1,d=need-dn(s.start);
   if(d>0){s.start=iso(dn(s.start)+d);s.due=iso(dn(s.due)+d);changed.push(s.id);q.push(s.id)}}}return changed}
/** Longest dependency chain by total duration (the critical path). */
export function criticalPath(cards){const m=new Map(cards.filter(dated).map(c=>[c.id,c])),memo=new Map();
 const best=id=>{if(memo.has(id))return memo.get(id);memo.set(id,{len:0,prev:null});const c=m.get(id);let b={len:dur(c),prev:null};
  for(const d of c.deps||[])if(m.has(d)){const r=best(d);if(r.len+dur(c)>b.len)b={len:r.len+dur(c),prev:d}}memo.set(id,b);return b};
 let top=null,tl=-1;for(const id of m.keys()){const l=best(id).len;if(l>tl){tl=l;top=id}}
 const out=new Set();for(let x=top;x;x=memo.get(x)?.prev)out.add(x);return out.size>1?out:new Set()}
const ics=s=>String(s).replace(/[\\;,]/g,'\\$&').replace(/\n/g,'\\n');
export function toICS(cards,now=new Date()){const stamp=now.toISOString().replace(/[-:]|\.\d+/g,''),d=s=>s.replace(/-/g,'');
 return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sprintboard//EN',...cards.filter(c=>c.due).flatMap(c=>['BEGIN:VEVENT',`UID:${c.id}@sprintboard`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${d(c.start||c.due)}`,`DTEND;VALUE=DATE:${d(iso(dn(c.due)+1))}`,`SUMMARY:${ics(c.title)}`,'END:VEVENT']),'END:VCALENDAR'].join('\r\n')}
