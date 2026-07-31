// breadboardOS — no frameworks, just DOM + canvas
// state in memStore (falls back if localStorage is blocked)

const memStore = (() => {
  const ram = Object.create(null);
  return {
    get(k){ try{ return localStorage.getItem(k) } catch(e){ return k in ram ? ram[k] : null } },
    set(k,v){ try{ localStorage.setItem(k,v) } catch(e){ ram[k]=String(v) } }
  } 
})();   

function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML }
function toast(msg){
  const el=document.createElement('div'); el.className='toast'; el.textContent=msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(()=>el.remove(),2800); 
}                                                  

let beepCtx=null;
function beep(freq=440,dur=.05){
  if(memStore.get('bb_mute')==='1') return;
  try{
    if(!beepCtx) beepCtx=new (window.AudioContext||window.webkitAudioContext)();
    const o=beepCtx.createOscillator(), g=beepCtx.createGain();
    o.type='square'; o.frequency.value=freq;
    g.gain.setValueAtTime(.035,beepCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,beepCtx.currentTime+dur);
    o.connect(g).connect(beepCtx.destination); o.start(); o.stop(beepCtx.currentTime+dur);
  }catch(e){}
}

window.addEventListener('load',()=>{
  setTimeout(()=>document.getElementById('boot').classList.add('hide'),1300);
});

// wallpaper — actual breadboard holes + power rails
const cv=document.getElementById('board'), bctx=cv.getContext('2d');
function fitCanvas(){ cv.width=innerWidth; cv.height=innerHeight }
addEventListener('resize',fitCanvas); fitCanvas();

function runBoardAnim(){
  const BOARD_BG='#efe7cd', HOLE='rgba(32,29,22,0.5)';
  const RAIL_RED='#cf3a34', RAIL_BLUE='#2c5aa0';
  const col=15, row=14, railH=46, gutter=row*2, seam=row*2.4, rowsPerBlock=5;
  const blockH=rowsPerBlock*row, unitH=blockH*2+gutter+seam;

  // little lights drifting along the rails
  let railPulses=[
    {rail:'plus',color:RAIL_RED,x:-30,speed:.7+Math.random()*.5},
    {rail:'plus',color:RAIL_RED,x:cv.width*.5,speed:.7+Math.random()*.5},
    {rail:'minus',color:RAIL_BLUE,x:-90,speed:.7+Math.random()*.5},
    {rail:'minus',color:RAIL_BLUE,x:cv.width*.7,speed:.7+Math.random()*.5},
  ];

  function holeRow(y,fromX,toX){
    bctx.fillStyle=HOLE;
    for(let x=fromX;x<toX;x+=col){ bctx.beginPath(); bctx.arc(x,y,1.5,0,7); bctx.fill() }
  }

  function drawRailBand(topY){
    const plusY=topY+14, minusY=topY+30;
    bctx.strokeStyle=RAIL_RED; bctx.globalAlpha=.65; bctx.lineWidth=2;
    bctx.beginPath(); bctx.moveTo(26,plusY-9); bctx.lineTo(cv.width-26,plusY-9); bctx.stroke();
    bctx.strokeStyle=RAIL_BLUE;
    bctx.beginPath(); bctx.moveTo(26,minusY+9); bctx.lineTo(cv.width-26,minusY+9); bctx.stroke();
    bctx.globalAlpha=1;
    holeRow(plusY,40,cv.width-26);
    holeRow(minusY,40,cv.width-26);
    return {plusY,minusY};
  }

  function drawTerminalField(startY,endY){
    for(let x=40;x<cv.width-26;x+=col){
      let base=startY;
      while(base<endY){
        for(let i=0;i<rowsPerBlock;i++) holeRow(base+i*row,x,x+1);
        for(let i=0;i<rowsPerBlock;i++) holeRow(base+blockH+gutter+i*row,x,x+1);
        base+=unitH;
      }
    }
    bctx.strokeStyle='rgba(32,29,22,0.10)'; bctx.lineWidth=1;
    let base=startY;
    while(base<endY){
      const gutterY=base+blockH+gutter/2;
      bctx.beginPath(); bctx.moveTo(20,gutterY); bctx.lineTo(cv.width-20,gutterY); bctx.stroke();
      const seamY=base+blockH*2+gutter+seam/2;
      bctx.strokeStyle='rgba(32,29,22,0.16)';
      bctx.beginPath(); bctx.moveTo(0,seamY); bctx.lineTo(cv.width,seamY); bctx.stroke();
      bctx.strokeStyle='rgba(32,29,22,0.10)';
      base+=unitH;
    }
  }

  (function draw(){
    bctx.fillStyle=BOARD_BG; bctx.fillRect(0,0,cv.width,cv.height);
    const top=drawRailBand(6);
    const bottom=drawRailBand(cv.height-railH+6);
    drawTerminalField(railH+8,cv.height-railH-8);

    bctx.shadowBlur=6;
    railPulses.forEach(p=>{
      p.x+=p.speed;
      if(p.x>cv.width+30) p.x=-30;
      const topY=p.rail==='plus'?top.plusY:top.minusY;
      const bottomY=p.rail==='plus'?bottom.plusY:bottom.minusY;
      bctx.shadowColor=p.color; bctx.fillStyle=p.color; bctx.globalAlpha=.8;
      bctx.beginPath(); bctx.arc(p.x,topY,2,0,7); bctx.fill();
      bctx.beginPath(); bctx.arc(p.x,bottomY,2,0,7); bctx.fill();
      bctx.globalAlpha=1;
    });
    bctx.shadowBlur=0;
    requestAnimationFrame(draw);
  })();
}
runBoardAnim();

