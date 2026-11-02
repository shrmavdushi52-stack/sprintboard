export const DAY=864e5,dn=s=>Math.round(Date.parse(s)/DAY),iso=n=>new Date(n*DAY).toISOString().slice(0,10);
export const TODAY=iso(Math.floor(Date.now()/DAY)),uid=()=>Math.random().toString(36).slice(2,8);
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const md=t=>esc(t).replace(/^### (.*)$/gm,'<h4>$1</h4>').replace(/^## (.*)$/gm,'<h3>$1</h3>').replace(/^# (.*)$/gm,'<h2>$1</h2>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/^- (.*)$/gm,'<li>$1</li>').replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\n/g,'<br>');
