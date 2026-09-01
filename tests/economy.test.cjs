const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1].replace(/Game\.init\(\);\s*$/, '');
function loadGame(overrides = {}) {
  const nodes = new Map();
  function element() {
    let content = '';
    return {
      style: {}, dataset: {}, children: [], attributes: {}, innerText: '', value: '', title: '',
      classList: {add(){},remove(){},toggle(){},contains(){return false;}},
      set innerHTML(value){content=String(value);this.children=[];}, get innerHTML(){return content;},
      appendChild(child){this.children.push(child);return child;},
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
  vm.runInContext(script+'\nglobalThis.testApi={Game,UI,Storage,Tutorial,I18N,T,BI,loc,SafeT,Rules,Config,Units,MarketGoods,RenownTiers,EPSILON,numberText,migrateState,simulateEconomy,produceResources,createEconomyReport,executeTrade,rebalanceMarket,enforceStorageLimits,reconcileWorkforce,countWorkers,calcCaps,marketPrice,renownStatus,productionMultiplier,contractReward,applyOfflineProgress,getDefStr,set(v){S=v;migrateState();return S;},state(){return S;}};',sandbox);
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
  const r=api.produceResources();near(r.produced.flour,r.inputs.wheat);near(r.produced.bread,r.inputs.flour*4);near(r.inputs.flour,r.inputs.wood);
});
test('limited inputs throttle production without negative stocks',()=>{
  const {api,state}=loadGame({b:{bake:10},w:{bake:10},res:{flour:.25,wood:10}});
  const r=api.produceResources();near(r.produced.bread,1);near(state.res.flour,0);near(state.res.wood,9.75);assert.equal(r.buildings.bake.status,'partial');
});
test('bread has processing priority over beer when fuel is scarce',()=>{
  const {api,state}=loadGame({b:{bake:1,brew:1},w:{bake:1,brew:1},res:{flour:1,wood:1,wheat:1,hops:1}});
  const r=api.produceResources();near(r.produced.bread,4);near(r.produced.beer||0,0);near(state.res.hops,1);
});
test('brewing requires grain, hops and fuel; hops alone do not make beer',()=>{
  const {api}=loadGame({b:{brew:1},w:{brew:1},res:{hops:20}});const r=api.produceResources();near(r.produced.beer||0,0);assert.equal(r.buildings.brew.status,'no_inputs');
});
test('beer demand is 0.2 per resident, separate from food and its capacity',()=>{
  const {api,state}=loadGame({pop:{curr:20},res:{beer:50,bread:20},b:{gran:1}});
  const r=api.simulateEconomy();near(r.beerServed,4);near(state.res.beer,46);near(r.foodMissing,0);assert.ok(!api.Rules.foodTypes.includes('beer'));
});
test('beer never substitutes for edible food',()=>{
  const {api}=loadGame({pop:{curr:10},res:{beer:50}});near(api.simulateEconomy().foodMissing,10);
});
test('cattle, tanning and leather armor form a working chain',()=>{
  const {api,state}=loadGame({b:{cattle:1,tannery:1,leatherwork:1},w:{cattle:1,tannery:1,leatherwork:1}});
  const r=api.produceResources();near(r.produced.hides,1);near(r.produced.leather,1);near(state.res.leatherArmor,1);near(state.res.hides,0);near(state.res.leather,0);near(state.res.meat,2);
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
  near(state.lvl,20);near(state.renown,300);near(state.res.gold,1234);near(state.b.dairy,3);near(state.w.dairy,2);near(state.units.archer,2);near(state.res.wood,0);near(state.res.leather,0);near(state.meta.version,6);
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
test('leather recipes use singular hide names in both languages',()=>{
  const {api,nodes}=loadGame();
  api.I18N.lang='de';api.UI.renderProduction();assert.ok(nodes.get('production-body').innerHTML.includes('1 Rohhaut → 1 Leder'));
  api.I18N.lang='en';api.UI.renderProduction();assert.ok(nodes.get('production-body').innerHTML.includes('1 Hide → 1 Leather'));
});
test('new-game startup initializes all new systems without resetting language',()=>{
  const {api,storage,updateUI}=loadGame();api.I18N.set('en');api.Game.newGame();updateUI();
  near(api.state().meta.version,6);near(api.state().res.leather,0);near(api.state().units.guard,0);assert.equal(storage.get('stronhold_language'),'en');
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
