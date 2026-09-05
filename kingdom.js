/* STRONHOLD v8. Original resource dependencies; deliberately adapted game-day rates.
 * Reference: Firefly's Stronghold HD manual, sections 4, 6.1, 9 and 10.2–10.3.
 * Engineers are people in S.units; machines are equipment in S.siege.units.
 */
'use strict';

Object.assign(T,{mace:BI('Streitkolben','Mace'),cow:BI('Kuh','Cow')});
Object.assign(I18N.strings,T,{
  forest:BI('Waldplätze','Woodland plots'),free_plots:BI('freie Bauplätze','free plots'),
  all_territories:BI('Alle Gebiete · automatisch bauen','All territories · automatic building'),
  plot_help:BI('Jedes Gebäude belegt einen passenden Bauplatz. Wähle über der Karte das Gebiet für Ansicht und Neubauten. Alle Gebiete produzieren weiter; Arbeiter werden für das gesamte Lehen zugeteilt. Landwirtschaft braucht fruchtbares Land, Bergbau endliche Vorkommen. Abriss gibt den Platz frei.','Every building occupies a suitable plot. Above the map, choose the territory to view and build in. All territories keep producing; workers are assigned across the whole fief. Farms need fertile land, mines finite deposits. Demolition frees the plot.'),
  territory_progress:BI('Nach je zwei weiteren erschlossenen Gebieten öffnet sich eine neue Grenze – ohne letzte Stufe. Dafür muss mindestens ein Gegner je Grenzabschnitt besiegt werden. Entdeckte Gegner behalten ihre Stärke.','Every two more developed territories open a new frontier, with no final tier. This requires defeating at least one enemy per frontier. Discovered enemies retain their strength.'),
  beer_explain:BI('Hopfen → Brauerei → Bier → Wirtshaus. Ein besetztes Wirtshaus versorgt bis zu 30 Bewohner mit je 0,2 Bier pro Tag. Ohne Wirtshaus bleibt Bier im Lager; vollständige Versorgung bringt +3 Stimmung.','Hops → brewery → ale → inn. A staffed inn serves up to 30 residents at 0.2 ale each per day. Without an inn, ale remains in storage; full coverage gives +3 mood.'),
  dairy_explain:BI('Milchviehhöfe ziehen bis zu drei Kühe auf. Mit drei Kühen liefern sie Käse. Eine Gerberei verarbeitet eine Kuh zu drei Lederrüstungen; der Hof muss die Kuh nachzüchten und liefert währenddessen keinen Käse. Pausiere Gerbereien, um die Milchversorgung zu schützen.','Dairy farms raise up to three cows. With three cows they produce cheese. A tanner turns one cow into three leather suits; the farm must replace it and produces no cheese meanwhile. Pause tanners to protect dairy supplies.'),
  recipe_base:BI('Rezepte zeigen Materialverhältnisse. Durchsatz, Nachzucht und Bauzeiten sind auf unsere Spieltage abgestimmt. Eine voll besetzte Mühle versorgt bis zu sechs Bäckereien; Jahreszeit und Boni verändern den tatsächlichen Durchsatz.','Recipes show material ratios. Throughput, breeding and construction times are adapted to our game days. A fully staffed mill supplies up to six bakeries; seasons and bonuses affect actual throughput.'),
  leather_chain:BI('Milchvieh & Lederrüstungen','Dairy cattle & leather armor'),weapon_chain:BI('Waffen & Rüstungen','Weapons & armor'),
  raising_cows:BI('Nachzucht · Käse erst mit drei Kühen','Breeding · cheese requires three cows'),
  herd_missing:BI('Keine ausgewachsene Herde verfügbar','No mature herd available'),
  tanning_progress:BI('Gerbung in Arbeit','Tanning in progress'),
  need_guild:BI('Baumeistergilde fehlt','Engineers’ guild required'),
  siege:BI('Belagerungsgeräte','Siege equipment'),engineers:BI('Baumeister','Engineers'),
  army_overview:BI('Truppenbestand','Army roster'),total:BI('Gesamt','Total'),ready:BI('Verfügbar','Available'),busy:BI('Im Bau gebunden','Building equipment'),
  no_siege_crew:BI('Für die gewählten Geräte fehlen verfügbare Baumeister.','Not enough available engineers for the selected equipment.'),
  invalid_siege:BI('Diese Belagerungsgeräte sind nicht verfügbar.','This siege equipment is not available.'),
  siege_help:BI('Baumeister bauen und bedienen Geräte. Beim Feldzug wird die Besatzung automatisch mitgeschickt und fehlt zu Hause. Steine für Katapulte und Triboke werden beim Aufbruch geladen. Geräte können zerstört werden; ohne überlebende Besatzung müssen sie aufgegeben werden.','Engineers build and operate equipment. Campaigns automatically take the required crew, leaving fewer people at home. Catapults and trebuchets load stone ammunition on departure. Equipment can be destroyed; without surviving crew it must be abandoned.'),
  siege_bonus:BI('Belagerungswirkung','Siege effect'),crew:BI('Besatzung','Crew'),ammunition:BI('Steinmunition','Stone ammunition'),
  workshop_variants:BI('Spezialisierte Werkstatt','Specialized workshop')
});

