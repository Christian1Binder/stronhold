/* STRONHOLD v7: territories, finite deposits and persistent armies.
 * S.units includes deployed soldiers. Only homeUnits() may defend the castle.
 * All deadlines use game days, never wall-clock time; offline play is peaceful.
 */
'use strict';

Object.assign(T,{crossbow:BI('Armbrust','Crossbow'),pike:BI('Pike','Pike')});
Object.assign(I18N.strings,T,{
  expansion:BI('Gebiete & Bauplätze','Territories & plots'),campaigns:BI('Nachbarn & Feldzüge','Neighbours & campaigns'),
  raid_in:BI('⚔️ Angriff in','⚔️ Attack in'),events:BI('Ereignisse','Events'),
  weapon_chain:BI('Neue Waffenkette','New weapon chain'),deposit_empty:BI('Vorkommen erschöpft','Deposit exhausted'),
  settlement:BI('Siedlungsplätze','Settlement plots'),fertile:BI('Fruchtbares Land','Fertile land'),
  stone_plots:BI('Steinbruchplätze','Quarry plots'),iron_plots:BI('Minenplätze','Mine plots'),
  home:BI('Heimat','Home'),away:BI('Unterwegs','Deployed'),peace:BI('Ruhe','Peace'),upkeep:BI('Sold','Upkeep'),
  scout:BI('Erkunden','Scout'),settle:BI('Besiedeln','Settle'),secure:BI('Außenposten errichten','Establish outpost'),
  owned:BI('Eigenes Gebiet','Owned territory'),neutral:BI('Unbesiedelt','Unsettled'),hostile:BI('Feindgebiet','Enemy territory'),
  conquered:BI('Erobert · Außenposten fehlt','Conquered · outpost needed'),unknown:BI('Unerkundet','Unscouted'),
  reserved_workers:BI('gebundene Arbeiter','reserved workers'),no_changes:BI('Keine weiteren Folgen','No other effects'),
  field_army:BI('Feldarmee','Field army'),garrison:BI('Heimatverteidigung','Home defense'),
  troops_help:BI('Ausbildung bindet einen Bewohner. Soldaten zahlen keine Steuern und kosten je 0,15 Gold/Tag. Zu Hause benötigen sie 1,25 Rationen; Feldzüge nehmen ihren Proviant vorab mit.','Training reserves one resident. Soldiers pay no tax and cost 0.15 gold/day each. At home they need 1.25 rations; campaigns take their provisions in advance.'),
  plot_help:BI('Jedes Gebäude belegt einen passenden Bauplatz. Landwirtschaft konkurriert um fruchtbares Land; Stein und Eisen werden aus endlichen Vorkommen gewonnen. Pausieren spart Arbeiter, Abriss gibt den Platz frei.','Each building occupies a suitable plot. Farms compete for fertile land; stone and iron come from finite deposits. Pausing frees workers; demolition frees the plot.'),
  click_help:BI('Klickhilfe ist pro Spieltag begrenzt. Mehr besetzte Betriebe und bessere Werkzeuge erhöhen das Budget. Steinklicks benötigen einen besetzten Steinbruch und verbrauchen echte Vorkommen.','Click assistance is limited per game day. More staffed businesses and better tools increase the budget. Stone clicks require a staffed quarry and consume real deposits.'),
  no_space:BI('Keine freien, passenden Bauplätze im gewählten Gebiet. Wähle ein anderes Gebiet oder erschließe neues Land unter 🧭.','No suitable plots remain in the selected territory. Select another territory or develop new land under 🧭.'),
  no_deposit:BI('Hier gibt es kein nutzbares Vorkommen mehr. Erkunde und erschließe neue Rohstoffgebiete.','No usable deposit remains here. Scout and develop new resource territories.'),
  no_afford:BI('Ressourcen, freier Wohnraum oder freie Bewohner fehlen. Es wurde nichts abgezogen.','Resources, free housing or idle residents are missing. Nothing was deducted.'),
  ongoing_project:BI('Zuerst das laufende Vorhaben abschließen.','Finish the current project first.'),
  territory_progress:BI('Nach je zwei erschlossenen Gebieten und fünf Burgstufen wird ein neuer Grenzabschnitt zugänglich. Feindstärken werden bei Entdeckung festgelegt, nicht an deine Armee angepasst.','Every two developed territories and five castle levels reveal a new frontier. Enemy strength is fixed when discovered, not scaled to your army.'),
  troop_choice:BI('Truppen auswählen','Select troops'),send_army:BI('Feldzug beginnen','Begin campaign'),
  no_army:BI('Wähle mindestens einen verfügbaren Soldaten.','Select at least one available soldier.'),
  invalid_army:BI('Die Auswahl enthält ungültige oder nicht verfügbare Truppen.','The selection contains invalid or unavailable troops.'),
  one_army:BI('Deine Feldarmee muss zuerst zurückkehren.','Your field army must return first.'),
  scout_first:BI('Erkunde dieses Gebiet zuerst.','Scout this territory first.'),
  army_warning:BI('Jeder Angriff verursacht Verluste – auch bei deutlicher Überlegenheit. Unterwegs können diese Truppen deine Burg nicht verteidigen.','Every attack causes losses, even with overwhelming strength. While deployed, these troops cannot defend your castle.'),
  war_timing:BI('Marsch, Schlacht und Rückkehr laufen in Spieltagen. Offline gibt es keine Kämpfe, keine Ereignisse und keinen Proviantverbrauch.','Travel, battle and return use game days. Offline there are no battles, events or provision consumption.'),
  armored:BI('Schwere Infanterie','Heavy infantry'),cavalry:BI('Reiterei','Cavalry'),ranged:BI('Fernkämpfer','Ranged troops'),swarm:BI('Leichte Infanterie','Light infantry'),
  confirm_demolish:BI('Abriss bestätigen','Confirm demolition'),cancel:BI('Abbrechen','Cancel'),demolish:BI('Abreißen','Demolish'),
  protected_building:BI('Das letzte Lager, der letzte Kornspeicher, das Handelskontor und der Gebietsaußenposten bleiben erhalten.','The last warehouse, last granary, trading post and territorial outpost are protected.'),
  history:BI('Letzte Ergebnisse','Recent results'),no_enemy:BI('Alle derzeit bekannten Gegner sind besiegt.','All currently known enemies are defeated.'),
  upkeep_missing:BI('Sold fehlt: −2 Stimmung pro Tag, bis der laufende Sold bezahlt werden kann.','Unpaid upkeep: −2 mood per day until current upkeep can be paid.')
});
Rules.marketTypes.push('crossbow','pike');
Object.assign(MarketGoods,{crossbow:{buy:140,sell:65},pike:{buy:75,sell:34}});
Units.spearman={...Units.pikeman,n:BI('Speerträger','Spearman'),desc:BI('Günstige leichte Infanterie.','Affordable light infantry.')};
Units.pikeman={n:BI('Pikenier','Pikeman'),cost:30,res:'pike',arm:'leatherArmor',str:12,def:10,desc:BI('Stark gegen Reiterei: +70 %.','Strong against cavalry: +70%.')};
Units.crossbowman={n:BI('Armbrustschütze','Crossbowman'),cost:35,res:'crossbow',arm:'leatherArmor',str:18,def:12,desc:BI('Stark gegen schwere Infanterie: +55 %. Benötigt Nahkampfschutz.','Strong against heavy infantry: +55%. Needs melee protection.')};
Units.archer.desc=BI('Stark gegen leichte Infanterie; schwach gegen Rüstung.','Strong against light infantry; weak against armor.');
Units.swordsman.desc=BI('Stark gegen Fernkämpfer; schützt eigene Schützen.','Strong against ranged troops; protects allied shooters.');
Units.guard.desc=BI('Solide Heimatverteidigung und Nahkampfschutz.','Reliable home defense and melee protection.');
Config.b.pole.n=BI('Speermacher','Spear Maker');
Config.b.crosswork={n:BI('Armbrustwerkstatt','Crossbow Workshop'),c:'waffen',i:'🎯',z:'z-town',cost:{g:180,w:60,i:20},stage:4,recipe:{input:{wood:2,iron:1},output:{crossbow:1}}};
Config.b.pikesmith={n:BI('Pikenschmied','Pike Smith'),c:'waffen',i:'🔱',z:'z-town',cost:{g:140,w:40,i:10},stage:4,recipe:{input:{wood:2,iron:1},output:{pike:1}}};
ReleaseWorkerPriority.unshift('crosswork','pikesmith');
UpgradeDefs.tools.desc=BI('Jede Stufe gibt +1 Ressource pro Kartenklick und erhöht das tägliche Klickbudget. Bauplätze und Vorkommen bleiben begrenzt.','Each level grants +1 resource per map click and raises the daily click budget. Plots and deposits remain limited.');

