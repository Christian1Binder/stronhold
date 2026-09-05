const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map(([,attrs,body])=>{
  const src=attrs.match(/src="([^"]+)"/);
  if(src&&!/^https?:/.test(src[1]))return fs.readFileSync(path.join(__dirname,'..',src[1].split('?')[0]),'utf8');
  return src?'':body.replace(/Game\.init\(\);\s*$/, '');
}).join('\n');
function loadGame(overrides = {}) {
  const nodes = new Map();
  function element() {
    let content = '';
    return {
      style: {}, dataset: {}, children: [], attributes: {}, innerText: '', value: '', title: '',
      classList: {add(){},remove(){},toggle(){},contains(){return false;}},
      set innerHTML(value){content=String(value);this.children=[];for(const [,id] of content.matchAll(/\bid="([^"]+)"/g))nodes.set(id,element());}, get innerHTML(){return content;},
      appendChild(child){this.children.push(child);if(child.id)nodes.set(child.id,child);return child;},
      setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},
      querySelectorAll(){return [];},querySelector(){return null;},contains(){return false;},
      getBoundingClientRect(){return {left:0,top:0,right:100,bottom:100,width:100,height:100};},
      remove(){},cloneNode(){return element();},parentNode:{replaceChild(){}}
    };
  }
  for(const [,id] of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(id,element());
  const storage = new Map();
  const sandbox = {
    window:{innerWidth:1024,innerHeight:768},
    document:{documentElement:{},body:element(),activeElement:null,title:'',
      getElementById(id){return nodes.get(id)||null;},createElement:element,querySelectorAll(){return [];},querySelector(){return null;}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    Date,Math:Object.assign(Object.create(Math),{random:()=>.5}),console,
    setInterval(){},setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame(){},location:{reload(){}}
  };
  vm.createContext(sandbox);
  vm.runInContext(script+'\nglobalThis.testApi={Game,UI,Storage,Tutorial,I18N,T,BI,loc,SafeT,Rules,Config,Units,MarketGoods,RenownTiers,EPSILON,World,Kingdom,Siege,WorldEvents,EventEngine,numberText,productionRecipe,migrateState,simulateEconomy,produceResources,createEconomyReport,executeTrade,rebalanceMarket,enforceStorageLimits,reconcileWorkforce,countWorkers,calcCaps,marketPrice,renownStatus,productionMultiplier,contractReward,applyOfflineProgress,getDefStr,recalcPopMax,set(v){S=v;migrateState();return S;},state(){return S;}};',sandbox);
  const api=sandbox.testApi;
  const base={day:1,lvl:1,paused:false,res:{gold:1000},pop:{curr:20,max:105,hap:60},b:{stock:20,gran:20,market:1,hovel:20},w:{},units:{},tax:0,
    goal:{gold:1e12},tut:{done:true,skipped:true},events:{pending:null,nextDay:999999},raid:{next:999999,warned:false}};
  const state=api.set({...base,...overrides,res:{...base.res,...overrides.res},pop:{...base.pop,...overrides.pop},b:{...base.b,...overrides.b},w:{...overrides.w}});
  const messages=[];
  const updateUI=api.UI.update.bind(api.UI);
  api.UI.log=(value,style)=>messages.push({value,style});
  api.UI.update=()=>{};
  api.UI.showModal=()=>{};
  api.UI.addMapIcon=()=>{};
  return {api,state,nodes,storage,messages,sandbox,updateUI};
}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.0001,actual+' != '+expected);

test('the main weapons counter includes newly introduced maces',()=>{
  const {nodes,updateUI}=loadGame({res:{mace:7,bow:3}});updateUI();assert.equal(nodes.get('s-wep').innerText,'10');
});

test('v8 territory switching changes map counts and actual construction destination',()=>{
  const {api,state,nodes}=loadGame({res:{gold:10000,wood:1000},b:{apple:2}}),W=api.World,K=api.Kingdom;
  const home=W.region('home'),other=state.world.regions[1];other.status='owned';other.scouted=true;
  W.setRegion('home');near(K.visibleCount('apple'),2);const homeFree=K.free('fertile');
  W.setRegion(other.id);near(K.visibleCount('apple'),0);assert.ok(nodes.get('plots-farm').innerText.includes(String(other.slots.fertile)));
  api.Game.build('apple');near(other.buildings.apple,1);near(home.buildings.apple,2);near(K.visibleCount('apple'),1);near(K.free('fertile'),other.slots.fertile-1);
  W.setRegion('home');near(K.free('fertile'),homeFree);near(K.visibleCount('apple'),2);
  W.setRegion('auto');near(K.visibleCount('apple'),3);near(K.free('fertile'),homeFree+other.slots.fertile-1);
});
test('v8 migration expands the old homeland once without replenishing deposits or losing buildings',()=>{
  const {api,state}=loadGame({meta:{version:7},b:{dairy:2,cattle:3,tannery:2,leatherwork:1,brew:1},w:{dairy:2,cattle:2,tannery:1,leatherwork:1,brew:1},units:{pikeman:2},res:{hides:4,leather:6}});
  near(state.b.dairy,5);near(state.b.tannery,3);near(state.w.dairy,4);near(state.w.tannery,2);near(state.b.cattle,0);near(state.b.leatherwork,0);
  near(state.units.pikeman,2);near(state.b.inn,1);near(state.res.hides,4);near(state.res.leather,6);
  const home=api.World.region('home');home.deposits.iron=7;state.husbandry.herds[0].cows=1;
  const before=JSON.stringify({b:state.b,w:state.w,world:state.world,herds:state.husbandry});api.migrateState();
  assert.equal(JSON.stringify({b:state.b,w:state.w,world:state.world,herds:state.husbandry}),before);near(home.deposits.iron,7);
});
test('new dairy herds grow over work time and restarting tanning cannot create free leather',()=>{
  const {api,state}=loadGame({meta:{version:8},b:{dairy:1,tannery:1},w:{dairy:1,tannery:1}});
  near(api.Kingdom.cows(),0);
  for(let n=0;n<11;n++){const r=api.produceResources();near(r.produced.cheese||0,0);near(state.res.leatherArmor,0);}
  api.produceResources();near(state.res.leatherArmor,3);near(api.Kingdom.cows(),2);
  state.w.dairy=0;state.staffing.targets.dairy=0;
  for(let n=0;n<20;n++)api.produceResources();near(state.res.leatherArmor,3);assert.ok(state.husbandry.tanning<=1);
  const saved=JSON.parse(JSON.stringify(state));api.set(saved);api.produceResources();near(api.state().res.leatherArmor,3);
});
test('legacy leather and hides are consumed with full resource accounting before live cows',()=>{
  const {api,state}=loadGame({meta:{version:7},b:{dairy:1,tannery:1},w:{dairy:1,tannery:1},res:{leather:1,hides:1}});
  let r=api.produceResources();near(r.inputs.leather,1);near(r.produced.leatherArmor,1);near(api.Kingdom.cows(),3);
  for(let n=0;n<3;n++)r=api.produceResources();near(r.inputs.hides,1);near(state.res.leatherArmor,4);near(api.Kingdom.cows(),3);
});
test('a fully staffed mill supports multiple bakeries and staffing survives reload',()=>{
  const {api,state}=loadGame({meta:{version:8},b:{mill:1,bake:6},w:{mill:3,bake:6},res:{wheat:6}});
  const r=api.produceResources();near(r.produced.flour,6);near(r.produced.bread,24);near(state.res.wheat,0);near(state.res.flour,0);
  api.migrateState();near(state.w.mill,3);near(state.staffing.targets.mill,3);
  state.pop.curr=7;api.reconcileWorkforce();assert.ok(api.countWorkers().idle>=0);state.pop.curr=20;api.reconcileWorkforce();near(state.w.mill,3);
});
test('ale stays in storage without an inn and service is limited by staffed inns',()=>{
  const {api,state}=loadGame({meta:{version:8},pop:{curr:70},b:{inn:2},w:{inn:0},res:{beer:100,bread:400}});
  let r=api.simulateEconomy();near(r.beerServed,0);near(state.res.beer,100);
  state.w.inn=1;state.staffing.targets.inn=1;r=api.simulateEconomy();near(r.beerServed,6);near(r.beerDemand,14);
  state.w.inn=2;state.staffing.targets.inn=2;r=api.simulateEconomy();near(r.beerServed,12);near(state.res.beer,82);
});
test('all wood and iron weapon recipes match the researched material requirements',()=>{
  const {api,state}=loadGame({meta:{version:8},b:{fletch:1,crosswork:1,pole:1,pikesmith:1,smith:1,macesmith:1,armor:1},w:{fletch:1,crosswork:1,pole:1,pikesmith:1,smith:1,macesmith:1,armor:1},res:{wood:8,iron:3}});
  const r=api.produceResources();near(r.inputs.wood,8);near(r.inputs.iron,3);
  for(const k of ['bow','crossbow','spear','pike','sword','mace','armor'])near(state.res[k],1);
});
test('new borders continue past one hundred frontiers at the same castle level with stable unique names',()=>{
  const {api,state}=loadGame({meta:{version:8},lvl:1}),W=api.World;
  for(let n=0;n<120;n++){
    const band=state.world.nextBand-1;
    for(const r of state.world.regions.filter(r=>r.band===band).slice(0,2)){r.status='owned';if(r.enemy)r.enemy.defeated=true;}
    W.ensureFrontier();
  }
  near(state.world.nextBand,121);near(state.world.regions.length,364);near(state.lvl,1);
  const names=state.world.regions.map(r=>r.name.de);assert.equal(new Set(names).size,names.length);
  assert.ok(state.world.regions.at(-1).enemy.level>400);
  const namesAndStrength=()=>state.world.regions.map(r=>({id:r.id,name:r.name,lord:r.enemy?.name,strength:r.enemy?.strength,level:r.enemy?.level}));
  const snapshot=JSON.stringify(namesAndStrength());
  api.migrateState();assert.equal(JSON.stringify(namesAndStrength()),snapshot);
});
test('frontier and troop pagination remain bounded while showing different pages',()=>{
  const {api,state,nodes}=loadGame({meta:{version:8}}),W=api.World;
  for(let n=0;n<8;n++){const band=state.world.nextBand-1;for(const r of state.world.regions.filter(r=>r.band===band).slice(0,2)){r.status='owned';if(r.enemy)r.enemy.defeated=true;}W.ensureFrontier();}
  W.setTerritoryView('owned');const first=nodes.get('exp-body').innerHTML;assert.ok((first.match(/<article/g)||[]).length<=9);
  W.changeTerritoryPage(1);assert.notEqual(nodes.get('exp-body').innerHTML,first);
  W.renderWar();const enemies=nodes.get('war-list').innerHTML;assert.ok((enemies.match(/<article/g)||[]).length<=8);W.changeWarPage(1);assert.notEqual(nodes.get('war-list').innerHTML,enemies);
});
test('engineers need their guild, money and an idle resident but no barracks',()=>{
  const {api,state}=loadGame({meta:{version:8}});api.Game.recruit('engineer');near(state.units.engineer,0);
  state.b.engineerGuild=1;const idle=api.countWorkers().idle,gold=state.res.gold;api.Game.recruit('engineer');near(state.units.engineer,1);near(state.res.gold,gold-30);near(api.countWorkers().idle,idle-1);
  state.res.gold=0;api.Game.recruit('engineer');near(state.units.engineer,1);
});
test('siege construction reserves crew, charges once and finishes once across save migration',()=>{
  const {api,state}=loadGame({meta:{version:8},b:{engineerGuild:1},units:{engineer:4},res:{gold:1000,wood:500}}),G=api.Siege;
  assert.equal(G.build('catapult'),true);near(api.World.homeUnits().engineer,2);near(api.countWorkers().sold,4);near(state.res.gold,850);near(state.res.wood,440);
  assert.equal(G.build('shield'),false);near(state.res.gold,850);assert.equal(api.World.removeBuilding('home','engineerGuild'),false);
  api.migrateState();near(G.busy(),2);const finish=state.siege.project.finishDay;state.day=finish-1;G.advance();near(state.siege.units.catapult,0);
  state.day=finish;G.advance();near(state.siege.units.catapult,1);near(api.World.homeUnits().engineer,4);G.advance();near(state.siege.units.catapult,1);
});
test('insufficient crew, resources and pause all block siege construction without payment',()=>{
  const {api,state}=loadGame({meta:{version:8},b:{engineerGuild:1},units:{engineer:1},res:{gold:1000,wood:500}}),G=api.Siege;
  assert.equal(G.build('catapult'),false);near(state.res.gold,1000);state.res.wood=0;assert.equal(G.build('shield'),false);
  state.res.wood=500;state.paused=true;assert.equal(G.build('shield'),false);near(state.res.gold,1000);assert.equal(G.build('unknown'),false);
});
test('offline progress does not complete siege equipment or release its reserved crew',()=>{
  const {api,state}=loadGame({meta:{version:8},b:{engineerGuild:1},units:{engineer:2},res:{wood:1000}});api.Siege.build('catapult');
  const project=JSON.stringify(state.siege.project),day=state.day;api.applyOfflineProgress(Date.now()-1800000);near(state.day,day);assert.equal(JSON.stringify(state.siege.project),project);near(state.siege.units.catapult,0);near(api.Siege.busy(),2);
});
test('siege drafts automatically include crew and ammunition and keep home defense honest',()=>{
  const {api,state}=loadGame({meta:{version:8},units:{spearman:10,engineer:6},res:{bread:1000,stone:100}}),W=api.World;
  const r=state.world.regions[2];r.scouted=true;state.siege.units.catapult=2;
  const base=W.preview(r.id,{spearman:6}),p=W.preview(r.id,{spearman:6},state,{catapult:1});
  assert.ok(p.ok);near(p.siege.crew,2);near(p.count,8);assert.ok(p.food>base.food);assert.ok(p.attack>base.attack);near(p.homeCount,8);
  assert.equal(W.launch(r.id,{spearman:6},state,{catapult:1}),true);near(state.res.stone,90);near(state.world.mission.units.engineer,2);near(W.homeUnits().engineer,4);near(api.Siege.available('catapult'),1);
  const food=state.res.bread;assert.equal(W.launch(r.id,{spearman:1},state,{catapult:1}),false);near(state.res.stone,90);near(state.res.bread,food);
});
test('invalid siege quantities, missing ammunition and builder double-booking are rejected atomically',()=>{
  const {api,state}=loadGame({meta:{version:8},b:{engineerGuild:1},units:{spearman:10,engineer:2},res:{wood:500,bread:1000,stone:100}}),W=api.World;
  const r=state.world.regions[2];r.scouted=true;state.siege.units.catapult=1;
  for(const equipment of [{catapult:2},{catapult:-1},{catapult:.5},{catapult:Infinity},{fake:1}])assert.equal(W.launch(r.id,{spearman:5},state,equipment),false);
  near(state.res.stone,100);near(state.res.bread,1000);
  api.Siege.build('catapult');assert.equal(W.preview(r.id,{spearman:5},state,{catapult:1}).ok,false);
  state.siege.project=null;state.res.stone=0;assert.equal(W.launch(r.id,{spearman:5},state,{catapult:1}),false);near(state.res.bread,1000);
});
test('engineers do not count as melee protection and equipment cannot attack without soldiers',()=>{
  const {api,state}=loadGame({meta:{version:8},units:{engineer:8},res:{bread:1000,stone:100}}),W=api.World,r=state.world.regions[2];r.scouted=true;state.siege.units.catapult=2;
  near(W.power({archer:8,engineer:8}),W.power({archer:8}));assert.equal(W.preview(r.id,{},state,{catapult:2}).ok,false);assert.equal(W.preview(r.id,{engineer:8}).ok,false);
});
test('winning siege forecasts bound actual losses and returning machines cannot duplicate',()=>{
  const {api,state}=loadGame({meta:{version:8},pop:{curr:80},units:{spearman:40,engineer:8},res:{bread:10000,stone:100}}),W=api.World,r=state.world.regions[2];r.scouted=true;r.enemy.strength=60;
  state.siege.units.catapult=2;state.siege.units.shield=2;const equipment={catapult:2,shield:2},p=W.preview(r.id,{spearman:30},state,equipment);
  assert.equal(W.launch(r.id,{spearman:30},state,equipment),true);state.day=state.world.mission.battleDay;W.battle();
  const m=state.world.mission,loss=Object.values(m.result.losses).reduce((a,b)=>a+b,0);assert.ok(m.result.win);assert.ok(loss>=p.losses.min&&loss<=p.losses.max);
  assert.ok(api.Siege.crew(m.siege)<=(m.units.engineer||0));const stocks=JSON.stringify(state.siege.units),total=JSON.stringify(state.units);
  api.migrateState();W.battle();assert.equal(JSON.stringify(state.siege.units),stocks);assert.equal(JSON.stringify(state.units),total);
  state.day=m.returnDay;W.returnArmy();assert.equal(state.world.mission,null);near(api.Siege.available('catapult'),state.siege.units.catapult);W.returnArmy();assert.equal(JSON.stringify(state.siege.units),stocks);
});
test('lost siege battles destroy equipment and never retain machines without surviving crew',()=>{
  const {api,state}=loadGame({meta:{version:8},units:{spearman:1,engineer:4},res:{bread:1000,stone:100}}),W=api.World,r=state.world.regions[2];r.scouted=true;r.enemy.strength=10000;
  state.siege.units.catapult=2;assert.equal(W.launch(r.id,{spearman:1},state,{catapult:2}),true);state.day=state.world.mission.battleDay;W.battle();
  const m=state.world.mission;assert.equal(m.result.win,false);assert.ok(state.siege.units.catapult<2);assert.ok(api.Siege.crew(m.siege)<=(m.units.engineer||0));
  near(state.siege.units.catapult,m.siege.catapult);assert.ok(state.units.engineer>=0);
});
test('construction crew still eats, pays upkeep and is distinguished in the bilingual roster',()=>{
  const {api,state,nodes}=loadGame({meta:{version:8},pop:{curr:20},b:{engineerGuild:1},units:{engineer:4},res:{wood:500,bread:1000}});api.Siege.build('catapult');
  const r=api.simulateEconomy();near(r.foodDemand,21);near(r.upkeep,.6);
  for(const lang of ['de','en']){api.I18N.lang=lang;api.UI.renderRecruit();api.World.renderWar();
    for(const id of ['recruit-roster','war-roster','siege-workshop']){const h=nodes.get(id).innerHTML;assert.ok(!/undefined|NaN|\[object Object\]/.test(h));assert.ok(h.includes(lang==='de'?'Baumeister':'Engineer'));}
    assert.ok(nodes.get('recruit-roster').innerHTML.includes(lang==='de'?'Im Bau gebunden':'Building equipment'));
  }
});

test('automatic trade reaches arbitrary targets in one pass, without five-unit rounding',()=>{
  const {api,state}=loadGame({res:{wood:100,stone:0}});
  state.market.auto.wood={enabled:true,min:10,max:20};
  state.market.auto.stone={enabled:true,min:37,max:80};
  api.rebalanceMarket();near(state.res.wood,20);near(state.res.stone,37);
});
test('changing a limit rebalances immediately and allows equal minimum and maximum',()=>{
  const {api,state}=loadGame({res:{wood:100}});
  state.market.auto.wood={enabled:true,min:10,max:80};
  api.Game.setMarketTarget('wood','max',20);near(state.res.wood,20);
  api.Game.setMarketTarget('wood','min',20);near(state.market.auto.wood.max,20);
});
test('all sales precede purchases and finance shortages',()=>{
  const {api,state}=loadGame({res:{gold:100,wood:0,iron:100}});
  state.market.auto.wood={enabled:true,min:25,max:25};
  state.market.auto.iron={enabled:true,min:0,max:0};
  api.rebalanceMarket();near(state.res.wood,25);near(state.res.iron,0);assert.ok(state.res.gold>=100);
});
test('gold reserve and shared capacity constrain purchases without overdrafts',()=>{
  const {api,state}=loadGame({res:{gold:110,wood:48},b:{stock:1}});
  state.market.auto.wood={enabled:true,min:70,max:70};
  api.rebalanceMarket();near(state.res.wood,50);assert.ok(state.res.gold>=100);
  state.res.wood=0;state.res.gold=101;api.rebalanceMarket();assert.ok(state.res.gold>=100-.000001);assert.ok(state.res.wood<1);
});
test('prices stay fixed after high-volume trades and ignore legacy pressure',()=>{
  const {api,state}=loadGame({res:{gold:100000,wood:500}});
  const price=api.marketPrice('wood',true);state.market.pressure={wood:.65};
  for(let n=0;n<50;n++){api.executeTrade('wood',false,5);api.executeTrade('wood',true,5);}
  near(api.marketPrice('wood',true),price);
});
test('production surplus is sold before storage clipping in the same tick',()=>{
  const {api,state}=loadGame({pop:{curr:100},b:{stock:1,wood:100},w:{wood:100},res:{bread:200}});
  state.market.auto.wood={enabled:true,min:0,max:10};
  const report=api.simulateEconomy();near(state.res.wood,10);near(report.lost.wood||0,0);assert.ok(report.trade.wood<-200);
});
test('fractional overflow never produces negative stocks',()=>{
  const {api,state}=loadGame({res:{wood:.2,stone:100},b:{stock:1}});
  const losses=api.enforceStorageLimits();
  near(state.res.wood+state.res.stone,50);near((losses.wood||0)+(losses.stone||0),50.2);
  Object.values(state.res).forEach(v=>assert.ok(v>=0&&Number.isFinite(v)));
});
test('empty food stores do not stop a staffed bread chain; net zero is fully explained',()=>{
  const {api,state}=loadGame({pop:{curr:4},b:{wood:1,wheat:1,mill:1,bake:1},w:{wood:1,wheat:1,mill:1,bake:1}});
  for(let n=0;n<3;n++){
    api.Game.tick();const r=state.economy.lastTick;
    near(r.foodMade,4);near(r.foodEaten,4);near(r.foodMissing,0);near(state.res.bread,0);near(state.survival.hungerTicks,0);
  }
});
test('idle population absorbs losses without dismissing food workers',()=>{
  const {api,state}=loadGame({pop:{curr:6},b:{apple:1},w:{apple:1}});
  state.pop.curr--;api.Game.unassignWorker();near(state.w.apple,1);
});
test('real staff shortages preserve food jobs and restore intended jobs after recovery',()=>{
  const {api,state}=loadGame({pop:{curr:2},b:{apple:1,smith:1},w:{apple:1,smith:1}});
  state.pop.curr=1;api.reconcileWorkforce();near(state.w.apple,1);near(state.w.smith,0);near(state.staffing.targets.smith,1);
  state.pop.curr=2;api.reconcileWorkforce();near(state.w.smith,1);
});
test('deliberately paused production is not silently restarted',()=>{
  const {api,state}=loadGame({b:{apple:1},w:{apple:0}});
  api.reconcileWorkforce();near(state.w.apple,0);
});
test('one short food tick does not kill a villager',()=>{
  const {api,state}=loadGame({pop:{curr:6}});api.Game.tick();near(state.pop.curr,6);near(state.survival.hungerTicks,1);
});
test('throughput bonuses consume proportionally more inputs, without free material amplification',()=>{
  const {api,state}=loadGame({renown:300,upgrades:{guild:5},boostUntilDay:10,b:{mill:2,bake:2},w:{mill:2,bake:2},res:{wheat:100,wood:100}});
  const r=api.produceResources();near(r.produced.flour,r.inputs.wheat);near(r.produced.bread,r.inputs.flour*4);near(r.inputs.wood||0,0);near(state.res.wood,100);
});
test('limited inputs throttle production without negative stocks',()=>{
  const {api,state}=loadGame({b:{bake:10},w:{bake:10},res:{flour:.25,wood:10}});
  const r=api.produceResources();near(r.produced.bread,1);near(state.res.flour,0);near(state.res.wood,10);assert.equal(r.buildings.bake.status,'partial');
});
test('bread and ale use independent inputs without an artificial fuel dependency',()=>{
  const {api,state}=loadGame({b:{bake:1,brew:1},w:{bake:1,brew:1},res:{flour:1,wood:1,wheat:1,hops:1}});
  const r=api.produceResources();near(r.produced.bread,4);near(r.produced.beer,4);near(state.res.hops,0);near(state.res.wood,1);near(state.res.wheat,1);
});
test('brewing turns hops into ale without grain or wood',()=>{
  const {api}=loadGame({b:{brew:1},w:{brew:1},res:{hops:20}});const r=api.produceResources();near(r.produced.beer,4);assert.equal(r.buildings.brew.status,'running');
});
test('beer demand is 0.2 per resident, separate from food and its capacity',()=>{
  const {api,state}=loadGame({pop:{curr:20},res:{beer:50,bread:20},b:{gran:1,inn:1},w:{inn:1}});
  const r=api.simulateEconomy();near(r.beerServed,4);near(state.res.beer,46);near(r.foodMissing,0);assert.ok(!api.Rules.foodTypes.includes('beer'));
});
test('beer never substitutes for edible food',()=>{
  const {api}=loadGame({pop:{curr:10},res:{beer:50}});near(api.simulateEconomy().foodMissing,10);
});
test('tanning consumes a real dairy cow and temporarily interrupts cheese production',()=>{
  const {api,state}=loadGame({meta:{version:7},b:{dairy:1,tannery:1},w:{dairy:1,tannery:1}});
  near(api.Kingdom.cows(),3);near(api.produceResources().produced.cheese,2);
  api.produceResources();const leather=api.produceResources();near(leather.produced.leatherArmor,3);near(leather.inputs.cow,1);near(api.Kingdom.cows(),2);
  const empty=api.produceResources();near(empty.produced.cheese||0,0);assert.equal(empty.buildings.dairy.status,'raising_cows');
  state.w.tannery=0;state.staffing.targets.tannery=0;
  for(let n=0;n<4;n++)api.produceResources();
  near(api.Kingdom.cows(),3);near(api.produceResources().produced.cheese,2);
});

test('castle guards consume a spear and leather armor when recruited',()=>{
  const {api,state}=loadGame({b:{barrack:1},res:{spear:1,leatherArmor:1}});
  api.Game.recruit('guard');near(state.units.guard,1);near(state.res.spear,0);near(state.res.leatherArmor,0);
});
test('300 existing renown immediately grants the documented bonuses',()=>{
  const {api}=loadGame({renown:300});const rank=api.renownStatus().current;
  near(rank.contracts,.2);near(rank.production,.1);near(rank.tax,.1);near(rank.defense,.1);near(api.contractReward({rewardGold:100}),120);
});
test('migration preserves progress and fixes legacy negative quantities',()=>{
  const {api,state}=loadGame({lvl:20,renown:300,res:{gold:1234,wood:-.8},b:{dairy:3},w:{dairy:2},units:{archer:2}});
  near(state.lvl,20);near(state.renown,300);near(state.res.gold,1234);near(state.b.dairy,3);near(state.w.dairy,2);near(state.units.archer,2);near(state.res.wood,0);near(state.res.leather,0);near(state.meta.version,8);
  api.migrateState();near(state.res.gold,1234);near(state.staffing.targets.dairy,2);
});
test('every resource has German and English names and every static translation key exists',()=>{
  const {api}=loadGame();
  for(const k of api.Rules.marketTypes){assert.equal(typeof api.T[k].de,'string',k);assert.equal(typeof api.T[k].en,'string',k);}
  for(const [,key] of html.matchAll(/data-i18n(?:-title|-aria)?="([^"]+)"/g)) assert.ok(api.I18N.strings[key],key);
});
test('reported gross flows exactly explain inventory changes',()=>{
  const {api,state}=loadGame({pop:{curr:15},renown:300,tax:2,b:{wood:2,wheat:2,mill:2,bake:3,brew:1,hops:1,cattle:1,tannery:1,leatherwork:1},w:{wood:2,wheat:2,mill:2,bake:3,brew:1,hops:1,cattle:1,tannery:1,leatherwork:1},res:{bread:20,wood:20,wheat:10}});
  state.market.auto.wood={enabled:true,min:10,max:20};
  for(let n=0;n<100;n++){
    const r=api.simulateEconomy();
    for(const k of ['gold',...api.Rules.marketTypes]){
      near(r.net[k],(r.produced[k]||0)-(r.inputs[k]||0)-(r.consumed[k]||0)+(r.trade[k]||0)-(r.lost[k]||0)+(k==='gold'?r.taxes:0));
      assert.ok(state.res[k]>=0&&Number.isFinite(state.res[k]),k);
    }
  }
});

test('offline processing runs the same bread and leather recipes without starvation',()=>{
  const {api,state}=loadGame({pop:{curr:7},b:{wood:1,wheat:1,mill:1,bake:1,cattle:1,tannery:1,leatherwork:1},w:{wood:1,wheat:1,mill:1,bake:1,cattle:1,tannery:1,leatherwork:1}});
  const text=api.applyOfflineProgress(Date.now()-120000);
  assert.ok(state.res.bread>0);assert.ok(state.res.leatherArmor>0);near(state.pop.curr,7);assert.equal(typeof text.de,'string');assert.equal(typeof text.en,'string');
});
test('all dynamic views render in both languages without object coercion or missing values',()=>{
  const {api,state,nodes,updateUI}=loadGame({renown:300,pop:{curr:8},b:{wood:1,wheat:1,mill:1,bake:1,cattle:1,tannery:1,leatherwork:1},w:{wood:1,wheat:1,mill:1,bake:1,cattle:1,tannery:1,leatherwork:1}});
  api.Game.tick();
  for(const lang of ['de','en']){
    api.I18N.lang=lang;api.UI.init();updateUI();
    api.UI.renderMarket();api.UI.renderContracts();api.UI.renderUpgrades();api.UI.renderRecruit();api.UI.renderWar();api.UI.renderProduction();
    const body=nodes.get('production-body').innerHTML;
    assert.ok(body.includes(lang==='de'?'Rohhäute':'Hides'));
    assert.ok(body.includes(lang==='de'?'Brotkette':'Bread chain'));
    assert.ok(!/\[object Object\]|undefined|NaN/.test(body));
    assert.ok(!/\[object Object\]|undefined|NaN/.test(nodes.get('rank-summary').innerHTML));
  }
});
test('language changes preserve production state and remember the preference',()=>{
  const {api,state,storage}=loadGame({res:{gold:250,wood:12},renown:300});
  api.I18N.set('en');near(state.res.gold,250);near(state.res.wood,12);near(state.renown,300);assert.equal(storage.get('stronhold_language'),'en');
  api.I18N.set('de');assert.equal(storage.get('stronhold_language'),'de');
});

test('static and dynamically rendered click/change handlers are valid JavaScript',()=>{
  const {api,nodes}=loadGame({b:{apple:1,wood:1},w:{apple:1,wood:1}});
  const fragments=[html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g,'')];
  api.UI.renderMarket();api.UI.renderRecruit();api.UI.renderWar();api.UI.renderContracts();api.UI.renderUpgrades();api.UI.renderProduction();
  for(const node of nodes.values()){fragments.push(node.innerHTML);for(const child of node.children)fragments.push(child.innerHTML);}
  let count=0;
  for(const fragment of fragments)for(const [,code] of fragment.matchAll(/\bon(?:click|change)="([^"]*)"/g)){new vm.Script('(function(event){'+code+'})');count++;}
  assert.ok(count>100);
});
test('market rendering preserves the focused number field while refreshing its stocks',()=>{
  const {api,nodes,sandbox}=loadGame();api.UI.renderMarket();
  const firstCard=nodes.get('market-list').children[0];
  sandbox.document.activeElement={tagName:'INPUT',type:'number'};nodes.get('market-mask').contains=()=>true;
  api.UI.renderMarket();assert.equal(nodes.get('market-list').children[0],firstCard);
});
test('production explains the direct cow-to-armor chain in both languages',()=>{
  const {api,nodes}=loadGame();
  api.I18N.lang='de';api.UI.renderProduction();assert.ok(nodes.get('production-body').innerHTML.includes('1 Kuh → 3 Lederrüstung'));
  api.I18N.lang='en';api.UI.renderProduction();assert.ok(nodes.get('production-body').innerHTML.includes('1 Cow → 3 Leather suits'));
});
test('new-game startup initializes all new systems without resetting language',()=>{
  const {api,storage,updateUI}=loadGame();api.I18N.set('en');api.Game.newGame();updateUI();
  near(api.state().meta.version,8);near(api.state().res.leather,0);near(api.state().units.guard,0);assert.equal(storage.get('stronhold_language'),'en');
});
test('randomized fractional inventories remain finite and correctly accounted for',()=>{
  let seed=4711;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let trial=0;trial<60;trial++){
    const {api,state}=loadGame({day:1+trial,pop:{curr:40},tax:trial%5,renown:trial*11,upgrades:{guild:trial%4},b:{stock:1,gran:1}});
    for(const k of api.Rules.marketTypes){state.res[k]=random()*200;state.market.auto[k]={enabled:random()>.5,min:random()*20,max:20+random()*20};}
    for(const k of ['wood','wheat','hops','apple','hunter','dairy','cattle','mill','bake','brew','tannery','leatherwork']){state.b[k]=2;state.w[k]=2;state.staffing.targets[k]=2;}
    const r=api.simulateEconomy();
    for(const k of ['gold',...api.Rules.marketTypes]){
      assert.ok(Number.isFinite(state.res[k])&&state.res[k]>=0,k);
      near(r.net[k],(r.produced[k]||0)-(r.inputs[k]||0)-(r.consumed[k]||0)+(r.trade[k]||0)-(r.lost[k]||0)+(k==='gold'?r.taxes:0));
    }
    const caps=api.calcCaps();
    for(const [keys,cap] of [[api.Rules.storeTypes,caps.store],[api.Rules.foodTypes,caps.food],[api.Rules.drinkTypes,caps.drink]])assert.ok(keys.reduce((sum,k)=>sum+state.res[k],0)<=cap+.0001);
  }
});