const ACCENTS=[
  {id:'copper',hex:'#c9793a'},{id:'amber',hex:'#ffb020'},
  {id:'mint',hex:'#5fd08a'},{id:'wire-blue',hex:'#5eb3d6'},
];
function applyAccent(id,silent){
  const a=ACCENTS.find(x=>x.id===id)||ACCENTS[0];
  document.documentElement.style.setProperty('--copper',a.hex);
  memStore.set('bb_accent',a.id);
  document.querySelectorAll('.acc-dot').forEach(d=>d.classList.toggle('on',d.dataset.id===a.id));
  if(!silent) beep(520,.04);
}

function tickClock(){
  const now=new Date();
  const t=now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
  const d=now.toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'});
  const box=document.getElementById('clk');
  box.querySelector('.t').textContent=t;
  box.querySelector('.d').textContent=d;
}
setInterval(tickClock,1000); tickClock();

// window manager
let zTop=100;
const cleanup={};

function openPane(id,title,html,w=560,h=380){
  if(document.getElementById('pane-'+id)){ focusPane(id); return }
  const el=document.createElement('div');
  el.className='pane pane-in'; el.id='pane-'+id;
  el.style.width=w+'px'; el.style.height=h+'px';
  el.style.top=(46+Math.random()*40)+'px';
  el.style.left=(70+Math.random()*70)+'px';
  el.style.zIndex=++zTop;
  el.innerHTML=`
    <div class="bar" onmousedown="beginDrag(event,'${id}')" ondblclick="toggleFull('${id}')">
      <span>${title}</span>
      <div class="btns">
        <button class="dot m" onclick="toggleMin('${id}')"><svg><use href="#ic-min"/></svg></button>
        <button class="dot o" onclick="toggleFull('${id}')"><svg><use href="#ic-max"/></svg></button>
        <button class="dot x" onclick="closePane('${id}')"><svg><use href="#ic-x"/></svg></button>
      </div>
    </div>
    <div class="body-area">${html}</div>
    <div class="grip" onmousedown="beginResize(event,'${id}')"></div>`;
  el.addEventListener('mousedown',()=>focusPane(id));
  document.body.appendChild(el);
  addTab(id,title);
  focusPane(id);
  beep(560,.04);
}

function focusPane(id){
  const el=document.getElementById('pane-'+id); if(!el) return;
  el.classList.remove('min'); el.style.zIndex=++zTop;
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on-top'));
  el.classList.add('on-top');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  const tab=document.getElementById('tab-'+id); if(tab) tab.classList.add('on');
}
function toggleMin(id){
  document.getElementById('pane-'+id).classList.toggle('min');
  const tab=document.getElementById('tab-'+id); if(tab) tab.classList.toggle('dimmed');
  beep(320,.04);
}
function toggleFull(id){ document.getElementById('pane-'+id).classList.toggle('full'); beep(460,.04) }
function closePane(id){
  const el=document.getElementById('pane-'+id);
  if(el){ el.classList.add('closing'); setTimeout(()=>el.remove(),140) }
  const tab=document.getElementById('tab-'+id); if(tab) tab.remove();
  if(cleanup[id]){ cleanup[id](); delete cleanup[id] }
  beep(210,.06);
}
function addTab(id,title){
  const t=document.createElement('div'); t.className='tab on'; t.id='tab-'+id;
  t.innerHTML=`<span>${title}</span><i onclick="event.stopPropagation();closePane('${id}')">×</i>`;
  t.addEventListener('click',()=>focusPane(id));
  document.getElementById('tabs').appendChild(t);
}

let dragEl=null, dOX=0, dOY=0;
function beginDrag(e,id){
  if(e.target.closest('.dot')) return;
  dragEl=document.getElementById('pane-'+id);
  dOX=e.clientX-dragEl.offsetLeft; dOY=e.clientY-dragEl.offsetTop;
  document.addEventListener('mousemove',onDrag);
  document.addEventListener('mouseup',endDrag);
}
function onDrag(e){
  if(!dragEl||dragEl.classList.contains('full')) return;
  dragEl.style.left=(e.clientX-dOX)+'px';
  dragEl.style.top=(e.clientY-dOY)+'px';
}
function endDrag(){
  dragEl=null;
  document.removeEventListener('mousemove',onDrag);
  document.removeEventListener('mouseup',endDrag);
}