Rules.marketTypes.push('mace');
MarketGoods.mace={buy:110,sell:50};
// The original's wood/iron requirements are independent of our production speed.
Config.b.fletch.recipe={input:{wood:2},output:{bow:1}};
Config.b.crosswork.n=BI('Bogenmacher · Armbrüste','Fletcher · crossbows');
Config.b.crosswork.cost={...Config.b.fletch.cost};
Config.b.crosswork.recipe={input:{wood:3},output:{crossbow:1}};
Config.b.pikesmith.n=BI('Drechslerei · Piken','Poleturner · pikes');
Config.b.pikesmith.cost={...Config.b.pole.cost};
Config.b.pikesmith.recipe={input:{wood:2},output:{pike:1}};
Config.b.pole.n=BI('Drechslerei · Speere','Poleturner · spears');
Config.b.macesmith={n:BI('Schmiede · Streitkolben','Blacksmith · maces'),c:'waffen',i:'🔨',z:'z-town',cost:{g:180,w:80},stage:4,recipe:{input:{iron:1},output:{mace:1}}};
Config.b.mill.workers=3;
Config.b.bake.recipe={input:{flour:1},output:{bread:4}};
Config.b.brew.recipe={input:{hops:1},output:{beer:4}};
Config.b.inn={n:BI('Wirtshaus','Inn'),c:'nahrung',i:'🍻',z:'z-town',cost:{g:100,w:20},service:true,desc:BI('Bierausschank für 30 Bewohner','Ale service for 30 residents')};
Config.b.dairy.n=BI('Milchviehhof','Dairy farm');
Config.b.dairy.desc=BI('3 Kühe: Käse · Kuh für Gerberei','3 cows: cheese · cows for tanners');
Config.b.tannery.c='waffen';Config.b.tannery.i='🦺';Config.b.tannery.stage=4;
Config.b.tannery.recipe={input:{cow:1},output:{leatherArmor:3}};
Config.b.tannery.desc=BI('Eine Kuh → drei Lederrüstungen','One cow → three leather suits');
// Retain legacy keys for lossless conversion, but never offer obsolete buildings.
Config.b.cattle.legacy=true;Config.b.leatherwork.legacy=true;
Config.b.engineerGuild={n:BI('Baumeistergilde','Engineers’ guild'),c:'burg',i:'📐',z:'z-town',cost:{g:300,w:100,s:50},unique:true,desc:BI('Baumeister & Belagerungsgeräte','Engineers & siege equipment')};
Config.b.outpost.z='z-town';
Units.pikeman.arm='armor';
Units.maceman={n:BI('Streitkolbenkämpfer','Maceman'),cost:25,res:'mace',arm:'leatherArmor',str:16,def:5,desc:BI('Starke Sturmtruppe mit Lederrüstung.','Strong assault infantry with leather armor.')};
Units.engineer={n:BI('Baumeister','Engineer'),cost:30,str:0,def:0,guild:true,desc:BI('Baut und bedient Belagerungsgeräte; kämpft nicht selbst.','Builds and operates siege equipment; does not fight directly.')};
FoodWorkerPriority.push('inn');ReleaseWorkerPriority.unshift('macesmith','inn');