const snapshot=value=>JSON.parse(JSON.stringify(value));
function assertWorldConsistency(api,state){
  const W=api.World;
  for(const [key,n] of Object.entries(state.res))assert.ok(Number.isFinite(n)&&n>=0,'inventory '+key);
  for(const key in api.Units){assert.ok(Number.isInteger(state.units[key])&&state.units[key]>=0,'unit '+key);assert.ok((W.awayUnits(state)[key]||0)<=state.units[key],'away '+key);}
  assert.ok(state.pop.curr>=W.unitCount(state.units)+(state.world.project?.workers||0),'reserved residents');
  assert.ok(api.countWorkers(state).idle>=0,'worker allocation');
  for(const key in api.Config.b)near(state.b[key],W.owned(state).reduce((n,r)=>n+(r.buildings[key]||0),0));
  for(const r of state.world.regions){for(const kind of W.plotKinds)assert.ok(W.used(r,kind)<=r.slots[kind],r.id+' '+kind);for(const n of Object.values(r.deposits))assert.ok(n>=0&&Number.isFinite(n),'deposit');}
}

test('v7 migration preserves legacy land, all buildings and old spear-equipped soldiers',()=>{
  const {api,state}=loadGame({meta:{version:6},exp:{land:4},lvl:18,day:90,res:{gold:1234,bow:15},units:{pikeman:7,archer:2},b:{apple:40,quarry:12,iron:8},w:{apple:5,quarry:2}});
  const before=snapshot({res:state.res,b:state.b,w:state.w,world:state.world});
  near(state.units.pikeman,0);near(state.units.spearman,7);near(state.units.archer,2);near(state.exp.land,4);near(state.world.protectedUntil,106);
  assert.ok(api.World.region('home').slots.fertile>=42);api.migrateState();
  assert.deepEqual(snapshot({res:state.res,b:state.b,w:state.w,world:state.world}),before);near(state.units.spearman,7);
});
test('real load path creates an original local backup once, and retains language',()=>{
  const {api,storage,state}=loadGame({meta:{version:6},units:{pikeman:3}});
  const old=snapshot(state);delete old.world;old.meta.version=6;old.units.pikeman=3;old.units.spearman=0;
  storage.set(api.Storage.key,JSON.stringify(old));storage.set('stronhold_language','en');api.I18N.lang='en';
  api.Game.init();const backup=storage.get(api.Storage.key+'_before_major_v8');assert.ok(backup);near(JSON.parse(backup).units.pikeman,3);near(api.state().units.spearman,3);
  api.Game.init();assert.equal(storage.get(api.Storage.key+'_before_major_v8'),backup);assert.equal(api.I18N.lang,'en');
});
test('new games have finite, distinct base plot budgets and map each building',()=>{
  const {api}=loadGame();api.Game.newGame();const home=api.World.region('home');
  assert.deepEqual(snapshot(home.slots),{settlement:36,forest:10,fertile:16,stone:4,iron:3});
  for(const key in api.Config.b)assert.ok(api.World.plotKinds.includes(api.World.plotKind(key)),key);
  assert.equal(api.World.plotKind('cattle'),'fertile');assert.equal(api.World.plotKind('hunter'),'forest');assert.equal(api.World.plotKind('quarry'),'stone');
  assert.equal(api.World.available(home,'settlement'),33);
});
test('a full fertile region blocks construction without charging money or materials',()=>{
  const {api,state}=loadGame({res:{gold:10000,wood:1000}});const home=api.World.region('home');home.slots.fertile=0;
  const before=snapshot(state.res);api.Game.build('apple');assert.deepEqual(snapshot(state.res),before);near(state.b.apple,0);
});
test('new construction occupies exactly one regional slot and charges the workshop resources',()=>{
  const {api,state}=loadGame({res:{gold:10000,wood:500,iron:100}});const home=api.World.region('home');home.slots.settlement+=3;
  const free=api.World.available(home,'settlement');api.Game.build('crosswork');
  near(state.b.crosswork,1);near(home.buildings.crosswork,1);near(api.World.available(home,'settlement'),free-1);near(state.res.iron,100);near(state.res.gold,9900);near(state.res.wood,450);
});
test('building selection never uses hostile land and auto-selection finds owned space',()=>{
  const {api,state}=loadGame();const W=api.World,home=W.region('home'),r=state.world.regions[1];home.slots.fertile=0;W.setRegion('auto');
  assert.equal(W.buildTarget('apple'),null);W.setRegion(r.id);assert.equal(state.world.selectedRegion,'auto');
  r.status='owned';assert.equal(W.buildTarget('apple').id,r.id);W.setRegion('home');assert.equal(W.buildTarget('apple'),null);
});
test('demolition refunds half construction costs, releases the plot and preserves critical buildings',()=>{
  const {api,state}=loadGame({b:{house:2,wood:1},w:{wood:1},res:{gold:0,wood:0,stone:0}});const W=api.World,home=W.region('home'),free=W.available(home,'settlement');
  assert.ok(W.removeBuilding('home','house'));near(state.b.house,1);near(state.res.gold,25);near(state.res.wood,15);near(state.res.stone,5);near(W.available(home,'settlement'),free+1);
  assert.equal(W.removeBuilding('home','market'),false);assert.equal(W.removeBuilding('missing','house'),false);
  W.removeBuilding('home','wood');near(state.w.wood,0);near(state.staffing.targets.wood,0);
});
test('mining exhausts finite deposits exactly and does not resume on reload',()=>{
  const {api,state}=loadGame({b:{quarry:1,iron:1},w:{quarry:1,iron:1}});const home=api.World.region('home');home.deposits={stone:3.25,iron:1.25};
  api.produceResources();api.produceResources();api.produceResources();near(state.res.stone,3.25);near(state.res.iron,1.25);near(home.deposits.stone,0);near(home.deposits.iron,0);
  api.migrateState();api.produceResources();near(state.res.stone,3.25);assert.equal(api.World.buildTarget('quarry'),null);
});
test('mining respects workers and separately drains the deposits actually worked',()=>{
  const {api,state}=loadGame({b:{quarry:1},w:{quarry:1}});const W=api.World,home=W.region('home'),r=state.world.regions[1];
  r.status='owned';r.buildings.quarry=1;r.deposits.stone=100;home.deposits.stone=100;state.b.quarry=2;state.w.quarry=2;state.staffing.targets.quarry=2;
  api.produceResources();near(home.deposits.stone,98);near(r.deposits.stone,98);near(state.res.stone,4);
  home.deposits.stone=0;api.produceResources();near(r.deposits.stone,96);near(state.res.stone,6);
});
test('unowned resource deposits are never mined',()=>{
  const {api,state}=loadGame({b:{iron:1},w:{iron:1}});const W=api.World,home=W.region('home'),r=state.world.regions[2];home.deposits.iron=0;r.buildings.iron=10;r.deposits.iron=1000;
  api.produceResources();near(state.res.iron,0);near(r.deposits.iron,1000);
});
test('clicks consume a daily budget; neither daily gold bonuses nor stone can be infinite',()=>{
  const {api,state}=loadGame({b:{quarry:1},w:{quarry:1}});const W=api.World,home=W.region('home');home.deposits.stone=1.5;
  near(W.gather('wood',100000),8);near(W.gather('wood',100000),0);near(W.gather('stone',1000),1.5);near(home.deposits.stone,0);near(W.gather('stone',100),0);
  assert.equal(W.clickReward(),true);assert.equal(W.clickReward(),false);state.day++;near(W.gather('wood',100),8);assert.equal(W.clickReward(),true);
  near(W.gather('iron',100),0);near(W.gather('apple',NaN),0);
});
test('stone clicking needs a staffed quarry and tools scale assistance, not land',()=>{
  const {api,state}=loadGame();const W=api.World,home=W.region('home');const plots=snapshot(home.slots);
  near(W.gather('stone',50),0);state.upgrades.tools=10;assert.ok(W.clickBudget('wood')>8);assert.deepEqual(snapshot(home.slots),plots);
});
test('scouting requires full payment and idle people, and reserves them until completion',()=>{
  const {api,state}=loadGame({res:{gold:19}});const W=api.World,r=state.world.regions[1];
  assert.equal(W.startProject('scout',r.id),false);near(state.res.gold,19);assert.equal(state.world.project,null);
  state.res.gold=20;const idle=api.countWorkers().idle;assert.equal(W.startProject('scout',r.id),true);near(api.countWorkers().idle,idle-1);near(state.res.gold,0);
  const due=state.world.project.finishDay;state.day=due-1;W.advance();assert.equal(r.scouted,false);state.day=due;W.advance();assert.equal(r.scouted,true);assert.equal(state.world.project,null);near(api.countWorkers().idle,idle);
});
test('a second project cannot overwrite an existing one or spend extra resources',()=>{
  const {api,state}=loadGame();const W=api.World;assert.ok(W.startProject('scout',state.world.regions[1].id));const saved=snapshot(state.world.project),gold=state.res.gold;
  assert.equal(W.startProject('scout',state.world.regions[2].id),false);assert.deepEqual(snapshot(state.world.project),saved);near(state.res.gold,gold);
});
test('settlement takes resources and time, unlocks real plots and grants one outpost',()=>{
  const {api,state}=loadGame({res:{gold:1000,wood:100,stone:100,bread:100}});const W=api.World,r=state.world.regions[1];r.scouted=true;
  assert.ok(W.startProject('settle',r.id));assert.equal(r.status,'neutral');assert.ok(!W.owned().includes(r));near(api.countWorkers().builders,2);
  state.day=state.world.project.finishDay;W.advance();assert.equal(r.status,'owned');near(r.buildings.outpost,1);near(state.b.outpost,1);near(state.exp.land,1);
  const gold=state.res.gold;W.advance();near(state.b.outpost,1);near(state.res.gold,gold);assert.equal(W.canDemolish(r.id,'outpost'),false);
});
test('an enemy territory cannot be settled or secured before conquest',()=>{
  const {api,state}=loadGame({res:{gold:10000,wood:1000,stone:1000,bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;
  assert.equal(W.startProject('settle',r.id),false);assert.equal(W.startProject('secure',r.id),false);assert.equal(state.world.project,null);
});
test('frontiers require developed land and set enemy strength once at discovery',()=>{
  const {api,state}=loadGame();const W=api.World,old=state.world.regions[2].enemy.strength;state.lvl=50;W.ensureFrontier();near(state.world.regions.length,4);
  state.world.regions[1].status='owned';state.world.regions[2].status='owned';state.world.regions[2].enemy.defeated=true;W.ensureFrontier();near(state.world.regions.length,7);near(state.world.regions[2].enemy.strength,old);
  const newer=state.world.regions[5].enemy;near(newer.level,50);assert.ok(newer.strength>old);
});
test('crossbows and pikes use the original wood requirements without iron',()=>{
  const {api,state}=loadGame({b:{crosswork:1,pikesmith:1},w:{crosswork:1,pikesmith:1},res:{wood:10,iron:4}});const r=api.produceResources();
  near(r.produced.crossbow,1);near(r.produced.pike,1);near(r.inputs.wood,5);near(r.inputs.iron||0,0);near(state.res.wood,5);near(state.res.iron,4);
});
test('pikemen require metal armor while crossbowmen require leather armor',()=>{
  const {api,state}=loadGame({meta:{version:7},b:{barrack:1},res:{pike:1,crossbow:1,armor:1,leatherArmor:0}});
  api.Game.recruit('pikeman');near(state.units.pikeman,1);near(state.res.pike,0);near(state.res.armor,0);near(state.res.leatherArmor,0);
  api.Game.recruit('crossbowman');near(state.units.crossbowman,0);state.res.leatherArmor=1;api.Game.recruit('crossbowman');near(state.units.crossbowman,1);near(state.res.crossbow,0);near(state.res.leatherArmor,0);
});
test('unit counters matter and unsupported ranged troops lose effectiveness',()=>{
  const {api}=loadGame();const W=api.World;
  assert.ok(W.power({pikeman:5},{tactic:'cavalry'})>W.power({pikeman:5},{tactic:'armored'}));
  assert.ok(W.power({crossbowman:5,spearman:2},{tactic:'armored'})>W.power({crossbowman:5,spearman:2},{tactic:'swarm'}));
  assert.ok(W.power({crossbowman:8},null)<8*api.Units.crossbowman.str);
});
test('campaign validation rejects negative, fractional, unknown and overcommitted units without effects',()=>{
  const {api,state}=loadGame({meta:{version:7},units:{spearman:5},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;const before=snapshot(state);
  for(const draft of [{spearman:-1},{spearman:.5},{spearman:6},{spearman:Infinity},{spearman:'bad'},{fake:1},{}])assert.equal(W.launch(r.id,draft),false);
  assert.deepEqual(snapshot(state),before);
});
test('campaigns cannot launch without scouting or full provisions',()=>{
  const {api,state}=loadGame({meta:{version:7},units:{spearman:5}});const W=api.World,r=state.world.regions[2];
  assert.equal(W.launch(r.id,{spearman:5}),false);r.scouted=true;assert.equal(W.launch(r.id,{spearman:5}),false);assert.equal(state.world.mission,null);
});
test('a launched army remains reserved, vanishes from home defense, and prepays food exactly once',()=>{
  const {api,state}=loadGame({meta:{version:7},units:{spearman:10},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;const p=W.preview(r.id,{spearman:6}),idle=api.countWorkers().idle,def=api.getDefStr();
  assert.ok(W.launch(r.id,{spearman:6}));near(state.units.spearman,10);near(W.homeUnits().spearman,4);near(W.unitCount(W.awayUnits()),6);near(api.countWorkers().idle,idle);assert.ok(api.getDefStr()<def);near(state.res.bread,1000-p.food);
  const food=state.res.bread;assert.equal(W.launch(r.id,{spearman:1}),false);near(state.res.bread,food);
});
test('soldiers pay upkeep rather than taxes, and deployed soldiers are not fed twice',()=>{
  const {api,state}=loadGame({meta:{version:7},pop:{curr:20},units:{spearman:10},tax:2,res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;W.launch(r.id,{spearman:6});
  const report=api.simulateEconomy();near(report.taxes,20);near(report.upkeep,1.5);near(report.away,6);near(report.foodDemand,15);near(report.beerDemand,2.8);
});
test('campaign preview exposes a raid arriving before the army returns',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:10,units:{spearman:10},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;state.world.protectedUntil=0;r.enemy.nextRaid=state.day+2;
  const p=W.preview(r.id,{spearman:5});assert.ok(p.threat.day<p.returnDay);assert.ok(p.homeDefense<api.getDefStr());
});
test('victory always has casualties, is settled once, and does not instantly grant build access',()=>{
  const {api,state}=loadGame({meta:{version:7},pop:{curr:100},units:{swordsman:30},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;
  W.launch(r.id,{swordsman:20});state.day=state.world.mission.battleDay;const before=state.pop.curr;W.advance();
  assert.equal(r.enemy.defeated,true);assert.equal(r.status,'conquered');assert.ok(state.world.mission.result.win);assert.ok(state.units.swordsman<30);assert.ok(state.pop.curr<before);assert.equal(W.owned().includes(r),false);
  const snap=snapshot({res:state.res,units:state.units,pop:state.pop,renown:state.renown});W.advance();assert.deepEqual(snapshot({res:state.res,units:state.units,pop:state.pop,renown:state.renown}),snap);
});
test('failed campaigns cause losses without conquering the target',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:20,units:{spearman:4},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;
  W.launch(r.id,{spearman:4});state.day=state.world.mission.battleDay;W.advance();assert.equal(state.world.mission.result.win,false);assert.equal(r.status,'hostile');assert.ok(state.units.spearman<4);
});
test('survivors cannot defend until the real return day',()=>{
  const {api,state}=loadGame({meta:{version:7},pop:{curr:50},units:{swordsman:20},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;W.launch(r.id,{swordsman:15});
  state.day=state.world.mission.battleDay;W.advance();near(W.homeUnits().swordsman,5);const survivors=W.unitCount(W.awayUnits());assert.ok(survivors>0);
  state.day=state.world.mission.returnDay-1;W.advance();near(W.homeUnits().swordsman,5);state.day++;W.advance();assert.equal(state.world.mission,null);near(W.homeUnits().swordsman,5+survivors);
});
test('save migration retains campaign rolls and does not duplicate loot or casualties',()=>{
  const {api,state}=loadGame({meta:{version:7},pop:{curr:60},units:{swordsman:20},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;W.launch(r.id,{swordsman:15});const roll=state.world.mission.roll;
  const resumed=api.set(snapshot(state));near(resumed.world.mission.roll,roll);resumed.day=resumed.world.mission.battleDay;W.advance();const after=snapshot(resumed);api.set(snapshot(after));W.advance();assert.deepEqual(snapshot(api.state()),after);
});
test('defeated enemies stop attacking and conquered regions need an outpost project',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:10,res:{gold:1000,wood:100,stone:100,bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;r.enemy.defeated=true;r.status='conquered';r.enemy.nextRaid=1;
  assert.notEqual(W.upcomingRaid()?.region.id,r.id);assert.ok(W.startProject('secure',r.id));assert.equal(r.status,'conquered');state.day=state.world.project.finishDay;W.advance();assert.equal(r.status,'owned');near(r.buildings.outpost,1);
});
test('crossing level six does not trigger an overdue, unannounced attack',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:5,day:100});const W=api.World;
  for(const r of W.enemies())r.enemy.nextRaid=1;state.lvl=6;W.advance();assert.ok(W.upcomingRaid().day>=state.day+12);assert.equal(W.checkRaid(),false);
});
test('pending raids use a named enemy, persist their roll and resolve only once',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:10,units:{spearman:6},res:{bread:1000}});const W=api.World,r=state.world.regions[2];state.world.protectedUntil=0;r.enemy.nextRaid=state.day;
  assert.equal(W.checkRaid(),true);assert.equal(state.world.raidPending.regionId,r.id);const pending=snapshot(state.world.raidPending);api.migrateState();assert.deepEqual(snapshot(state.world.raidPending),pending);
  assert.equal(W.resolveRaid(),true);const snap=snapshot(state);assert.equal(W.resolveRaid(),false);assert.deepEqual(snapshot(state),snap);assert.ok(r.enemy.nextRaid>state.day);
});
test('home raids never kill soldiers currently deployed',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:10,pop:{curr:40},units:{swordsman:20},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;W.launch(r.id,{swordsman:15});const away=snapshot(W.awayUnits());
  state.world.raidPending={regionId:r.id,attack:100000,roll:.9};W.resolveRaid();assert.deepEqual(snapshot(W.awayUnits()),away);assert.ok(state.units.swordsman>=15);assertWorldConsistency(api,state);
});
test('offline production depletes deposits but advances no armies, projects, raids or events',()=>{
  const {api,state}=loadGame({meta:{version:7},b:{quarry:1},w:{quarry:1},units:{spearman:5},res:{bread:1000}});const W=api.World,r=state.world.regions[2];r.scouted=true;W.launch(r.id,{spearman:4});W.startProject('scout',state.world.regions[1].id);
  const before=snapshot({day:state.day,mission:state.world.mission,project:state.world.project,events:state.events,units:state.units,raids:W.enemies().map(r=>r.enemy.nextRaid)}),deposit=W.deposits('stone');
  api.applyOfflineProgress(Date.now()-3600000);assert.ok(W.deposits('stone')<deposit);assert.deepEqual(snapshot({day:state.day,mission:state.world.mission,project:state.world.project,events:state.events,units:state.units,raids:W.enemies().map(r=>r.enemy.nextRaid)}),before);
});
test('every castle level retains at least fifteen eligible stories after cooldowns',()=>{
  const {api,state}=loadGame();assert.equal(api.WorldEvents.filter(e=>!e.followOnly).length,100);assert.equal(new Set(api.WorldEvents.map(e=>e.id)).size,api.WorldEvents.length);
  for(let level=1;level<=150;level++){state.lvl=level;state.events.recent=api.EventEngine.eligible(state,false).slice(0,5).map(e=>e.id);assert.ok(api.EventEngine.eligible(state).length>=15,'level '+level);}
  for(const min of [1,5,10,20,35])assert.equal(api.WorldEvents.filter(e=>e.id.startsWith('r')&&e.min===min&&/^r[1-5]_/.test(e.id)).length,15);
});
test('all 105 events have German and English text and at least one free, affordable exit',()=>{
  const {api,state}=loadGame();for(const k in state.res)state.res[k]=0;state.pop.max=state.pop.curr;
  for(const e of api.WorldEvents){for(const field of ['title','text'])for(const lang of ['de','en'])assert.ok(typeof e[field][lang]==='string'&&e[field][lang].length>5,e.id+' '+field+' '+lang);
    assert.ok(e.choices.some(c=>api.EventEngine.canChoose(c,state)),e.id+' free exit');
    for(const c of e.choices)for(const lang of ['de','en']){assert.ok(c.label[lang]);assert.ok(!/undefined|NaN|\[object Object\]/.test(api.EventEngine.hint(c,state,lang)),e.id);}
  }
});
test('context-specific events require real farms, mines, cattle or soldiers',()=>{
  const {api,state}=loadGame();let ids=api.EventEngine.eligible(state,false).map(e=>e.id);assert.ok(!ids.includes('harvest'));state.b.apple=1;ids=api.EventEngine.eligible(state,false).map(e=>e.id);assert.ok(ids.includes('harvest'));
  state.lvl=10;assert.ok(!api.EventEngine.eligible(state,false).some(e=>e.id==='r3_ore_sample'));state.world.regions[0].buildings.iron=1;assert.ok(api.EventEngine.eligible(state,false).some(e=>e.id==='r3_ore_sample'));
});
test('event choices revalidate money, food, housing and choice index without partial payment',()=>{
  const {api,state}=loadGame({res:{gold:39}});state.events.pending={id:'caravan'};state.paused=true;const before=snapshot(state.res);
  assert.equal(api.Game.chooseEvent('caravan',0),false);assert.deepEqual(snapshot(state.res),before);assert.equal(api.Game.chooseEvent('caravan',99),false);assert.equal(api.Game.chooseEvent('wrong',0),false);
  state.events.pending={id:'refugees'};state.res.bread=20;state.pop.max=state.pop.curr;assert.equal(api.Game.chooseEvent('refugees',0),false);near(state.res.bread,20);assert.equal(api.Game.chooseEvent('refugees',1),true);
});
test('event gold matches the displayed diplomacy-adjusted reward',()=>{
  const {api,state}=loadGame({upgrades:{diplomacy:3},res:{gold:0}});const c=api.EventEngine.definition('small_inheritance').choices[0];state.events.pending={id:'small_inheritance'};
  const amount=api.EventEngine.gains(c.effect).gold;assert.ok(api.EventEngine.hint(c).includes(String(amount)));api.Game.chooseEvent('small_inheritance',0);near(state.res.gold,amount);
});
test('event follow-ups need a preceding choice and remain queued across saves',()=>{
  const {api,state}=loadGame();assert.ok(!api.EventEngine.eligible(state,false).some(e=>e.followOnly));state.events.pending={id:'lost_wagon'};api.Game.chooseEvent('lost_wagon',0);
  near(state.events.queue.length,1);assert.equal(state.events.queue[0].id,'wagon_owner');const resumed=api.set(snapshot(state));resumed.day=resumed.events.queue[0].dueDay+20;resumed.events.nextDay=resumed.day;resumed.paused=false;
  assert.equal(api.Game.checkRandomEvent(),true);assert.equal(resumed.events.pending.id,'wagon_owner');near(resumed.events.queue.length,0);
});
test('temporary event effects expire and never create permanent throughput upgrades',()=>{
  const {api,state}=loadGame();state.events.pending={id:'travelling_tinker'};api.Game.chooseEvent('travelling_tinker',0);near(api.World.effect('production'),1.15);
  const expiry=state.world.effects[0].expiresAt;state.day=expiry-1;near(api.World.effect('production'),1.15);state.day=expiry;api.World.advance();near(api.World.effect('production'),1);near(state.world.effects.length,0);near(state.upgrades.guild,0);
});
test('a negotiated truce postpones one living neighbour but does not erase other threats',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:20,res:{gold:10000}});const W=api.World;state.world.protectedUntil=0;const enemies=W.enemies();enemies[0].enemy.nextRaid=state.day+2;enemies[1].enemy.nextRaid=state.day+4;
  state.events.pending={id:'r4_border_diplomacy'};api.Game.chooseEvent('r4_border_diplomacy',0);near(enemies[0].enemy.truceUntil,state.day+18);near(W.upcomingRaid().day,state.day+4);
});
test('paid geological events increase actual deposits but grant no new plots',()=>{
  const {api,state}=loadGame({meta:{version:7},lvl:10,b:{iron:1},res:{gold:1000,wood:100}});const W=api.World,home=W.region('home'),before=home.deposits.iron,slots=snapshot(home.slots);state.events.pending={id:'r3_ore_sample'};
  assert.equal(api.Game.chooseEvent('r3_ore_sample',0),true);near(home.deposits.iron,before+180);assert.deepEqual(snapshot(home.slots),slots);
});
test('territory, army, event and production interfaces remain bilingual and all handlers parse',()=>{
  const {api,state,nodes}=loadGame({meta:{version:7},lvl:12,units:{spearman:3,crossbowman:2},res:{bread:1000}});const W=api.World;state.world.regions[2].scouted=true;
  for(const lang of ['de','en']){
    api.I18N.lang=lang;api.UI.openExp();api.UI.openWar();api.UI.renderRecruit();api.UI.renderProduction();
    for(const e of api.WorldEvents){state.events.pending={id:e.id};api.UI.openEvent(state.events.pending);}
    for(const id of ['exp-body','war-list','war-orders','war-preview','production-body'])assert.ok(!/undefined|NaN|\[object Object\]/.test(nodes.get(id).innerHTML),id+' '+lang);
    assert.ok(nodes.get('exp-body').innerHTML.includes(lang==='de'?'Bauplätze':'plots'));
    for(const node of nodes.values())for(const fragment of [node.innerHTML,...node.children.map(c=>c.innerHTML)])for(const [,code] of fragment.matchAll(/\bon(?:click|change|input)="([^"]*)"/g))new vm.Script('(function(event){'+code+'})');
  }
});
test('army drafting does not replace a focused number field during game ticks',()=>{
  const {api,nodes,sandbox}=loadGame();api.UI.openWar();const markup=nodes.get('war-orders').innerHTML;
  sandbox.document.activeElement={tagName:'INPUT',type:'number'};nodes.get('war-mask').contains=()=>true;api.World.setDraft('spearman','1');api.UI.renderWar();assert.equal(nodes.get('war-orders').innerHTML,markup);
});
test('all event choices execute safely with exact costs in both rich and poor economies',()=>{
  const {api}=loadGame();
  for(const event of api.WorldEvents)for(let choice=0;choice<event.choices.length;choice++)for(const rich of [false,true]){
    const res=Object.fromEntries(['gold',...api.Rules.marketTypes].map(k=>[k,rich?10000:0]));
    const state=api.set({day:1,lvl:40,meta:{version:7},res,pop:{curr:30,max:100,hap:50},b:{stock:3000,gran:3000,hovel:20,market:1,iron:1,quarry:1},w:{},units:{spearman:1},events:{pending:{id:event.id},nextDay:999999},goal:{gold:1e12},paused:true});
    const before=snapshot(state.res),can=api.EventEngine.canChoose(event.choices[choice]);const result=api.Game.chooseEvent(event.id,choice);assert.equal(result,can,event.id+' '+choice);
    if(!can)assert.deepEqual(snapshot(state.res),before);assertWorldConsistency(api,state);
  }
});
test('one thousand mixed game days retain coherent workers, armies, territories and resource accounting',()=>{
  const buildings={stock:150,gran:150,hovel:50,market:1,wood:14,apple:16,hunter:5,wheat:16,mill:16,bake:32,hops:2,brew:2,cattle:4,tannery:4,leatherwork:4,quarry:2,iron:2,crosswork:1,pikesmith:1,barrack:1,tower:8};
  const workers=Object.fromEntries(Object.entries(buildings).filter(([k])=>!['stock','gran','hovel','market','barrack','tower'].includes(k)));
  const {api,state,sandbox}=loadGame({meta:{version:6},lvl:20,pop:{curr:180},b:buildings,w:workers,units:{swordsman:24},tax:2,res:{gold:10000,bread:6000,wood:1000,stone:800,iron:400,wheat:500}});const W=api.World;
  let seed=73519;sandbox.Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  state.market.auto.apple={enabled:true,min:200,max:250};for(const k of ['crossbow','pike','leatherArmor'])state.market.auto[k]={enabled:true,min:20,max:50};
  state.events.nextDay=10;
  for(let i=0;i<1000;i++){
    if(state.events.pending){const e=api.EventEngine.definition(state.events.pending.id);api.Game.chooseEvent(e.id,e.choices.findIndex(c=>api.EventEngine.canChoose(c)));}
    if(state.world.raidPending)W.resolveRaid();state.paused=false;
    const threat=W.upcomingRaid();if(threat&&W.defense(threat.enemy)<threat.enemy.raidStrength&&W.buildTarget('tower'))api.Game.build('tower');
    if(i%5===0&&W.unitCount(state.units)<24&&api.countWorkers().idle>0)api.Game.recruit(state.units.pikeman<10?'pikeman':'crossbowman');
    if(!state.world.project){const r=state.world.regions.find(r=>!r.scouted||r.status==='neutral'||r.status==='conquered');if(r){const kind=!r.scouted?'scout':r.status==='neutral'?'settle':'secure';if(W.canStartProject(kind,r.id))W.startProject(kind,r.id);}}
    if(!state.world.mission&&i%20===0){const r=W.enemies().find(r=>r.scouted);if(r&&W.homeUnits().swordsman>8){const draft={swordsman:Math.min(16,W.homeUnits().swordsman-4)};if(W.preview(r.id,draft).ok)W.launch(r.id,draft);}}
    api.Game.tick();assertWorldConsistency(api,state);
  }
  assert.ok(state.day>=1000);assert.ok(state.events.seen>30);assert.ok(W.owned().length>=2);assert.ok(state.pop.curr>0);assert.ok(state.world.history.length<=12);
});

test('starvation preserves provisioned field troops and can kill unprovided home troops',()=>{
  const {api,state}=loadGame({meta:{version:7},pop:{curr:3},units:{spearman:3},res:{bread:100}});const W=api.World,r=state.world.regions[2];r.scouted=true;W.launch(r.id,{spearman:2});
  assert.equal(W.starve(),'soldier');near(state.units.spearman,2);near(state.pop.curr,2);near(W.unitCount(W.awayUnits()),2);assert.equal(W.starve(),null);near(state.pop.curr,2);
});
test('unpaid military wages are recorded and impose a reversible mood penalty',()=>{
  const {api,state}=loadGame({meta:{version:7},units:{spearman:5},res:{gold:0,bread:100}});state.economy.lastTick=api.simulateEconomy();near(state.economy.lastTick.unpaidUpkeep,.75);near(api.World.mood(),-2);
  state.res.gold=10;state.economy.lastTick=api.simulateEconomy();near(state.economy.lastTick.unpaidUpkeep,0);near(api.World.mood(),0);
});
test('loss forecasts contain actual losses over extreme and evenly matched armies',()=>{
  const {api}=loadGame();
  for(const soldiers of [1,2,5,10,30,100])for(const strength of [1,20,80,150,1000])for(const roll of [0,.25,.5,.75,.999999]){
    const state=api.set({day:1,lvl:6,meta:{version:7},res:{gold:10000,bread:10000},pop:{curr:soldiers+20,max:1000,hap:90},b:{stock:20,gran:300,market:1},w:{},units:{swordsman:soldiers},goal:{gold:1e12},paused:false});
    const W=api.World,r=state.world.regions[2];r.scouted=true;r.enemy.strength=strength;const p=W.preview(r.id,{swordsman:soldiers});assert.ok(W.launch(r.id,{swordsman:soldiers}));state.world.mission.roll=roll;state.day=state.world.mission.battleDay;W.battle();
    const loss=soldiers-state.units.swordsman;assert.ok(loss>=1&&loss>=p.losses.min&&loss<=p.losses.max,JSON.stringify({soldiers,strength,roll,loss,p:p.losses}));
  }
});
test('new military resources retain fixed prices and exact automatic trading',()=>{
  const {api,state}=loadGame({res:{gold:10000,crossbow:100,pike:0}});state.market.auto.crossbow={enabled:true,min:10,max:20};state.market.auto.pike={enabled:true,min:37,max:40};
  api.rebalanceMarket();near(state.res.crossbow,20);near(state.res.pike,37);near(api.marketPrice('crossbow',true),140);near(api.marketPrice('pike',false),34);
});
test('events do not interrupt the tutorial and blocking dialogs outrank management menus',()=>{
  const {api,state}=loadGame();state.events.nextDay=1;api.Tutorial.active=true;assert.equal(api.Game.checkRandomEvent(),false);assert.equal(state.events.pending,null);
  api.Tutorial.active=false;assert.equal(api.Game.checkRandomEvent(),true);
  assert.match(html,/#modal-mask\{z-index:8000\}/);assert.match(html,/#event-mask\{z-index:8100\}/);
});
test('new-game and loaded-game initialization execute all shipped scripts in order',()=>{
  const {api,nodes,sandbox,updateUI}=loadGame();api.UI.update=updateUI;api.UI.showModal=()=>{};api.Game.newGame();const state=api.state();state.paused=false;
  api.Game.tick();api.UI.openExp();api.UI.openWar();api.UI.openMarket();api.UI.openProduction();api.I18N.set('en');api.I18N.set('de');
  for(const id of ['r-gold','r-pop','raid-in'])assert.ok(!/undefined|NaN/.test(String(nodes.get(id).innerText)),id);
  assert.equal(sandbox.document.documentElement.lang,'de');assertWorldConsistency(api,state);
});