let rsEl=null, rsX=0, rsY=0, rsW=0, rsH=0;
function beginResize(e,id){
  e.stopPropagation();
  rsEl=document.getElementById('pane-'+id);
  if(rsEl.classList.contains('full')) return;
  rsX=e.clientX; rsY=e.clientY; rsW=rsEl.offsetWidth; rsH=rsEl.offsetHeight;
  document.addEventListener('mousemove',onResize);
  document.addEventListener('mouseup',endResize);
}
function onResize(e){
  if(!rsEl) return;
  rsEl.style.width=Math.max(300,rsW+(e.clientX-rsX))+'px';
  rsEl.style.height=Math.max(210,rsH+(e.clientY-rsY))+'px';
}
function endResize(){
  rsEl=null;
  document.removeEventListener('mousemove',onResize);
  document.removeEventListener('mouseup',endResize);
}

// apps
const APPS=[
  {id:'files',name:'Files',icon:'ic-files',open:launchFiles},
  {id:'notepad',name:'Notepad',icon:'ic-notepad',open:launchNotepad},
  {id:'terminal',name:'Terminal',icon:'ic-term',open:launchTerminal},
  {id:'calculator',name:'Calc',icon:'ic-calc',open:launchCalc},
  {id:'tasks',name:'Tasks',icon:'ic-tasks',open:launchTasks},
  {id:'paint',name:'Paint',icon:'ic-paint',open:launchPaint},
  {id:'snake',name:'Snake',icon:'ic-snake',open:launchSnake},
  {id:'scope',name:'Scope',icon:'ic-scope',open:launchScope},
  {id:'settings',name:'Setup',icon:'ic-set',open:launchSettings},
];

function buildDesktop(){
  const desk=document.getElementById('desk');
  const menu=document.getElementById('menu');
  const saved=JSON.parse(memStore.get('bb_positions')||'{}');
  const originX=18, spacing=98;
  const perRow=Math.max(1,Math.floor((desk.clientWidth-originX)/spacing));

  APPS.forEach((app,i)=>{
    const pos=saved[app.id]||{x:originX+(i%perRow)*spacing, y:originX+Math.floor(i/perRow)*spacing};
    const chip=document.createElement('div');
    chip.className='chip'; chip.dataset.app=app.id;
    chip.style.left=pos.x+'px'; chip.style.top=pos.y+'px';
    chip.style.animationDelay=(i*.05)+'s';
    chip.innerHTML=`<div class="body"><svg><use href="#${app.icon}"/></svg></div><div class="tag">${app.name}</div>`;
    desk.appendChild(chip);

    const mitem=document.createElement('div');
    mitem.className='mitem';
    mitem.innerHTML=`<svg><use href="#${app.icon}"/></svg> ${app.name}`;
    mitem.onclick=()=>{ app.open(); toggleMenu(false) };
    menu.appendChild(mitem);
  });
  wireDragging();
}

function wireDragging(){
  const desk=document.getElementById('desk');
  let cur=null, sx=0, sy=0, ox=0, oy=0, moved=false;

  document.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('mousedown',e=>{
      cur=chip; sx=e.clientX; sy=e.clientY;
      ox=chip.offsetLeft; oy=chip.offsetTop; moved=false; e.preventDefault();
    });
  });
  document.addEventListener('mousemove',e=>{
    if(!cur) return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if(Math.abs(dx)>4||Math.abs(dy)>4){ if(!moved) cur.classList.add('dragging'); moved=true }
    if(!moved) return;
    cur.style.left=Math.max(0,Math.min(ox+dx,desk.clientWidth-84))+'px';
    cur.style.top=Math.max(0,Math.min(oy+dy,desk.clientHeight-88))+'px';
  });
  document.addEventListener('mouseup',()=>{
    if(!cur) return;
    const chip=cur; cur=null; chip.classList.remove('dragging');
    if(moved){
      const positions=JSON.parse(memStore.get('bb_positions')||'{}');
      positions[chip.dataset.app]={x:chip.offsetLeft,y:chip.offsetTop};
      memStore.set('bb_positions',JSON.stringify(positions));
    } else {
      const app=APPS.find(a=>a.id===chip.dataset.app);
      if(app) app.open();
    }
  });
}

function toggleMenu(force){
  const m=document.getElementById('menu');
  if(typeof force==='boolean'){ m.classList.toggle('open',force); return }
  m.classList.toggle('open'); beep(400,.04);
}
document.getElementById('pwr').addEventListener('click',()=>toggleMenu());
document.addEventListener('click',e=>{
  const m=document.getElementById('menu');
  if(m.classList.contains('open') && !m.contains(e.target) && e.target.id!=='pwr' && !e.target.closest('#pwr'))
    m.classList.remove('open');
  hideCtx();
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ toggleMenu(false); hideCtx() } });

// right click menu
function hideCtx(){ document.getElementById('ctx').classList.remove('open') }
document.getElementById('desk').addEventListener('contextmenu',e=>{
  if(e.target.closest('.chip')) return;
  e.preventDefault();
  const menu=document.getElementById('ctx');
  menu.innerHTML=`
    <div class="citem" onclick="arrangeChips()">Arrange chips</div>
    <div class="csep"></div>
    <div class="citem" onclick="feedBug();hideCtx();">Feed the bug 🐛</div>
    <div class="csep"></div>
    <div class="citem" onclick="showAbout()">About breadboardOS</div>`;
  menu.style.left=Math.min(e.clientX,innerWidth-210)+'px';
  menu.style.top=Math.min(e.clientY,innerHeight-200)+'px';
  menu.classList.add('open');
});