const Kingdom={
  basePlots:{settlement:36,forest:10,fertile:16,stone:4,iron:3},
  staffCapacity(key,state=S){return (state.b[key]||0)*(Config.b[key]?.workers||1);},
  selected(state=S){return World.owned(state).filter(r=>state.world.selectedRegion==='auto'||r.id===state.world.selectedRegion);},
  visibleCount(key,state=S){return this.selected(state).reduce((n,r)=>n+(r.buildings[key]||0),0);},
  free(kind,state=S){return this.selected(state).reduce((n,r)=>n+(['stone','iron'].includes(kind)&&r.deposits[kind]<=EPSILON?0:World.available(r,kind)),0);},
  migrate(state,version){
    const w=state.world,home=World.region('home',state)||w.regions[0];
    for(const [old,key] of [['cattle','dairy'],['leatherwork','tannery']]){
      state.b[key]+=state.b[old]||0;state.w[key]+=state.w[old]||0;state.staffing.targets[key]+=state.staffing.targets[old]||0;
      state.b[old]=0;state.w[old]=0;state.staffing.targets[old]=0;
      for(const r of w.regions){r.buildings[key]=(r.buildings[key]||0)+(r.buildings[old]||0);delete r.buildings[old];}
    }
    if((w.version||0)<2){
      for(const r of w.regions){
        r.slots.forest=Math.max(r.slots.forest||0,World.used(r,'forest')+(r.id===home.id?10:5));
        if(r===home)for(const [k,n] of Object.entries(this.basePlots))r.slots[k]=Math.max(r.slots[k]||0,n,World.used(r,k)+Math.ceil(n/3));
      }
      w.selectedRegion=w.selectedRegion==='auto'?home.id:w.selectedRegion;
      if(version<8)w.protectedUntil=Math.max(w.protectedUntil||0,state.day+16);
      // Previously ale was served without a building. Give existing brewers an inn.
      if(version<8&&state.b.brew>0&&!state.b.inn){state.b.inn=1;home.buildings.inn=1;state.staffing.targets.inn=1;home.slots.settlement=Math.max(home.slots.settlement,World.used(home,'settlement'));}
      w.version=2;
    }
    if(!World.owned(state).some(r=>r.id===w.selectedRegion)&&w.selectedRegion!=='auto')w.selectedRegion=home.id;
    state.husbandry=state.husbandry||{herds:[],tanning:0};
    if(!Array.isArray(state.husbandry.herds))state.husbandry.herds=[];
    this.syncHerds(state,version<8);
    for(const herd of state.husbandry.herds){herd.cows=clamp(World.int(herd.cows),0,3);herd.growth=clamp(Number(herd.growth)||0,0,4);}
    state.husbandry.tanning=clamp(Number(state.husbandry.tanning)||0,0,1);
    Siege.migrate(state);reconcileWorkforce(state);
  },
  syncHerds(state=S,mature=false){
    const h=state.husbandry.herds,count=state.b.dairy||0;
    h.length=Math.min(h.length,count);
    while(h.length<count)h.push({cows:mature?3:0,growth:0});
    return h;
  },
  cows(state=S){return state.husbandry.herds.reduce((n,h)=>n+h.cows,0);},
  specialProduction(key,state,report,scale){
    if(key!=='dairy'&&key!=='tannery')return false;
    const workers=state.w[key]||0,mult=productionMultiplier(state)*scale;
    const row={workers,target:state.staffing.targets[key]||0,capacity:workers*mult,cycles:0,input:{},output:{},missing:[],status:!state.b[key]?'not_built':!workers?'no_workers':'running'};
    const herds=this.syncHerds(state);
    if(key==='dairy'){
      let producing=0;
      herds.slice(0,workers).forEach(h=>{
        if(h.cows<3){h.growth+=mult;while(h.growth+EPSILON>=4&&h.cows<3){h.growth=roundQty(h.growth-4);h.cows++;}}
        if(h.cows===3){h.growth=0;producing++;}
      });
      row.cycles=producing*mult;
      if(workers&&producing<workers)row.status='raising_cows';
      const made=roundQty(row.cycles*2*seasonMultiplier('cheese',state.day));
      if(made){addAmount(state.res,'cheese',made);addAmount(report.produced,'cheese',made);row.output.cheese=made;}
    }else if(workers){
      // Old hides/leather stay usable; no new artificial intermediate goods are made.
      let budget=workers*mult,armor=0;
      const leather=Math.min(state.res.leather||0,budget);budget-=leather;armor+=leather;
      if(leather){addAmount(state.res,'leather',-leather);row.input.leather=leather;addAmount(report.inputs,'leather',leather);}
      state.husbandry.tanning+=budget/3;
      let cycles=Math.floor(state.husbandry.tanning+EPSILON);
      while(cycles>0){
        const herd=herds.find(h=>h.cows===3);
        if((state.res.hides||0)>=1){addAmount(state.res,'hides',-1);addAmount(row.input,'hides',1);addAmount(report.inputs,'hides',1);}
        else if(herd){herd.cows--;herd.growth=0;addAmount(row.input,'cow',1);addAmount(report.inputs,'cow',1);}
        else break;
        armor+=3;cycles--;state.husbandry.tanning=Math.max(0,roundQty(state.husbandry.tanning-1));
      }
      // A blocked tannery cannot bank unlimited work for a future herd.
      state.husbandry.tanning=Math.min(state.husbandry.tanning,1);
      row.cycles=armor/3;
      if(armor){addAmount(state.res,'leatherArmor',armor);addAmount(report.produced,'leatherArmor',armor);row.output.leatherArmor=armor;}
      if(!armor&&!herds.some(h=>h.cows===3)&&!(state.res.hides>=1)){row.status='herd_missing';row.missing=['cow'];}
      else if(!armor)row.status='tanning_progress';
    }
    report.buildings[key]=row;return true;
  },
  names(band,index,state=S){
    const prefixes=[BI('Falken','Falcon'),BI('Eichen','Oak'),BI('Raben','Raven'),BI('Wolfs','Wolf'),BI('Silber','Silver'),BI('Dorn','Thorn'),BI('Rosen','Rose'),BI('Eisen','Iron'),BI('Adler','Eagle'),BI('Sonnen','Sun'),BI('Nebel','Mist'),BI('Eschen','Ash'),BI('Bären','Bear'),BI('Linden','Linden'),BI('Hirsch','Stag'),BI('Winter','Winter')];
    const suffixes=[BI('fels','crag'),BI('tal','vale'),BI('hain','grove'),BI('furt','ford'),BI('wacht','watch'),BI('mark','march'),BI('au','meadow'),BI('berg','hill'),BI('quell','spring'),BI('ried','fen'),BI('horst','nest'),BI('brück','bridge')];
    const pick=a=>a[Math.floor(World.random(state)*a.length)];
    const a=pick(prefixes),b=pick(suffixes);let place=dual(lang=>loc(a,lang)+loc(b,lang));
    if(state.world.regions.some(r=>loc(r.name,'de')===place.de))place=dual(lang=>loc(a,lang)+loc(b,lang)+' · '+(band*3+index+1));
    const women=['Adelheid','Eleonore','Mathilde','Isolde','Agnes','Beatrix','Hedwig','Konstanze','Ida','Johanna','Margarete','Sibylle'];
    const men=['Konrad','Friedrich','Otto','Heinrich','Albrecht','Dietrich','Ulrich','Ludwig','Wilhelm','Rudolf','Berthold','Gottfried'];
    const ranks=[['Ritter','Ritterin','Knight','Dame'],['Baron','Baronin','Baron','Baroness'],['Graf','Gräfin','Count','Countess'],['Herzog','Herzogin','Duke','Duchess'],['Fürst','Fürstin','Prince','Princess'],['König','Königin','King','Queen'],['Kaiser','Kaiserin','Emperor','Empress']];
    const progress=Math.max(state.lvl||1,1+band*4),rank=ranks[Math.min(ranks.length-1,Math.floor(Math.log2(1+progress/4)))],female=World.random(state)<.5,first=pick(female?women:men);
    const titles=[BI('vom Nordwind','of the North Wind'),BI('vom Roten Banner','of the Red Banner'),BI('von der Silberküste','of the Silver Coast'),BI('vom Hohen Rat','of the High Council')];
    // Gender-neutral epithets for advanced ranks; territory identity is never reused.
    const epithet=progress>=35?pick(titles):null;
    return {place,lord:dual(lang=>(lang==='de'?rank[female?1:0]:rank[female?3:2])+' '+first+(lang==='de'?' von ':' of ')+loc(place,lang)+(epithet?' · '+loc(epithet,lang):''))};
  },
  refreshMap(){
    const bar=document.getElementById('territory-nav');if(!bar)return;
    const options='<option value="auto" '+(S.world.selectedRegion==='auto'?'selected':'')+'>'+tr('all_territories')+'</option>'+World.owned().map(r=>'<option value="'+r.id+'" '+(r.id===S.world.selectedRegion?'selected':'')+'>'+loc(r.name)+'</option>').join('');
    const signature=I18N.lang+'|'+S.world.selectedRegion+'|'+World.owned().length;
    if(this.navSignature!==signature){
      bar.innerHTML='<button type="button" onclick="Kingdom.cycleRegion(-1)" aria-label="'+loc(BI('Vorheriges Gebiet','Previous territory'))+'">‹</button><label>📍 <select id="map-territory" aria-label="'+loc(BI('Angezeigtes Baugebiet','Displayed build territory'))+'" onchange="World.setRegion(this.value)">'+options+'</select></label><button type="button" onclick="Kingdom.cycleRegion(1)" aria-label="'+loc(BI('Nächstes Gebiet','Next territory'))+'">›</button><button type="button" onclick="UI.openExp()" aria-label="'+tr('expansion')+'">🧭 <span>'+World.owned().length+'</span></button>';
      this.navSignature=signature;
    }
    const badges={forest:[['🌲','forest']],mountain:[['🧱','stone'],['⛓️','iron']],town:[['🏠','settlement']],farm:[['🌾','fertile']]};
    for(const [zone,kinds] of Object.entries(badges)){
      const n=document.getElementById('plots-'+zone);if(n){n.innerText=kinds.map(([icon,k])=>icon+' '+numberText(this.free(k))).join(' · ')+' '+loc(BI('frei','free'));n.title=kinds.map(([,k])=>World.plotName(k)+': '+this.free(k)).join(' · ');}
    }
  },
  cycleRegion(dir){const ids=['auto',...World.owned().map(r=>r.id)],at=ids.indexOf(S.world.selectedRegion);World.setRegion(ids[(at+dir+ids.length)%ids.length]);},
  armyHTML(state=S){
    const home=World.homeUnits(state),away=World.awayUnits(state),busy=Siege.busy(state),total=World.unitCount(state.units);
    return '<section class="army-roster"><h3>🛡️ '+tr('army_overview')+'</h3><div class="army-totals"><span><b>'+total+'</b>'+tr('total')+'</span><span><b>'+World.unitCount(home)+'</b>'+tr('ready')+'</span><span><b>'+World.unitCount(away)+'</b>'+tr('away')+'</span><span><b>'+busy+'</b>'+tr('busy')+'</span></div><div class="roster-scroll"><table><thead><tr><th>'+tr('army')+'</th><th>'+tr('total')+'</th><th>'+tr('ready')+'</th><th>'+tr('away')+'</th></tr></thead><tbody>'+Object.entries(Units).map(([k,u])=>'<tr'+(!(state.units[k]>0)?' class="empty-unit"':'')+'><th>'+loc(u.n)+(k==='engineer'&&busy?' <small>('+busy+' '+tr('busy')+')</small>':'')+'</th><td>'+(state.units[k]||0)+'</td><td>'+home[k]+'</td><td>'+(away[k]||0)+'</td></tr>').join('')+'</tbody></table></div><p>'+tr('garrison')+': <b>'+World.defense(null,home,state)+' 🛡️</b> · '+tr('upkeep')+': '+numberText(total*.15)+' '+SafeT('gold')+'/'+loc(BI('Tag','day'))+'</p></section>';
  },
  productionHTML(){
    const h=S.husbandry.herds,mature=h.filter(x=>x.cows===3).length;
    return '<div class="chain-card"><b>🐄 '+loc(Config.b.dairy.n)+'</b><p>'+this.cows()+' / '+h.length*3+' '+loc(BI('Kühe','cows'))+' · '+mature+' / '+h.length+' '+loc(BI('Höfe mit drei Kühen','farms with three cows'))+'</p><p>'+loc(BI('Nachzucht: eine Kuh je vier Arbeitstage. Gerbereien verbrauchen zuerst vorhandene Rohhäute und Leder aus älteren Spielständen.','Breeding: one cow per four working days. Tanners first use existing hides and leather from earlier saves.'))+'</p><p>'+tr('tanning_progress')+': '+Math.floor(S.husbandry.tanning*100)+' %</p></div>';
  }
};

