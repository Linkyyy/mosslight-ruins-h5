'use strict';
(() => {
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),W=1280,H=720;
const COLORS={fire:'#eeab71',ice:'#9cdddd',lightning:'#d9bcf2'};
const NAMES={fire:'火焰',ice:'寒冰',lightning:'雷电'};
const SHRINES=[
 {id:'sword',kind:'weapon',room:0,x:530,y:590,name:'旅者短刃',color:'#d7d8b1'},
 {id:'fire',kind:'element',room:0,x:720,y:480,name:'余烬灵印',color:'#e3b282'},
 {id:'heal',kind:'heal',room:0,x:1580,y:590,name:'回春之种',color:'#bcdda4'},
 {id:'ice',kind:'element',room:1,x:520,y:590,name:'寒霜灵印',color:'#abd8df'},
 {id:'ice',kind:'element',room:1,x:1130,y:590,name:'寒霜残响',color:'#abd8df'},
 {id:'ice',kind:'element',room:2,x:350,y:590,name:'寒霜残响',color:'#abd8df'},
 {id:'fire',kind:'element',room:2,x:600,y:590,name:'余烬残响',color:'#e3b282'},
 {id:'lightning',kind:'element',room:3,x:390,y:590,name:'鸣雷灵印',color:'#c7b5e5'},
 {id:'ice',kind:'element',room:3,x:1050,y:590,name:'寒霜残响',color:'#abd8df'},
 {id:'supply-garden',kind:'supplies',room:0,x:920,y:590,name:'旧日行囊',contents:{potion:2,bomb:2,ether:1},color:'#d9cba0'},
 {id:'supply-water',kind:'supplies',room:1,x:1400,y:450,name:'水道遗物',contents:{frost:2,ether:1,potion:1},color:'#d9cba0'},
 {id:'supply-mine',kind:'supplies',room:3,x:1250,y:590,name:'矿工遗物',contents:{bomb:2,potion:2,ore:3},color:'#d9cba0'}
];

const ITEMS={
 sword:{source:'苔息庭院 · 篝火东侧的旧路旁',name:'旅者短刃',kind:'weapon',slot:'weapon',icon:'sword',lore:'苔痕覆盖剑柄，却依然锋利。',effect:'三段近战连击；第三击造成更强的击退。'},
 bow:{name:'古木长弓',kind:'weapon',slot:'weapon',icon:'bow',lore:'以古树枝干制成的轻弓，弦声如微风。',effect:'远程发射箭矢，无弹药消耗。',source:'沉水回廊 · 对岸的古老宝箱'},
 cloak:{name:'苔织披风',kind:'armor',slot:'armor',icon:'cloak',lore:'披风上的微小孢子随步伐起伏。',effect:'移动速度 +5%。',stats:{speed:1.05}},
 stonevest:{name:'根石护甲',kind:'armor',slot:'armor',icon:'shield',lore:'鸣雷矿脉中孕育的护身石甲。',effect:'每 8 秒抵挡 1 次伤害；移动速度 -4%。',stats:{defense:1,speed:.96},source:'激活鸣雷矿井的灵石机关后获得'},
 amber:{name:'余烬琥珀',kind:'charm',slot:'charm',icon:'gem',lore:'树脂凝固的一瞬，封存了一缕火光。',effect:'短刃与长弓伤害 +1。',stats:{damage:1},source:'烧开荆棘书库的封路藤蔓后获得'},
 moonwing:{name:'月孢之翼',kind:'charm',slot:'charm',icon:'leaf',lore:'月光在轻盈的孢翼间停留。',effect:'移动速度 +12%；取得时永久掌握二段跳。',stats:{speed:1.12},source:'月孢洞窟 · 高处的隐秘宝箱'},
 thornring:{name:'根脉灵环',kind:'charm',slot:'charm',icon:'ring',lore:'守卫留下的灵环，回应三种元素。',effect:'元素伤害 +1。',stats:{element:1},source:'击败古树心室的根骸守卫后获得'},
 potion:{name:'苔露药剂',kind:'consumable',icon:'potion',lore:'从柔软苔藓中收集的温和露滴。',effect:'使用后恢复 3 点生命；满生命时不消耗。'},
 ether:{name:'灵息露',kind:'consumable',icon:'flask',lore:'盛着淡蓝微光的玻璃小瓶。',effect:'恢复 65 点灵息；灵息已满时不消耗。'},
 bomb:{name:'爆破种子',kind:'consumable',icon:'bomb',lore:'受热会迸开的坚硬种壳。',effect:'向前投掷，短暂延迟后爆炸，对范围内敌人造成 5 点伤害。'},
 frost:{name:'寒霜瓶',kind:'consumable',icon:'ice',lore:'瓶口结着一圈不会融化的细霜。',effect:'冻结附近敌人，并为邻近深水制造 14 秒冰桥。'},
 fiber:{name:'苔丝纤维',kind:'material',icon:'leaf',lore:'从遗境生物身上收集的柔韧纤维。',effect:'制作苔露药剂与灵息露的材料。',source:'击败遗境中的怪物后收集'},
 ore:{name:'鸣雷碎矿',kind:'material',icon:'ore',lore:'断面中偶尔闪过细小的电光。',effect:'制作爆破种子、寒霜瓶与灵息露的材料。',source:'击败怪物或激活鸣雷矿井机关后收集'}
};
const RECIPES={potion:{cost:{fiber:3},count:1},ether:{cost:{fiber:2,ore:1},count:1},bomb:{cost:{ore:2},count:2},frost:{cost:{fiber:1,ore:2},count:1}};
let bagFilter='all',bagSelected='sword',inventoryBombs=[],inventoryBursts=[],mapCleanup=null;

const regions=[
{name:'苔息庭院',en:'THE MOSS GARDEN',tag:'遗忘之森 · 01',w:1840,type:'garden',floor:[[0,1840]],platforms:[[600,480,180],[870,380,190],[1170,465,180]],camp:430,doors:[{x:970,y:380,to:4,label:'进入月孢洞窟'}],enemies:[[1110,590],[1480,590]],color:'#254b3e'},
{name:'沉水回廊',en:'THE SUNKEN HALL',tag:'旧日水道 · 02',w:1960,type:'water',floor:[[0,680],[1080,880]],platforms:[[280,475,180],[1320,450,180]],pool:[680,1080],chest:{x:1250,y:590,type:'bow'},enemies:[[1490,590],[1750,590]],color:'#23505a'},
{name:'荆棘书库',en:'THE THORN ARCHIVE',tag:'失落圣所 · 03',w:1800,type:'library',floor:[[0,1800]],platforms:[[410,465,170],[1180,455,170]],camp:250,vine:930,enemies:[[650,590],[1220,590],[1550,590]],color:'#40483b'},
{name:'鸣雷矿井',en:'THE THUNDER DEPTHS',tag:'灵石矿脉 · 04',w:1840,type:'mine',floor:[[0,600],[940,900]],platforms:[[270,460,170],[1090,430,140]],pool:[600,940],conductor:1175,gate:1490,enemies:[[400,590],[1300,590]],color:'#3d3f58'},
{name:'月孢洞窟',en:'THE MOONSPORE GROTTO',tag:'隐秘支路 · 05',w:1500,type:'grotto',floor:[[0,1500]],platforms:[[430,500,180],[650,415,180],[870,330,240]],chest:{x:980,y:330,type:'relic'},doors:[{x:145,y:590,to:0,label:'返回苔息庭院'}],enemies:[[600,590]],color:'#294e52'},
{name:'古树心室',en:'THE ANCIENT HEART',tag:'根脉深处 · 06',w:1600,type:'heart',floor:[[0,1600]],platforms:[[210,455,160],[1260,455,160]],camp:140,doors:[{x:1440,y:590,to:0,label:'沿根脉返回庭院',needWin:true}],enemies:[],color:'#424c33'}
];
regions.forEach((r,i)=>r.shrines=SHRINES.filter(s=>s.room===i));
let memory;try{memory=JSON.parse(localStorage.getItem('mosslight-v1')||'null')}catch{}
let state={room:0,hp:5,maxHp:5,mana:100,coins:0,weapon:null,element:null,visited:[0],flags:{bow:false,relic:false,vines:false,gate:false,boss:false,rest:false},kills:0,started:false,...(memory||{})};
state.started=false;state.mana=100;state.hp=state.maxHp;
state.discoveryVersion=2;
state.discoveries=memory?.discoveryVersion===2?{sword:false,fire:false,ice:false,lightning:false,heal:false,...memory.discoveries}:{sword:false,fire:!!memory?.flags?.vines,ice:false,lightning:!!memory?.flags?.gate,heal:false};
state.caches={...(memory?.caches||{})};
state.inventory={sword:0,cloak:1,potion:0,ether:0,bomb:0,frost:0,fiber:0,ore:0,...(memory?.inventory||{})};
state.inventory.sword=state.discoveries.sword?1:0;
if(!weaponUnlocked(state.weapon))state.weapon=state.flags.bow?'bow':state.discoveries.sword?'sword':null;
if(!elementUnlocked(state.element))state.element=['fire','ice','lightning'].find(id=>state.discoveries[id])||null;
state.equipment={armor:'cloak',charm:null,...(memory?.equipment||{})};state.quickItems=memory?.quickItems?.length===3?memory.quickItems:['potion','ether','bomb'];state.rewards={...(memory?.rewards||{})};
let orientationPaused=false;
let running=false,paused=false,modalType='',time=0,last=0,cam=0,shake=0,roomTimer=0,toastTimer=0,saveTimer=0,uiTimer=0,tipIndex=0;
let player={x:330,y:480,w:30,h:52,vx:0,vy:0,face:1,grounded:false,jumps:0,coyote:0,inv:0,attack:0,attackCooldown:0,castCooldown:0,dash:0,dashCooldown:0,anim:0};
let entities=[],projectiles=[],particles=[],effects=[],drops=[],roomStates={},boss=null,near=null,checkpoint={room:0,x:430,y:510},keys={},pressed={};
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const rng=n=>{let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
function svg(id,cls=''){return `<svg class="${cls}"><use href="#i-${id}"/></svg>`}
let audio=null,soundOn=false;
function sound(freq=440,dur=.1,type='sine',volume=.05){if(!soundOn||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.55),audio.currentTime+dur);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}catch{}}
function emit(x,y,color,n=12,speed=100){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-speed,speed),vy:rand(-speed*1.3,speed*.5),life:rand(.3,.9),max:1,color,r:rand(1.5,4)});}
function toast(text,duration=3){$('toast').textContent=text;$('toast').classList.add('show');toastTimer=duration;}
function save(){try{localStorage.setItem('mosslight-v1',JSON.stringify({...state,started:false,checkpoint}));saveTimer=2;return true}catch{return false}}
function showRegion(){const r=regions[state.room];$('regionTitle').innerHTML=`<span>${r.en}</span><strong>${r.name}</strong><i></i>`;$('regionTitle').classList.add('show');roomTimer=3.6;}
function loadRoom(id,x){
 if(roomStates[state.room])roomStates[state.room].enemies=entities.map(e=>({...e}));
 state.room=id;if(!state.visited.includes(id))state.visited.push(id);
 const r=regions[id];if(!roomStates[id])roomStates[id]={frozen:0,enemies:r.enemies.map((v,i)=>({x:v[0],y:v[1]-34,w:42,h:34,vx:0,vy:0,hp:id===3?9:id===0?6:7,maxHp:id===3?9:id===0?6:7,base:v[0],dir:i%2?1:-1,t:rng(i+id)*5,hit:0,burn:0,frozen:0,stun:0,dead:false}))};
 entities=roomStates[id].enemies;projectiles=[];effects=[];drops=[];particles=[];inventoryBombs=[];inventoryBursts=[];
 player.x=x??100;player.y=510;player.vx=0;player.vy=0;player.inv=1.2;player.dash=0;player.grounded=false;player.jumps=0;player.coyote=0;near=null;$('interactHint').style.display='none';cam=clamp(player.x-W*.4,0,r.w-W);
 if(id===5&&!state.flags.boss){if(!boss||boss.hp<=0)boss={x:1070,y:466,w:100,h:124,hp:36,maxHp:36,t:0,phase:'idle',phaseT:1.8,vx:0,vy:0,hit:0,active:false,dir:-1};}
 if(typeof combatTick==='function')combatTick(0);
 showRegion();updateUI();if(running)save();
}
function start(){
 if(state.hp<=0)return;
 if(!state.started){state.started=true;running=true;paused=orientationPaused;document.body.classList.add('playing');$('startPrompt').classList.add('hidden');showRegion();toast(isTouch()?'左侧摇杆移动 · 右侧跳跃与攻击 · 靠近篝火后互动':'A / D 移动 · 空格跳跃 · 靠近篝火按 E 休息',4);save();}
 else{running=true;closeModal();}
 void enterFullscreen();canvas.focus();
}
function updateUI(){
 reconcileInventory();updateInventoryHUD();
 $('hearts').innerHTML=Array.from({length:state.maxHp},(_,i)=>svg('heart',i>=state.hp?'empty':'')).join('');
 $('manaFill').style.width=state.mana+'%';$('manaText').textContent=Math.floor(state.mana);$('coinCount').textContent=state.coins;
 const r=regions[state.room];$('roomName').textContent=r.name;$('roomTag').textContent=r.tag;$('statusText').textContent=saveTimer>0?'旅程已记录':state.flags.boss?'根脉已然苏醒':'世界正在呼吸';
 document.querySelectorAll('[data-element]').forEach(b=>b.classList.toggle('selected',b.dataset.element===state.element));document.querySelectorAll('[data-weapon]').forEach(b=>{b.classList.toggle('selected',b.dataset.weapon===state.weapon);b.classList.toggle('locked',b.dataset.weapon==='bow'&&!state.flags.bow)});
 const quests=[{done:weaponUnlocked(state.weapon)||state.discoveries.sword,title:'寻找遗落的短刃',sub:'沿庭院的微光前行，靠近后互动拾取'},{done:state.flags.rest,title:'在苔息篝火休息',sub:'点亮旅程的第一束光'},{done:state.flags.vines,title:'穿过荆棘书库',sub:'用火焰打开被封闭的道路'},{done:state.flags.gate,title:'唤醒鸣雷机关',sub:'让雷电沿着水与灵石流动'},{done:state.flags.boss,title:'寻找古树之心',sub:'击败根骸守卫，重燃灵息'}];let current=quests.findIndex(q=>!q.done);
 $('questList').innerHTML=current<0?'<div class="quest-item current done"><i></i><span>根脉已苏醒<small>继续探索，寻找遗落的秘密</small></span></div>':quests.map((q,i)=>`<div class="quest-item ${q.done?'done':i===current?'current':''}"><i></i><span>${q.title}${i===current?`<small>${q.sub}</small>`:''}</span></div>`).join('');const pct=Math.round(quests.filter(q=>q.done).length/quests.length*100);$('questPercent').textContent=pct+'%';$('questProgress').style.width=pct+'%';$('explorationText').textContent=`探索 ${state.visited.length} / 6`;
 $('bossHud').classList.toggle('hidden',!(state.room===5&&boss&&boss.active&&!state.flags.boss));if(boss)$('bossFill').style.width=(boss.hp/boss.maxHp*100)+'%';if(window.MossMap)window.MossMap.drawMinimap($('minimap'),{state,regions,player,checkpoint});else drawMap($('minimap'),false);
}
function weaponUnlocked(id){return id==='sword'?!!state.discoveries.sword:id==='bow'?!!state.flags.bow:false;}
function elementUnlocked(id){return !!id&&['fire','ice','lightning'].includes(id)&&!!state.discoveries[id];}
function shrineFound(s){return s.kind==='supplies'?!!state.caches[s.id]:!!state.discoveries[s.id];}
function collectDiscovery(s){
 if(!s||shrineFound(s))return false;
 if(s.kind==='supplies'){state.caches[s.id]=true;for(const [id,n]of Object.entries(s.contents))grantInventory(id,n,true);toast('发现旧日行囊 · 物资已收入背包',3);}
 else{state.discoveries[s.id]=true;
  if(s.kind==='weapon'){state.inventory[s.id]=1;state.weapon=s.id;toast('拾得旅者短刃 · 现在可以攻击了',4);}
  if(s.kind==='element'){state.element=s.id;toast(`唤醒${NAMES[s.id]}灵印 · ${s.id==='fire'?'火焰可以焚开荆棘':s.id==='ice'?'寒冰可以凝结水面':'雷电可以唤醒机关'}`,4);}
  if(s.kind==='heal'){state.hp=state.maxHp;state.mana=100;toast('获得回春之种 · 按 R 消耗灵息恢复生命',4);}
 }
 emit(s.x,s.y-43,s.color||'#e3d2a1',45,160);inventoryBursts.push({x:s.x,y:s.y-35,life:.8,color:s.color||'#dfd1a2'});sound(780,.6,'sine',.045);player.inv=Math.max(player.inv,1);near=null;$('interactHint').style.display='none';updateUI();save();return true;
}
function healPlayer(){
 if(!state.discoveries.heal){toast('尚未找到回春之种 · 在庭院深处寻找微光',2);return false;}
 if(state.hp>=state.maxHp)return false;if(state.mana<45){toast('灵息不足',1.5);return false;}
 state.mana-=45;state.hp=Math.min(state.maxHp,state.hp+2);emit(player.x+15,player.y+20,'#c7e5aa',25,70);inventoryBursts.push({x:player.x+15,y:player.y+25,life:.7,color:'#c6e6ad'});toast('微光回春',1.6);sound(650,.4,'sine',.04);updateUI();return true;
}
function cycleWeapon(){const available=['sword','bow'].filter(weaponUnlocked);if(!available.length){toast('武器尚未发现 · 庭院的旧路旁有一柄短刃',2.5);return false}return selectWeapon(available[(available.indexOf(state.weapon)+1)%available.length]);}
function drawDiscoveryShrines(){
 for(const s of regions[state.room].shrines||[]){if(shrineFound(s))continue;const bob=Math.sin(time*2.1+s.x)*4,x=s.x,y=s.y-45+bob,color=s.color||'#d7cc98';
  ellipse(x,s.y-2,22,4,'#061c15aa');path([[x-22,s.y],[x-17,s.y-8],[x+17,s.y-8],[x+22,s.y]],'#4d6250','#7c8b62',1);glow(x,y,70,color,.17);glow(x,y,24,color,.16);
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.lineWidth=2;
  if(s.kind==='weapon'){ctx.rotate(.25);path([[-3,15],[-2,-22],[3,-29],[7,-22],[4,15]],'#dce6bd',color,1);ctx.beginPath();ctx.moveTo(-8,10);ctx.lineTo(9,10);ctx.stroke();}
  else if(s.kind==='heal'){ctx.beginPath();ctx.moveTo(0,17);ctx.quadraticCurveTo(6,0,0,-14);ctx.stroke();path([[0,-2],[-14,-14],[-17,-3],[-7,4],[0,2]],'#b6d6a6');path([[1,-10],[12,-24],[19,-13],[11,-4],[1,-4]],'#d4e8b5');}
  else if(s.kind==='supplies'){path([[-15,-7],[-11,-17],[10,-17],[15,-7],[14,15],[-14,15]],'#8b8060',color,1.3);ctx.beginPath();ctx.moveTo(-12,-5);ctx.lineTo(12,-5);ctx.moveTo(0,-10);ctx.lineTo(0,9);ctx.stroke();}
  else if(s.id==='fire'){path([[-11,9],[-14,-2],[-6,-14],[0,-6],[4,-27],[14,-8],[12,9],[3,18]],'#e6bb87',color,1);}
  else if(s.id==='ice'){for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(0,20);ctx.moveTo(-6,-15);ctx.lineTo(0,-10);ctx.lineTo(6,-15);ctx.stroke();ctx.restore();}}
  else{path([[2,-25],[-13,1],[-1,1],[-4,23],[15,-8],[3,-8]],'#dac8ef',color,1);}
  ctx.restore();for(let i=0;i<3;i++){const a=time*.7+i*2.1;ellipse(x+Math.cos(a)*29,y+Math.sin(a)*19,1.3,1.3,color);}
  if(Math.abs(player.x+15-x)<135&&Math.abs(player.y+52-s.y)<95){ctx.fillStyle='#e1e8c9';ctx.font='11px serif';ctx.textAlign='center';ctx.fillText(s.name,x,y-42);}
 }
}