function arrangeChips(){
  hideCtx();
  const desk=document.getElementById('desk');
  const chips=[...document.querySelectorAll('.chip')];
  const perRow=Math.max(1,Math.floor((desk.clientWidth-18)/98));
  const positions={};
  chips.forEach((c,i)=>{
    const x=18+(i%perRow)*98, y=18+Math.floor(i/perRow)*98;
    c.style.left=x+'px'; c.style.top=y+'px';
    positions[c.dataset.app]={x,y};
  });
  memStore.set('bb_positions',JSON.stringify(positions));
  toast('chips arranged');
}

function showAbout(){
  hideCtx();
  openPane('about','ABOUT.txt',`
    <div style="text-align:center;padding:10px;">
      <svg style="width:70px;height:26px;margin-bottom:10px;" viewBox="0 0 120 46"><path d="M4 23h24M28 23v-14M28 9h20M28 23v14M28 37h20M48 9v28M48 9h20M48 37h20M68 9v28M68 23h24M92 15v16" fill="none" stroke="#ffb020" stroke-width="2"/></svg>
      <h2 style="font-family:var(--font-mono);color:var(--amber);">breadboardOS</h2>
      <p style="font-size:11.5px;color:var(--silk-dim);margin-top:6px;">a desktop soldered together in a browser tab.</p>
      <p style="font-size:10.5px;color:var(--silk-dim);margin-top:14px;">built by <b style="color:var(--copper)">Rizz</b> — no frameworks, no servers.</p>
      <a href="https://github.com/STEVEALEX-source/personal-webOS" target="_blank" rel="noopener" style="display:inline-flex;gap:6px;align-items:center;margin-top:12px;color:var(--silk);font-family:var(--font-mono);font-size:10.5px;border:1px solid var(--copper);padding:6px 10px;text-decoration:none;">
        <svg style="width:13px;height:13px;fill:var(--silk);"><use href="#ic-gh"/></svg> source
      </a>
    </div>`,340,270);
}

// virtual filesystem
let vfs;
try{ vfs=JSON.parse(memStore.get('bb_fs')||'null')||{'readme.txt':'welcome to the board.\nfiles saved here persist in this browser.'} }
catch(e){ vfs={'readme.txt':'welcome to the board.'} }
function saveFs(){ memStore.set('bb_fs',JSON.stringify(vfs)) }

function launchFiles(){
  const items=Object.keys(vfs).map(name=>`
    <div class="fitem" onclick="openFileInNotepad('${name}')">
      <div class="ic">▤</div><div class="nm">${esc(name)}</div>
    </div>`).join('');
  openPane('files','FILES',`<div class="fgrid">${items}</div>`,420,300);
}
function openFileInNotepad(name){
  launchNotepad();
  setTimeout(()=>{
    document.getElementById('np-name').value=name;
    document.getElementById('np-body').value=vfs[name]||'';
  },40);
}
function launchNotepad(){
  openPane('notepad','NOTEPAD',`
    <div style="display:flex;flex-direction:column;height:100%;gap:8px;">
      <div style="display:flex;gap:6px;">
        <input id="np-name" style="flex:1" value="untitled.txt">
        <button onclick="saveNote()">save</button>
      </div>
      <textarea id="np-body" placeholder="write something..."></textarea>
    </div>`,560,380);
}
function saveNote(){
  const name=document.getElementById('np-name').value.trim();
  if(!name){ toast('name it first'); return }
  vfs[name]=document.getElementById('np-body').value;
  saveFs(); beep(660,.05); toast(`saved ${name}`);
}

function launchTerminal(){
  openPane('terminal','TERMINAL',`
    <div id="term-log" class="term-out">breadboardOS shell\ntype 'help'\n</div>
    <div class="term-in"><span>&gt;</span><input id="term-in" onkeydown="runTerm(event)"></div>`,560,380);
}
function runTerm(e){
  if(e.key!=='Enter') return;
  const val=e.target.value.trim();
  const log=document.getElementById('term-log');
  log.textContent+=`> ${val}\n`;
  const [cmd,...rest]=val.split(' ');
  if(cmd==='help') log.textContent+='commands: help, ls, cat <file>, echo <text>, clear, whoami, date\n';
  else if(cmd==='ls') log.textContent+=Object.keys(vfs).join('  ')+'\n';
  else if(cmd==='cat') log.textContent+=(vfs[rest[0]]||'no such file')+'\n';
  else if(cmd==='echo') log.textContent+=rest.join(' ')+'\n';
  else if(cmd==='whoami') log.textContent+='guest@breadboard\n';
  else if(cmd==='date') log.textContent+=new Date().toString()+'\n';
  else if(cmd==='clear') log.textContent='';
  else if(val!=='') log.textContent+=`unknown command: ${cmd}\n`;
  e.target.value='';
  log.scrollTop=log.scrollHeight;
  if(val) beep(500,.03);
}