const Siege={
  defs:{
    shield:{n:BI('Tragbarer Schild','Portable shield'),i:'🛡️',crew:1,cost:{gold:40,wood:15},days:2,breach:0,ammo:0,cover:5},
    catapult:{n:BI('Katapult','Catapult'),i:'🪨',crew:2,cost:{gold:150,wood:60},days:3,breach:24,ammo:10,cover:0},
    trebuchet:{n:BI('Tribok','Trebuchet'),i:'🏗️',crew:3,cost:{gold:300,wood:100},days:5,breach:52,ammo:20,cover:0},
    ram:{n:BI('Rammbock','Battering ram'),i:'🪵',crew:4,cost:{gold:200,wood:80},days:4,breach:42,ammo:0,cover:0},
    siegeTower:{n:BI('Belagerungsturm','Siege tower'),i:'🗼',crew:4,cost:{gold:250,wood:100},days:5,breach:30,ammo:0,cover:2}
  },
  draft:{},
  migrate(state){
    state.siege=state.siege||{units:{},project:null};state.siege.units=state.siege.units||{};
    for(const k in this.defs)state.siege.units[k]=World.int(state.siege.units[k]);
    const p=state.siege.project;
    if(p&&(!this.defs[p.key]||!Number.isFinite(p.finishDay)||this.defs[p.key].crew>(state.units.engineer||0)-(World.awayUnits(state).engineer||0)))state.siege.project=null;
  },
  busy(state=S){return this.defs[state.siege?.project?.key]?.crew||0;},
  available(key,state=S){return Math.max(0,(state.siege?.units[key]||0)-(state.world.mission?.siege?.[key]||0));},
  count(equipment){return Object.keys(this.defs).reduce((n,k)=>n+World.int(equipment?.[k]),0);},
  crew(equipment){return Object.entries(this.defs).reduce((n,[k,d])=>n+World.int(equipment?.[k])*d.crew,0);},
  canBuild(key,state=S){const d=Object.prototype.hasOwnProperty.call(this.defs,key)&&this.defs[key];return !!d&&!state.paused&&state.b.engineerGuild>0&&!state.siege.project&&World.homeUnits(state).engineer>=d.crew&&World.canPay(d.cost,state);},
  build(key,state=S){
    if(!this.canBuild(key,state))return false;
    const d=this.defs[key];World.pay(d.cost,state);state.siege.project={key,startDay:state.day,finishDay:state.day+d.days};
    UI.update();return true;
  },
  advance(state=S){
    const p=state.siege.project;if(!p||state.day<p.finishDay)return;
    state.siege.project=null;state.siege.units[p.key]++;
    World.record(dual(lang=>loc(this.defs[p.key].n,lang)+(lang==='de'?' fertiggestellt.':' completed.')),'prod',state);
  },
  prepare(draft,equipment={},state=S){
    const units={...draft},machines={},errors=[];let potential=0,ammo=0,cover=0;
    for(const [k,v] of Object.entries(equipment||{})){
      const n=Number(v),d=this.defs[k];
      if(!Object.prototype.hasOwnProperty.call(this.defs,k)||!d||!Number.isInteger(n)||n<0||n>this.available(k,state)){errors.push(I18N.strings.invalid_siege);continue;}
      machines[k]=n;potential+=n*d.breach;ammo+=n*d.ammo;cover+=n*d.cover;
    }
    const crew=this.crew(machines);
    // Engineers are selected by machine crew requirements, never counted twice.
    if(crew){units.engineer=crew;if(World.homeUnits(state).engineer<crew)errors.push(I18N.strings.no_siege_crew);}
    if(ammo>state.res.stone+EPSILON)errors.push(BI('Für die Belagerung fehlt Steinmunition.','Not enough stone ammunition for the siege.'));
    const combat=Object.keys(Units).filter(k=>k!=='engineer').reduce((n,k)=>n+World.int(units[k]),0);
    return {units,machines,crew,potential,ammo,cover,errors,protection:Math.min(.25,cover/Math.max(1,combat)*.25)};
  },
  afterBattle(m,win,state=S){
    if(!m.siege)return;
    const lost={};
    for(const k in m.siege){const n=m.siege[k],loss=win?Math.floor(n*.12):Math.ceil(n*.55);if(loss){m.siege[k]-=loss;state.siege.units[k]-=loss;lost[k]=loss;}}
    // Survivors cannot bring home machines they no longer have enough crew for.
    for(const k of ['shield','siegeTower','ram','catapult','trebuchet']){
      while(m.siege[k]>0&&this.crew(m.siege)>(m.units.engineer||0)){m.siege[k]--;state.siege.units[k]--;lost[k]=(lost[k]||0)+1;}
    }
    m.result.siegeLosses=lost;
    if(this.count(lost))World.record(dual(lang=>(lang==='de'?'Verlorene Geräte: ':'Equipment lost: ')+Object.entries(lost).map(([k,n])=>n+' '+loc(this.defs[k].n,lang)).join(', ')),'war',state);
  },
  setDraft(key,value){this.draft[key]=value;World.renderWarPreview();},
  pickerHTML(){return '<h3>🏗️ '+tr('siege')+'</h3><p class="world-help">'+tr('siege_help')+'</p><div class="army-picker">'+Object.entries(this.defs).filter(([k])=>this.available(k)>0).map(([k,d])=>'<label><span>'+d.i+' '+loc(d.n)+'<small>'+tr('ready')+': '+this.available(k)+' · '+d.crew+' '+tr('engineers')+'</small></span><input type="number" min="0" max="'+this.available(k)+'" step="1" inputmode="numeric" aria-label="'+loc(d.n)+'" value="'+World.int(this.draft[k])+'" oninput="Siege.setDraft(\''+k+'\',this.value)"></label>').join('')+'</div>';},
  render(){
    const p=S.siege.project;
    let html='<h3>📐 '+loc(Config.b.engineerGuild.n)+'</h3><p class="world-help">'+tr('siege_help')+'</p>';
    if(!S.b.engineerGuild)html+='<p class="world-warning">'+tr('need_guild')+' · '+loc(BI('Bauen unter 🏰','Build under 🏰'))+'</p>';
    html+='<p>'+tr('engineers')+': '+World.homeUnits().engineer+' '+tr('ready')+' · '+this.busy()+' '+tr('busy')+' · '+(World.awayUnits().engineer||0)+' '+tr('away')+'</p>';
    if(p)html+='<div class="world-notice" role="status">⌛ '+loc(this.defs[p.key].n)+' · '+loc(BI('fertig an Tag','complete on day'))+' '+p.finishDay+' · '+Math.max(0,p.finishDay-S.day)+' '+tr('days')+'</div>';
    html+='<div class="territory-grid">'+Object.entries(this.defs).map(([k,d])=>'<article class="territory-card"><h3>'+d.i+' '+loc(d.n)+'</h3><div class="army-totals"><span><b>'+(S.siege.units[k]||0)+'</b>'+tr('total')+'</span><span><b>'+this.available(k)+'</b>'+tr('ready')+'</span><span><b>'+(S.world.mission?.siege?.[k]||0)+'</b>'+tr('away')+'</span></div><p>'+tr('crew')+': '+d.crew+' '+tr('engineers')+' · '+d.days+' '+tr('days')+'</p><p>'+World.costText(d.cost)+'</p><p class="world-help">'+(d.breach?tr('siege_bonus')+': +'+d.breach+' ⚔️':loc(BI('Schützt fünf Soldaten vor Beschuss','Shields five soldiers from missiles')))+(d.ammo?' · '+d.ammo+' 🧱 / '+loc(BI('Feldzug','campaign')):'')+'</p><button class="btn" onclick="Siege.build(\''+k+'\')" '+(this.canBuild(k)?'':'disabled')+'>'+loc(BI('Gerät bauen','Build equipment'))+'</button></article>').join('')+'</div>';
    return html;
  }
};