const World = {
  plotKinds:['settlement','forest','fertile','stone','iron'],
  int(value){return Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;},
  unitCount(units){return Object.keys(Units).reduce((n,k)=>n+this.int(units&&units[k]),0);},
  awayUnits(state=S){return state.world?.mission?.units||{};},
  homeUnits(state=S){return Object.fromEntries(Object.keys(Units).map(k=>[k,Math.max(0,this.int(state.units[k])-this.int(this.awayUnits(state)[k])-(k==='engineer'?Siege.busy(state):0))]));},
  owned(state=S){return state.world.regions.filter(r=>r.status==='owned');},
  region(id,state=S){return state.world.regions.find(r=>r.id===id);},
  enemies(state=S){return state.world.regions.filter(r=>r.enemy&&!r.enemy.defeated);},
  random(state=S){state.world.rng=(Math.imul(state.world.rng,1664525)+1013904223)>>>0;return state.world.rng/4294967296;},
  plotKind(key){return key==='quarry'?'stone':key==='iron'?'iron':Config.b[key]?.z==='z-farm'?'fertile':Config.b[key]?.z==='z-forest'?'forest':'settlement';},
  plotName(kind){return tr(kind==='stone'?'stone_plots':kind==='iron'?'iron_plots':kind);},
  used(region,kind){return Object.entries(region.buildings||{}).reduce((n,[k,v])=>n+(Config.b[k]&&this.plotKind(k)===kind?this.int(v):0),0);},
  available(region,kind){return Math.max(0,region.slots[kind]-this.used(region,kind));},

  migrate(state,previousVersion){
    for(const k in Units)state.units[k]=this.int(state.units[k]);
    if(previousVersion<7){state.units.spearman+=state.units.pikeman;state.units.pikeman=0;}
    if(!state.world||!Array.isArray(state.world.regions)||!state.world.regions.length){
      const legacy=previousVersion<7,land=this.int(state.exp.land);
      const home={id:'home',name:BI('Stammland','Homeland'),status:'owned',scouted:true,buildings:{...state.b},slots:{settlement:36+land*6,forest:10,fertile:16+land*3,stone:4+land,iron:3+Math.floor(land/2)},deposits:{stone:4000,iron:2000}};
      for(const kind of this.plotKinds)home.slots[kind]=Math.max(home.slots[kind],this.used(home,kind)+(legacy?2:0));
      if(legacy){home.deposits.stone=Math.max(2000,(state.b.quarry||0)*800);home.deposits.iron=Math.max(1000,(state.b.iron||0)*600);}
      state.world={version:1,legacyLand:land,regions:[home],nextBand:0,selectedRegion:'auto',project:null,mission:null,raidPending:null,
        protectedUntil:(state.day||1)+(legacy?16:12),raidsStarted:(state.lvl||1)>=Config.raid.startLevel,effects:[],history:[],rng:((state.day||1)*7919+(state.lvl||1)*104729)>>>0,clicks:{day:state.day,used:{},rewarded:false}};
    }
    const w=state.world;
    w.rng=(Number(w.rng)||9719)>>>0;w.effects=Array.isArray(w.effects)?w.effects:[];w.history=Array.isArray(w.history)?w.history:[];
    w.nextBand=this.int(w.nextBand);w.legacyLand=this.int(w.legacyLand);
    w.selectedRegion=w.selectedRegion||'auto';
    const home=w.regions.find(r=>r.id==='home')||w.regions[0];
    for(const r of w.regions){
      r.buildings=r.buildings||{};r.deposits=r.deposits||{stone:0,iron:0};r.slots=r.slots||{};
      for(const kind of this.plotKinds)r.slots[kind]=Math.max(this.int(r.slots[kind]),this.used(r,kind));
      for(const kind of ['stone','iron'])r.deposits[kind]=Math.max(0,Number(r.deposits[kind])||0);
      if(r.enemy){r.enemy.defeated=!!r.enemy.defeated;r.enemy.nextRaid=r.enemy.defeated?null:(Number(r.enemy.nextRaid)||(state.day||1)+16);}
    }
    // Recover unallocated legacy buildings, without granting more plots on every load.
    for(const k in Config.b){
      const allocated=this.owned(state).reduce((n,r)=>n+this.int(r.buildings[k]),0);
      if(allocated<state.b[k]){home.buildings[k]=this.int(home.buildings[k])+state.b[k]-allocated;home.slots[this.plotKind(k)]=Math.max(home.slots[this.plotKind(k)],this.used(home,this.plotKind(k)));}
      if(allocated>state.b[k])state.b[k]=allocated;
    }
    if(w.mission){for(const k in w.mission.units)w.mission.units[k]=Math.min(this.int(w.mission.units[k]),state.units[k]||0);}
    state.pop.curr=Math.max(this.int(state.pop.curr),this.unitCount(state.units)+(w.project?.workers||0));
    state.events.recent=Array.isArray(state.events.recent)?state.events.recent.slice(-5):[];
    state.events.queue=Array.isArray(state.events.queue)?state.events.queue:[];
    this.ensureFrontier(state);this.syncThreat(state);
  },

  ensureFrontier(state=S){
    const w=state.world,band=w.nextBand,developed=this.owned(state).length-1;
    if(developed<band*2)return;
    const level=Math.max(1+band*4,state.lvl||1),scale=1+band*.4,extra=Math.floor(Math.sqrt(band));
    const profiles=[
      {slots:{settlement:12,forest:8,fertile:10,stone:1,iron:0},deposits:{stone:600,iron:0}},
      {slots:{settlement:14,forest:6,fertile:6,stone:4,iron:2},deposits:{stone:3500,iron:800}},
      {slots:{settlement:14,forest:5,fertile:5,stone:2,iron:4},deposits:{stone:1000,iron:2800}}
    ];
    profiles.forEach((p,i)=>{
      const id='region-'+band+'-'+i,names=Kingdom.names(band,i,state);
      const r={id,band,name:names.place,status:i===0?'neutral':'hostile',scouted:false,slots:Object.fromEntries(Object.entries(p.slots).map(([k,n])=>[k,n+(n?extra:0)])),deposits:{stone:Math.round(p.deposits.stone*scale),iron:Math.round(p.deposits.iron*scale)},buildings:{},distance:2+Math.min(3,Math.floor(band/3))};
      if(i){
        r.enemy={id:'enemy-'+band+'-'+i,name:names.lord,level,strength:Math.round((22+level*8)*(i===2?1.3:1)),raidStrength:Math.round((13+level*3)*(i===2?1.2:1)),tactic:['swarm','armored','cavalry','ranged'][(band+i)%4],defeated:false,nextRaid:(state.day||1)+16+i*7,truceUntil:0,warned:false};}
      w.regions.push(r);
    });
    w.nextBand++;
  },
  buildTarget(key,state=S){
    if(!Config.b[key]||Config.b[key].legacy)return null;
    const kind=this.plotKind(key),selected=state.world.selectedRegion;
    return this.owned(state).find(r=>(selected==='auto'||r.id===selected)&&this.available(r,kind)>0&&(!['stone','iron'].includes(kind)||r.deposits[kind]>EPSILON))||null;
  },
  buildBlockReason(key,state=S){
    const kind=this.plotKind(key),selected=state.world.selectedRegion;
    const pool=this.owned(state).filter(r=>selected==='auto'||selected===r.id);
    return I18N.strings[['stone','iron'].includes(kind)&&pool.every(r=>r.deposits[kind]<=EPSILON)?'no_deposit':'no_space'];
  },
  setRegion(id){if(id!=='auto'&&!this.owned().some(r=>r.id===id))return;S.world.selectedRegion=id;UI.renderMap();UI.renderBuild();UI.update();},
  miningPlan(key,workers,multiplier,state=S){
    const resource=key==='quarry'?'stone':'iron',plan=[];
    let remaining=Math.max(0,workers);
    for(const r of this.owned(state)){
      if(r.deposits[resource]<=EPSILON)continue;
      const assigned=Math.min(remaining,this.int(r.buildings[key]));remaining-=assigned;
      const amount=roundQty(Math.min(r.deposits[resource],assigned*(Config.b[key].amt||1)*multiplier));
      if(amount>0)plan.push({region:r,amount});
      if(remaining<=0)break;
    }
    return plan;
  },
  miningLimit(key,workers,multiplier,state=S){return roundQty(this.miningPlan(key,workers,multiplier,state).reduce((n,p)=>n+p.amount,0));},
  drainMine(key,amount,state=S,multiplier=1){
    const resource=key==='quarry'?'stone':'iron';let left=amount;
    // Only deposits with a built mine can be mined, including click assistance.
    for(const p of this.miningPlan(key,state.w[key]||0,multiplier,state)){const take=Math.min(left,p.amount);p.region.deposits[resource]=Math.max(0,roundQty(p.region.deposits[resource]-take));left=roundQty(left-take);if(left<=EPSILON)break;}
    return roundQty(amount-left);
  },
  deposits(resource,state=S){return roundQty(this.owned(state).reduce((n,r)=>n+(r.deposits[resource]||0),0));},
  clickBudget(type,state=S){
    const tools=1+(state.upgrades.tools||0)*.3;
    return Math.floor((type==='wood'?8+2*(state.w.wood||0):type==='apple'?5+2*(state.w.apple||0):type==='stone'?2*(state.w.quarry||0):0)*tools);
  },
  clickState(state=S){if(!state.world.clicks||state.world.clicks.day!==state.day)state.world.clicks={day:state.day,used:{},rewarded:false};return state.world.clicks;},
  gather(type,wanted,state=S){
    if(!['wood','apple','stone'].includes(type)||!Number.isFinite(wanted)||wanted<=0)return 0;
    const clicks=this.clickState(state),room=Math.max(0,this.clickBudget(type,state)-(clicks.used[type]||0));
    let amount=Math.min(wanted,room);
    if(type==='stone')amount=Math.min(amount,this.miningLimit('quarry',state.w.quarry||0,1,state));
    amount=roundQty(amount);if(type==='stone')amount=this.drainMine('quarry',amount,state);
    clicks.used[type]=roundQty((clicks.used[type]||0)+amount);return amount;
  },
  clickReward(state=S){const c=this.clickState(state);if(c.rewarded)return false;c.rewarded=true;return true;},
  effect(kind,state=S){return clamp((state.world?.effects||[]).filter(e=>e.kind===kind&&e.expiresAt>state.day).reduce((n,e)=>n*(e.multiplier||1),1),.35,2);},
  mood(state=S){return (state.world?.effects||[]).filter(e=>e.kind==='mood'&&e.expiresAt>state.day).reduce((n,e)=>n+(e.value||0),0)+(state.economy?.lastTick?.unpaidUpkeep>EPSILON?-2:0);},

  costText(cost,lang=I18N.lang){return Object.entries(cost).filter(([,n])=>n>0).map(([k,n])=>numberText(n,lang)+' '+(k==='food'?trl('food',lang):SafeT(k,lang))).join(' · ');},
  canPay(cost,state=S){return Object.entries(cost).every(([k,n])=>Number.isFinite(n)&&n>=0&&(k==='food'?sumGoods(state.res,Rules.foodTypes):(state.res[k]||0))+EPSILON>=n);},
  pay(cost,state=S){
    if(!this.canPay(cost,state))return false;
    for(const [key,amount] of Object.entries(cost)){
      if(key==='food'){let left=amount;for(const k of [...Rules.foodTypes].sort((a,b)=>state.res[b]-state.res[a])){const take=Math.min(left,state.res[k]);state.res[k]=roundQty(state.res[k]-take);left=roundQty(left-take);if(left<=EPSILON)break;}}
      else state.res[key]=Math.max(0,roundQty(state.res[key]-amount));
    }return true;
  },
  fail(message){UI.log(message,'warn');return false;},
  projectSpec(kind,r,state=S){
    const scale=1+(r.band||0)*.35;
    if(kind==='scout')return {workers:1,duration:2,cost:{gold:Math.round(20*scale)}};
    if(kind==='settle')return {workers:2,duration:6,cost:{gold:Math.round(200*scale),wood:Math.round(40*scale),stone:Math.round(20*scale),food:Math.round(20*scale)}};
    if(kind==='secure')return {workers:2,duration:4,cost:{gold:Math.round(120*scale),wood:Math.round(30*scale),stone:Math.round(20*scale),food:Math.round(15*scale)}};
    return null;
  },
  canStartProject(kind,id,state=S){
    const r=this.region(id,state),spec=r&&this.projectSpec(kind,r,state);
    if(!r||!spec||state.paused)return false;
    const valid=kind==='scout'?!r.scouted:kind==='settle'?r.scouted&&r.status==='neutral':r.scouted&&r.status==='conquered';
    return valid&&!state.world.project&&countWorkers(state).idle>=spec.workers&&this.canPay(spec.cost,state);
  },
  startProject(kind,id,state=S){
    if(!this.canStartProject(kind,id,state))return this.fail(I18N.strings[state.world.project?'ongoing_project':'no_afford']);
    const r=this.region(id,state),spec=this.projectSpec(kind,r,state);
    this.pay(spec.cost,state);state.world.project={kind,regionId:id,workers:spec.workers,startDay:state.day,finishDay:state.day+spec.duration};
    reconcileWorkforce(state);this.record(dual(lang=>`${trl(kind,lang)}: ${loc(r.name,lang)} · ${trl('day',lang)} ${state.world.project.finishDay}`),'prod',state);
    UI.update();this.renderTerritories();return true;
  },
  finishProject(state=S){
    const p=state.world.project;if(!p||state.day<p.finishDay)return;
    const r=this.region(p.regionId,state);state.world.project=null;
    if(!r)return;
    if(p.kind==='scout')r.scouted=true;
    else if((p.kind==='settle'&&r.status==='neutral')||(p.kind==='secure'&&r.status==='conquered')){
      r.status='owned';r.scouted=true;r.buildings.outpost=1;r.requiredOutpost=true;state.b.outpost++;
      state.exp.land=state.world.legacyLand+this.owned(state).length-1;
      state.staffing.targets.outpost=Math.min(state.b.outpost,(state.staffing.targets.outpost||0)+1);
      if(state===S)recalcPopMax();
    }
    reconcileWorkforce(state);
    this.record(dual(lang=>`${loc(r.name,lang)}: ${p.kind==='scout'?(lang==='de'?'Erkundung abgeschlossen':'scouting complete'):(lang==='de'?'erschlossen – neue Bauplätze verfügbar':'developed – new plots available')}.`),'prod',state);
    if(state===S){UI.renderBuild();UI.renderMap();}
  },
  canDemolish(id,key,state=S){
    const r=this.region(id,state);if(!r||r.status!=='owned'||!(r.buildings[key]>0)||!Config.b[key])return false;
    if(key==='market'||(key==='engineerGuild'&&state.siege?.project)||(['stock','gran'].includes(key)&&state.b[key]<=1)||(key==='outpost'&&r.requiredOutpost&&r.buildings[key]<=1))return false;
    return true;
  },
  removeBuilding(id,key,state=S){
    if(state.paused||!this.canDemolish(id,key,state))return false;
    const r=this.region(id,state);r.buildings[key]--;state.b[key]--;
    state.staffing.targets[key]=Math.min(state.staffing.targets[key]||0,Kingdom.staffCapacity(key,state));
    if(key==='dairy')Kingdom.syncHerds(state);
    const costs=Config.b[key].cost,keys={g:'gold',w:'wood',s:'stone',i:'iron'};
    for(const k in costs)if(keys[k])addAmount(state.res,keys[k],costs[k]*.5);
    reconcileWorkforce(state);if(state===S)recalcPopMax();rebalanceMarket(state);enforceStorageLimits(state);
    this.record(dual(lang=>`${loc(Config.b[key].n,lang)}: ${lang==='de'?'abgerissen, 50 % Baukosten zurück':'demolished, 50% construction cost refunded'}.`),'prod',state);
    UI.renderBuild();UI.renderMap();UI.update();return true;
  },
  confirmDemolish(id,key){
    if(S.paused||!this.canDemolish(id,key))return;
    this.demolition={id,key};this.renderTerritories();
  },
  cancelDemolish(){this.demolition=null;this.renderTerritories();},
  executeDemolish(){const d=this.demolition;this.demolition=null;if(d)this.removeBuilding(d.id,d.key);this.renderTerritories();},

  power(units,enemy=null,defend=false,state=S){
    const ranged=(units.archer||0)+(units.crossbowman||0),melee=this.unitCount(units)-ranged-(units.engineer||0);
    return Math.floor(Object.entries(Units).reduce((sum,[k,u])=>{
      let factor=1;
      if(enemy){if(k==='crossbowman'&&enemy.tactic==='armored')factor=1.55;
        if(k==='pikeman'&&enemy.tactic==='cavalry')factor=1.7;
        if(k==='archer')factor=enemy.tactic==='armored'?.55:enemy.tactic==='swarm'?1.35:1;
        if(k==='swordsman'&&enemy.tactic==='ranged')factor=1.35;}
      if((k==='archer'||k==='crossbowman')&&melee<ranged*.25)factor*=.7;
      return sum+this.int(units[k])*(defend?u.def:u.str)*factor;
    },0));
  },
  defense(enemy=null,units=this.homeUnits(),state=S){
    const base=this.power(units,enemy,true,state)+(state.b.wall_w||0)*3+(state.b.tower||0)*10+Math.floor((state.pop.hap||0)/20);
    return Math.floor(base*(1+renownStatus(state).current.defense)*this.effect('defense',state));
  },
  draftUnits(draft,state=S){
    const home=this.homeUnits(state),units={};let valid=true;
    for(const [key,value] of Object.entries(draft||{})){const n=Number(value);if(!Units[key]||!Number.isInteger(n)||n<0||n>(home[key]||0))valid=false;else units[key]=n;}
    return {units,valid};
  },
  lossRate(attack,defense,win){return win?clamp(.08+.22*defense/Math.max(1,attack),.08,.4):clamp(.35+.25*defense/Math.max(1,attack),.35,.85);},
  preview(id,draft,state=S,equipment={}){
    const siege=Siege.prepare(draft,equipment,state);
    const r=this.region(id,state),enemy=r?.enemy,{units,valid}=this.draftUnits(siege.units,state),count=this.unitCount(units);
    const errors=[...siege.errors];
    if(!valid)errors.push(I18N.strings.invalid_army);
    if(count-(units.engineer||0)<1)errors.push(I18N.strings.no_army);
    if(!enemy||enemy.defeated||r.status!=='hostile')errors.push(I18N.strings.no_enemy);
    if(r&&!r.scouted)errors.push(I18N.strings.scout_first);
    if(state.world.mission)errors.push(I18N.strings.one_army);
    const distance=r?.distance||2,days=distance*2+1,food=Math.ceil(count*days*1.25);
    if(!this.canPay({food},state))errors.push(BI(`Es fehlen ${numberText(food-sumGoods(state.res,Rules.foodTypes),'de')} Rationen für den Marsch.`,`The march needs ${numberText(food-sumGoods(state.res,Rules.foodTypes),'en')} more rations.`));
    const strength=enemy?.strength||1,siegeBonus=Math.floor(Math.min(strength*.6,siege.potential));
    const attack=this.power(units,enemy,false,state)+siegeBonus;
    const chance=clamp((attack/strength-.9)/.2,0,1);
    const lower=(chance>0?this.lossRate(attack,strength*.9,true):this.lossRate(attack,strength*.9,false))*(1-siege.protection);
    const upper=(chance<1?this.lossRate(attack,strength*1.1,false):this.lossRate(attack,strength*1.1,true))*(1-siege.protection);
    const losses={min:count?Math.min(count,Math.max(1,Math.ceil(count*lower))):0,max:count?Math.min(count,Math.max(1,Math.ceil(count*upper))):0};
    const home=this.homeUnits(state);for(const k in units)home[k]-=units[k];
    const threat=this.upcomingRaid(state);
    return {ok:!errors.length,known:!!r?.scouted,errors,units,count,food,days,distance,attack,chance,losses,siege,siegeBonus,homeDefense:this.defense(threat?.enemy||null,home,state),threat,
      homeCount:this.unitCount(home),enemy:strength,battleDay:state.day+distance,returnDay:state.day+days};
  },
  launch(id,draft,state=S,equipment={}){
    if(state.paused)return false;
    const p=this.preview(id,draft,state,equipment);if(!p.ok)return this.fail(p.errors[0]);
    const r=this.region(id,state);this.pay({food:p.food,stone:p.siege.ammo},state);
    state.world.mission={regionId:id,units:{...p.units},phase:'outbound',startDay:state.day,battleDay:p.battleDay,returnDay:p.returnDay,
      attack:p.attack,enemyStrength:r.enemy.strength,roll:this.random(state),provisions:p.food,siege:{...p.siege.machines},siegeProtection:p.siege.protection,ammunition:p.siege.ammo};
    Siege.draft={};
    this.warDraft={};this.record(dual(lang=>`${trl('field_army',lang)}: ${p.count} · ${loc(r.enemy.name,lang)} · ${lang==='de'?'Rückkehr':'return'} ${trl('day',lang)} ${p.returnDay}.`),'war',state);
    UI.update();return true;
  },
  casualties(units,number,state=S){
    const total=this.unitCount(units),wanted=Math.min(total,this.int(number));if(!wanted)return {};
    const entries=Object.keys(Units).filter(k=>units[k]>0).map(k=>({k,n:units[k],loss:Math.floor(wanted*units[k]/total),fraction:wanted*units[k]/total%1}));
    let assigned=entries.reduce((n,e)=>n+e.loss,0);
    entries.sort((a,b)=>b.fraction-a.fraction||a.k.localeCompare(b.k));
    for(const e of entries){if(assigned>=wanted)break;if(e.loss<e.n){e.loss++;assigned++;}}
    const losses={};for(const e of entries){if(!e.loss)continue;units[e.k]-=e.loss;state.units[e.k]=Math.max(0,state.units[e.k]-e.loss);losses[e.k]=e.loss;}
    state.pop.curr=Math.max(this.unitCount(state.units)+(state.world.project?.workers||0),state.pop.curr-wanted);
    reconcileWorkforce(state);return losses;
  },
  starve(state=S){
    if(state.pop.curr>this.unitCount(state.units)+(state.world.project?.workers||0)){state.pop.curr--;reconcileWorkforce(state);return 'civilian';}
    const home=this.homeUnits(state);
    if(this.unitCount(home)>0){this.casualties(home,1,state);return 'soldier';}
    // The expedition carries prepaid provisions; it cannot starve at home.
    return null;
  },
  battle(state=S){
    const m=state.world.mission;if(!m||m.phase!=='outbound'||state.day<m.battleDay)return;
    const r=this.region(m.regionId,state),enemy=r?.enemy;
    if(!enemy){m.phase='return';return;}
    const defense=m.enemyStrength*(.9+.2*m.roll),win=m.attack>=defense;
    const count=this.unitCount(m.units),number=Math.min(count,Math.max(1,Math.ceil(count*this.lossRate(m.attack,defense,win)*(1-(m.siegeProtection||0)))));
    const losses=this.casualties(m.units,number,state);m.phase='return';m.result={win,losses,day:state.day};
    Siege.afterBattle(m,win,state);
    if(win){enemy.defeated=true;enemy.nextRaid=null;r.status='conquered';m.result.gold=Math.round(45+enemy.level*8);m.result.renown=5+Math.floor(enemy.level/3);state.renown+=m.result.renown;state.res.gold+=m.result.gold;state.pop.hap=clamp(state.pop.hap+2,0,100);}
    else {enemy.strength=Math.max(1,Math.round(enemy.strength-Math.min(enemy.strength*.12,m.attack*.08)));state.pop.hap=clamp(state.pop.hap-3,0,100);}
    this.record(dual(lang=>`${win?(lang==='de'?'Sieg':'Victory'):(lang==='de'?'Niederlage':'Defeat')}: ${loc(enemy.name,lang)}. ${lang==='de'?'Verluste':'Losses'}: ${number}. ${win?`${m.result.gold} ${SafeT('gold',lang)} · ${m.result.renown} 👑. `:''}${win?(lang==='de'?'Gebiet erobert; Außenposten zur Nutzung erforderlich.':'Territory conquered; establish an outpost to use it.'):(lang==='de'?'Überlebende kehren zurück.':'Survivors are returning.')}`),win?'war':'death',state);
  },
  returnArmy(state=S){
    const m=state.world.mission;if(!m||m.phase!=='return'||state.day<m.returnDay)return;
    const count=this.unitCount(m.units);state.world.mission=null;
    this.record(dual(lang=>lang==='de'?`${count} Soldaten sind zurück und verteidigen wieder die Burg.`:`${count} soldiers returned and can defend the castle again.`),'prod',state);
  },
  upcomingRaid(state=S){
    if((state.lvl||1)<Config.raid.startLevel||!state.world.raidsStarted)return null;
    return this.enemies(state).map(r=>({region:r,enemy:r.enemy,day:Math.max(r.enemy.nextRaid||state.day+16,r.enemy.truceUntil||0,state.world.protectedUntil||0)})).sort((a,b)=>a.day-b.day)[0]||null;
  },
  syncThreat(state=S){
    const threat=this.upcomingRaid(state);state.raid.next=threat?.day||0;state.raid.warned=!!threat?.enemy.warned;
  },
  advance(state=S){
    if(!state.world.raidsStarted&&(state.lvl||1)>=Config.raid.startLevel){state.world.raidsStarted=true;for(const r of this.enemies(state))r.enemy.nextRaid=Math.max(r.enemy.nextRaid||0,state.day+12);}
    state.world.effects=state.world.effects.filter(e=>e.expiresAt>state.day);
    Siege.advance(state);this.finishProject(state);this.battle(state);this.returnArmy(state);this.ensureFrontier(state);this.syncThreat(state);
  },
  checkRaid(state=S){
    if(state.world.raidPending){this.showRaid();return true;}
    const threat=this.upcomingRaid(state);if(!threat)return false;
    if(threat.day-state.day<=5&&!threat.enemy.warned){threat.enemy.warned=true;this.record(dual(lang=>`${loc(threat.enemy.name,lang)}: ${lang==='de'?'Angriff angekündigt für Tag':'attack announced for day'} ${threat.day}.`),'raid',state);}
    if(state.day<threat.day)return false;
    state.world.raidPending={regionId:threat.region.id,attack:threat.enemy.raidStrength,roll:this.random(state)};
    this.showRaid();return true;
  },
  showRaid(){
    const pending=S.world.raidPending,r=pending&&this.region(pending.regionId);if(!pending||!r)return;
    S.paused=true;Storage.save();
    UI.showModal(dual(lang=>`${lang==='de'?'Angriff':'Attack'}: ${loc(r.enemy.name,lang)}`),dual(lang=>`${lang==='de'?'Angriffsstärke':'Attack strength'}: ${pending.attack}\n${trl('garrison',lang)}: ${this.defense(r.enemy)}\n${trl('away',lang)}: ${this.unitCount(this.awayUnits())}\n\n${lang==='de'?'Nur die Truppen zu Hause und deine Befestigungen verteidigen.':'Only troops at home and your fortifications defend the castle.'}`),BI('Burg verteidigen','Defend castle'),()=>this.resolveRaid());
  },
  resolveRaid(state=S){
    const pending=state.world.raidPending,r=pending&&this.region(pending.regionId,state);if(!pending||!r)return false;
    // Clear the persistent encounter before applying its one-time consequences.
    state.world.raidPending=null;
    if(r.enemy.defeated){state.paused=false;return false;}
    const home=this.homeUnits(state),win=this.defense(r.enemy,home,state)>=pending.attack;
    const count=this.unitCount(home),loss=Math.min(count,count?Math.max(1,Math.ceil(count*(win?.03+.04*pending.roll:.15+.1*pending.roll))):0);
    this.casualties(home,loss,state);
    let civilians=0;
    if(win){state.renown+=1;state.pop.hap=clamp(state.pop.hap+2,0,100);}
    else{
      for(const key of ['gold','wood','stone','iron',...Rules.foodTypes])state.res[key]=roundQty(Math.max(0,state.res[key]*(1-(.05+.07*pending.roll))));
      civilians=Math.min(2,Math.max(0,state.pop.curr-this.unitCount(state.units)-(state.world.project?.workers||0)));state.pop.curr-=civilians;state.pop.hap=clamp(state.pop.hap-6,0,100);
    }
    r.enemy.nextRaid=state.day+Math.max(12,22-Math.floor(r.enemy.level/8));r.enemy.warned=false;
    state.paused=false;this.syncThreat(state);reconcileWorkforce(state);
    this.record(dual(lang=>`${loc(r.enemy.name,lang)}: ${win?(lang==='de'?'Angriff abgewehrt':'attack repelled'):(lang==='de'?'Burgverteidigung durchbrochen, Vorräte verloren':'castle defense breached, supplies lost')}. ${lang==='de'?'Verluste':'Losses'}: ${loss} ${trl('soldier',lang)}${civilians?`, ${civilians} ${trl('population',lang)}`:''}.`),win?'raid':'death',state);
    UI.update();return true;
  },
  record(message,style='prod',state=S){state.world.history.unshift({day:state.day,message});state.world.history=state.world.history.slice(0,12);if(state===S)UI.log(message,style);},

  renderBuildLocation(container){
    const card=document.createElement('button');card.className='build-location';card.id='build-location';card.onclick=()=>UI.openExp();
    container.appendChild(card);this.refreshBuildLocation(card);
  },
  refreshBuildLocation(card=document.getElementById('build-location')){
    if(!card)return;const selected=S.world.selectedRegion,regions=this.owned().filter(r=>selected==='auto'||r.id===selected);
    const free=kind=>regions.reduce((n,r)=>n+this.available(r,kind),0);
    card.innerHTML='<b>🧭 '+loc(BI('Baugebiet','Build territory'))+'</b><span>'+(selected==='auto'?tr('all_territories'):loc(regions[0]?.name))+'</span><small>🏠 '+free('settlement')+' · 🌾 '+free('fertile')+' · 🌲 '+free('forest')+'<br>🧱 '+free('stone')+' · ⛓️ '+free('iron')+'</small>';
    card.title=tr('plot_help');
  },
  changeTerritoryPage(dir){this.territoryPage=Math.max(0,(this.territoryPage||0)+dir);this.renderTerritories();},
  setTerritoryView(view){this.territoryView=view;this.territoryPage=0;this.renderTerritories();},
  changeWarPage(dir){this.warPage=Math.max(0,(this.warPage||0)+dir);this.renderWar();},
  renderTerritories(){
    const body=document.getElementById('exp-body');if(!body)return;
    const w=S.world,p=w.project;
    let html='<p class="world-help">'+tr('plot_help')+'</p><label class="territory-picker">'+loc(BI('Bauen in','Build in'))+' <select aria-label="'+loc(BI('Baugebiet','Build territory'))+'" onchange="World.setRegion(this.value)"><option value="auto" '+(w.selectedRegion==='auto'?'selected':'')+'>'+loc(BI('Automatisch: erster freier Platz','Automatic: first suitable free plot'))+'</option>'+this.owned().map(r=>'<option value="'+r.id+'" '+(w.selectedRegion===r.id?'selected':'')+'>'+loc(r.name)+'</option>').join('')+'</select></label>';
    if(p)html+='<div class="world-notice">⌛ '+tr(p.kind)+' · '+loc(this.region(p.regionId).name)+' · '+p.workers+' '+tr('reserved_workers')+' · '+loc(BI('fertig an Tag','complete on day'))+' '+p.finishDay+' ('+Math.max(0,p.finishDay-S.day)+')</div>';
    if(this.demolition){const d=this.demolition;html+='<div class="world-notice danger">'+loc(Config.b[d.key].n)+' · '+loc(BI('50 % Baukosten zurück, Platz frei. Ggf. sinken Wohnraum und Lagerkapazität. Überfüllte Vorräte können verloren gehen.','50% construction cost refunded; plot freed. Housing or storage may decrease. Overflowing supplies may be lost.'))+'<div class="world-actions"><button class="btn" onclick="World.executeDemolish()">'+tr('confirm_demolish')+'</button><button class="btn" onclick="World.cancelDemolish()">'+tr('cancel')+'</button></div></div>';}
    const view=this.territoryView||'frontier',pool=w.regions.filter(r=>view==='owned'?r.status==='owned':r.status!=='owned');
    const pages=Math.max(1,Math.ceil(pool.length/9));this.territoryPage=Math.min(this.territoryPage||0,pages-1);
    html+='<div class="world-actions"><button class="btn" onclick="World.setTerritoryView(\'owned\')">'+loc(BI('Eigene Gebiete','Owned territories'))+' ('+this.owned().length+')</button><button class="btn" onclick="World.setTerritoryView(\'frontier\')">'+loc(BI('Grenze & Eroberungen','Frontier & conquests'))+' ('+w.regions.filter(r=>r.status!=='owned').length+')</button></div>';
    html+='<div class="world-pagination"><button class="btn" onclick="World.changeTerritoryPage(-1)" '+(!this.territoryPage?'disabled':'')+'>‹</button><span>'+loc(BI('Seite','Page'))+' '+(this.territoryPage+1)+' / '+pages+'</span><button class="btn" onclick="World.changeTerritoryPage(1)" '+(this.territoryPage>=pages-1?'disabled':'')+'>›</button></div>';
    html+='<div class="territory-grid">';
    for(const r of pool.slice(this.territoryPage*9,this.territoryPage*9+9)){
      html+='<article class="territory-card '+r.status+'"><div class="world-card-head"><h3>📍 '+loc(r.name)+'</h3><span>'+tr(r.status)+'</span></div>';
      if(r.scouted){
        html+='<div class="plot-grid">'+this.plotKinds.map(k=>'<div><small>'+this.plotName(k)+'</small><b>'+this.available(r,k)+' / '+r.slots[k]+' '+loc(BI('frei','free'))+'</b></div>').join('')+'</div>';
        html+='<p class="world-help">'+loc(BI('Verbleibende Vorkommen','Remaining deposits'))+': 🧱 '+numberText(r.deposits.stone)+' · ⛓️ '+numberText(r.deposits.iron)+'</p>';
        if(r.enemy&&!r.enemy.defeated)html+='<p>'+loc(r.enemy.name)+' · '+tr('level')+' '+r.enemy.level+' · '+r.enemy.strength+' 🛡️ · '+tr(r.enemy.tactic)+'</p>';
      }else html+='<p class="world-help">'+tr('unknown')+' · '+loc(BI('Erkunde Bauplätze, Rohstoffe und Besatzung.','Scout plots, deposits and the garrison.'))+'</p>';
      const kind=!r.scouted?'scout':r.status==='neutral'?'settle':r.status==='conquered'?'secure':null;
      if(kind){const spec=this.projectSpec(kind,r);html+='<div class="world-help">'+this.costText(spec.cost)+' · '+spec.workers+' '+tr('reserved_workers')+' · '+spec.duration+' '+loc(BI('Spieltage','game days'))+'</div><button class="btn" onclick="World.startProject(\''+kind+'\',\''+r.id+'\')" '+(this.canStartProject(kind,r.id)?'':'disabled')+'>'+tr(kind)+'</button>';}
      if(r.status==='hostile'&&r.scouted)html+='<button class="btn" onclick="World.selectEnemy(\''+r.id+'\');UI.closeExp();UI.openWar()">⚔️ '+tr('campaigns')+'</button>';
      if(r.status==='owned'){
        html+='<button class="btn" onclick="World.setRegion(\''+r.id+'\');UI.closeExp()">📍 '+loc(BI('Gebiet anzeigen & hier bauen','View territory & build here'))+'</button>';
        html+='<details><summary>'+loc(BI('Gebäude & Abriss','Buildings & demolition'))+'</summary><p class="world-help">'+tr('protected_building')+'</p>';
        for(const [key,n] of Object.entries(r.buildings)){if(!n||!Config.b[key])continue;html+='<div class="building-manage"><span>'+Config.b[key].i+' '+loc(Config.b[key].n)+' ×'+n+'</span><button class="btn" '+(this.canDemolish(r.id,key)?'':'disabled')+' onclick="World.confirmDemolish(\''+r.id+'\',\''+key+'\')">'+tr('demolish')+'</button></div>';}
        html+='</details>';
      }html+='</article>';
    }
    html+='</div><p class="world-help">'+tr('territory_progress')+'</p><p class="world-help">'+tr('click_help')+'</p>';
    body.innerHTML=html;
  },
  selectEnemy(id){this.selectedEnemy=id;this.warDraft=this.warDraft||{};this.renderWar();},
  setDraft(key,value){this.warDraft=this.warDraft||{};this.warDraft[key]=value;this.renderWarPreview();},
  renderWar(){
    const list=document.getElementById('war-list'),orders=document.getElementById('war-orders');if(!list||!orders)return;
    const active=document.activeElement;if(active&&active.tagName==='INPUT'&&document.getElementById('war-mask').contains(active)){this.renderWarPreview();return;}
    document.getElementById('army-str').innerText=getArmyStr();document.getElementById('def-str').innerText=getDefStr();
    const enemies=this.enemies();
    document.getElementById('war-roster').innerHTML=Kingdom.armyHTML();
    if(!enemies.some(r=>r.id===this.selectedEnemy))this.selectedEnemy=enemies.find(r=>r.scouted)?.id||enemies[0]?.id||null;
    const m=S.world.mission;
    if(m){const r=this.region(m.regionId);orders.innerHTML='<div class="world-notice"><b>⚔️ '+tr('field_army')+' · '+loc(r?.enemy?.name)+'</b><p>'+this.unitCount(m.units)+' '+tr('soldier')+' · '+loc(m.phase==='outbound'?BI('Hinmarsch','Outbound'):BI('Rückmarsch','Returning'))+'</p><p>'+loc(BI('Schlacht an Tag','Battle on day'))+' '+m.battleDay+' · '+loc(BI('Rückkehr an Tag','Return on day'))+' '+m.returnDay+'</p><small>'+tr('army_warning')+'</small></div>';}
    else{
      const home=this.homeUnits();this.warDraft=this.warDraft||{};
      orders.innerHTML='<p class="world-help">'+tr('army_warning')+'</p><div class="army-picker">'+Object.entries(Units).filter(([k])=>k!=='engineer').map(([k,u])=>'<label><span>'+loc(u.n)+'<small>'+tr('home')+': '+home[k]+'</small></span><input type="number" min="0" max="'+home[k]+'" step="1" inputmode="numeric" aria-label="'+loc(u.n)+'" value="'+this.int(this.warDraft[k])+'" oninput="World.setDraft(\''+k+'\',this.value)" onchange="World.setDraft(\''+k+'\',this.value)"></label>').join('')+'</div>'+Siege.pickerHTML()+'<div id="war-preview" aria-live="polite"></div>';
    }
    if(m&&Siege.count(m.siege))orders.innerHTML+='<p class="world-notice">🏗️ '+Object.entries(m.siege).filter(([,n])=>n>0).map(([k,n])=>n+' '+loc(Siege.defs[k].n)).join(' · ')+'</p>';
    const pages=Math.max(1,Math.ceil(enemies.length/8));this.warPage=Math.min(this.warPage||0,pages-1);
    list.innerHTML=enemies.slice(this.warPage*8,this.warPage*8+8).map(r=>'<article class="territory-card '+(r.id===this.selectedEnemy?'selected':'')+'"><div class="world-card-head"><h3>'+loc(r.enemy.name)+'</h3><span>'+tr('level')+' '+r.enemy.level+'</span></div><p>'+loc(r.name)+' · '+tr(r.enemy.tactic)+'</p><p>'+(r.scouted?r.enemy.strength+' 🛡️ · '+loc(BI('Angriffsstärke','Attack strength'))+': '+r.enemy.raidStrength:'❓ '+tr('scout_first'))+'</p><p class="world-help">'+(S.lvl<Config.raid.startLevel?loc(BI('Angriffe ab Burgstufe 6','Attacks from castle level 6')):'⚔️ '+tr('day')+' '+Math.max(r.enemy.nextRaid||0,r.enemy.truceUntil||0,S.world.protectedUntil||0))+' · 🎁 '+Math.round(45+r.enemy.level*8)+' '+SafeT('gold')+' · '+(5+Math.floor(r.enemy.level/3))+' 👑</p><div class="world-actions">'+(r.scouted?'<button class="btn" onclick="World.selectEnemy(\''+r.id+'\')">'+(r.id===this.selectedEnemy?'✓ ':'')+tr('troop_choice')+'</button>':'<button class="btn" onclick="UI.closeWar();UI.openExp()">🧭 '+tr('scout')+'</button>')+'</div></article>').join('')||'<div class="world-notice">🕊️ '+tr('no_enemy')+'</div>';
    list.innerHTML+='<div class="world-pagination"><button class="btn" onclick="World.changeWarPage(-1)" '+(!this.warPage?'disabled':'')+'>‹</button><span>'+loc(BI('Seite','Page'))+' '+(this.warPage+1)+' / '+pages+'</span><button class="btn" onclick="World.changeWarPage(1)" '+(this.warPage>=pages-1?'disabled':'')+'>›</button></div>';
    list.innerHTML+='<p class="world-help">'+tr('troops_help')+'</p><p class="world-help">'+tr('war_timing')+'</p>'+this.historyHTML();
    this.renderWarPreview();
  },
  renderWarPreview(){
    const node=document.getElementById('war-preview');if(!node||S.world.mission)return;
    const p=this.preview(this.selectedEnemy,this.warDraft||{},S,Siege.draft),r=this.region(this.selectedEnemy);
    const warn=p.threat&&p.threat.day<=p.returnDay;
    node.innerHTML='<div class="world-notice"><b>'+loc(r?.enemy?.name||BI('Kein Ziel','No target'))+'</b><p>'+p.count+' 💂 · '+p.attack+' ⚔️</p><div class="plot-grid"><div><small>'+loc(BI('Siegchance','Victory chance'))+'</small><b>'+(p.known?Math.round(p.chance*100)+' %':'?')+'</b></div><div><small>'+loc(BI('Erwartete Verluste','Expected losses'))+'</small><b>'+(p.known?p.losses.min+'–'+p.losses.max:'?')+'</b></div><div><small>'+loc(BI('Marschproviant','March provisions'))+'</small><b>'+p.food+'</b></div><div><small>'+tr('garrison')+'</small><b>'+p.homeDefense+' 🛡️</b></div></div><p>'+loc(BI('Rückkehr an Tag','Return on day'))+' '+p.returnDay+' · '+p.homeCount+' '+tr('soldier')+' '+tr('home')+'</p>'+(warn?'<p class="world-warning">⚠️ '+loc(p.threat.enemy.name)+' · '+loc(BI('Angriff vor Rückkehr','Attack before return'))+' · '+tr('day')+' '+p.threat.day+' · '+p.threat.enemy.raidStrength+' ⚔️</p>':'')+p.errors.map(e=>'<p class="world-help">'+loc(e)+'</p>').join('')+'<button class="btn campaign-launch" '+(p.ok&&!S.paused?'':'disabled')+' onclick="World.launch(World.selectedEnemy,World.warDraft,S,Siege.draft)">'+tr('send_army')+'</button></div>';
    if(p.siege.crew||p.siege.ammo)node.innerHTML+='<p class="world-notice">🏗️ '+Siege.count(p.siege.machines)+' '+tr('siege')+' · '+p.siege.crew+' '+tr('engineers')+' · '+p.siege.ammo+' 🧱 · '+tr('siege_bonus')+': +'+p.siegeBonus+' ⚔️<br>'+loc(BI('Belagerung ergänzt höchstens 60 % der gegnerischen Stärke. Schilde senken Verluste um bis zu 25 %; mindestens ein Verlust bleibt.','Siege adds at most 60% of enemy strength. Shields reduce casualties by up to 25%; at least one loss remains.'))+'</p>';
  },
  historyHTML(){return S.world.history.length?'<details class="world-history"><summary>'+tr('history')+'</summary>'+S.world.history.map(h=>'<p>'+tr('day')+' '+h.day+': '+loc(h.message)+'</p>').join('')+'</details>':'';},
  productionHTML(){
    const r=S.economy.lastTick;
    return '<div class="chain-card"><b>🧭 '+tr('expansion')+'</b><p>'+tr('plot_help')+'</p><p>🧱 '+numberText(this.deposits('stone'))+' · ⛓️ '+numberText(this.deposits('iron'))+' '+loc(BI('im eigenen Boden verbleibend','remaining in owned deposits'))+'</p><button class="btn" onclick="UI.closeProduction();UI.openExp()">🧭 '+tr('expansion')+'</button></div><div class="chain-card"><b>💂 '+tr('army')+'</b><p>'+tr('troops_help')+'</p><p>'+tr('away')+': '+this.unitCount(this.awayUnits())+' · '+loc(BI('Sold zuletzt','Last upkeep'))+': '+numberText(r?.upkeep||0)+' / '+numberText(this.unitCount(S.units)*.15)+' '+SafeT('gold')+'</p>'+(r?.unpaidUpkeep>EPSILON?'<p class="world-warning">'+tr('upkeep_missing')+'</p>':'')+'</div>'+S.world.effects.filter(e=>e.expiresAt>S.day).map(e=>'<div class="world-notice">'+loc(e.label)+' · '+loc(BI('bis Tag','until day'))+' '+(e.expiresAt-1)+'</div>').join('');
  },
  raidInfo(){
    const next=this.upcomingRaid();
    const body=next?dual(lang=>`${loc(next.enemy.name,lang)}\n${lang==='de'?'Angriff an Tag':'Attack on day'} ${next.day} · ${next.enemy.raidStrength} ⚔️\n${trl('garrison',lang)}: ${this.defense(next.enemy)} 🛡️\n${trl('away',lang)}: ${this.unitCount(this.awayUnits())}\n\n${trl('army_warning',lang)}`):dual(lang=>S.lvl<Config.raid.startLevel?(lang==='de'?'Gegner greifen ab Burgstufe 6 an. Die ersten Angriffe werden rechtzeitig angekündigt.':'Enemies attack from castle level 6. Initial attacks are announced in advance.'):trl('no_enemy',lang));
    UI.showModal(BI('Nachbarn & Verteidigung','Neighbours & defense'),body,BI('Schließen','Close'));
  },
  refreshUI(){
    if(!S.world)return;
    this.refreshBuildLocation();Kingdom.refreshMap();
    const threat=this.upcomingRaid(),pill=document.getElementById('raid-pill'),days=threat?Math.max(0,threat.day-S.day):null;
    document.getElementById('raid-in').innerText=days===null?'—':days;
    document.getElementById('raid-unit').innerText=days===null?tr('peace'):tr(days===1?'day_singular':'days');
    pill.title=threat?loc(threat.enemy.name)+' · '+threat.enemy.raidStrength+' ⚔️':tr('peace');pill.classList.toggle('raid-warn',days!==null&&days<=5);
    document.getElementById('s-sold').title=tr('ready')+': '+this.unitCount(this.homeUnits())+' · '+tr('away')+': '+this.unitCount(this.awayUnits())+' · '+tr('busy')+': '+Siege.busy();
    if(document.getElementById('war-mask').style.display==='flex')this.renderWar();
    // Preserve expanded building management and selection controls while reading/editing.
    if(document.getElementById('exp-mask').style.display==='flex'&&!this.demolition){
      const active=document.activeElement,body=document.getElementById('exp-body');
      if(!(active&&['SELECT','INPUT'].includes(active.tagName)&&body.contains(active))&&!body.querySelector('details[open]'))this.renderTerritories();
    }
  }
};