// calculator
let calc={disp:'0',first:null,op:null,wait:false};
function renderCalc(){ const el=document.getElementById('calc-disp'); if(el) el.textContent=calc.disp }
function calcDigit(d){
  if(calc.wait){ calc.disp=d; calc.wait=false }
  else calc.disp=(calc.disp==='0')?d:calc.disp+d;
  renderCalc();
}
function calcDot(){
  if(calc.wait){ calc.disp='0.'; calc.wait=false; renderCalc(); return }
  if(!calc.disp.includes('.')) calc.disp+='.';
  renderCalc();
}
function calcClear(){ calc={disp:'0',first:null,op:null,wait:false}; renderCalc(); beep(300,.04) }
function calcOp(op){
  const v=parseFloat(calc.disp);
  if(calc.first===null) calc.first=v;
  else if(!calc.wait){
    calc.first=apply(calc.first,v,calc.op);
    calc.disp=Number.isNaN(calc.first)?'err':String(round10(calc.first));
    renderCalc();
  }
  calc.wait=true; calc.op=op; beep(440,.03);
}
function calcEq(){
  if(calc.op===null||calc.first===null) return;
  const v=parseFloat(calc.disp), r=apply(calc.first,v,calc.op);
  calc.disp=Number.isNaN(r)?'err':String(round10(r));
  calc.first=null; calc.op=null; calc.wait=false;
  renderCalc(); beep(620,.05);
}
function apply(a,b,op){ return op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?(b===0?NaN:a/b):b }
function round10(n){ return Math.round(n*1e10)/1e10 }
function launchCalc(){
  openPane('calculator','CALC',`
    <div class="calc">
      <div class="calc-lcd" id="calc-disp">0</div>
      <div class="calc-grid">
        <button class="cbtn" onclick="calcClear()">C</button>
        <button class="cbtn" onclick="calcDigit('7')">7</button><button class="cbtn" onclick="calcDigit('8')">8</button><button class="cbtn" onclick="calcDigit('9')">9</button>
        <button class="cbtn op" onclick="calcOp('/')">÷</button>
        <button class="cbtn" onclick="calcDigit('4')">4</button><button class="cbtn" onclick="calcDigit('5')">5</button><button class="cbtn" onclick="calcDigit('6')">6</button>
        <button class="cbtn op" onclick="calcOp('*')">×</button>
        <button class="cbtn" onclick="calcDigit('1')">1</button><button class="cbtn" onclick="calcDigit('2')">2</button><button class="cbtn" onclick="calcDigit('3')">3</button>
        <button class="cbtn op" onclick="calcOp('-')">−</button>
        <button class="cbtn zero" onclick="calcDigit('0')">0</button><button class="cbtn" onclick="calcDot()">.</button>
        <button class="cbtn op" onclick="calcOp('+')">+</button>
        <button class="cbtn op" style="grid-column:span 4" onclick="calcEq()">=</button>
      </div>
    </div>`,300,420);
}

// tasks
let tasks;
try{ tasks=JSON.parse(memStore.get('bb_tasks')||'[]'); if(!Array.isArray(tasks)) tasks=[] }
catch(e){ tasks=[] }
let taskFilter='all';
function saveTasks(){ memStore.set('bb_tasks',JSON.stringify(tasks)) }

function launchTasks(){
  openPane('tasks','TASKS',`
    <div class="tk-wrap">
      <div class="tk-add"><input id="tk-in" placeholder="add a task" onkeydown="if(event.key==='Enter')addTask()"><button onclick="addTask()">add</button></div>
      <div class="tk-filters">
        <button class="on" data-f="all" onclick="setFilter('all')">all</button>
        <button data-f="active" onclick="setFilter('active')">active</button>
        <button data-f="done" onclick="setFilter('done')">done</button>
      </div>
      <div class="tk-list" id="tk-list"></div>
      <div class="tk-foot"><span id="tk-count"></span><span onclick="clearDone()">clear done</span></div>
    </div>`,320,440);
  renderTasks();
}
function renderTasks(){
  const list=document.getElementById('tk-list'); if(!list) return;
  const filtered=tasks.filter(t=>taskFilter==='all'?true:taskFilter==='active'?!t.done:t.done);
  list.innerHTML=filtered.length?filtered.map(t=>`
    <div class="tk-item" data-id="${t.id}">
      <div class="tk-check ${t.done?'on':''}" onclick="toggleTask('${t.id}')"><svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-6"/></svg></div>
      <span class="tk-text ${t.done?'done':''}">${esc(t.text)}</span>
      <span class="tk-del" onclick="delTask('${t.id}')">del</span>
    </div>`).join('') : `<div class="tk-empty">nothing here</div>`;
  document.querySelectorAll('.tk-filters button').forEach(b=>b.classList.toggle('on',b.dataset.f===taskFilter));
  const left=tasks.filter(t=>!t.done).length;
  const c=document.getElementById('tk-count'); if(c) c.textContent=`${left} left`;
}
function addTask(){
  const inp=document.getElementById('tk-in');
  const text=inp.value.trim(); if(!text) return;
  tasks.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),text,done:false});
  saveTasks(); inp.value=''; renderTasks(); beep(560,.04);
}
function toggleTask(id){
  const t=tasks.find(x=>x.id===id);
  if(t){ t.done=!t.done; saveTasks(); renderTasks(); beep(t.done?620:400,.04) }
}
function delTask(id){
  const el=document.querySelector(`.tk-item[data-id="${id}"]`);
  if(el) el.classList.add('removing');
  beep(260,.04);
  setTimeout(()=>{ tasks=tasks.filter(x=>x.id!==id); saveTasks(); renderTasks() },150);
}
function setFilter(f){ taskFilter=f; renderTasks() }
function clearDone(){ tasks=tasks.filter(t=>!t.done); saveTasks(); renderTasks(); toast('cleared') }

