/* Mosslight atlas: a self-contained, touch-first map of the actual room graph. */
'use strict';
(() => {
  const NS='http://www.w3.org/2000/svg';
  const BOX={w:1160,h:660};
  // Numeric room identifiers intentionally match game.js. The grotto is a door
  // branch from the garden, and the heart can only return to it after victory.
  const ROOMS=[
    {x:65,y:285,w:225,h:112,tone:'#728b69'},
    {x:332,y:285,w:235,h:112,tone:'#669599'},
    {x:609,y:285,w:224,h:112,tone:'#a59a73'},
    {x:609,y:493,w:228,h:112,tone:'#9e8db5'},
    {x:65,y:77,w:211,h:110,tone:'#8ec1b1'},
    {x:891,y:493,w:207,h:112,tone:'#c0b47c'}
  ];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const px=(id,x,regions)=>ROOMS[id].x+clamp(x/(regions[id].w||1),0,1)*ROOMS[id].w;
  const py=(id,y)=>ROOMS[id].y+clamp(y/720,0,1)*ROOMS[id].h;
  const point=(api)=>({x:px(api.state.room,api.player.x+(api.player.w||30)/2,api.regions),y:py(api.state.room,api.player.y+(api.player.h||52)/2)});
  const visited=(api,id)=>(api.state.visited||[api.state.room]).includes(id)||api.state.room===id;
  const flags=api=>api.state.flags||{};
  const symbols=`<defs>
    <pattern id="atlas-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#97b48b" stroke-opacity=".055" stroke-width="1"/></pattern>
    <pattern id="atlas-fog" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V9" stroke="#749177" stroke-opacity=".15" stroke-width="2"/></pattern>
    <filter id="atlas-glow"><feGaussianBlur stdDeviation="3"/></filter>
    <marker id="atlas-return-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0 0 8 4 0 8Z" fill="#c5bd7e" stroke="none"/></marker>
    <symbol id="atlas-camp" viewBox="-12 -12 24 24"><path d="m-8 8 15-3M-7 4 8 9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M-5 3Q-8-2-2-8Q-2-3 1-1Q5-5 5-7Q12 4 3 6Q-3 7-5 3Z" fill="currentColor"/></symbol>
    <symbol id="atlas-chest" viewBox="-12 -12 24 24"><path d="M-9-2Q-9-9-3-9H3Q9-9 9-2V8H-9Z" fill="#142e26" stroke="currentColor" stroke-width="1.7"/><path d="M-9-2H9M-5-8V8M5-8V8M-1-3H1V2H-1Z" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>
    <symbol id="atlas-vine" viewBox="-12 -12 24 24"><path d="M-6 10Q5 4-3-3Q-8-7 3-10M-5 5-10 1M-2 1 5-3M-4-5-9-8M0-8 6-9" fill="none" stroke="currentColor" stroke-width="2"/><path d="m5-5 2-4 4 3-3 4Z" fill="currentColor"/></symbol>
    <symbol id="atlas-gate" viewBox="-12 -12 24 24"><path d="M-9 9V-7H9V9M-9-3H9M-5-3V9M5-3V9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m1-10-4 8h4L-1 6 6-4H2l3-6Z" fill="currentColor"/></symbol>
    <symbol id="atlas-boss" viewBox="-12 -12 24 24"><path d="m-9-7 5 2 4-6 4 6 5-2-1 14L0 11-8 7Z" fill="#172d22" stroke="currentColor" stroke-width="1.6"/><path d="m-5 0 3 2M5 0 2 2M-2 6H2" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
    <symbol id="atlas-door" viewBox="-12 -12 24 24"><path d="M-7 9V-4a7 7 0 0 1 14 0V9ZM-2 9V-2a2 2 0 0 1 4 0V9" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
    <symbol id="atlas-sword" viewBox="-12 -12 24 24"><path d="m-6 6 11-15 4-1v4L-6 7Zm-3-3 6 6M-9 9-5 5" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
    <symbol id="atlas-fire" viewBox="-12 -12 24 24"><path d="M-5 8Q-12 1-2-10Q-3-3 1-1Q5-5 5-8Q14 5 4 9Q-1 11-5 8Z" fill="currentColor"/><path d="M-2 7Q-5 4 1 0Q0 4 3 5Q4 8 1 8Z" fill="#172e23"/></symbol>
    <symbol id="atlas-ice" viewBox="-12 -12 24 24"><path d="M0-10V10M-9-5 9 5M-9 5 9-5M-3-8 0-5 3-8M-3 8 0 5 3 8M-8-1-4-2-5-6M8 1 4 2 5 6M-8 1-4 2-5 6M8-1 4-2 5-6" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="atlas-lightning" viewBox="-12 -12 24 24"><path d="m1-11-9 13h7l-2 10L9-3H2l5-8Z" fill="currentColor"/></symbol>
    <symbol id="atlas-heal" viewBox="-12 -12 24 24"><path d="M-3-9H3V-3H9V3H3V9H-3V3H-9V-3H-3Z" fill="currentColor"/></symbol>
    <symbol id="atlas-player" viewBox="-12 -12 24 24"><path d="M0-8 7 6 0 3-7 6Z" fill="currentColor" stroke="#0d241c" stroke-width="1.5"/></symbol>
  </defs>`;
  const icon=(kind,x,y,cls='',size=20)=>`<g class="atlas-marker ${cls}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle r="${size*.65}" fill="#0e231df2" stroke="currentColor" stroke-opacity=".35"/><use href="#atlas-${kind}" x="${-size/2}" y="${-size/2}" width="${size}" height="${size}"/></g>`;
  const shape=r=>`M${r.x},${r.y+25}l18,-12h${Math.round(r.w*.27)}l9,-8h${Math.round(r.w*.29)}l10,9h${Math.round(r.w*.18)}l${r.w-Math.round(r.w*.74)-37},12V${r.y+r.h-8}l-18,8H${r.x+20}l-20,-12Z`;
  const connections=(api,svg=true)=>{
    const ground=id=>py(id,565), r=ROOMS;
    const links=[
      {a:0,b:1,d:`M290 ${ground(0)}H332`,p:[[290,ground(0)],[332,ground(0)]]},
      {a:1,b:2,d:`M567 ${ground(1)}H609`,p:[[567,ground(1)],[609,ground(1)]]},
      {a:2,b:3,d:`M833 ${ground(2)}H864V461H583V${ground(3)}H609`,p:[[833,ground(2)],[864,ground(2)],[864,461],[583,461],[583,ground(3)],[609,ground(3)]]},
      {a:3,b:5,d:`M837 ${ground(3)}H891`,p:[[837,ground(3)],[891,ground(3)]]},
      {a:0,b:4,d:`M${px(0,970,api.regions)} ${py(0,380)}V244H40V${py(4,590)}H${px(4,145,api.regions)}`,p:[[px(0,970,api.regions),py(0,380)],[px(0,970,api.regions),244],[40,244],[40,py(4,590)],[px(4,145,api.regions),py(4,590)]],branch:true}
    ];
    if(flags(api).boss)links.push({a:5,b:0,shortcut:true,d:`M${px(5,1440,api.regions)} ${ground(5)}H1121V38H${px(0,1650,api.regions)}V${py(0,500)}`,p:[[px(5,1440,api.regions),ground(5)],[1121,ground(5)],[1121,38],[px(0,1650,api.regions),38],[px(0,1650,api.regions),py(0,500)]]});
    if(!svg)return links;
    return links.map(l=>`<path class="atlas-route${l.branch?' atlas-route-branch':''}${l.shortcut?' atlas-route-shortcut':''}${visited(api,l.a)&&visited(api,l.b)?' atlas-route-known':''}" d="${l.d}"${l.shortcut?' marker-end="url(#atlas-return-arrow)"':''}/>`).join('');
  };
  function terrain(api,id){
    const r=ROOMS[id],world=api.regions[id],f=flags(api);
    let out='';
    for(const [x,w]of world.floor||[])out+=`<path class="atlas-terrain" d="M${px(id,x,api.regions)} ${py(id,590)}h${w/world.w*r.w}v${r.h-590/720*r.h-3}H${px(id,x,api.regions)}Z"/>`;
    for(const [x,y,w]of world.platforms||[])out+=`<path class="atlas-platform" d="M${px(id,x,api.regions)} ${py(id,y)}h${w/world.w*r.w}"/>`;
    if(world.pool)out+=`<path class="atlas-water" d="M${px(id,world.pool[0],api.regions)} ${py(id,600)}h${(world.pool[1]-world.pool[0])/world.w*r.w}"/><text class="atlas-water-label" x="${px(id,(world.pool[0]+world.pool[1])/2,api.regions)}" y="${py(id,702)}">深水</text>`;
    for(const shrine of world.shrines||[]){
      const found=shrine.kind==='supplies'?api.state.caches?.[shrine.id]:api.state.discoveries?.[shrine.id];
      if(found)continue;
      const kind=shrine.kind==='weapon'?'sword':shrine.kind==='heal'?'heal':shrine.kind==='element'&&['fire','ice','lightning'].includes(shrine.id)?shrine.id:'chest';
      out+=icon(kind,px(id,shrine.x,api.regions),py(id,shrine.y-135),'atlas-find atlas-find-'+kind,17);
    }
    if(world.camp)out+=icon('camp',px(id,world.camp,api.regions),py(id,540),'atlas-camp'+(api.checkpoint?.room===id?' atlas-lit':''));
    if(world.chest)out+=icon('chest',px(id,world.chest.x,api.regions),py(id,world.chest.y-40),'atlas-chest'+(f[world.chest.type]?' atlas-resolved':''));
    if(world.vine)out+=icon('vine',px(id,world.vine,api.regions),py(id,430),'atlas-vine'+(f.vines?' atlas-resolved':''));
    if(world.gate)out+=icon('gate',px(id,world.gate,api.regions),py(id,435),'atlas-gate'+(f.gate?' atlas-resolved':''));
    if(world.conductor&&!f.gate)out+=`<path class="atlas-conductor" d="m${px(id,world.conductor,api.regions)} ${py(id,475)-6}-4 7h4l-3 7 9-10h-4l3-4Z"/>`;
    if(world.doors)for(const d of world.doors)if(!d.needWin||f.boss)out+=icon('door',px(id,d.x,api.regions),py(id,d.y-35),'atlas-door');
    if(id===5)out+=icon('boss',px(id,1120,api.regions),py(id,470),'atlas-boss'+(f.boss?' atlas-resolved':''),22);
    return out;
  }
  function objectives(api,id){
    const f=flags(api),r=api.regions[id],seen=visited(api,id),goals=[];
    if(!seen)return [{done:false,label:'沿相连路径发现这片区域'}];
    const recorded=new Set();
    for(const shrine of r.shrines||[]){
      if(recorded.has(shrine.id))continue;recorded.add(shrine.id);
      const found=shrine.kind==='supplies'?api.state.caches?.[shrine.id]:api.state.discoveries?.[shrine.id];
      goals.push({done:!!found,label:(shrine.kind==='supplies'?'收集':'发现')+shrine.name});
    }
    if(r.camp)goals.push({done:api.checkpoint?.room===id||(id===0&&f.rest),label:api.checkpoint?.room===id?'当前重生篝火':'在篝火休息并记录旅程'});
    if(id===0)goals.push({done:visited(api,4),label:'探索高处拱门通往的隐秘支路'});
    if(r.chest)goals.push({done:!!f[r.chest.type],label:r.chest.type==='bow'?'收集古木长弓':'收集月孢之翼，解锁二段跳'});
    if(r.pool)goals.push({done:id===1?visited(api,2):!!f.gate,label:id===1?'用寒冰渡过深水，抵达书库':'渡过矿井水域，寻找导电灵石'});
    if(r.vine)goals.push({done:!!f.vines,label:'用火焰焚毁封路荆棘'});
    if(r.gate)goals.push({done:!!f.gate,label:'用雷电唤醒机关，解除雷门封印'});
    if(id===5){goals.push({done:!!f.boss,label:'击败根骸守卫，重燃古树之心'});goals.push({done:!!f.boss,label:'开启返回苔息庭院的根脉捷径'});}
    return goals;
  }
  const descriptions=[
    '微光的起点。篝火守着古老庭院，高处拱门里流动着陌生的孢光。',
    '曾经的地下水道。寒冰可以让深水暂时凝结，遗落的长弓就在对岸。',
    '书页早已归于尘土，顽生荆棘仍封着通往矿脉的路。火焰能让道路重见微光。',
    '雷鸣沉睡在灵石之间。让电流唤醒机关，才能抵达根脉最深处。',
    '庭院高处的隐秘支路。沿悬台上行，月孢之翼正在最高处等待。',
    '一切根脉交汇之地。古老守卫沉睡于此，胜利将开启通向庭院的捷径。'
  ];
  function mount(root,api){
    if(!root||!api?.state||!api.regions?.length)return()=>{};
    let selected=api.state.room,zoom=1,pan={x:0,y:0},disposed=false,gesture=null;
    const listeners=[],pointers=new Map();
    root.innerHTML=`<section class="atlas" aria-label="遗境地图"><div class="atlas-topline"><div><span class="atlas-kicker">CARTOGRAPHY / 遗境测绘</span><span class="atlas-discovered">${api.regions.filter((_,i)=>visited(api,i)).length} <small>/ ${api.regions.length} 区域</small></span></div><span class="atlas-instruction">拖动探索 · 双指或滚轮缩放</span></div><div class="atlas-layout"><div class="atlas-map-column"><div class="atlas-viewport" tabindex="0" aria-label="可拖动缩放的遗境地图"><svg class="atlas-svg" xmlns="${NS}" viewBox="0 0 ${BOX.w} ${BOX.h}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="六区连通地图">${symbols}<rect width="1160" height="660" fill="url(#atlas-grid)"/><g class="atlas-world">${connections(api)}${ROOMS.map((r,id)=>{const seen=visited(api,id),active=api.state.room===id;return `<g class="atlas-room${seen?' atlas-room-known':''}${active?' atlas-room-current':''}" data-atlas-room="${id}" role="button" tabindex="0" aria-label="${seen?esc(api.regions[id].name):'未探索区域'}" style="--room-tone:${r.tone}"><path class="atlas-room-shape" d="${shape(r)}"/>${seen?terrain(api,id):`<path class="atlas-room-fog" d="${shape(r)}"/><text class="atlas-unknown" x="${r.x+r.w/2}" y="${r.y+r.h/2+8}">?</text>`}<text class="atlas-room-number" x="${r.x+10}" y="${r.y+40}">${String(id+1).padStart(2,'0')}</text><text class="atlas-room-name" x="${r.x+r.w/2}" y="${r.y-13}">${seen?esc(api.regions[id].name):'未探索区域'}</text><path class="atlas-room-selection" d="${shape(r)}"/></g>`}).join('')}<g class="atlas-you"><circle class="atlas-player-glow" r="12"/><circle class="atlas-player-ring" r="9"/><use href="#atlas-player" x="-9" y="-9" width="18" height="18"/><text class="atlas-you-label" x="0" y="-19">你在这里</text></g><text class="atlas-path-label" x="75" y="223">庭院高处拱门</text><text class="atlas-path-label" x="724" y="449">深入矿脉</text>${flags(api).boss?'<text class="atlas-shortcut-label" x="670" y="29">返回庭院 · 单向</text>':''}</g><g class="atlas-compass" transform="translate(1081 111)"><path d="m0-22 7 20-7-4-7 4Z"/><path d="m0 22 7-20-7 4-7-4Z" opacity=".3"/><text x="0" y="-31">N</text></g></svg><div class="atlas-map-controls"><button type="button" data-atlas-control="in" aria-label="放大地图">＋</button><span class="atlas-zoom" aria-live="polite">100%</span><button type="button" data-atlas-control="out" aria-label="缩小地图">−</button><i></i><button type="button" class="atlas-overview" data-atlas-control="overview" aria-label="查看地图全貌"><span>▧</span> 全貌</button><button type="button" class="atlas-locate" data-atlas-control="locate" aria-label="回到当前位置"><span>⌖</span> 定位</button></div><span class="atlas-map-hint">仅标注已发现区域</span></div><div class="atlas-legend"><span><i class="atlas-key-player"></i>旅者</span><span><i class="atlas-key-camp">♨</i>篝火</span><span><i class="atlas-key-chest">▣</i>宝箱</span><span><i class="atlas-key-vine">♧</i>荆棘</span><span><i class="atlas-key-gate">ϟ</i>雷门</span><span><i class="atlas-key-boss">♜</i>首领</span><span><i class="atlas-key-resolved">✓</i>已完成</span><span><i class="atlas-key-fog"></i>未探索</span></div></div><aside class="atlas-detail" aria-live="polite"></aside></div></section>`;
    const $=s=>root.querySelector(s),svg=$('.atlas-svg'),world=$('.atlas-world'),viewport=$('.atlas-viewport'),you=$('.atlas-you'),detail=$('.atlas-detail');
    const on=(el,name,fn,options)=>{el.addEventListener(name,fn,options);listeners.push(()=>el.removeEventListener(name,fn,options));};
    function renderDetail(){
      const seen=visited(api,selected),r=api.regions[selected],goals=objectives(api,selected),remaining=goals.filter(g=>!g.done),allDone=remaining.length===0;
      detail.innerHTML=`<span class="atlas-detail-eyebrow">${seen?esc(r.tag||`区域 ${selected+1}`):'迷雾之中'}</span><h3>${seen?esc(r.name):'未探索区域'}</h3><span class="atlas-region-status${selected===api.state.room?' atlas-here':''}"><i></i>${selected===api.state.room?'旅者当前所在':seen?'已发现':'尚未抵达'}</span><p class="atlas-description">${seen?descriptions[selected]:'地图只记录你走过的道路。沿相连的出口探索，让下一片区域显现。'}</p><div class="atlas-goals-heading"><span>${allDone?'区域目标':'探索目标'}</span><small>${goals.filter(g=>g.done).length} / ${goals.length}</small></div><ul class="atlas-goals">${goals.map(g=>`<li class="${g.done?'atlas-goal-done':''}"><i>${g.done?'✓':'◇'}</i><span>${g.label}</span></li>`).join('')}</ul><div class="atlas-detail-route"><span>相连路径</span><p>${adjacent(api,selected).map(id=>seen&&visited(api,id)?esc(api.regions[id].name):'未知区域').join(' · ')}</p>${selected===0||selected===4?'<small>洞窟由庭院高处拱门进入</small>':''}</div>`;
      root.querySelectorAll('[data-atlas-room]').forEach(el=>el.classList.toggle('atlas-room-selected',+el.dataset.atlasRoom===selected));
    }
    function local(clientX,clientY){
      const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/BOX.w,rect.height/BOX.h)||1;
      return {x:(clientX-rect.left-(rect.width-BOX.w*scale)/2)/scale,y:(clientY-rect.top-(rect.height-BOX.h*scale)/2)/scale};
    }
    function constrain(){
      const margin=140;
      pan.x=BOX.w*zoom<BOX.w-margin*2?(BOX.w-BOX.w*zoom)/2:clamp(pan.x,BOX.w-margin-BOX.w*zoom,margin);
      pan.y=BOX.h*zoom<BOX.h-margin*2?(BOX.h-BOX.h*zoom)/2:clamp(pan.y,BOX.h-margin-BOX.h*zoom,margin);
    }
    function update(){
      if(disposed)return;
      constrain();world.setAttribute('transform',`translate(${pan.x.toFixed(2)} ${pan.y.toFixed(2)}) scale(${zoom.toFixed(4)})`);
      $('.atlas-zoom').textContent=Math.round(zoom*100)+'%';
      const p=point(api);you.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      $('[data-atlas-control="in"]').disabled=zoom>=2.8;
      $('[data-atlas-control="out"]').disabled=zoom<=.72;
    }
    function changeZoom(next,anchor={x:BOX.w/2,y:BOX.h/2}){
      next=clamp(next,.72,2.8);const ratio=next/zoom;
      pan={x:anchor.x-(anchor.x-pan.x)*ratio,y:anchor.y-(anchor.y-pan.y)*ratio};zoom=next;update();
    }
    function locate(){selected=api.state.room;const p=point(api);zoom=1.5;pan={x:BOX.w/2-p.x*zoom,y:BOX.h/2-p.y*zoom};renderDetail();update();}
    function overview(){selected=api.state.room;zoom=1;pan={x:0,y:0};renderDetail();update();}
    const pair=()=>{const p=[...pointers.values()];if(p.length<2)return null;return {center:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};};
    function rebase(){const two=pair();gesture=two?{kind:'pinch',distance:Math.max(1,two.distance),center:local(two.center.x,two.center.y),zoom,pan:{...pan},moved:true}:pointers.size?{kind:'drag',start:local([...pointers.values()][0].x,[...pointers.values()][0].y),pan:{...pan},moved:true}:null;}
    on(viewport,'pointerdown',e=>{
      if(e.target.closest('[data-atlas-control]')||e.button>0)return;
      e.preventDefault();e.stopPropagation();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      try{viewport.setPointerCapture(e.pointerId)}catch{}
      if(pointers.size===1)gesture={kind:'drag',start:local(e.clientX,e.clientY),pan:{...pan},moved:false,room:e.target.closest('[data-atlas-room]')?.dataset.atlasRoom};else rebase();
      viewport.classList.add('atlas-dragging');
    });
    on(viewport,'pointermove',e=>{
      if(!pointers.has(e.pointerId)||!gesture)return;e.preventDefault();e.stopPropagation();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const two=pair();
      if(two&&gesture.kind==='pinch'){
        const center=local(two.center.x,two.center.y),next=clamp(gesture.zoom*two.distance/gesture.distance,.72,2.8),ratio=next/gesture.zoom;
        pan={x:center.x-(gesture.center.x-gesture.pan.x)*ratio,y:center.y-(gesture.center.y-gesture.pan.y)*ratio};zoom=next;update();
      }else if(gesture.kind==='drag'){
        const p=local(e.clientX,e.clientY),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
        if(Math.hypot(dx,dy)>7)gesture.moved=true;
        if(gesture.moved){pan={x:gesture.pan.x+dx,y:gesture.pan.y+dy};update();}
      }
    });
    const endPointer=e=>{
      if(!pointers.has(e.pointerId))return;e.stopPropagation();
      if(e.type==='pointerup'&&gesture?.kind==='drag'&&!gesture.moved&&gesture.room!==undefined){selected=+gesture.room;renderDetail();}
      pointers.delete(e.pointerId);if(pointers.size)rebase();else{gesture=null;viewport.classList.remove('atlas-dragging');}
    };
    on(viewport,'pointerup',endPointer);on(viewport,'pointercancel',endPointer);on(viewport,'lostpointercapture',endPointer);
    on(viewport,'wheel',e=>{e.preventDefault();e.stopPropagation();changeZoom(zoom*Math.exp(-clamp(e.deltaY,-180,180)*.0018),local(e.clientX,e.clientY));},{passive:false});
    on(viewport,'touchmove',e=>{e.preventDefault();e.stopPropagation();},{passive:false});
    on(viewport,'contextmenu',e=>e.preventDefault());
    on(viewport,'keydown',e=>{
      if(e.code==='Enter'||e.code==='Space'){const el=e.target.closest('[data-atlas-room]');if(el){e.preventDefault();e.stopPropagation();selected=+el.dataset.atlasRoom;renderDetail();}return;}
      const move={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]}[e.code];
      if(move){e.preventDefault();e.stopPropagation();pan.x+=move[0];pan.y+=move[1];update();}
      if(e.key==='+'||e.key==='='){e.preventDefault();e.stopPropagation();changeZoom(zoom*1.2)}
      if(e.key==='-'){e.preventDefault();e.stopPropagation();changeZoom(zoom/1.2)}
    });
    root.querySelectorAll('[data-atlas-control]').forEach(button=>on(button,'click',e=>{e.preventDefault();e.stopPropagation();const control=button.dataset.atlasControl;if(control==='locate')locate();else if(control==='overview')overview();else changeZoom(zoom*(control==='in'?1.25:.8));}));
    if(window.matchMedia?.('(pointer:coarse) and (max-height:600px)').matches)locate();else overview();
    return()=>{disposed=true;listeners.forEach(fn=>fn());pointers.clear();gesture=null;};
  }
  function adjacent(api,id){
    const links=[[0,1],[1,2],[2,3],[3,5],[0,4]];
    const destinations=links.filter(([a,b])=>a===id||b===id).map(([a,b])=>a===id?b:a);
    if(flags(api).boss&&id===5)destinations.push(0);
    return destinations;
  }
  function drawMinimap(canvas,api){
    if(!canvas||!api?.state||!api.regions?.length)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const width=canvas.width,height=canvas.height,s=Math.min((width-12)/BOX.w,(height-9)/BOX.h);
    ctx.save();ctx.clearRect(0,0,width,height);ctx.translate((width-BOX.w*s)/2,(height-BOX.h*s)/2);ctx.scale(s,s);
    ctx.lineCap='round';ctx.lineJoin='round';
    connections(api,false).forEach(l=>{ctx.strokeStyle=l.shortcut?'#b9bf78':visited(api,l.a)&&visited(api,l.b)?'#819879':'#435c50';ctx.lineWidth=5;ctx.setLineDash(l.shortcut?[9,8]:[]);ctx.beginPath();l.p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();});ctx.setLineDash([]);
    ROOMS.forEach((r,id)=>{
      const known=visited(api,id),current=id===api.state.room;
      ctx.fillStyle=current?'#607a53':known?'#2a4b3d':'#112c23';ctx.strokeStyle=current?'#e2e8b9':known?'#92a57f':'#465f50';ctx.lineWidth=current?6:4;
      ctx.beginPath();ctx.moveTo(r.x,r.y+18);ctx.lineTo(r.x+18,r.y+7);ctx.lineTo(r.x+r.w-18,r.y+7);ctx.lineTo(r.x+r.w,r.y+20);ctx.lineTo(r.x+r.w,r.y+r.h-9);ctx.lineTo(r.x+r.w-15,r.y+r.h);ctx.lineTo(r.x+15,r.y+r.h);ctx.lineTo(r.x,r.y+r.h-9);ctx.closePath();ctx.fill();ctx.stroke();
      if(known){
        const world=api.regions[id];
        if(world.pool){ctx.strokeStyle='#7faeae';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(px(id,world.pool[0],api.regions),py(id,600));ctx.lineTo(px(id,world.pool[1],api.regions),py(id,600));ctx.stroke();}
        if(world.camp){ctx.fillStyle=api.checkpoint?.room===id?'#f0c283':'#bdad79';ctx.beginPath();ctx.arc(px(id,world.camp,api.regions),py(id,525),9,0,Math.PI*2);ctx.fill();}
      }
      ctx.font='32px sans-serif';ctx.textAlign='center';ctx.fillStyle=known?'#c5d4b1':'#6c8371';ctx.fillText(known?api.regions[id].name:'???',r.x+r.w/2,r.y-14);
    });
    const p=point(api);ctx.strokeStyle='#e1e9b77c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#edf1cb';ctx.beginPath();ctx.moveTo(p.x,p.y-12);ctx.lineTo(p.x+10,p.y+9);ctx.lineTo(p.x,p.y+5);ctx.lineTo(p.x-10,p.y+9);ctx.closePath();ctx.fill();ctx.restore();
  }
  window.MossMap={mount,drawMinimap};
})();
