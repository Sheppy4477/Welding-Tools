const defaults={wireDiameter:0.045,wireFeed:300,efficiency:95,passes:1,weightPerFoot:0.5,arcTime:18,totalTime:60};
const sections=[
 {id:'weight',title:'Weld weight per foot',formula:'Ww = weld geometry area × 12 in × material density',fields:[['weightPerFoot','Weld weight per foot','lb/ft',.106125],['area','Weld geometry area','in²',.03125],['density','Material density','lb/in³',.283]]},
 {id:'deposition',title:'Deposition rate',formula:'Dr = 13.1 × diameter² × wire feed speed × (efficiency / 100)',fields:[['deposition','Deposition rate','lb/hr',7.5603375],['wireDiameter','Wire diameter','in',defaults.wireDiameter],['wireFeed','Wire feed speed','in/min',defaults.wireFeed],['efficiency','Process efficiency','%',defaults.efficiency]]},
 {id:'travel',title:'Travel speed',formula:'Ts = (Dr × weld passes) / (5 × weld metal weight per foot)',fields:[['travel','Travel speed','in/min',3.024135],['deposition','Deposition rate','lb/hr',7.5603375],['passes','Number of weld passes','passes',defaults.passes],['weightPerFoot','Weld metal weight per foot','lb/ft',defaults.weightPerFoot]]},
 {id:'operator',title:'Operator factor',formula:'Of = (arc time / total time) × 100',fields:[['factor','Operator factor','%',30],['arcTime','Arc time','min',defaults.arcTime],['totalTime','Total time','min',defaults.totalTime]]}
];
const form=document.querySelector('#inputs');
const fmt=x=>x.toLocaleString('en-US',{maximumSignificantDigits:8});
for(const [i,config] of sections.entries()){
 const section=document.createElement('section');section.id=config.id+'-calculator';
 const heading=document.createElement('h2');heading.innerHTML=`<span>0${i+1}</span>${config.title}`;section.append(heading);
 const label=document.createElement('label');label.innerHTML='<span>Solve for</span>';const select=document.createElement('select');select.id=config.id+'-target';for(const [key,title] of config.fields)select.add(new Option(title,key));label.append(select);if(config.id==='weight')label.hidden=true;section.append(label);
 const formula=document.createElement('p');formula.className='note';formula.textContent=config.formula;section.append(formula);
 const fields=document.createElement('div');fields.className='fields';
 for(const [key,title,unit,value] of config.fields){const field=document.createElement('label');field.htmlFor=`${config.id}-${key}`;field.innerHTML=`<span>${title}</span><div class="input-wrap"><input id="${config.id}-${key}" data-key="${key}" type="number" min="0" step="any" inputmode="decimal" value="${value}"><small>${unit}</small></div>`;fields.append(field);}
 section.append(fields);const result=document.createElement('div');result.className='calculator-result';result.setAttribute('aria-live','polite');section.append(result);
 const update=()=>{const target=select.value;const values={};for(const input of fields.querySelectorAll('input')){const unknown=input.dataset.key===target;input.disabled=unknown;input.closest('label').hidden=unknown;values[input.dataset.key]=input.value;}
 try{const answer=WeldCalculator.solve(config.id,target,values);const [,title,unit]=config.fields.find(f=>f[0]===target);result.innerHTML='';const name=document.createElement('h3');name.textContent=title;const output=document.createElement('div');output.className='hero-value';output.textContent=fmt(answer);const units=document.createElement('span');units.textContent=unit;output.append(units);result.append(name,output);fields.querySelector(`[data-key="${target}"]`).value=answer;}
 catch(e){result.textContent=e.message;}};
 section.addEventListener('input',update);select.addEventListener('change',update);form.append(section);config.update=update;
 if(config.id==='weight'){
  const importButton=document.createElement('button');importButton.type='button';importButton.textContent='Use latest geometry result';
  const transfer=document.createElement('button');transfer.type='button';transfer.textContent='Use weight in travel calculator';
  const message=document.createElement('p');message.className='note';message.setAttribute('role','status');
  importButton.onclick=()=>{try{const data=JSON.parse(localStorage.getItem('weld-tools-geometry-result-v1'));if(!data||!Number.isFinite(data.area)||data.area<=0||!Number.isFinite(data.density)||data.density<=0)throw Error('Open Geometry & weight and calculate a valid weld first.');select.value='weightPerFoot';document.getElementById('weight-area').value=data.area;document.getElementById('weight-density').value=data.density;update();message.textContent='Imported the latest weld area and density. Combined fillets and reinforcement are included when applicable.';}catch(e){message.textContent=e.message;}};
  transfer.onclick=()=>{try{const target=select.value;const known=Object.fromEntries(config.fields.map(([key])=>[key,document.getElementById('weight-'+key).value]));const solved=WeldCalculator.solve('weight',target,known);known[target]=solved;const weight=Number(known.weightPerFoot);if(weight<=0)throw Error('Weld weight per foot must be greater than zero for travel speed.');document.getElementById('travel-weightPerFoot').value=weight;document.getElementById('travel-target').value='travel';sections.find(c=>c.id==='travel').update();message.textContent='Weld weight per foot copied to the travel speed calculator.';}catch(e){message.textContent=e.message;}};
  section.append(importButton,transfer,message);
 }

}
function snapshot(){return Object.fromEntries(sections.map(c=>[c.id,{target:document.getElementById(c.id+'-target').value,values:Object.fromEntries(c.fields.map(([key])=>[key,document.getElementById(`${c.id}-${key}`).value]))}]));}
function load(saved){for(const c of sections){const data=saved?.[c.id];const select=document.getElementById(c.id+'-target');select.value=c.id!=='weight'&&c.fields.some(f=>f[0]===data?.target)?data.target:c.fields[0][0];for(const [key,,,value] of c.fields)document.getElementById(`${c.id}-${key}`).value=data?.values?.[key]??value;c.update();}}
form.addEventListener('submit',e=>e.preventDefault());document.querySelector('#print').onclick=()=>window.print();
document.querySelector('#save').onclick=()=>{try{localStorage.setItem('weld-tools-production-v3',JSON.stringify(snapshot()));document.querySelector('#status').textContent='All calculator inputs saved in this browser.';}catch{document.querySelector('#status').textContent='Browser storage unavailable. Print to keep a copy.';}};
document.querySelector('#reset').onclick=()=>{load();document.querySelector('#status').textContent='All calculator inputs reset.';};
try{load(JSON.parse(localStorage.getItem('weld-tools-production-v3')));}catch{load();}