// paint
function launchPaint(){
  openPane('paint','PAINT',`
    <div style="display:flex;flex-direction:column;height:100%;gap:6px;">
      <div class="ptoolbar">
        <div class="pcolor on" style="background:#111" data-c="#111" onclick="setPColor(this)"></div>
        <div class="pcolor" style="background:#c9793a" data-c="#c9793a" onclick="setPColor(this)"></div>
        <div class="pcolor" style="background:#ffb020" data-c="#ffb020" onclick="setPColor(this)"></div>
        <div class="pcolor" style="background:#5fd08a" data-c="#5fd08a" onclick="setPColor(this)"></div>
        <div class="pcolor" style="background:#5eb3d6" data-c="#5eb3d6" onclick="setPColor(this)"></div>
        <label style="font-size:11px;color:var(--silk-dim);">size <input type="range" id="p-size" min="1" max="36" value="5" style="width:70px;"></label>
        <button onclick="clearPaint()">clear</button>
      </div>
      <canvas id="pcanvas" width="500" height="300"></canvas>
    </div>`,540,400);
  setTimeout(initPaint,30);
}
let pColor='#111', pDown=false;
function setPColor(el){
  pColor=el.dataset.c;
  document.querySelectorAll('.pcolor').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
}
function clearPaint(){
  const c=document.getElementById('pcanvas'); if(!c) return;
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
}
function initPaint(){
  const c=document.getElementById('pcanvas'); if(!c) return;
  const x=c.getContext('2d');
  x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
  x.lineCap='round'; x.lineJoin='round';

  function pos(e){
    const r=c.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
    const cy=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
    return {x:cx*(c.width/r.width), y:cy*(c.height/r.height)};
  }
  function start(e){ pDown=true; const p=pos(e); x.beginPath(); x.moveTo(p.x,p.y); e.preventDefault() }
  function move(e){
    if(!pDown) return;
    const p=pos(e);
    x.strokeStyle=pColor;
    x.lineWidth=+document.getElementById('p-size').value;
    x.lineTo(p.x,p.y); x.stroke();
    x.beginPath(); x.moveTo(p.x,p.y);
    e.preventDefault();
  }
  function stop(){ pDown=false }
  c.onmousedown=start; c.onmousemove=move; c.onmouseup=stop; c.onmouseleave=stop;
  c.ontouchstart=start; c.ontouchmove=move; c.ontouchend=stop;
}

// snake
function launchSnake(){
  openPane('snake','SNAKE',`
    <div class="snk-wrap">
      <div class="snk-hd"><span>score <b id="snk-score">0</b></span><span>best <b id="snk-best">0</b></span></div>
      <canvas id="snake-cv" width="300" height="300"></canvas>
      <div style="font-size:10.5px;color:var(--silk-dim);">arrows / WASD · <button onclick="restartSnake()">restart</button></div>
    </div>`,340,420);
  runSnake();
}
function runSnake(){
  const cv=document.getElementById('snake-cv'); if(!cv) return;
  const sx=cv.getContext('2d'), cell=15, cols=cv.width/cell, rows=cv.height/cell;
  let body=[{x:8,y:8},{x:7,y:8},{x:6,y:8}], dir={x:1,y:0}, nextDir={x:1,y:0}, score=0, alive=true;
  let best=parseInt(memStore.get('bb_snake_best')||'0',10);
  document.getElementById('snk-best').textContent=best;

  function spawnFood(){
    let f;
    do{ f={x:(Math.random()*cols)|0, y:(Math.random()*rows)|0} }
    while(body.some(s=>s.x===f.x&&s.y===f.y));
    return f;
  }
  let food=spawnFood();

  function draw(over){
    sx.fillStyle='#050b08'; sx.fillRect(0,0,cv.width,cv.height);
    sx.fillStyle='#ff5a4e'; sx.fillRect(food.x*cell+2,food.y*cell+2,cell-4,cell-4);
    body.forEach((s,i)=>{
      sx.fillStyle=i===0?'#ffb020':'#c9793a';
      sx.fillRect(s.x*cell+1,s.y*cell+1,cell-2,cell-2);
    });
    if(over){
      sx.fillStyle='rgba(0,0,0,.6)'; sx.fillRect(0,0,cv.width,cv.height);
      sx.fillStyle='#dfeadb'; sx.textAlign='center'; sx.font='14px monospace';
      sx.fillText('game over — restart',cv.width/2,cv.height/2);
    }
  }
  function tick(){
    if(!alive) return;
    dir=nextDir;
    const head={x:body[0].x+dir.x, y:body[0].y+dir.y};
    if(head.x<0||head.x>=cols||head.y<0||head.y>=rows||body.some(s=>s.x===head.x&&s.y===head.y)){
      alive=false; clearInterval(loop); beep(180,.15);
      if(score>best){ best=score; memStore.set('bb_snake_best',best) }
      document.getElementById('snk-best').textContent=best;
      draw(true); return;
    }
    body.unshift(head);
    if(head.x===food.x&&head.y===food.y){
      score+=10; document.getElementById('snk-score').textContent=score;
      food=spawnFood(); beep(700,.05);
    } else body.pop();
    draw(false);
  }
  function key(e){
    if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const k=e.key.toLowerCase();
    if((k==='arrowup'||k==='w')&&dir.y===0) nextDir={x:0,y:-1};
    else if((k==='arrowdown'||k==='s')&&dir.y===0) nextDir={x:0,y:1};
    else if((k==='arrowleft'||k==='a')&&dir.x===0) nextDir={x:-1,y:0};
    else if((k==='arrowright'||k==='d')&&dir.x===0) nextDir={x:1,y:0};
    else return;
    e.preventDefault();
  }
  document.addEventListener('keydown',key);
  const loop=setInterval(tick,110);
  draw(false);
  cleanup['snake']=()=>{ clearInterval(loop); document.removeEventListener('keydown',key) };
}
function restartSnake(){ if(cleanup['snake']) cleanup['snake'](); runSnake(); beep(500,.04) }