function equipmentStats(){
 const armor=ITEMS[state.equipment.armor],charm=ITEMS[state.equipment.charm];
 return {damage:(charm?.stats?.damage||0),defense:(armor?.stats?.defense||0),element:(charm?.stats?.element||0),speed:(armor?.stats?.speed||1)*(charm?.stats?.speed||1)};
}
function absorbEquipmentHit(){if(equipmentStats().defense>0&&!(player.guardCooldown>0)){player.guardCooldown=8;return true}return false;}
function grantInventory(id,n=1,quiet=false){if(!ITEMS[id])return;state.inventory[id]=(state.inventory[id]||0)+n;if(!quiet)toast(`获得 ${ITEMS[id].name} ×${n}`,2);}
function grantEnemyLoot(e){const n=state.kills;grantInventory(n%2?'fiber':'ore',1,true);if(n%3===0)grantInventory('potion',1,true);if(n%4===0)grantInventory('bomb',1,true);save();}
function reconcileInventory(){
 state.inventory.sword=state.discoveries.sword?1:0;if(state.flags.bow)state.inventory.bow=1;if(state.flags.relic)state.inventory.moonwing=1;
 for(const [flag,rewards]of Object.entries({vines:{amber:1,fiber:3},gate:{stonevest:1,ore:4,ether:2},boss:{thornring:1,bomb:3,potion:3}})){
  if(state.flags[flag]&&!state.rewards[flag]){for(const [id,n]of Object.entries(rewards))grantInventory(id,n,true);state.rewards[flag]=true;}
 }
 if(!state.inventory[state.equipment.armor])state.equipment.armor='cloak';if(!state.inventory[state.equipment.charm])state.equipment.charm=null;
}
function equipItem(id){
 const d=ITEMS[id];if(!d||!(state.inventory[id]>0)||!d.slot)return false;
 if(d.slot==='weapon')return selectWeapon(id);
 state.equipment[d.slot]=id;toast(`已装备 ${d.name}`,1.7);sound(540,.12,'sine',.03);save();updateUI();return true;
}
function useItem(id){
 const d=ITEMS[id];if(!d||d.kind!=='consumable'||!(state.inventory[id]>0)){toast('道具已用完，可以在背包中制作或探索收集',2);return false}
 if(state.hp<=0||(player.itemCooldown>0&&modalType!=='bag'))return false;
 if(id==='potion'&&state.hp>=state.maxHp){toast('生命已满，药剂已保留',1.7);return false}
 if(id==='ether'&&state.mana>=99){toast('灵息充盈，灵露已保留',1.7);return false}
 state.inventory[id]--;player.itemCooldown=.55;
 if(id==='potion'){state.hp=Math.min(state.maxHp,state.hp+3);emit(player.x+15,player.y+20,'#d4eab0',32,100);inventoryBursts.push({x:player.x+15,y:player.y+25,life:.6,color:'#bbdf8c'});sound(680,.35,'sine',.04);toast('饮下苔露药剂 · 恢复 3 点生命',1.8)}
 if(id==='ether'){state.mana=Math.min(100,state.mana+65);emit(player.x+15,player.y+20,'#a6dce6',32,100);inventoryBursts.push({x:player.x+15,y:player.y+25,life:.6,color:'#a6dce6'});sound(830,.3,'sine',.035);toast('灵息回复 65 点',1.8)}
 if(id==='bomb'){inventoryBombs.push({x:player.x+15+player.face*20,y:player.y+18,vx:player.face*300,vy:-300,t:.85});sound(170,.15,'triangle',.04);toast('爆破种子 · 远离爆炸中心',1.1)}
 if(id==='frost'){const r=regions[state.room];if(r.pool&&Math.min(Math.abs(player.x-r.pool[0]),Math.abs(player.x-r.pool[1]))<350)roomStates[state.room].frozen=14;for(const e of entities)if(!e.dead&&Math.abs(e.x-player.x)<250)damageEnemy(e,1,'ice');inventoryBursts.push({x:player.x+15,y:player.y+25,life:.8,color:'#ade6e1'});emit(player.x+15,player.y+25,'#b7e9e1',40,260);toast('寒霜瓶破碎 · 冻结周围敌人与水面',2)}
 save();updateUI();if(modalType==='bag')closeModal();return true;
}
function useQuickItem(slot){if(paused||!state.started||orientationPaused)return false;return useItem(state.quickItems[slot]);}
function assignQuickItem(id,slot){if(ITEMS[id]?.kind!=='consumable')return;state.quickItems[slot]=id;save();updateUI();renderInventory();toast(`已放入道具栏 ${slot+1} · 按 ${slot+3} 使用`,1.8)}
function craftItem(id){const recipe=RECIPES[id];if(!recipe)return false;for(const [mat,n]of Object.entries(recipe.cost))if((state.inventory[mat]||0)<n){toast('材料不足，击败怪物或探索宝箱收集',2);return false}for(const [mat,n]of Object.entries(recipe.cost))state.inventory[mat]-=n;grantInventory(id,recipe.count||1,true);toast(`制作完成 · ${ITEMS[id].name} ×${recipe.count||1}`,2);save();updateUI();renderInventory();return true;}
function updateInventory(dt){
 player.itemCooldown=Math.max(0,(player.itemCooldown||0)-dt);inventoryBursts.forEach(f=>f.life-=dt);inventoryBursts=inventoryBursts.filter(f=>f.life>0);
 for(const b of inventoryBombs){b.t-=dt;b.vy+=800*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y>575){b.y=575;b.vy=-Math.abs(b.vy)*.35;b.vx*=.65}if(b.t<=0){
  emit(b.x,b.y,'#edbe76',65,330);inventoryBursts.push({x:b.x,y:b.y,life:.65,color:'#edbe76'});shake=Math.max(shake,13);sound(75,.35,'sawtooth',.075);
  for(const e of entities)if(!e.dead&&Math.hypot(e.x+21-b.x,e.y+17-b.y)<175)damageEnemy(e,5,'bomb');if(state.room===5&&boss&&!state.flags.boss&&Math.hypot(boss.x+50-b.x,boss.y+60-b.y)<220)damageBoss(5,'bomb');
 }}inventoryBombs=inventoryBombs.filter(b=>b.t>0);
}
function drawInventoryEffects(){
 ctx.save();ctx.translate(-cam,0);drawDiscoveryShrines();
 for(const b of inventoryBombs){glow(b.x,b.y,35,'#f2bb72',.18);ellipse(b.x,b.y,9,9,'#6b6041');ctx.strokeStyle='#e1c17d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x+3,b.y-7);ctx.lineTo(b.x+8,b.y-16);ctx.stroke();ellipse(b.x+8,b.y-16,2+Math.sin(time*30),2,'#f2c37a');}
 for(const f of inventoryBursts){ctx.globalAlpha=Math.min(1,f.life*1.5);const radius=(1-f.life/.8)*170;ctx.strokeStyle=f.color;ctx.lineWidth=3*f.life;ctx.beginPath();ctx.arc(f.x,f.y,Math.max(5,radius),0,Math.PI*2);ctx.stroke();glow(f.x,f.y,Math.max(10,radius),f.color,f.life*.2);}ctx.restore();
}
function updateInventoryHUD(){
 const setQuick=(button,icon,allowed,label,color)=>{button.innerHTML=svg(icon)+(allowed?'':'<i class="quick-lock">'+svg('lock')+'</i>');button.classList.toggle('locked',!allowed);button.setAttribute('aria-disabled',String(!allowed));button.setAttribute('aria-label',label);button.title=label;if(color)button.style.color=color;};
 setQuick($('weaponCycle'),state.weapon==='bow'?'bow':'sword',weaponUnlocked(state.weapon),weaponUnlocked(state.weapon)?ITEMS[state.weapon].name+' · 切换武器':'武器尚未发现');
 setQuick($('elementCycle'),state.element==='lightning'?'bolt':state.element||'gem',elementUnlocked(state.element),elementUnlocked(state.element)?NAMES[state.element]+' · 切换元素':'灵印尚未发现',COLORS[state.element]||'#b4c2b1');
 setQuick($('healQuick'),'heal',!!state.discoveries.heal,state.discoveries.heal?'回春 · R':'回春之种尚未发现');
 document.querySelectorAll('[data-quick-slot]').forEach(b=>{const slot=Number(b.dataset.quickSlot),id=state.quickItems[slot],d=ITEMS[id],count=state.inventory[id]||0;b.innerHTML=svg(d?.icon||'bag')+`<b>${count}</b>`;b.classList.toggle('depleted',count<=0);b.title=(d?.name||'道具')+' · '+(slot+3);b.setAttribute('aria-label',`${d?.name||'道具'}，剩余${count}`);});
 document.querySelectorAll('.touch-cast').forEach(b=>{b.innerHTML=svg(elementUnlocked(state.element)?(state.element==='lightning'?'bolt':state.element):'lock');b.classList.toggle('locked',!elementUnlocked(state.element))});
 document.querySelectorAll('.touch-attack').forEach(b=>{b.innerHTML=svg(weaponUnlocked(state.weapon)?(state.weapon==='bow'?'bow':'sword'):'lock');b.classList.toggle('locked',!weaponUnlocked(state.weapon))});
}
function itemOwned(id){return (ITEMS[id]?.slot!=='weapon'||weaponUnlocked(id))&&(state.inventory[id]||0)>0;}
function itemEquipped(id){const d=ITEMS[id];return d?.slot==='weapon'?state.weapon===id:d?.slot?state.equipment[d.slot]===id:false;}
// Presentation helpers deliberately derive everything from existing inventory data.
function rpgItemRarity(id){const d=ITEMS[id];return Math.max(1,Math.min(5,Math.round(d?.rarity||({weapon:3,armor:3,charm:4,consumable:2,material:1}[d?.kind]||1))));}
function rpgItemStars(id){return `<span class="rpg-stars" aria-label="${rpgItemRarity(id)}星品质">${'★'.repeat(rpgItemRarity(id))}</span>`;}
function rpgItemCard(id,selected=false,attribute='data-bag-item'){
 const d=ITEMS[id],count=state.inventory[id]||0,owned=itemOwned(id);
 return `<button class="inventory-cell rarity-${rpgItemRarity(id)} ${selected?'selected':''} ${owned?'':'undiscovered'}" ${attribute}="${id}" aria-label="${d.name}，${owned?'持有'+count+'件':'尚未发现，查看线索'}" aria-pressed="${selected}" title="${d.name}"><span class="rpg-card-art">${svg(d.icon)}${!owned?`<i class="rpg-card-lock">${svg('lock')}</i>`:''}</span><span class="rpg-card-caption">${rpgItemStars(id)}<b>${owned?count:'—'}</b></span>${owned&&itemEquipped(id)?'<i class="rpg-equipped-mark" aria-label="已装备">◆</i>':''}</button>`;
}
function rpgTravelerMarkup(){
 const weapon=state.weapon&&itemOwned(state.weapon)?state.weapon:null,armor=state.equipment.armor&&itemOwned(state.equipment.armor)?state.equipment.armor:null,charm=state.equipment.charm&&itemOwned(state.equipment.charm)?state.equipment.charm:null;
 return `<svg class="paper-traveler" viewBox="0 0 320 480" aria-label="微光旅者角色形象"><defs><radialGradient id="rpgPortraitHalo"><stop stop-color="#dce9bf" stop-opacity=".28"/><stop offset="1" stop-color="#b8d6bf" stop-opacity="0"/></radialGradient></defs><ellipse cx="162" cy="251" rx="150" ry="214" fill="url(#rpgPortraitHalo)"/><ellipse cx="161" cy="434" rx="76" ry="13" fill="#061c1e" opacity=".45"/><path d="M133 345 123 417m64-72 11 72" fill="none" stroke="#233f37" stroke-width="20" stroke-linecap="round"/><path d="m111 414 27-1 5 16h-39Zm73-1 27 2 12 15h-39Z" fill="#b7c3a2"/><path d="m124 220 66-3 30 138-113 2Z" fill="${armor==='stonevest'?'#6e7f6a':'#557e67'}" stroke="#a7ba8d" stroke-width="2"/><path d="m124 229-41 106 37 21 39-52" fill="#365d4f"/><path d="m124 227-35 65-17 12m116-76 41 62 14 9" fill="none" stroke="#aec0a0" stroke-width="16" stroke-linecap="round"/><path d="m115 313 90-1" fill="none" stroke="#b0ae7e" stroke-width="9"/><path d="m156 307 12 0 0 14-12 0Z" fill="#e3d8a2"/>${armor==='stonevest'?'<path d="m123 238 29-12 42 14-5 56-31 15-32-17Z" fill="#81917b" stroke="#c7d0aa" stroke-width="2"/><path d="m157 231 2 71m-32-34 64 1" stroke="#4a6355" stroke-width="3"/>':''}<circle cx="159" cy="171" r="47" fill="#e3e6c7"/><path d="m113 171 4-40 33-25 37 12 24 41-17-7-15-18h-48l-4 37Z" fill="#668357"/><path d="m150 111 3-32 18-12" fill="none" stroke="#c4d99d" stroke-width="5"/><path d="m157 84 23-27 20 9-16 22Z" fill="#a4bf79"/><path d="m169 171v10m25-10v10" stroke="#294937" stroke-width="5" stroke-linecap="round"/><path d="m177 193 9 1" stroke="#9eae86" stroke-width="2"/><path d="m115 214 88-3 8 22-95 5Z" fill="#c89970"/><path d="m120 224-41-15-24 13 64 22" fill="#b7825b"/><path d="m119 228-56 18-17 32 72-35" fill="#c89368"/>${weapon==='sword'?'<path d="m235 307 10-117 14-23 3 24-17 118Z" fill="#e5ebce" stroke="#92aa95" stroke-width="2"/><path d="m224 307 30 3" stroke="#c7b87f" stroke-width="7" stroke-linecap="round"/><path d="m236 311-2 20" stroke="#716c47" stroke-width="7"/>':weapon==='bow'?'<path d="M242 209q54 88-4 145" fill="none" stroke="#c8b47b" stroke-width="7"/><path d="m242 209-4 145" stroke="#dee7c5" stroke-width="2"/>':''}${charm?'<path d="m180 244 7 30-12 12-11-15Z" fill="#d5be81" stroke="#ede4b0" stroke-width="2"/><circle cx="176" cy="271" r="4" fill="#edf4c6"/>':''}</svg>`;
}
function itemDetailMarkup(id,compact=false){
 const d=ITEMS[id];if(!d)return '<div class="rpg-detail-empty">选择一件物品</div>';
 const count=state.inventory[id]||0,owned=itemOwned(id),equipped=owned&&itemEquipped(id),kind={weapon:'武器',armor:'护甲',charm:'灵物',consumable:'消耗品',material:'材料'}[d.kind],r=RECIPES[id];
 const canCraft=r&&Object.entries(r.cost).every(([m,n])=>(state.inventory[m]||0)>=n);
 let main='';
 if(owned&&d.slot)main=`<button class="primary-btn rpg-main-action" data-equip-item="${id}" ${equipped?'disabled':''}>${svg(equipped?'leaf':'arrow')}<span>${equipped?'已装备':'装备'}</span></button>`;
 else if(owned&&d.kind==='consumable')main=`<button class="primary-btn rpg-main-action" data-use-item="${id}">${svg(d.icon)}<span>使用</span></button>`;
 else if(r)main=`<button class="primary-btn rpg-main-action" data-craft="${id}" ${canCraft?'':'disabled'}>${svg('ore')}<span>制作${r.count>1?' ×'+r.count:''}</span></button>`;
 const recipe=r?`<div class="recipe"><span>制作所需</span><div class="rpg-recipe-cost">${Object.entries(r.cost).map(([m,n])=>`<span class="${(state.inventory[m]||0)<n?'insufficient':''}" title="${ITEMS[m].name}">${svg(ITEMS[m].icon)}<b>${state.inventory[m]||0}<small> / ${n}</small></b></span>`).join('')}${owned?`<button class="rpg-craft-icon" data-craft="${id}" ${canCraft?'':'disabled'} aria-label="制作${d.name}" title="制作${d.name}">${svg('ore')}<i>+</i></button>`:''}</div></div>`:'';
 const assign=owned&&d.kind==='consumable'?`<div class="assign-row"><span>快捷位置</span>${[0,1,2].map(i=>`<button data-assign-item="${id}" data-slot="${i}" class="${state.quickItems[i]===id?'selected':''}" aria-label="放入快捷位置${i+1}" title="快捷键 ${i+3}">${i+1}</button>`).join('')}</div>`:'';
 return `<div class="rpg-detail-content ${compact?'compact':''} rarity-${rpgItemRarity(id)}"><header class="rpg-detail-heading"><div class="item-kind">${kind}<span>${owned?'持有 '+count:'尚未发现'}</span></div><h3>${d.name}</h3>${rpgItemStars(id)}</header>${!compact?`<div class="item-detail-icon ${d.kind}">${svg(d.icon)}<span class="rpg-detail-rune">✧</span></div>`:''}<div class="rpg-detail-prose"><p class="item-effect">${d.effect}</p>${!compact?`<p class="item-lore">${d.lore}</p>`:''}${!owned?`<p class="item-source">${svg('compass')}<span>${d.source||'探索遗境，寻找遗落的宝箱与灵印。'}</span></p>`:''}${!compact?recipe+assign:''}</div><div class="item-actions">${main||'<span class="rpg-no-action">'+(d.kind==='material'?'用于合成道具':owned?'探索所得':'等待旅途中相遇')+'</span>'}</div></div>`;
}
function bindInventoryActions(root){
 root.querySelectorAll('[data-equip-item]').forEach(b=>b.onclick=()=>{const id=b.dataset.equipItem;if(!itemOwned(id)||!ITEMS[id]?.slot)return;equipItem(id);if(modalType==='equipment')renderEquipment();else renderInventory();});
 root.querySelectorAll('[data-use-item]').forEach(b=>b.onclick=()=>{if(itemOwned(b.dataset.useItem))useItem(b.dataset.useItem);});
 root.querySelectorAll('[data-assign-item]').forEach(b=>b.onclick=()=>{if(itemOwned(b.dataset.assignItem))assignQuickItem(b.dataset.assignItem,Number(b.dataset.slot));});
 root.querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>{if(RECIPES[b.dataset.craft])craftItem(b.dataset.craft);});
 root.querySelectorAll('[data-gear-view]').forEach(b=>b.onclick=()=>{bagSelected=b.dataset.gearView;renderEquipment();});
 root.querySelectorAll('[data-equipment-slot]').forEach(b=>b.onclick=()=>{const slot=b.dataset.equipmentSlot,ids=Object.keys(ITEMS).filter(id=>ITEMS[id].slot===slot),current=slot==='weapon'?state.weapon:state.equipment[slot];bagSelected=ids.includes(current)&&itemOwned(current)?current:ids.find(itemOwned)||ids[0];renderEquipment();});
}
function renderInventory(){
 const root=$('modalBody'),filters=[['all','bag','全部物品'],['gear','sword','装备'],['consumable','potion','消耗品'],['material','ore','材料']];
 const ids=Object.keys(ITEMS).filter(id=>bagFilter==='all'||(bagFilter==='gear'?!!ITEMS[id].slot:ITEMS[id].kind===bagFilter));if(!ids.includes(bagSelected))bagSelected=ids.find(itemOwned)||ids[0];
 root.innerHTML=`<div class="inventory-layout rpg-inventory-layout"><section class="inventory-catalog"><div class="inventory-toolbar"><nav class="inventory-filters" aria-label="物品分类">${filters.map(([id,icon,label])=>`<button data-bag-filter="${id}" class="${bagFilter===id?'selected':''}" aria-label="${label}" aria-pressed="${bagFilter===id}" title="${label}">${svg(icon)}</button>`).join('')}</nav><span class="rpg-category-caption">${filters.find(f=>f[0]===bagFilter)?.[2]||'全部物品'}</span><span class="inventory-count">${Object.keys(ITEMS).filter(itemOwned).length} <i>/ ${Object.keys(ITEMS).length}</i></span></div><div class="inventory-grid">${ids.map(id=>rpgItemCard(id,bagSelected===id)).join('')}</div><div class="inventory-wallet"><span>✧</span><b>${state.coins}</b><small>灵光碎片</small><span class="rpg-wallet-note">遗境中的每一次发现，都值得珍藏。</span></div></section><section class="item-detail" aria-label="物品详情">${itemDetailMarkup(bagSelected)}</section></div>`;
 root.querySelectorAll('[data-bag-filter]').forEach(b=>b.onclick=()=>{bagFilter=b.dataset.bagFilter;renderInventory();});root.querySelectorAll('[data-bag-item]').forEach(b=>b.onclick=()=>{bagSelected=b.dataset.bagItem;renderInventory();});bindInventoryActions(root);
}
function renderEquipment(){
 const root=$('modalBody'),stats=equipmentStats(),slot=ITEMS[bagSelected]?.slot||'weapon',slots=[['weapon','sword','武器',state.weapon],['armor','cloak','护甲',state.equipment.armor],['charm','gem','灵物',state.equipment.charm]],ids=Object.keys(ITEMS).filter(id=>ITEMS[id].slot===slot);
 if(!ids.includes(bagSelected))bagSelected=ids.find(itemOwned)||ids[0];
 root.innerHTML=`<div class="equipment-layout rpg-equipment-layout"><aside class="equipment-slots-panel"><div class="rpg-equipment-label">旅者行装</div>${slots.map(([key,icon,label,current])=>{const equipped=current&&itemOwned(current)&&ITEMS[current]?.slot===key;return `<button class="equipment-slot-button ${slot===key?'selected':''} ${equipped?'':'empty'}" data-equipment-slot="${key}" aria-label="${label}：${equipped?ITEMS[current].name:'未装备'}" aria-pressed="${slot===key}"><span class="rpg-slot-orbit">${svg(equipped?ITEMS[current].icon:icon)}${!equipped?`<i>${svg('lock')}</i>`:''}</span><span class="rpg-slot-label"><small>${label}</small><strong>${equipped?ITEMS[current].name:'未装备'}</strong></span></button>`;}).join('')}<p class="rpg-equipment-note">沿途拾取，随心搭配。</p></aside><section class="character-sheet rpg-character-stage"><div class="character-caption"><span>MOSSLIGHT WANDERER</span><h3>微光旅者</h3></div><div class="rpg-character-orbit"></div>${rpgTravelerMarkup()}<div class="rpg-character-pedestal"><i></i><span>根脉与你同在</span></div></section><aside class="rpg-equipment-aside"><section class="rpg-stat-sheet"><div class="rpg-stat-heading">角色属性<span>ATTRIBUTES</span></div><div class="character-stats">${[['生命上限',state.maxHp],['武器伤害','+'+stats.damage],['元素增幅','+'+stats.element],['移动速度',Math.round(stats.speed*100)+'%'],['护甲格挡',stats.defense?'每 8 秒':'—']].map(([label,value])=>`<span><span>${label}</span><b>${value}</b></span>`).join('')}</div></section><section class="rpg-gear-selection"><div class="rpg-choice-heading"><span>${{weapon:'武器',armor:'护甲',charm:'灵物'}[slot]}</span><small>${ids.filter(itemOwned).length} / ${ids.length}</small></div><div class="equipment-options rpg-candidate-grid">${ids.map(id=>rpgItemCard(id,bagSelected===id,'data-gear-view')).join('')}</div></section><section class="item-detail rpg-equipment-detail">${itemDetailMarkup(bagSelected,true)}</section></aside></div>`;
 bindInventoryActions(root);
}
function selectElement(el){if(!elementUnlocked(el)){toast('灵印尚未发现 · 寻找遗境中的发光石碑',2);return false}state.element=el;sound(450,.06);save();updateUI();return true;}
function selectWeapon(w){if(!weaponUnlocked(w)){toast(w==='bow'?'长弓藏在沉水回廊对岸的宝箱中':'短刃遗落在庭院的旧路旁',2.5);return false}state.weapon=w;if(typeof combatState!=='undefined'){combatState.swing=null;combatState.bow=null;combatState.cast=null;player.attack=0;player.attackCooldown=0;}save();updateUI();return true;}
function cycleElement(){const a=['fire','ice','lightning'].filter(elementUnlocked);if(!a.length){toast('尚未发现灵印 · 留意遗境中的微光',2);return false}return selectElement(a[(a.indexOf(state.element)+1)%a.length]);}
// Combat actors, timing and transient visuals are independent of inventory state.
const combatState={room:-1,clock:0,stop:0,combo:0,comboWindow:0,swing:null,bow:null,cast:null,hurt:0,land:0,runPhase:0,stepTimer:0,texts:[],slashes:[],sparks:[]};
function combatStats(){return typeof equipmentStats==='function'?equipmentStats():{damage:0,defense:0,element:0,speed:1};}
function combatFloat(x,y,text,color='#e4edc4',large=false){combatState.texts.push({x,y,text:String(text),color,large,life:.85,max:.85,vx:rand(-14,14)});if(combatState.texts.length>60)combatState.texts.shift();}
function combatImpact(x,y,color,heavy=false){combatState.sparks.push({x,y,color,life:heavy?.25:.18,max:heavy?.25:.18,heavy});combatState.stop=Math.max(combatState.stop,heavy?.075:.045);shake=Math.max(shake,heavy?7:3);emit(x,y,color,heavy?22:11,heavy?240:160);sound(heavy?125:185,.08,'triangle',heavy?.065:.045);}
function combatMoveSpeed(){const s=combatState.swing;return (combatStats().speed||1)*(s?(s.t<s.wind ? .55 : .8):1);}
function combatLand(speed){if(speed<170)return;combatState.land=clamp(speed/950,.25,1);emit(player.x+15,player.y+52,'#9eb58a',Math.round(6+combatState.land*8),70+combatState.land*70);sound(100,.075,'triangle',.015);if(speed>750)shake=Math.max(shake,2);}
function combatTick(dt){
 const c=combatState;
 if(c.room!==state.room){c.room=state.room;c.swing=null;c.bow=null;c.cast=null;c.stop=0;c.hurt=0;c.land=0;c.texts=[];c.slashes=[];c.sparks=[];c.combo=0;c.comboWindow=0;}
 for(const a of c.texts){a.life-=dt;a.y-=dt*45;a.x+=a.vx*dt;}c.texts=c.texts.filter(a=>a.life>0);
 for(const a of c.slashes)a.life-=dt;c.slashes=c.slashes.filter(a=>a.life>0);
 for(const a of c.sparks)a.life-=dt;c.sparks=c.sparks.filter(a=>a.life>0);
 if(c.stop>0){c.stop=Math.max(0,c.stop-dt);return true;}
 c.clock+=dt;c.hurt=Math.max(0,c.hurt-dt);c.land=Math.max(0,c.land-dt*5);c.comboWindow=Math.max(0,c.comboWindow-dt);player.guardCooldown=Math.max(0,(player.guardCooldown||0)-dt);
 c.runPhase+=Math.abs(player.vx)*dt*.06;c.stepTimer=Math.max(0,c.stepTimer-dt);
 if(player.grounded&&Math.abs(player.vx)>150&&c.stepTimer===0){c.stepTimer=.16;emit(player.x+15,player.y+52,'#789b78',2,28);}
 const s=c.swing;
 if(s){s.t+=dt;player.attack=Math.max(0,s.total-s.t);
  if(s.t>=s.wind&&s.t<s.wind+s.active){
   if(!s.trail){s.trail=true;c.slashes.push({x:player.x+15,y:player.y+24,face:s.face,stage:s.stage,life:.22,max:.22});sound(s.stage===2?110:210+s.stage*70,.12,'triangle',.045);}
   const range=s.stage===2?125:100,box={x:s.face>0?player.x+8:player.x-range+22,y:player.y-18,w:range,h:88};
   for(const e of entities)if(!e.dead&&!s.hits.has(e)&&overlap(box,e)){s.hits.add(e);damageEnemy(e,s.damage,'sword');}
   if(state.room===5&&boss&&!state.flags.boss&&!s.hits.has(boss)&&overlap(box,boss)){s.hits.add(boss);damageBoss(s.damage,'sword');}
   if(state.room===2&&!state.flags.vines&&Math.abs(player.x-regions[2].vine)<120&&!s.vine){s.vine=true;emit(regions[2].vine,player.y+25,'#768b58',8,75);}
  }
  if(s.t>=s.total)c.swing=null;
 }
 if(c.bow){const b=c.bow;b.t+=dt;if(!b.fired&&b.t>=.17){b.fired=true;projectiles.push({x:player.x+15+b.face*25,y:player.y+23,vx:b.face*830,vy:0,life:1.3,type:'arrow',w:24,h:7,damage:2+(combatStats().damage||0)});emit(player.x+15+b.face*25,player.y+23,'#e2e8bd',6,60);sound(610,.12,'triangle',.045);}if(b.t>=.46)c.bow=null;}
 if(c.cast){const a=c.cast;a.t+=dt;if(!a.fired&&a.t>=.11){a.fired=true;projectiles.push({x:player.x+15+a.face*26,y:player.y+24,vx:a.face*(a.type==='lightning'?850:610),vy:0,life:1.7,type:a.type,w:21,h:21,damage:(a.type==='lightning'?3:2)+(combatStats().element||0)});emit(player.x+15+a.face*25,player.y+24,COLORS[a.type],15,100);sound(a.type==='fire'?240:a.type==='ice'?800:120,.2,a.type==='lightning'?'sawtooth':'sine',.04);}if(a.t>=.34)c.cast=null;}
 return c.stop>0;
}
function combatEnemyTick(e,dt){
 if(e.dead){e.deathT=Math.max(0,(e.deathT||0)-dt);return;}
 e.ai??='patrol';e.aiT??=1;e.homeY??=e.y;e.knock??=0;e.t+=dt;e.hit=Math.max(0,e.hit-dt);e.stun=Math.max(0,e.stun-dt);e.frozen=Math.max(0,e.frozen-dt);
 if(e.burn>0){e.burn=Math.max(0,e.burn-dt);if(Math.random()<dt*6)emit(e.x+20,e.y+10,'#e9a36f',2,40);if(Math.floor(e.t*2)!==Math.floor((e.t-dt)*2))damageEnemy(e,.5,'burn');if(e.dead)return;}
 const ground=regions[state.room].floor.find(f=>e.base>=f[0]&&e.base<=f[0]+f[1]),left=ground?ground[0]+8:0,right=ground?ground[0]+ground[1]-e.w-8:regions[state.room].w-e.w;
 e.x=clamp(e.x+e.knock*dt,left,right);e.knock*=Math.exp(-10*dt);
 if(e.frozen>0||e.stun>0){e.y=lerp(e.y,e.homeY,Math.min(1,dt*12));return;}
 const distance=player.x+15-e.x-e.w/2,visible=Math.abs(distance)<295&&Math.abs(player.y-e.y)<130;e.aiT-=dt;
 if(e.ai==='patrol'){
  e.x+=e.dir*38*dt;if(e.x<Math.max(left,e.base-120)||e.x>Math.min(right,e.base+120))e.dir*=-1;
  if(visible){e.ai='alert';e.aiT=.34;e.dir=distance>0?1:-1;combatFloat(e.x+21,e.y-27,'!','#edcf8f',true);}
 }else if(e.ai==='alert'){
  e.dir=distance>0?1:-1;if(e.aiT<=0){e.ai=visible?'windup':'patrol';e.aiT=.48;}
 }else if(e.ai==='windup'){
  if(e.aiT<=0){e.ai='lunge';e.aiT=.39;e.lungeDir=e.dir;emit(e.x+21,e.homeY+34,'#a6b77d',8,90);sound(180,.12,'triangle',.02);}
 }else if(e.ai==='lunge'){
  e.x+=e.lungeDir*360*dt;e.y=e.homeY-Math.sin(clamp(1-e.aiT/.39,0,1)*Math.PI)*32;
  if(e.aiT<=0){e.y=e.homeY;e.ai='recover';e.aiT=.82;emit(e.x+21,e.homeY+34,'#98aa7b',7,70);}
 }else if(e.ai==='recover'&&e.aiT<=0){e.ai='patrol';e.aiT=1;}
 e.x=clamp(e.x,left,right);if(overlap(player,e))hurt(1,player.x<e.x?-1:1);
}
function drawCombatEffects(){
 const c=combatState;
 for(const s of c.slashes){ctx.save();ctx.translate(s.x,s.y);ctx.scale(s.face,s.stage===1?-1:1);ctx.globalAlpha=clamp(s.life/s.max,0,1);const p=1-s.life/s.max,r=s.stage===2?94:75;ctx.rotate(s.stage===2?-.28:0);ctx.strokeStyle=s.stage===2?'#dceca94d':'#d4eac638';ctx.lineWidth=s.stage===2?24:17;ctx.beginPath();ctx.arc(0,0,r,-1.45+p*.25,1.2+p*.2);ctx.stroke();ctx.strokeStyle='#eff6d6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r+5,-1.35+p*.2,.95+p*.3);ctx.stroke();ctx.restore();}
 for(const h of c.sparks){ctx.save();ctx.translate(h.x,h.y);const p=1-h.life/h.max;ctx.globalAlpha=1-p;ctx.strokeStyle=h.color;ctx.lineWidth=h.heavy?3:2;for(let i=0;i<7;i++){const a=i*Math.PI*2/7+.2,r=6+p*(h.heavy?40:28);ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.25,Math.sin(a)*r*.25);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}ctx.strokeStyle='#f1f5d8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,5+p*24,0,Math.PI*2);ctx.stroke();ctx.restore();}
 for(const f of c.texts){ctx.save();ctx.globalAlpha=clamp(f.life/.18,0,1);ctx.font=`${f.large?'bold 21px':'bold 15px'} system-ui,sans-serif`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#08241bd9';ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);ctx.restore();}
}
function attack(){
 if(player.attackCooldown>0||player.dash>0||combatState.hurt>0||combatState.cast)return;if(!weaponUnlocked(state.weapon)){player.attackCooldown=.6;toast('尚未发现武器 · 在庭院旧路旁寻找短刃',2);return;}
 if(state.weapon==='bow'){player.attackCooldown=.47;player.attack=.4;combatState.bow={t:0,face:player.face,fired:false};sound(300,.12,'sine',.02);return;}
 const c=combatState,stage=c.comboWindow>0?(c.combo+1)%3:0;c.combo=stage;c.comboWindow=.95;
 const total=[.32,.37,.53][stage],wind=[.075,.095,.145][stage];
 c.swing={stage,t:0,total,wind,active:[.115,.14,.17][stage],face:player.face,damage:(stage===2?4:2)+(combatStats().damage||0),hits:new Set(),trail:false};
 player.attackCooldown=total;player.attack=total;if(player.grounded)player.vx+=player.face*(stage===2?125:65);
}
function cast(){if(!elementUnlocked(state.element)){if(player.castCooldown<=0)toast('尚未发现灵印',1.6);player.castCooldown=.5;return;}if(player.castCooldown>0||combatState.hurt>0||combatState.swing||combatState.bow)return;if(state.mana<18){toast('灵息不足，稍候片刻或在篝火休息',1.8);return;}state.mana-=18;player.castCooldown=.5;player.attack=.34;combatState.cast={t:0,type:state.element,face:player.face,fired:false};emit(player.x+15-player.face*13,player.y+22,COLORS[state.element],7,30);}
function jump(){if(combatState.hurt>0)return;if(player.grounded||player.coyote>0||(state.flags.relic&&player.jumps<2)){player.vy=-680;player.grounded=false;player.coyote=0;player.jumps++;combatState.land=0;emit(player.x+15,player.y+player.h,'#b8cf9f',player.jumps>1?18:10,player.jumps>1?130:80);if(player.jumps>1){combatState.sparks.push({x:player.x+15,y:player.y+52,color:'#b9e5c9',life:.25,max:.25,heavy:false});}sound(player.jumps>1?520:360,.12,'sine',.025);}}
function dash(){if(player.dashCooldown<=0&&state.mana>=8){combatState.swing=null;combatState.bow=null;combatState.cast=null;combatState.hurt=0;player.dash=.19;player.dashCooldown=.7;player.inv=Math.max(player.inv,.22);player.vy=0;state.mana-=8;emit(player.x+15,player.y+25,'#c8e2b1',14,180);sound(220,.14,'triangle',.035);}}
function damageEnemy(e,n,type='sword'){
 if(e.dead)return;const dot=type==='burn',dir=e.x+e.w/2>=player.x+15?1:-1,color=COLORS[type]||(type==='bomb'?'#efd19b':'#e1edbc'),heavy=type==='bomb'||(!dot&&n>=4);
 e.hp-=n;e.hit=dot?.07:.19;
 if(!dot){e.knock=dir*(heavy?320:185);e.stun=Math.max(e.stun||0,type==='lightning'?1.3:.18);e.ai='recover';e.aiT=.5;combatImpact(e.x+e.w/2,e.y+14,color,heavy);}
 combatFloat(e.x+e.w/2,e.y-10,(heavy?'✦ ':'')+Number(n.toFixed(1)),color,heavy);
 if(type==='fire'){if(e.burn<=0)combatFloat(e.x+21,e.y-31,'灼烧',color);e.burn=2.5;}
 if(type==='ice'){if(e.frozen<=0)combatFloat(e.x+21,e.y-31,'冻结',color);e.frozen=2.6;}
 if(type==='lightning')combatFloat(e.x+21,e.y-31,'感电',color);
 if(e.hp<=0){e.dead=true;e.deathT=.55;e.y=e.homeY??e.y;state.kills++;if(typeof grantEnemyLoot==='function')grantEnemyLoot(e);for(let i=0;i<3;i++)drops.push({x:e.x+rand(0,35),y:e.y,vx:rand(-80,80),vy:rand(-200,-100),life:20});emit(e.x+21,e.y+12,'#bad39a',24,160);sound(670,.18,'sine',.03);}
}
function damageBoss(n,type='sword'){
 if(!boss||state.flags.boss)return;boss.active=true;boss.hp-=n;boss.hit=.21;combatImpact(boss.x+boss.w/2,boss.y+45,COLORS[type]||'#dce6b0',n>=4);combatFloat(boss.x+50,boss.y-13,n,COLORS[type]||'#e8edc3',n>=4);
 if(boss.hp<=0){boss.hp=0;state.flags.boss=true;state.coins+=100;state.hp=state.maxHp;combatState.stop=.12;shake=15;emit(boss.x+50,boss.y+60,'#d9e9ac',100,300);save();setTimeout(()=>{if(state.flags.boss)openModal('win')},1200);}updateUI();
}
function hurt(n=1,dir=-player.face){
 if(player.inv>0)return;
 if(typeof absorbEquipmentHit==='function'&&absorbEquipmentHit()){player.inv=Math.max(player.inv,.4);emit(player.x+15,player.y+24,'#b7dadd',24,130);combatFloat(player.x+15,player.y-15,'格挡','#c6ecdf',true);combatState.sparks.push({x:player.x+15,y:player.y+24,color:'#c7efdf',life:.3,max:.3,heavy:true});sound(820,.16,'triangle',.05);return;}
 n=Math.max(1,n);state.hp-=n;player.inv=1.35;player.vy=-260;player.vx=dir*310;combatState.hurt=.28;combatState.swing=null;combatState.bow=null;combatState.cast=null;combatState.comboWindow=0;combatState.stop=Math.max(combatState.stop,.065);shake=9;emit(player.x+15,player.y+20,'#e1c39d',19,160);combatFloat(player.x+15,player.y-12,'−'+n,'#efbd9c',true);sound(110,.22,'sawtooth',.04);if(state.hp<=0){state.hp=0;updateUI();openModal('death');}else updateUI();
}
function getPlatforms(){const r=regions[state.room];let a=r.floor.map(v=>({x:v[0],y:590,w:v[1],h:150,solid:false})).concat(r.platforms.map(v=>({x:v[0],y:v[1],w:v[2],h:24,solid:false})));if(r.pool&&roomStates[state.room].frozen>0)a.push({x:r.pool[0],y:590,w:r.pool[1]-r.pool[0],h:18});if(r.vine&&!state.flags.vines)a.push({x:r.vine-22,y:260,w:44,h:330,solid:true});if(r.gate&&!state.flags.gate)a.push({x:r.gate-20,y:310,w:40,h:280,solid:true});return a;}
function interact(){if(!near)return;const r=regions[state.room];if(near.kind==='discovery'){collectDiscovery(near.shrine);return;}if(near.kind==='camp'){state.hp=state.maxHp;state.mana=100;state.flags.rest=true;checkpoint={room:state.room,x:r.camp,y:520};const ok=save();emit(r.camp,560,'#e4c98d',30,90);toast(ok?'篝火已点亮 · 生命与灵息已恢复 · 旅程已记录':'篝火已点亮 · 生命与灵息已恢复（浏览器未允许本地存档）');sound(660,.5,'sine',.04)}if(near.kind==='chest'){const type=r.chest.type;state.flags[type]=true;if(type==='bow')grantInventory('bow',1,true);else grantInventory('moonwing',1,true);if(type==='relic'){state.maxHp=6;state.hp=6;toast('获得月孢之翼 · 现在可以二段跳！',5)}else{state.weapon='bow';toast('获得古木长弓 · 按 2 装备，J 发射箭矢',5)}state.coins+=25;emit(r.chest.x,r.chest.y-30,'#e7d99e',40,180);save();sound(880,.5,'sine',.045)}if(near.kind==='door'){const d=near.door;loadRoom(d.to,d.to===4?220:1050);if(d.to===0&&state.room===0){player.x=d.needWin?1650:970;player.y=d.needWin?500:310;}}updateUI();}
function respawn(){state.hp=state.maxHp;closeModal();state.mana=100;state.coins=Math.max(0,state.coins-10);loadRoom(checkpoint.room,checkpoint.x);player.y=checkpoint.y;boss=null;if(state.room===5&&!state.flags.boss)loadRoom(5,140);toast('微光仍在 · 从最后的篝火重新出发');running=true;canvas.focus();}
function update(dt){
 time+=dt;toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');roomTimer-=dt;if(roomTimer<=0&&state.started)$('regionTitle').classList.remove('show');saveTimer=Math.max(0,saveTimer-dt);shake=Math.max(0,shake-dt*26);
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);effects.forEach(e=>e.life-=dt);effects=effects.filter(e=>e.life>0);
 if(!running||paused){pressed={};return;}
 if(combatTick(dt))return;
 const r=regions[state.room],rs=roomStates[state.room];updateInventory(dt);rs.frozen=Math.max(0,rs.frozen-dt);state.mana=Math.min(100,state.mana+dt*8);
 player.inv=Math.max(0,player.inv-dt);player.attack=Math.max(0,player.attack-dt);player.attackCooldown=Math.max(0,player.attackCooldown-dt);player.castCooldown=Math.max(0,player.castCooldown-dt);player.dashCooldown=Math.max(0,player.dashCooldown-dt);player.anim+=dt;
 if(pressed.Space||pressed.KeyW||pressed.ArrowUp)jump();if(pressed.ShiftLeft||pressed.ShiftRight)dash();if(keys.KeyJ)attack();if(keys.KeyK)cast();if(pressed.KeyE){interact();if(regions[state.room]!==r){pressed={};return;}}
 if(pressed.Digit3)useQuickItem(0);if(pressed.Digit4)useQuickItem(1);if(pressed.Digit5)useQuickItem(2);if(pressed.KeyQ)cycleElement();if(pressed.Digit1)selectWeapon('sword');if(pressed.Digit2)selectWeapon('bow');if(pressed.KeyR)healPlayer();
 const axis=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);if(axis&&combatState.hurt<=0&&!combatState.swing&&!combatState.bow&&!combatState.cast)player.face=axis;
 if(player.dash>0){player.dash-=dt;player.vx=player.face*1100;player.vy=0;if(Math.random()<.6)effects.push({type:'ghost',x:player.x,y:player.y,face:player.face,life:.22});}else{if(combatState.hurt>0)player.vx*=Math.exp(-3.5*dt);else player.vx=lerp(player.vx,axis*310*combatMoveSpeed(),Math.min(1,dt*(player.grounded?18:10)));player.vy+=1850*dt;if(!keys.Space&&!keys.KeyW&&!keys.ArrowUp&&player.vy< -230)player.vy+=1900*dt;}
 const plats=getPlatforms();const oldY=player.y;player.x+=player.vx*dt;
 for(const p of plats){if(p.solid&&overlap(player,p)){player.x=player.vx>0?p.x-player.w:p.x+p.w;player.vx=0;}}
 player.y+=player.vy*dt;const impactVy=player.vy,wasGrounded=player.grounded;player.grounded=false;
 for(const p of plats){if(player.vy>=0&&oldY+player.h<=p.y+8&&player.y+player.h>=p.y&&player.x+player.w>p.x&&player.x<p.x+p.w){player.y=p.y-player.h;player.vy=0;player.grounded=true;player.jumps=0;}}
 if(player.grounded&&!wasGrounded)combatLand(impactVy);
 if(player.grounded)player.coyote=.12;else player.coyote=Math.max(0,player.coyote-dt);
 if(r.pool&&rs.frozen<=0&&player.y+player.h>610&&player.x+player.w>r.pool[0]&&player.x<r.pool[1]){hurt(1);player.x=player.x<(r.pool[0]+r.pool[1])/2?r.pool[0]-55:r.pool[1]+20;player.y=500;player.vy=-200;toast('水流太深了 · 用寒冰冻结水面后通过',3);emit(player.x,600,'#92c9c5',20,150)}
 if(player.y>780){hurt(1);player.y=450;player.x=100;player.vy=0;}
 if(player.x>r.w-25){if(state.room===0)loadRoom(1,60);else if(state.room===1)loadRoom(2,60);else if(state.room===2)loadRoom(3,60);else if(state.room===3){if(state.flags.gate)loadRoom(5,60);else player.x=r.w-60;}else player.x=r.w-player.w;}
 if(player.x<0){if(state.room===1)loadRoom(0,regions[0].w-80);else if(state.room===2)loadRoom(1,regions[1].w-80);else if(state.room===3)loadRoom(2,regions[2].w-80);else if(state.room===5)loadRoom(3,regions[3].w-80);else player.x=0;}
 if(state.room!==regions.indexOf(r)){pressed={};return;}
 for(const e of entities)combatEnemyTick(e,dt);
 for(const p of projectiles){const oldX=p.x;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;const c=COLORS[p.type]||'#e3dfba';if(p.type!=='arrow'&&Math.random()<.8)particles.push({x:p.x,y:p.y,vx:-p.vx*.07,vy:rand(-20,20),life:.23,max:.23,color:c,r:rand(1,3)});
 if(r.vine&&!state.flags.vines&&p.x>r.vine-35&&p.x<r.vine+35){p.life=0;if(p.type==='fire'){state.flags.vines=true;emit(r.vine,450,'#e9ae73',70,220);toast('火焰吞没了荆棘 · 通往深处的道路打开了');save();shake=6;updateUI();}else{emit(p.x,p.y,'#8aa06d',7,70);toast('古老的藤蔓挡住了去路 · 试试火焰',2)}}
 if(r.pool&&p.x>r.pool[0]-20&&p.x<r.pool[1]+20&&p.y>465){if(p.type==='ice'){rs.frozen=14;p.life=0;emit(p.x,592,COLORS.ice,40,170);toast('水面已冻结 · 冰桥将在 14 秒后融化',2.3);sound(950,.3,'sine',.03)}if(p.type==='lightning'){p.life=0;effects.push({type:'electricWater',x:r.pool[0],w:r.pool[1]-r.pool[0],life:.8});for(const e of entities){if(!e.dead&&Math.abs(e.x-p.x)<400)damageEnemy(e,3,'lightning')}if(r.conductor&&!state.flags.gate)activateGate();else toast('雷电沿着水面传导',1.5)}}
 if(r.conductor&&!state.flags.gate&&p.type==='lightning'&&Math.abs(p.x-r.conductor)<65){p.life=0;activateGate()}
 for(const e of entities){if(!e.dead&&overlap({x:p.x-8,y:p.y-8,w:22,h:22},e)){damageEnemy(e,p.damage??2,p.type);p.life=0;break;}}
 if(state.room===5&&boss&&!state.flags.boss&&overlap({x:p.x-8,y:p.y-8,w:22,h:22},boss)){damageBoss(p.damage??(p.type==='lightning'?3:2),p.type);p.life=0;}
 if(r.gate&&!state.flags.gate&&p.x>r.gate-25&&p.x<r.gate+25)p.life=0;
 }
 projectiles=projectiles.filter(p=>p.life>0);
 for(const d of drops){d.vy+=700*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;if(d.y>575){d.y=575;d.vy=-Math.abs(d.vy)*.25;d.vx*=.9}d.life-=dt;if(Math.hypot(d.x-player.x-15,d.y-player.y-25)<90){d.x=lerp(d.x,player.x+15,dt*10);d.y=lerp(d.y,player.y+25,dt*10)}if(Math.hypot(d.x-player.x-15,d.y-player.y-25)<25){d.life=0;state.coins+=3;state.mana=Math.min(100,state.mana+3);sound(950,.055,'sine',.018)}}drops=drops.filter(d=>d.life>0);
 if(state.room===5&&boss&&!state.flags.boss)updateBoss(dt);
 near=null;if(r.camp&&Math.abs(player.x-r.camp)<80&&player.y>480)near={kind:'camp',text:'在篝火休息 · 恢复并存档'};if(r.chest&&!state.flags[r.chest.type]&&Math.hypot(player.x-r.chest.x,player.y+52-r.chest.y)<90)near={kind:'chest',text:'打开古老宝箱'};if(r.doors)for(const d of r.doors)if((!d.needWin||state.flags.boss)&&Math.abs(player.x-d.x)<60&&Math.abs(player.y+52-d.y)<90)near={kind:'door',door:d,text:d.label};
 for(const shrine of r.shrines||[]){if(!shrineFound(shrine)&&Math.abs(player.x+15-shrine.x)<68&&Math.abs(player.y+52-shrine.y)<82){near={kind:'discovery',shrine,text:shrine.kind==='supplies'?'调查遗物':'拾取'+shrine.name};break;}}
 const h=$('interactHint');h.style.display=near?'block':'none';if(near)h.innerHTML='<kbd>E</kbd>'+near.text;
 cam=lerp(cam,clamp(player.x-W*.42,0,r.w-W),Math.min(1,dt*5));
 uiTimer-=dt;if(uiTimer<=0){updateUI();uiTimer=.12;}pressed={};
}
function activateGate(){state.flags.gate=true;emit(regions[3].conductor,500,COLORS.lightning,60,220);effects.push({type:'bolt',x:regions[3].conductor,y:200,y2:580,life:.5});toast('鸣雷机关已激活 · 古树心室的封印解除了',4);sound(100,.5,'sawtooth',.035);shake=8;save();updateUI();}
function updateBoss(dt){
 const b=boss;b.t+=dt;b.hit=Math.max(0,b.hit-dt);if(player.x>470&&!b.active){b.active=true;toast('根骸守卫苏醒了 · 观察蓄力，冲刺躲开攻击',4)}if(!b.active)return;b.phaseT-=dt;b.dir=player.x<b.x?-1:1;
 if(b.phase==='idle'&&b.phaseT<=0){b.phase='windup';b.phaseT=.85;sound(90,.3,'triangle',.02)}
 else if(b.phase==='windup'&&b.phaseT<=0){b.phase='charge';b.phaseT=.65;b.vx=b.dir*620;shake=5;sound(100,.25,'sawtooth',.04)}
 else if(b.phase==='charge'){b.x=clamp(b.x+b.vx*dt,380,1400);if(b.phaseT<=0){b.phase='rest';b.phaseT=1.5;effects.push({type:'shockwave',x:b.x+50,y:585,life:1.8,vx:-b.dir*350});emit(b.x+50,580,'#d0c799',30,180);}}
 else if(b.phase==='rest'&&b.phaseT<=0){b.phase='idle';b.phaseT=b.hp<18?.45:1.1;}
 if(overlap(player,{x:b.x+10,y:b.y+10,w:b.w-20,h:b.h-10}))hurt(1,player.x<b.x?-1:1);
 for(const e of effects)if(e.type==='shockwave'){e.x+=e.vx*dt;if(Math.abs(player.x+15-e.x)<30&&player.y+52>550)hurt(1,e.vx>0?1:-1)}
}
// Hand-drawn scenery is deterministic, while light and foliage remain alive.
function path(points,fill,stroke,width=1){ctx.beginPath();for(let i=0;i<points.length;i++)ctx[i?'lineTo':'moveTo'](...points[i]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function glow(x,y,r,color,alpha=.3){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()}
function arch(x,y,w,h,color,line){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+w/2);ctx.bezierCurveTo(x,y-w*.15,x+w,y-w*.15,x+w,y+w/2);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill();if(line){ctx.strokeStyle=line;ctx.lineWidth=7;ctx.stroke();ctx.lineWidth=1;}}
function drawBackground(r){
 const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,'#071f20');gradient.addColorStop(.45,r.color);gradient.addColorStop(1,'#102d29');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 // distant cavern ridges
 for(let layer=0;layer<3;layer++){const offset=cam*(.07+layer*.09);ctx.fillStyle=['#112e2d','#173b35','#194036'][layer];ctx.beginPath();ctx.moveTo(-50,H);for(let x=-80;x<W+160;x+=55){const v=rng(Math.floor((x+offset)/55)+layer*73);ctx.lineTo(x,240+layer*100+v*120)}ctx.lineTo(W+100,H);ctx.fill();}
 // cathedral-like silhouettes, scaled parallax
 ctx.save();ctx.translate(-cam*.24,0);for(let i=-1;i<9;i++){const x=i*310+60;arch(x,70,160,520,'#15352f','#284c3e');arch(x+24,103,112,480,'#0e2d2a');ctx.fillStyle='#274b3d';ctx.fillRect(x-9,290,178,12);ctx.fillRect(x-18,308,194,6);for(let j=0;j<5;j++){ctx.fillStyle='#315140';ctx.globalAlpha=.35;ctx.fillRect(x-3,118+j*70,15,2);ctx.fillRect(x+148,148+j*70,14,2)}ctx.globalAlpha=1;}ctx.restore();
 // a far-off doorway and hazy roots
 ctx.save();ctx.translate(-cam*.12,0);arch(615,137,164,500,'#0b2c2a','#315b49');arch(636,155,122,480,'#173c33');glow(693,330,240,'#7fa578',.16);ctx.strokeStyle='#315243';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(1100,-50);ctx.bezierCurveTo(890,150,1160,200,994,465);ctx.stroke();ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(1040,135);ctx.bezierCurveTo(910,240,1000,320,900,450);ctx.stroke();ctx.restore();
 // translucent sun shafts
 ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<4;i++){const x=230+i*290-cam*.1;const g=ctx.createLinearGradient(x,0,x+160,600);g.addColorStop(0,'#b1d9a30d');g.addColorStop(1,'#b1d9a300');path([[x,0],[x+40,0],[x+220,610],[x+90,610]],g)}ctx.restore();
 if(r.type==='water'){ctx.fillStyle='#8cb6a514';for(let i=0;i<15;i++){const x=(i*137-cam*.3)%1600;ctx.fillRect(x,150+rng(i)*260,1,120)}}
 if(r.type==='library'){ctx.save();ctx.translate(-cam*.42,0);for(let i=0;i<7;i++){let x=i*280-100;ctx.fillStyle='#263d31';ctx.fillRect(x,230,175,310);for(let j=0;j<4;j++){ctx.fillStyle='#405340';ctx.fillRect(x,280+j*65,175,6);for(let k=0;k<12;k++){ctx.fillStyle=['#4c5941','#384d39','#425c43','#596044'][Math.floor(rng(i*100+j*10+k)*4)];ctx.fillRect(x+7+k*13,242+j*65+rng(k+i)*8,8,36-rng(k)*10)}}}ctx.restore()}
 if(r.type==='mine'){ctx.save();ctx.translate(-cam*.5,0);for(let i=0;i<12;i++){let x=i*190;path([[x,500],[x-20,420],[x+3,380],[x+26,440],[x+32,500]],'#40546c','#6b8494',1);glow(x,450,65,'#b0a1e9',.1)}ctx.restore();}
 for(let i=0;i<60;i++){const x=((rng(i+1)*2100-cam*.35+time*(3+rng(i)*6))%1600+1600)%1600-100;const y=110+rng(i+99)*420+Math.sin(time*.4+i)*20;ctx.globalAlpha=.12+(Math.sin(time*1.2+i)+1)*.17;ellipse(x,y,1+rng(i)*1.3,1+rng(i)*1.3,'#d1e7b2')}ctx.globalAlpha=1;
}
function stonePlatform(p,seed){
 ctx.fillStyle='#132e28';ctx.fillRect(p.x,p.y,p.w,p.h);path([[p.x,p.y+10],[p.x+p.w,p.y+10],[p.x+p.w-8,p.y+p.h],[p.x+18,p.y+p.h+8]],'#1b372d');ctx.fillStyle='#264b36';ctx.fillRect(p.x,p.y,p.w,6);ctx.fillStyle='#537349';ctx.fillRect(p.x+3,p.y,p.w-6,3);
 for(let i=0;i<p.w;i+=25){const n=rng(seed+i);ctx.strokeStyle='#38553b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x+i+9,p.y+12);ctx.lineTo(p.x+i+5,p.y+25+n*15);ctx.lineTo(p.x+i+13,p.y+37+n*12);ctx.stroke();if(n>.5){ctx.fillStyle='#34583b';ctx.fillRect(p.x+i+2,p.y+3,4,8+n*13)}}
 for(let i=0;i<p.w;i+=9){const n=rng(seed+i*4);ctx.strokeStyle=n>.6?'#79945b':'#426b42';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x+i,p.y+2);ctx.quadraticCurveTo(p.x+i-4,p.y-6-n*12,p.x+i+Math.sin(time*.9+i)*2,p.y-4-n*13);ctx.stroke()}
 if(p.h<80){for(let i=0;i<p.w;i+=42){const n=rng(i+seed);ctx.strokeStyle='#4d7147';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+i+12,p.y+15);ctx.bezierCurveTo(p.x+i+9,p.y+40,p.x+i+30,p.y+54,p.x+i+13,p.y+70+n*35);ctx.stroke();for(let j=0;j<4;j++)ellipse(p.x+i+15+Math.sin(j*3)*5,p.y+28+j*12,4,2,'#527648')}}
}
function mushroom(x,y,s=1,color='#7fb9aa'){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#6d9d89';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(4,-17,0,-30);ctx.stroke();glow(0,-32,30,color,.13);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,-30,15,7,0,Math.PI,Math.PI*2);ctx.fill();ellipse(0,-30,15,2,'#a2d7bb');for(let i=0;i<4;i++)ellipse(-9+i*5,-33-rng(i+x)*3,1,1,'#d6e4c2');ctx.restore()}
function fern(x,y,s=1,front=false){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const sway=Math.sin(time*.65+x)*3;ctx.strokeStyle=front?'#112c23':'#456d42';ctx.fillStyle=front?'#173e2b':'#426a42';ctx.lineWidth=1.4;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(k*26,-28,k*43+sway,-73);ctx.stroke();for(let j=1;j<7;j++){const xx=k*j*6+sway*j/7,yy=-j*10;ctx.save();ctx.translate(xx,yy);ctx.rotate(k*.4);path([[0,0],[-18+j*1.7,-7],[0,-5],[14-j,-14]],ctx.fillStyle);ctx.restore()}}ctx.restore()}
function drawTree(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#132d27';ctx.beginPath();ctx.moveTo(-100,20);ctx.bezierCurveTo(-60,-30,-40,-160,-70,-300);ctx.bezierCurveTo(-76,-420,-42,-470,-30,-620);ctx.lineTo(45,-620);ctx.bezierCurveTo(12,-450,35,-400,9,-280);ctx.bezierCurveTo(-20,-100,70,-40,100,20);ctx.fill();ctx.strokeStyle='#294532';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-20,-60);ctx.bezierCurveTo(-40,-240,10,-320,-10,-530);ctx.stroke();for(let i=0;i<5;i++){ctx.strokeStyle='#18382a';ctx.lineWidth=25-i*4;ctx.beginPath();ctx.moveTo(-10,-300-i*30);ctx.quadraticCurveTo(80+i*50,-280-i*80,210+i*20,-480-i*40);ctx.stroke()}ctx.strokeStyle='#507444';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(20+i*30,-500-i*15);ctx.bezierCurveTo(50+i*20,-380,20+i*40,-370,50+i*20,-270);ctx.stroke();for(let j=0;j<7;j++)ellipse(40+i*20+Math.sin(j)*8,-450+j*25,5,2.5,'#4f6c3c')}ctx.restore()}
function drawWorld(r){
 ctx.save();ctx.translate(-cam,0);
 if(r.type==='garden'){drawTree(130,603,1.15);drawTree(1700,600,.86);arch(845,217,225,370,'#17382d','#3c5940');arch(872,241,171,340,'#0d2825','#294b37');ctx.fillStyle='#536648';for(let j=0;j<6;j++){ctx.fillRect(831,265+j*53,24,3);ctx.fillRect(1060,287+j*53,22,3)}ctx.strokeStyle='#456b3c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(883,180);ctx.bezierCurveTo(800,300,1050,260,1000,450);ctx.stroke();glow(970,330,110,'#91b783',.09);}
 if(r.type==='heart'){drawTree(910,590,1.65);glow(880,285,250,state.flags.boss?'#cee4a2':'#b5c982',state.flags.boss?.28:.1);ellipse(885,270,30,42,state.flags.boss?'#d3e8a9':'#5b7346');ctx.strokeStyle='#95b278';ctx.lineWidth=2;ctx.strokeRect(869,255,31,31);}
 for(const f of r.floor)stonePlatform({x:f[0],y:590,w:f[1],h:150},state.room*100+f[0]);for(const p of r.platforms)stonePlatform({x:p[0],y:p[1],w:p[2],h:24},p[0]);
 // rocks, runic rubble and little plants
 for(let i=0;i<r.w;i+=65){const n=rng(i+state.room*20);if(r.pool&&i>r.pool[0]-30&&i<r.pool[1]+10)continue;if(n>.48){path([[i,589],[i+8,572-n*13],[i+25,574],[i+34,590]],'#274331','#446044',1)}if(n<.3)fern(i,590,.3+n);if(n>.75)mushroom(i+12,590,.5+n*.4,r.type==='mine'?'#aaa2d0':'#8bbf9e');}
 if(r.pool){const [x,end]=r.pool;const frozen=roomStates[state.room].frozen;const water=ctx.createLinearGradient(0,590,0,720);water.addColorStop(0,frozen>0?'#80b8b1':'#3b837b');water.addColorStop(1,'#133f3e');ctx.fillStyle=water;ctx.fillRect(x,597,end-x,123);ctx.strokeStyle='#8fc9b67a';ctx.lineWidth=1;for(let j=0;j<5;j++){ctx.beginPath();for(let k=0;k<=end-x;k+=12){const y=599+j*13+Math.sin(k*.045+time*1.6+j)*2;ctx[k?'lineTo':'moveTo'](x+k,y)}ctx.stroke()}if(frozen>0){ctx.fillStyle='#acd3ccaa';ctx.fillRect(x,587,end-x,10);ctx.strokeStyle='#d1f1e0';for(let k=x;k<end;k+=40){ctx.beginPath();ctx.moveTo(k,590);ctx.lineTo(k+23,594);ctx.lineTo(k+36,588);ctx.stroke()}ctx.fillStyle='#c2e5dc';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('❄ '+Math.ceil(frozen)+'s',x+(end-x)/2,570);}else{ctx.fillStyle='#99c9b6';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.globalAlpha=.6;ctx.fillText('深水 · 寒冰可以改变它',x+(end-x)/2,645);ctx.globalAlpha=1;}}
 if(r.camp)drawCamp(r.camp,590);
 if(r.chest)drawChest(r.chest);
 if(r.doors)for(const d of r.doors){if(d.needWin&&!state.flags.boss)continue;arch(d.x-31,d.y-89,72,90,'#0b2723','#4d7050');glow(d.x+5,d.y-45,65,'#d8db9e',.08);ctx.fillStyle='#90a478';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(d.to===4?'月孢洞窟':'返回庭院',d.x+5,d.y-103);if(d.to===4){ctx.strokeStyle='#9daf7f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d.x+5,d.y-40);ctx.lineTo(d.x+5,d.y-64);ctx.moveTo(d.x-4,d.y-54);ctx.lineTo(d.x+5,d.y-64);ctx.lineTo(d.x+14,d.y-54);ctx.stroke()}}
 if(r.vine&&!state.flags.vines){for(let j=0;j<6;j++){ctx.strokeStyle=j%2?'#537b3d':'#3f6636';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(r.vine-15+j*6,590);ctx.bezierCurveTo(r.vine-55+j*17,470,r.vine+50-j*13,380,r.vine-20+j*8,250);ctx.stroke();for(let k=0;k<8;k++){let y=285+k*38;path([[r.vine-15+j*6,y],[r.vine-32+j*8,y-12],[r.vine-12+j*6,y-5]],'#7f9554')}}glow(r.vine,435,90,'#b7d27a',.06);ctx.fillStyle='#adb58a';ctx.textAlign='center';ctx.font='10px sans-serif';ctx.fillText('荆棘封路 · 火焰可焚',r.vine,225);}
 if(r.conductor){const x=r.conductor;ctx.fillStyle='#2a3f36';ctx.fillRect(x-17,524,34,66);path([[x,463],[x+22,501],[x,532],[x-22,501]],state.flags.gate?'#c8b9e2':'#6b7184','#b8aed1',2);glow(x,500,state.flags.gate?130:55,'#d5b8f2',state.flags.gate?.25:.08);ctx.strokeStyle=state.flags.gate?'#bdabdf':'#53666a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-15,582);ctx.lineTo(930,582);ctx.lineTo(930,610);ctx.stroke();ctx.fillStyle='#b2acbb';ctx.textAlign='center';ctx.font='10px sans-serif';ctx.fillText(state.flags.gate?'灵石已苏醒':'鸣雷灵石 · 渴望电流',x,448);}
 if(r.gate&&!state.flags.gate){arch(r.gate-60,290,120,300,'#142e2a','#465448');ctx.strokeStyle='#748671';ctx.lineWidth=5;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(r.gate+k*18,325);ctx.lineTo(r.gate+k*18,590);ctx.stroke()}ctx.strokeStyle='#8b9b7f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(r.gate-54,425);ctx.lineTo(r.gate+54,425);ctx.stroke()}
 for(const e of entities)if(!e.dead||(e.deathT||0)>0)drawEnemy(e);
 if(state.room===5&&boss&&!state.flags.boss)drawBoss();
 for(const d of drops){glow(d.x,d.y,17,'#d9e7a4',.2);ctx.save();ctx.translate(d.x,d.y);ctx.rotate(time);path([[0,-5],[4,0],[0,5],[-4,0]],'#dce9ac');ctx.restore()}
 for(const e of effects){if(e.type==='ghost'){ctx.save();ctx.globalAlpha=e.life*.9;drawPlayer(e.x,e.y,e.face,true);ctx.restore()}if(e.type==='electricWater'){ctx.strokeStyle='#d4bff1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,585);for(let i=0;i<e.w;i+=15)ctx.lineTo(e.x+i,585+rand(-10,10));ctx.stroke();glow(e.x+e.w/2,580,e.w,'#bfb5ff',.15)}if(e.type==='bolt'){ctx.strokeStyle='#ead2ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x,e.y);for(let y=e.y;y<e.y2;y+=22)ctx.lineTo(e.x+rand(-20,20),y);ctx.stroke()}if(e.type==='shockwave'){glow(e.x,e.y-15,60,'#dfca8e',.24);ctx.strokeStyle='#b4c48f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,25,Math.PI,0);ctx.stroke()}}
 if(!(player.inv>0&&Math.floor(time*14)%2))drawPlayer(player.x,player.y,player.face,false);
 drawCombatEffects();
 for(const p of projectiles)drawProjectile(p);
 for(const p of particles){ctx.globalAlpha=clamp(p.life*2,0,1);ellipse(p.x,p.y,p.r,p.r,p.color)}ctx.globalAlpha=1;
 // foreground root silhouettes anchor the stage
 for(let i=0;i<r.w;i+=210){const n=rng(i+12);fern(i+50,730,.8+n*.7,true);if(n>.7)fern(i+130,655,.7,true);}
 ctx.restore();
}
function drawCamp(x,y){ctx.save();ctx.translate(x,y);ellipse(0,-2,35,6,'#0a241a');ctx.strokeStyle='#655e39';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-18,-3);ctx.lineTo(17,-10);ctx.moveTo(-16,-11);ctx.lineTo(15,-2);ctx.stroke();glow(0,-22,110,'#e3b66f',.26);for(let i=0;i<4;i++){const a=Math.sin(time*7+i)*4;path([[-13+i*6,-6],[-5+i*2+a,-44-rng(i)*14],[10+i*3,-6]],i%2?'#edc482':'#d69f5a')}ellipse(0,-13,5,12,'#f0dda1');for(let i=0;i<4;i++){let t=(time*.7+i*.24)%1;ellipse(Math.sin(time+i)*12,-12-t*72,1.5-t,2-t,'#f0cd8a')}ctx.restore()}
function drawChest(c){const open=state.flags[c.type];ctx.save();ctx.translate(c.x,c.y);ellipse(0,-1,29,5,'#0d241a');glow(0,-18,65,open?'#8ba16b':'#dfc983',open?.05:.14);ctx.fillStyle='#655c3b';ctx.fillRect(-22,-26,44,25);ctx.strokeStyle='#bcac72';ctx.lineWidth=2;ctx.strokeRect(-22,-26,44,25);ctx.fillStyle='#b8a870';ctx.fillRect(-3,-22,6,10);ctx.fillRect(-15,-26,3,25);ctx.fillRect(12,-26,3,25);ctx.save();ctx.translate(-22,-26);ctx.rotate(open?-.7:0);ctx.fillStyle='#8b7b4d';ctx.fillRect(0,-12,44,12);ctx.strokeStyle='#beac74';ctx.strokeRect(0,-12,44,12);ctx.restore();if(!open){ctx.fillStyle='#d4d6a2';ctx.textAlign='center';ctx.font='10px serif';ctx.fillText(c.type==='relic'?'月孢之翼':'遗落的行囊',0,-56)}ctx.restore()}
function drawPlayer(x,y,face,ghost=false){
 const c=combatState,s=c.swing,b=c.bow,a=c.cast,walking=Math.abs(player.vx)>40&&player.grounded,run=walking?Math.sin(c.runPhase):0,breath=Math.sin(c.clock*2.8),air=!player.grounded,land=c.land,lean=clamp(player.vx/310,-1,1)*.08;
 ctx.save();ctx.translate(x+15,y+52);if(!ghost)ellipse(0,1,19-land*2,4,'#061b1699');ctx.scale(face,1);
 const sx=1+land*.19+(air&&player.vy<0?-.07:0),sy=1-land*.19+(air&&player.vy<0?.08:0);ctx.scale(sx,sy);ctx.rotate(lean+(c.hurt>0?-.16:s?(s.t<s.wind?-.09:.1):a?-.07:0));ctx.translate(0,walking?-Math.abs(run)*2:breath*.65);
 // Opposing knees, elbows and a delayed scarf make each locomotion state distinct.
 ctx.lineCap='round';ctx.strokeStyle='#18372b';ctx.lineWidth=7;for(const side of [-1,1]){const stride=air?(side<0?-4:5):run*side*8;ctx.beginPath();ctx.moveTo(side*5,-15);ctx.lineTo(side*6+stride*.55,-7+(air?-2:0));ctx.lineTo(side*7+stride,air?-3:0);ctx.stroke();ctx.strokeStyle='#a2b28a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(side*7+stride-2,air?-2:0);ctx.lineTo(side*7+stride+5,air?-2:0);ctx.stroke();ctx.strokeStyle='#18372b';ctx.lineWidth=7;}
 const trail=clamp(Math.abs(player.vx)/310,0,1)*17,wave=Math.sin(c.clock*9)*3;
 path([[-10,-38],[-20-trail,-35+wave],[-39-trail,-38+wave*1.5],[-31-trail,-28+wave],[-18,-30]],ghost?'#adcda2':'#bc8357');
 path([[-10,-34],[10,-34],[15,-12],[-15,-12]],ghost?'#b4d6a9':'#47745a','#779773',1);path([[-11,-30],[-18,-10],[0,-15]],'#2c5540');ctx.fillStyle='#91a876';ctx.fillRect(-10,-17,21,3);
 if(state.equipment.armor==='stonevest'){path([[-11,-33],[11,-33],[9,-16],[0,-12],[-9,-16]],ghost?'#b8c8a1':'#7f8b75','#b5c1a0',1);ctx.strokeStyle='#c5cfb0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-32);ctx.lineTo(0,-15);ctx.stroke();}
 if(state.equipment.charm&&!ghost){const color=state.equipment.charm==='amber'?'#edbd78':state.equipment.charm==='moonwing'?'#a6dcc7':'#cab4e4';glow(0,-28,18,color,.2);path([[0,-32],[3,-28],[0,-24],[-3,-28]],color);}

 const backArm=walking?run*6:breath;ctx.strokeStyle='#99b18b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,-28);ctx.lineTo(-16,-20+backArm*.4);ctx.lineTo(-14+backArm,-15);ctx.stroke();
 path([[-12,-39],[10,-40],[13,-33],[-12,-32]],ghost?'#bed5a3':'#c58e5c');
 ellipse(0,-49,14,15,ghost?'#d4e2b5':c.hurt>0?'#ede8c1':'#dce0b7');path([[-14,-50],[-12,-61],[-4,-66],[6,-64],[14,-56],[12,-47],[8,-55],[-8,-55]],'#57794b');ctx.strokeStyle='#b2cb88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-63);ctx.quadraticCurveTo(-4,-73,6,-74);ctx.stroke();path([[0,-70],[7,-77],[12,-74],[8,-68]],'#90b768');ctx.fillStyle='#233e2e';ctx.fillRect(3,-50,2,4);ctx.fillRect(10,-50,2,4);
 let handX=19,handY=-20;
 if(a){handX=a.t<.11?4:31;handY=-30;glow(handX,handY,38,COLORS[a.type],.25);ellipse(handX,handY,5,5,COLORS[a.type]);}
 if(b){const pull=clamp(b.t/.17,0,1);handX=b.fired?20:22-pull*18;handY=-27;}
 ctx.strokeStyle='#b6c8a1';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(10,-28);ctx.lineTo(15,-24);ctx.lineTo(handX,handY);ctx.stroke();
 if(state.weapon==='sword'){
  let angle=.24;
  if(s){const p=clamp((s.t-s.wind)/s.active,0,1);angle=s.t<s.wind?lerp(.25,s.stage===1?2:-1.15,s.t/s.wind):s.stage===1?2-p*2.8:-1.15+p*(s.stage===2?3.1:2.55);if(s.t>s.wind+s.active)angle=lerp(angle,.24,clamp((s.t-s.wind-s.active)/(s.total-s.wind-s.active),0,1));}
  ctx.save();ctx.translate(handX,handY);ctx.rotate(angle);path([[-1,0],[1,-38],[5,-45],[7,-37],[3,0]],ghost?'#dae7c5':'#e1e8cb','#7f9e88',1);ctx.strokeStyle='#b9aa6f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(8,0);ctx.stroke();ctx.restore();
 }else if(state.weapon==='bow'){
  const pull=b&&!b.fired?clamp(b.t/.17,0,1)*18:0;ctx.strokeStyle='#c9b985';ctx.lineWidth=2;ctx.beginPath();ctx.arc(20,-27,25,-1.2,1.2);ctx.stroke();ctx.strokeStyle='#e2e6c2';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(29,-50);ctx.lineTo(27-pull,-27);ctx.lineTo(29,-4);ctx.stroke();if(b&&!b.fired){ctx.beginPath();ctx.moveTo(8-pull,-27);ctx.lineTo(40,-27);ctx.stroke();}
 }
 if(!ghost&&!a&&elementUnlocked(state.element)){glow(-16,-17,27,COLORS[state.element],.12);ellipse(-16,-17,3,4,COLORS[state.element]);}ctx.restore();
}
function drawEnemy(e){
 const dead=e.dead,life=dead?clamp((e.deathT||0)/.55,0,1):1;if(life<=0)return;
 const wind=e.ai==='windup',lunge=e.ai==='lunge',recover=e.ai==='recover',squash=wind?clamp(1-e.aiT/.48,0,1)*.3:recover?.13:0;
 ctx.save();ctx.translate(e.x+21,e.y+34);ctx.globalAlpha=life;ellipse(0,1,26,5,'#082319aa');ctx.scale(e.dir||1,1);ctx.scale(1+squash+(lunge?.16:0)+(dead?(1-life)*.5:0),1-squash-(lunge?.13:0)-(dead?(1-life)*.75:0));ctx.translate(e.hit>0?Math.sin(e.t*70)*2:0,-17+(wind?Math.sin(e.t*35):Math.sin(e.t*5)*1.5));
 const color=e.hit>0?'#f2efcb':e.frozen>0?'#9bd3cf':e.stun>0?'#aa96bf':wind?'#8c8b4e':'#58764a';
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-24,12);ctx.quadraticCurveTo(-24,-21,0,-20);ctx.quadraticCurveTo(27,-20,25,12);ctx.closePath();ctx.fill();path([[-22,-7],[-27,-22],[-9,-14],[-3,-30],[6,-15],[23,-24],[20,-5]],e.hit>0?'#eff1cc':wind?'#c0af68':'#7b9659');
 ctx.strokeStyle='#334f35';ctx.lineWidth=4;const stride=lunge?5:Math.sin(e.t*9)*3;ctx.beginPath();ctx.moveTo(-15,10);ctx.lineTo(-22-stride,17);ctx.moveTo(15,10);ctx.lineTo(22+stride,17);ctx.stroke();ctx.fillStyle=wind?'#ffdc94':'#dce5ad';ctx.fillRect(-8,-5,4,wind?3:5);ctx.fillRect(9,-5,5,wind?3:5);ctx.strokeStyle='#29472f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,7);ctx.lineTo(6,wind?4:7);ctx.stroke();
 if(e.frozen>0){ctx.strokeStyle='#c0f0e5';ctx.lineWidth=1;path([[-27,-12],[-16,-30],[14,-28],[29,-9],[22,19],[-24,17]],'#c5f4e82b','#b9ece4',1);}
 if(e.stun>0&&e.frozen<=0){ctx.strokeStyle='#ead4ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-28,-12);ctx.lineTo(-20,-3);ctx.lineTo(-29,2);ctx.moveTo(28,-17);ctx.lineTo(19,-8);ctx.lineTo(28,-2);ctx.stroke();}
 if(wind){ctx.strokeStyle='#f1cc8777';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-3,35,-1.9,.1);ctx.stroke();}
 if(!dead&&e.hp<e.maxHp){ctx.fillStyle='#173a25';ctx.fillRect(-21,-40,42,3);ctx.fillStyle='#c7d79b';ctx.fillRect(-21,-40,42*Math.max(0,e.hp/e.maxHp),3);}ctx.restore();
}
function drawBoss(){
 const b=boss,wind=b.phase==='windup',charge=b.phase==='charge',rest=b.phase==='rest',p=wind?clamp(1-b.phaseT/.85,0,1):0;
 if(wind){ctx.save();ctx.globalAlpha=.12+p*.16;ctx.fillStyle='#e3b775';const from=b.dir<0?380:b.x+50,to=b.dir<0?b.x+50:1460;ctx.fillRect(from,578,to-from,12);ctx.setLineDash([12,8]);ctx.strokeStyle='#f4d29a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(from,579);ctx.lineTo(to,579);ctx.stroke();ctx.restore();}
 ctx.save();ctx.translate(b.x+50,b.y+124);ellipse(0,1,78,11,'#061e17aa');ctx.scale(b.dir<0?-1:1,1);ctx.rotate(charge?.15:b.hit>0?-.06:wind?-.06*p:0);ctx.scale(wind?1+p*.1:charge?1.08:1,wind?1-p*.1:charge?.95:1);ctx.translate(b.hit>0?Math.sin(b.t*90)*3:0,-54+(rest?5:Math.sin(b.t*3)*1.5));
 const stride=charge?Math.sin(b.t*22)*12:Math.sin(b.t*3)*2;ctx.strokeStyle=b.hit>0?'#f0ecc1':'#4b6039';ctx.lineWidth=23;ctx.beginPath();ctx.moveTo(-28,13);ctx.lineTo(-43-stride,52);ctx.moveTo(28,13);ctx.lineTo(43+stride,52);ctx.stroke();path([[-50,18],[-42,-37],[-20,-55],[28,-55],[49,-30],[55,20],[0,35]],b.hit>0?'#eceac0':'#607049','#91a16e',3);ctx.strokeStyle='#344f32';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-20,-43);ctx.lineTo(-30,17);ctx.moveTo(10,-52);ctx.lineTo(17,26);ctx.stroke();path([[-25,-44],[-32,-80],[-12,-69],[0,-97],[10,-70],[30,-85],[27,-44]],'#849460','#b3bf88',2);
 glow(0,-35,wind?100:80,wind?'#f2c686':'#d0df9e',wind?.2+p*.3:.13);ctx.fillStyle=wind?'#ffdb95':b.hit>0?'#ffffff':'#d4e0a5';ctx.fillRect(-21,-37,12,6);ctx.fillRect(10,-37,12,6);
 const arm=wind?-22*p:charge?14:rest?8:Math.sin(b.t*3)*3;ctx.strokeStyle='#6f864d';ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(-42,-19);ctx.quadraticCurveTo(-70,-4+arm,-73,25+arm);ctx.moveTo(45,-19);ctx.quadraticCurveTo(71,arm,72,31+arm);ctx.stroke();ctx.strokeStyle='#bdc493';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(70,20+arm);ctx.lineTo(96,63+arm);ctx.stroke();for(let i=0;i<6;i++)mushroom(-40+i*15,-36-rng(i)*10,.3,'#a2c383');
 if(wind){ctx.strokeStyle='#f0cc8eaa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-20,103-p*17,-Math.PI*.9,Math.PI*.9);ctx.stroke();ctx.fillStyle='#efd59c';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('!',0,-118);}
 if(charge){ctx.strokeStyle='#d8e3a955';ctx.lineWidth=3;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-110-i*5,-35+i*18);ctx.lineTo(-65,-35+i*18);ctx.stroke();}}
 ctx.restore();
}
function drawProjectile(p){ctx.save();ctx.translate(p.x,p.y);if(p.type==='arrow'){ctx.scale(p.vx>0?1:-1,1);ctx.strokeStyle='#dddcb0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-21,0);ctx.lineTo(13,0);ctx.stroke();path([[13,0],[5,-4],[5,4]],'#e4e7c9');path([[-16,0],[-25,-5],[-22,0],[-25,5]],'#91ab80')}else{const c=COLORS[p.type];glow(0,0,45,c,.3);if(p.type==='fire'){ellipse(0,0,11,7,'#e6ac71');ellipse(3,0,6,4,'#f1db9a')}else if(p.type==='ice'){ctx.rotate(time*4);path([[0,-13],[8,0],[0,13],[-8,0]],'#c3ece1','#e1f4e6',1)}else{ctx.strokeStyle='#e4d0fb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-25,rand(-5,5));for(let i=-15;i<=20;i+=7)ctx.lineTo(i,rand(-10,10));ctx.stroke()}}ctx.restore()}
function draw(){ctx.save();if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));const r=regions[state.room];drawBackground(r);drawWorld(r);drawInventoryEffects();const fog=ctx.createLinearGradient(0,520,0,720);fog.addColorStop(0,'#0c272300');fog.addColorStop(1,'#081e1ad9');ctx.fillStyle=fog;ctx.fillRect(0,520,W,200);ctx.restore();}
const mapNodes=[{x:80,y:134,w:82,h:44},{x:186,y:134,w:92,h:36},{x:300,y:134,w:73,h:44},{x:300,y:204,w:85,h:35},{x:75,y:55,w:80,h:37},{x:422,y:204,w:82,h:44}];
function drawMap(c,big){const cx=c.getContext('2d'),scale=big?1:440/560;cx.clearRect(0,0,c.width,c.height);cx.save();cx.scale(scale,scale);const offset=big?0:0;cx.strokeStyle='#344b35';cx.lineWidth=1;cx.setLineDash([3,5]);const links=[[0,1],[1,2],[2,3],[0,4],[3,5]];for(const [a,b]of links){const p=mapNodes[a],q=mapNodes[b];cx.beginPath();cx.moveTo(p.x+p.w/2,p.y+p.h/2);cx.lineTo(q.x+q.w/2,p.y+p.h/2);cx.lineTo(q.x+q.w/2,q.y+q.h/2);cx.stroke()}if(state.flags.boss){cx.beginPath();cx.moveTo(463,204);cx.lineTo(463,17);cx.lineTo(122,17);cx.lineTo(122,134);cx.stroke()}cx.setLineDash([]);mapNodes.forEach((n,i)=>{const visited=state.visited.includes(i),active=state.room===i;cx.fillStyle=active?'#566946':visited?'#31482f':'#1b2b20';cx.strokeStyle=active?'#cfdda4':visited?'#77905f':'#3a5139';cx.lineWidth=active?1.5:1;cx.fillRect(n.x,n.y,n.w,n.h);cx.strokeRect(n.x,n.y,n.w,n.h);if(i===0||i===2){cx.fillStyle='#7e9b63';cx.fillRect(n.x+5,n.y+5,4,4)}if(active){cx.fillStyle='#dceab5';cx.beginPath();cx.arc(n.x+n.w/2,n.y+n.h/2,3.5,0,Math.PI*2);cx.fill();cx.strokeStyle='#cfdda455';cx.beginPath();cx.arc(n.x+n.w/2,n.y+n.h/2,8,0,Math.PI*2);cx.stroke()}cx.fillStyle=visited?'#b1c39d':'#5c7355';cx.font=(big?'11':'10')+'px sans-serif';cx.textAlign='center';cx.fillText(visited?regions[i].name:'???',n.x+n.w/2,n.y+n.h+17)});cx.restore();}
function renderGuide(body){
 const controls=[['compass','移动','A / D 或 ← →','拖动左侧摇杆'],['jump','跳跃 / 二段跳','空格 / W / ↑','跳跃图标'],['sword','武器攻击','J','短刃图标'],['fire','元素施法','K','元素图标'],['gem','切换元素','Q','下方元素图标'],['bow','切换武器','1 / 2','下方武器图标'],['dash','短距离冲刺','Shift','冲刺图标'],['hand','互动 / 休息','E','手掌图标'],['heal','灵息疗愈','R','下方回春图标'],['bag','使用快捷道具','3 / 4 / 5','下方道具图标'],['map','地图 / 背包 / 装备','M / B / I','顶部菜单图标'],['pause','暂停','Esc','右上暂停图标'],['fullscreen','切换全屏','F','右上全屏图标']];
 body.innerHTML=`<div class="rpg-guide-layout"><section class="guide-controls"><header class="field-section-heading"><span>旅者的技艺</span><small>${isTouch()?'TOUCH CONTROLS':'KEYBOARD CONTROLS'}</small></header><div class="guide-control-list">${controls.map(([icon,label,key,touch])=>`<div class="guide-control-row"><span class="guide-control-label">${svg(icon)}<span>${label}</span></span>${isTouch()?`<span class="guide-touch-binding">${touch}</span>`:`<kbd>${key}</kbd>`}</div>`).join('')}</div></section><aside class="rpg-paper guide-fieldnotes"><header class="rpg-paper-heading"><small>FIELD GUIDE · 旅途须知</small><h3>循光而行</h3></header><div class="rpg-paper-prose"><div class="guide-elements" aria-hidden="true">${svg('fire')}${svg('ice')}${svg('bolt')}</div><h4>万物彼此相连</h4><p>火焰焚毁荆棘，寒冰冻结深水，雷电沿水面传导并唤醒灵石。施法消耗 18 点灵息，灵息会缓慢恢复。</p><h4>力量，藏在旅途之中</h4><p>武器、元素与回春需探索拾取。靠近发光遗物，按 E 或触摸手掌图标。篝火恢复生命并存档，月孢之翼解锁二段跳。</p><h4>留心每一次出手</h4><p>连续挥刃可衔接三段攻击；冲刺消耗 8 点灵息，并能短暂躲避攻击。回春消耗 45 点灵息。</p><h4>横持设备，走入遗境</h4><p>手机支持多指同时操作。下方一排图标切换武器、元素并使用道具。启程时会尝试进入全屏，也可随时点右上角全屏图标。</p></div><footer class="rpg-paper-actions"><button class="primary-btn" id="modalContinue">${svg('leaf')}<span>${state.started?'继续旅程':'踏上旅途'}</span></button></footer></aside></div>`;
}
function renderJournal(body){
 const entries=[['01','旅途起点','微光未曾熄灭','地下王国失去了古树的庇护。一位循着苔光而来的旅者，在遗境中寻找失落的灵印与武器。','每一处微光，都值得驻足。','leaf'],['02','元素法则','万物彼此相连','木畏火，水遇寒而凝，雷随水而行。旅者的力量并非钥匙，整个世界都是锁。','留心身边的水、木与灵石。','gem'],['03','遗落之翼','高处的另一条路',state.flags.relic?'月孢回应了你的呼唤。借助它的力量，你可以在空中再次跃起。':'庭院高处的拱门隐约有孢光流动。也许，那里藏着通往更高处的秘密。',state.flags.relic?'月孢之翼 · 已寻获':'月孢之翼 · 尚待探寻','jump'],['04','古树之心','根脉深处的回声',state.flags.boss?'守卫终于放下了沉重的职责。古树之心重新发光，微光沿着根脉回到每一个角落。':'最后的守卫仍在等待。它的蓄力会暴露下一次冲锋，跃起可以躲开地面的根脉波。',state.flags.boss?'根脉已苏醒':'旅途仍在继续','book']];
 body.innerHTML=`<div class="rpg-journal-layout"><section class="journal-chapters"><header class="field-section-heading"><span>遗境见闻</span><small>TRAVELER'S JOURNAL</small></header><nav class="journal-chapter-list" aria-label="手记章节">${entries.map(([n,chapter,heading,,,icon],i)=>`<button data-journal-page="${i}" aria-current="${i===0?'page':'false'}"><span class="journal-chapter-number">${n}</span><span><strong>${chapter}</strong><small>${heading}</small></span>${svg(icon)}</button>`).join('')}</nav><div class="journal-seal" aria-hidden="true">${svg('book')}<span>根脉与你同在</span></div></section><article class="rpg-paper journal-page" id="journalPage" aria-live="polite"></article></div>`;
 const showPage=index=>{const [n,chapter,heading,prose,note,icon]=entries[index];body.querySelectorAll('[data-journal-page]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.journalPage)===String(index)?'page':'false'));$('journalPage').innerHTML=`<header class="rpg-paper-heading"><small>FIELD NOTES · ${n} / ${chapter}</small><h3>${heading}</h3></header><div class="journal-page-art" aria-hidden="true">${svg(icon)}</div><div class="rpg-paper-prose"><p>${prose}</p><p class="journal-page-note">${note}</p></div><footer class="journal-page-footer"><span>MOSSLIGHT · 遗境手记</span><span>${n} / 04</span></footer>`;$('journalPage').scrollTop=0;};
 body.querySelectorAll('[data-journal-page]').forEach(b=>b.onclick=()=>showPage(Number(b.dataset.journalPage)));showPage(0);
}
function openModal(type){
 if(state.hp<=0&&type!=='death')return;if(type==='pause'&&!state.started)return;if(modalType===type){closeModal();return}paused=true;resetInput();if(mapCleanup){mapCleanup();mapCleanup=null;}modalType=type;$('modalWrap').dataset.view=type;$('gameMenu').classList.toggle('wide-menu',['map','bag','equipment'].includes(type));$('modalWrap').classList.remove('hidden');$('modalEyebrow').textContent=({map:'MOSSLIGHT · CARTOGRAPHY',bag:'TRAVELER INVENTORY',equipment:'GEAR & RELICS',pause:'JOURNEY PAUSED',win:'THE LIGHT RETURNS'})[type]||'MOSSLIGHT · FIELD NOTES';const title=$('modalTitle'),body=$('modalBody');body.scrollTop=0;$('menuTabs').innerHTML=['death','win','reset'].includes(type)?'':[['map','地图'],['bag','背包'],['equipment','装备'],['journal','手记'],['help','指南']].map(([id,name])=>`<button data-menu-tab="${id}" aria-label="${name}" title="${name}" aria-current="${id===type?'page':'false'}" class="${id===type?'selected':''}">${svg({map:'map',bag:'bag',equipment:'shield',journal:'book',help:'help'}[id])}<span>${name}</span></button>`).join('');$('menuTabs').querySelectorAll('[data-menu-tab]').forEach(b=>b.onclick=()=>{if(modalType!==b.dataset.menuTab)openModal(b.dataset.menuTab)});
 if(type==='help'){title.textContent='旅者指南';renderGuide(body);}
 if(type==='map'){title.textContent='遗境舆图';if(window.MossMap)mapCleanup=window.MossMap.mount(body,{state,regions,player,checkpoint});else{body.innerHTML='<canvas class="modal-map" id="bigMap" width="560" height="310"></canvas>';drawMap($('bigMap'),true)}}
 if(type==='bag'){title.textContent='旅者背包';renderInventory();}
 if(type==='equipment'){title.textContent='武器与装备';renderEquipment();}
 if(type==='journal'){title.textContent='冒险手记';renderJournal(body);}
 if(type==='pause'){title.textContent='在微光中歇息';body.innerHTML=`<div class="pause-overview"><div><span>当前区域</span><strong>${regions[state.room].name}</strong></div><div><span>已探索区域</span><strong>${state.visited.length} / 6</strong></div><div><span>灵光碎片</span><strong>✧ ${state.coins}</strong></div></div><p>遗境会等你回来。整理行囊，或者继续下一段旅程。</p><button class="primary-btn" id="modalContinue">继续冒险 →</button><button class="secondary-btn" id="saveBtn">保存旅程</button><button class="secondary-btn" id="restartBtn">重新开始</button>`;$('saveBtn').onclick=()=>{const ok=save();toast(ok?'旅程已记录':'浏览器未允许本地存档，请保留当前页面');closeModal()};$('restartBtn').onclick=()=>openModal('reset');}
 if(type==='reset'){title.textContent='重新开始旅程？';body.innerHTML='<p>这会清除当前浏览器中保存的旅程、装备和探索进度。</p><button class="secondary-btn" id="cancelReset">保留旅程</button><button class="primary-btn" id="confirmReset">确认重新开始</button>';$('cancelReset').onclick=()=>openModal('pause');$('confirmReset').onclick=()=>{try{localStorage.removeItem('mosslight-v1')}catch{}location.reload()}}
 if(type==='death'){title.textContent='微光暂歇';body.innerHTML='<p>失去的只是片刻方向。古树仍在等你。<br>消耗 10 枚灵光碎片，从最后的篝火重新出发。</p><button class="primary-btn" id="respawnBtn">重燃微光 →</button>';$('respawnBtn').onclick=respawn;}
 if(type==='win'){title.textContent='根脉苏醒，微光归来';body.innerHTML='<p>根骸守卫终于卸下了漫长的守望。<br>古树之心再次跳动，温柔的光沿着根脉回到遗境。</p><div class="help-grid"><div><span>区域探索</span><kbd>'+state.visited.length+' / 6</kbd></div><div><span>收集灵光</span><kbd>'+state.coins+'</kbd></div><div><span>击败敌人</span><kbd>'+state.kills+'</kbd></div><div><span>月孢之翼</span><kbd>'+(state.flags.relic?'已获得':'尚未发现')+'</kbd></div></div><p class="modal-note">庭院的捷径已开启。你可以继续探索，寻找尚未发现的秘密。</p><button class="primary-btn" id="modalContinue">继续探索 →</button>';}
 body.querySelectorAll('[data-modal]').forEach(b=>b.onclick=()=>openModal(b.dataset.modal));
 if($('modalContinue'))$('modalContinue').onclick=()=>{closeModal();if(!state.started)start()};(type==='death'?$('respawnBtn'):$('closeModal')).focus();
}
function closeModal(){if(modalType==='death'&&state.hp<=0)return;if(mapCleanup){mapCleanup();mapCleanup=null;}modalType='';paused=orientationPaused;$('modalWrap').classList.add('hidden');canvas.focus();}
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)&&e.target===canvas)e.preventDefault();if(e.repeat&&['KeyM','KeyB','KeyH','KeyI','Escape','KeyQ','KeyF'].includes(e.code))return;if(e.code==='KeyF'){e.preventDefault();void toggleFullscreen();return}if(e.code==='Escape'){if(modalType&&modalType!=='death')closeModal();else if(state.started)openModal('pause');return}if(e.code==='KeyM'){openModal('map');return}if(e.code==='KeyB'){openModal('bag');return}if(e.code==='KeyI'){openModal('equipment');return}if(e.code==='KeyH'){openModal('help');return}if(modalType||orientationPaused)return;if(!state.started&&['Space','Enter','KeyJ','KeyA','KeyD'].includes(e.code)){e.preventDefault();start();}if(!keys[e.code])pressed[e.code]=true;keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{resetInput();if(state.started&&!paused)openModal('pause')});
document.querySelectorAll('[data-quick-slot]').forEach(b=>b.onclick=()=>useQuickItem(Number(b.dataset.quickSlot)));$('startBtn').onclick=start;$('pauseBtn').onclick=()=>openModal('pause');$('closeModal').onclick=closeModal;$('modalWrap').addEventListener('click',e=>{if(e.target===$('modalWrap'))closeModal()});
document.querySelectorAll('[data-modal]').forEach(b=>b.onclick=()=>openModal(b.dataset.modal));document.querySelectorAll('[data-element]').forEach(b=>b.onclick=()=>{selectElement(b.dataset.element);canvas.focus()});document.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>{selectWeapon(b.dataset.weapon);canvas.focus()});
const actionPointers=new Map();
document.querySelectorAll('[data-key]').forEach(b=>{const pointers=new Set();actionPointers.set(b,pointers);b.addEventListener('pointerdown',e=>{e.preventDefault();if(modalType||orientationPaused||state.hp<=0)return;if(!state.started)start();b.setPointerCapture(e.pointerId);pointers.add(e.pointerId);b.classList.add('pressed');const code=b.dataset.key;if(!keys[code])pressed[code]=true;keys[code]=true});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{if(!pointers.delete(e.pointerId))return;if(!pointers.size){keys[b.dataset.key]=false;b.classList.remove('pressed')}})});
// The stick owns one pointer; action buttons keep their own captured pointers.
let stickPointer=null;
const pad=$('movePad'),knob=$('stickKnob');
function moveStick(e){const box=pad.getBoundingClientRect(),dx=e.clientX-box.left-box.width/2,dy=e.clientY-box.top-box.height/2,dist=Math.hypot(dx,dy),limit=28,mul=dist>limit?limit/dist:1;knob.style.transform=`translate(${dx*mul}px,${dy*mul}px)`;keys.KeyA=dx<-9;keys.KeyD=dx>9;}
function releaseStick(){stickPointer=null;keys.KeyA=false;keys.KeyD=false;knob.style.transform='translate(0,0)';}
function resetInput(){keys={};pressed={};releaseStick();for(const [button,pointers]of actionPointers){pointers.clear();button.classList.remove('pressed')}}
pad.addEventListener('pointerdown',e=>{e.preventDefault();if(modalType||orientationPaused||state.hp<=0||stickPointer!==null)return;if(!state.started)start();stickPointer=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e)});
pad.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer){e.preventDefault();moveStick(e)}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===stickPointer)releaseStick()});
$('elementCycle').onclick=()=>{if(!modalType)cycleElement()};$('weaponCycle').onclick=()=>{if(!modalType)cycleWeapon()};
function isTouch(){return typeof window.matchMedia==='function'&&window.matchMedia('(pointer:coarse)').matches;}
function isPortrait(){return typeof window.matchMedia==='function'&&window.matchMedia('(pointer:coarse) and (orientation:portrait)').matches;}
function syncOrientation(){
 const portrait=isPortrait();$('rotateOverlay').setAttribute('aria-hidden',String(!portrait));
 if(portrait){orientationPaused=true;resetInput();if(state.started)paused=true;}
 else if(orientationPaused){orientationPaused=false;if(state.started&&!modalType)paused=false;}
}
function updateFullscreenButton(){const active=!!(document.fullscreenElement||document.webkitFullscreenElement);$('fullscreenBtn').classList.toggle('selected',active);$('fullscreenBtn').setAttribute('aria-label',active?'退出全屏':'进入全屏');$('fullscreenBtn').title=active?'退出全屏 F':'全屏 F';}
async function enterFullscreen(){
 const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
 try{if(!document.fullscreenElement&&!document.webkitFullscreenElement&&request)await request.call(root);}catch{}
 try{if(window.screen?.orientation?.lock)await window.screen.orientation.lock('landscape');}catch{}
 syncOrientation();updateFullscreenButton();
}
async function toggleFullscreen(){
 if(document.fullscreenElement||document.webkitFullscreenElement){try{const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)await exit.call(document);}catch{}updateFullscreenButton();}
 else await enterFullscreen();
}
$('fullscreenBtn').onclick=()=>void toggleFullscreen();$('rotateFullscreenBtn').onclick=()=>void enterFullscreen();
document.addEventListener('fullscreenchange',()=>{updateFullscreenButton();syncOrientation()});
document.addEventListener('webkitfullscreenchange',()=>{updateFullscreenButton();syncOrientation()});
window.addEventListener('resize',syncOrientation);window.addEventListener('orientationchange',syncOrientation);
if(window.screen?.orientation?.addEventListener)window.screen.orientation.addEventListener('change',syncOrientation);
document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(state.started&&!paused)openModal('pause');}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
$('soundBtn').onclick=()=>{soundOn=!soundOn;if(soundOn){try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume();sound(550,.3,'sine',.03);if(!window.mossAmbient){const source=audio.createBufferSource(),buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.17;source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=270;const g=audio.createGain();g.gain.value=.09;source.connect(filter).connect(g).connect(audio.destination);source.start();window.mossAmbient=g;}}catch{soundOn=false}}else if(window.mossAmbient)window.mossAmbient.gain.value=0;if(soundOn&&window.mossAmbient)window.mossAmbient.gain.value=.09;document.querySelector('.mute-mark').style.display=soundOn?'none':'block';$('soundBtn').setAttribute('aria-label',soundOn?'关闭环境音效':'开启环境音效');$('soundBtn').title=soundOn?'关闭环境音效':'开启环境音效';};
// Trap keyboard focus in dialogs without interfering with game input.
$('modalWrap').addEventListener('keydown',e=>{if(e.code!=='Tab')return;const list=[...$('modalWrap').querySelectorAll('button:not([disabled]),[tabindex="0"]')];const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
const tips=['火焰会记得木的温度。<br>试着用元素，改变眼前的世界。','深水不总是阻碍。<br>寒冰会为旅者铺出新的道路。','听见水中的雷声了吗？<br>电流总能找到通向灵石的路。'];setInterval(()=>{tipIndex=(tipIndex+1)%3;$('worldTip').innerHTML=tips[tipIndex];document.querySelectorAll('.tip-dots i').forEach((i,n)=>i.classList.toggle('active',n===tipIndex))},10000);
const savedRoom=state.room;state.room=0;if(memory?.checkpoint)checkpoint=memory.checkpoint;loadRoom(savedRoom,memory?100:330);if(!memory){player.x=330;player.y=538;}else{$('startBtn').innerHTML='<span>继续旅程</span>'+svg('arrow');}showRegion();updateUI();syncOrientation();updateFullscreenButton();
function frame(ts){const dt=Math.min((ts-last)/1000,.035)||.016;last=ts;update(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
// A read-only snapshot supports save inspection and automated playability checks.
window.Mosslight={snapshot:()=>JSON.parse(JSON.stringify({state,player,near,roomStates,boss,running,paused,checkpoint})),regions:regions.map(({name,w,type})=>({name,w,type}))};
})();