// signal scope
let scopeState={running:false,wave:'sine',freq:4,amp:.7,t:0,raf:null};
function launchScope(){
  openPane('scope','SCOPE',`
    <div class="scope-wrap">
      <canvas id="scope-cv" width="500" height="220"></canvas>
      <div class="scope-controls">
        <div class="scope-wave-btns">
          <button class="on" data-w="sine" onclick="setWave('sine')">sine</button>
          <button data-w="square" onclick="setWave('square')">square</button>
          <button data-w="saw" onclick="setWave('saw')">saw</button>
          <button data-w="noise" onclick="setWave('noise')">noise</button>
        </div>
        <div class="scope-row">freq <input type="range" id="scope-freq" min="1" max="20" value="4" oninput="scopeState.freq=+this.value"> <span id="scope-freq-v">4hz</span></div>
        <div class="scope-row">amp <input type="range" id="scope-amp" min="5" max="100" value="70" oninput="scopeState.amp=this.value/100"></div>
      </div>
    </div>`,540,400);
  setTimeout(startScope,30);
}
function setWave(w){
  scopeState.wave=w;
  document.querySelectorAll('.scope-wave-btns button').forEach(b=>b.classList.toggle('on',b.dataset.w===w));
  beep(500,.03);
}
function startScope(){
  const cv=document.getElementById('scope-cv'); if(!cv) return;
  const x=cv.getContext('2d');
  function sample(phase){
    switch(scopeState.wave){
      case 'square': return Math.sign(Math.sin(phase))*scopeState.amp;
      case 'saw': return (((phase/Math.PI)%2+2)%2-1)*scopeState.amp;
      case 'noise': return (Math.random()*2-1)*scopeState.amp;
      default: return Math.sin(phase)*scopeState.amp;
    }
  }
  (function frame(){
    x.fillStyle='#050b08'; x.fillRect(0,0,cv.width,cv.height);
    x.strokeStyle='rgba(201,121,58,0.25)'; x.lineWidth=1;
    x.beginPath(); x.moveTo(0,cv.height/2); x.lineTo(cv.width,cv.height/2); x.stroke();
    x.strokeStyle='#ffb020'; x.lineWidth=2; x.beginPath();
    for(let i=0;i<cv.width;i++){
      const phase=(i*.05*scopeState.freq)+scopeState.t;
      const y=cv.height/2 - sample(phase)*(cv.height/2-10);
      i===0?x.moveTo(i,y):x.lineTo(i,y);
    }
    x.stroke();
    scopeState.t+=.06;
    scopeState.raf=requestAnimationFrame(frame);
  })();
  cleanup['scope']=()=>{ if(scopeState.raf) cancelAnimationFrame(scopeState.raf) };
}

// settings
function launchSettings(){
  const muted=memStore.get('bb_mute')==='1';
  const accent=memStore.get('bb_accent')||'copper';
  const accSwatches=ACCENTS.map(a=>`<div class="acc-dot ${a.id===accent?'on':''}" style="background:${a.hex}" data-id="${a.id}" onclick="applyAccent('${a.id}')"></div>`).join('');
  openPane('settings','SETUP',`
    <div class="set-wrap">
      <div class="set-nav">
        <button class="set-tab on" data-t="sound" onclick="setTab('sound')">sound</button>
        <button class="set-tab" data-t="accent" onclick="setTab('accent')">accent</button>
        <button class="set-tab" data-t="bug" onclick="setTab('bug')">the bug</button>
        <button class="set-tab" data-t="about" onclick="setTab('about')">about</button>
      </div>
      <div class="set-body">
        <div class="set-panel" id="p-sound">
          <h3>sound</h3><p class="set-sub">square-wave beeps for actions.</p>
          <div class="row"><div><div class="rlabel">interface sound</div></div>
            <label class="sw"><input type="checkbox" ${muted?'':'checked'} onchange="toggleMute(!this.checked)"><span class="strack"></span></label></div>
        </div>
        <div class="set-panel" id="p-accent" style="display:none;">
          <h3>accent</h3><p class="set-sub">trace color across the UI.</p>
          <div class="acc-row">${accSwatches}</div>
        </div>
        <div class="set-panel" id="p-bug" style="display:none;">
          <h3>the bug</h3><p class="set-sub">there's a literal bug living on your desktop. right-click the desktop to feed it.</p>
          <div class="row"><div class="rlabel">mood</div><div id="bug-mood-label" style="font-family:var(--font-mono);color:var(--amber);"></div></div>
        </div>
        <div class="set-panel" id="p-about" style="display:none;">
          <h3>breadboardOS</h3><p class="set-sub">a desktop, soldered together.</p>
          <p style="font-size:11px;color:var(--silk-dim);">built by Rizz. no frameworks.</p>
        </div>
      </div>
    </div>`,520,380);
  setTimeout(()=>{ const l=document.getElementById('bug-mood-label'); if(l) l.textContent=bugState.mood },30);
}
function setTab(t){
  document.querySelectorAll('.set-tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  document.querySelectorAll('.set-panel').forEach(p=>p.style.display=(p.id==='p-'+t)?'block':'none');
}
function toggleMute(muted){ memStore.set('bb_mute',muted?'1':'0'); if(!muted) beep(500,.05) }

// the bug — desktop pet that chases the cursor
let bugState={x:200,y:200,mood:'okay',lastFed:Date.now(),timer:null};
let bugTarget={x:200,y:200};
let bugFollowRaf=null;
let bugIdleTimeout=null;

function initBug(){
  try{
    const saved=JSON.parse(memStore.get('bb_bug')||'null');
    if(saved) bugState={...bugState,...saved};
  }catch(e){}
  const el=document.getElementById('bug');
  el.style.left=bugState.x+'px'; el.style.top=bugState.y+'px';
  bugTarget={x:bugState.x,y:bugState.y};

  document.addEventListener('mousemove',e=>{
    bugTarget.x=e.clientX-38;
    bugTarget.y=e.clientY+14;
    resetBugIdle();
  });

  chaseBugFrame();
  bugState.timer=setInterval(updateBugMood,15000);
  updateBugMood();

  el.addEventListener('click',()=>{
    const tip=document.getElementById('bug-tip');
    tip.textContent=bugMoodLine();
    tip.style.left=(el.offsetLeft+4)+'px';
    tip.style.top=(el.offsetTop-26)+'px';
    tip.style.display='block';
    setTimeout(()=>tip.style.display='none',1800);
    beep(700,.04);
  });
  el.addEventListener('dblclick',feedBug);
  resetBugIdle();
}

function chaseBugFrame(){
  const el=document.getElementById('bug'); if(!el) return;
  const speed=bugState.mood==='hungry'?.045:bugState.mood==='happy'?.16:.09;
  bugState.x+=(bugTarget.x-bugState.x)*speed;
  bugState.y+=(bugTarget.y-bugState.y)*speed;
  const dx=bugTarget.x-bugState.x;
  if(Math.abs(dx)>1) el.style.transform=`scaleX(${dx<0?-1:1})`;
  el.style.left=bugState.x+'px'; el.style.top=bugState.y+'px';
  bugFollowRaf=requestAnimationFrame(chaseBugFrame);
}

function resetBugIdle(){
  clearTimeout(bugIdleTimeout);
  bugIdleTimeout=setTimeout(()=>{
    bugTarget.x=Math.max(10,Math.min(innerWidth-40,bugState.x+(Math.random()*160-80)));
    bugTarget.y=Math.max(10,Math.min(innerHeight-90,bugState.y+(Math.random()*100-50)));
    resetBugIdle();
  },3500+Math.random()*2500);
}

function updateBugMood(){
  const minsSinceFed=(Date.now()-bugState.lastFed)/60000;
  const el=document.getElementById('bug');
  if(minsSinceFed<3){ bugState.mood='happy'; el.className='happy' }
  else if(minsSinceFed<12){ bugState.mood='okay'; el.className='' }
  else{ bugState.mood='hungry'; el.className='hungry' }
  saveBug();
}
function bugMoodLine(){
  if(bugState.mood==='happy') return 'the bug is thriving';
  if(bugState.mood==='hungry') return 'the bug is hungry — feed it (right-click desktop)';
  return 'the bug is doing fine';
}
function feedBug(){
  bugState.lastFed=Date.now();
  updateBugMood();
  saveBug();
  toast('fed the bug 🐛');
  beep(760,.06);
}
function saveBug(){
  memStore.set('bb_bug',JSON.stringify({x:bugState.x,y:bugState.y,lastFed:bugState.lastFed,mood:bugState.mood}));
}

window.addEventListener('DOMContentLoaded',()=>{
  buildDesktop();
  applyAccent(memStore.get('bb_accent')||'copper',true);
  initBug();
});
