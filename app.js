const defaults={wireDiameter:0.045,wireFeed:300,efficiency:95,passes:1,weightPerFoot:0.5,arcTime:18,totalTime:60};
const sections=[
 {id:'deposition',title:'Deposition rate',formula:'Dr = 13.1 × diameter² × wire feed speed × (efficiency / 100)',fields:[['deposition','Deposition rate','lb/hr',7.5603375],['wireDiameter','Wire diameter','in',defaults.wireDiameter],['wireFeed','Wire feed speed','in/min',defaults.wireFeed],['efficiency','Process efficiency','%',defaults.efficiency]]},
 {id:'travel',title:'Travel speed',formula:'Ts = (Dr × weld passes) / (5 × weld metal weight per foot)',fields:[['travel','Travel speed','in/min',3.024135],['deposition','Deposition rate','lb/hr',7.5603375],['passes','Number of weld passes','passes',defaults.passes],['weightPerFoot','Weld metal weight per foot','lb/ft',defaults.weightPerFoot]]},
 {id:'operator',title:'Operator factor',formula:'Of = (arc time / total time) × 100',fields:[['factor','Operator factor','%',30],['arcTime','Arc time','min',defaults.arcTime],['totalTime','Total time','min',defaults.totalTime]]}
];
const form=document.querySelector('#inputs');
const fmt=x=>x.toLocaleString('en-US',{maximumSignificantDigits:8});
for(const [i,config] of sections.entries()){
 const section=document.createElement('section');section.id=config.id+'-calculator';
 const heading=document.createElement('h2');heading.innerHTML=`<span>0${i+1}</span>${config.title}`;section.append(heading);
 const label=document.createElement('label');label.innerHTML='<span>Solve for</span>';const select=document.createElement('select');select.id=config.id+'-target';for(const [key,title] of config.fields)select.add(new Option(title,key));label.append(select);section.append(label);
 const formula=document.createElement('p');formula.className='note';formula.textContent=config.formula;section.append(formula);
 const fields=document.createElement('div');fields.className='fields';
 for(const [key,title,unit,value] of config.fields){const field=document.createElement('label');field.htmlFor=`${config.id}-${key}`;field.innerHTML=`<span>${title}</span><div class="input-wrap"><input id="${config.id}-${key}" data-key="${key}" type="number" min="0" step="any" inputmode="decimal" value="${value}"><small>${unit}</small></div>`;fields.append(field);}
 section.append(fields);const result=document.createElement('div');result.className='calculator-result';result.setAttribute('aria-live','polite');section.append(result);
 const update=()=>{const target=select.value;const values={};for(const input of fields.querySelectorAll('input')){const unknown=input.dataset.key===target;input.disabled=unknown;input.closest('label').hidden=unknown;values[input.dataset.key]=input.value;}
 try{const answer=WeldCalculator.solve(config.id,target,values);const [,title,unit]=config.fields.find(f=>f[0]===target);result.innerHTML='';const name=document.createElement('h3');name.textContent=title;const output=document.createElement('div');output.className='hero-value';output.textContent=fmt(answer);const units=document.createElement('span');units.textContent=unit;output.append(units);result.append(name,output);fields.querySelector(`[data-key="${target}"]`).value=answer;}
 catch(e){result.textContent=e.message;}};
 section.addEventListener('input',update);select.addEventListener('change',update);form.append(section);config.update=update;
}
function snapshot(){return Object.fromEntries(sections.map(c=>[c.id,{target:document.getElementById(c.id+'-target').value,values:Object.fromEntries(c.fields.map(([key])=>[key,document.getElementById(`${c.id}-${key}`).value]))}]));}
function load(saved){for(const c of sections){const data=saved?.[c.id];const select=document.getElementById(c.id+'-target');select.value=c.fields.some(f=>f[0]===data?.target)?data.target:c.fields[0][0];for(const [key,,,value] of c.fields)document.getElementById(`${c.id}-${key}`).value=data?.values?.[key]??value;c.update();}}
form.addEventListener('submit',e=>e.preventDefault());document.querySelector('#print').onclick=()=>window.print();
document.querySelector('#save').onclick=()=>{try{localStorage.setItem('weld-tools-production-v3',JSON.stringify(snapshot()));document.querySelector('#status').textContent='All calculator inputs saved in this browser.';}catch{document.querySelector('#status').textContent='Browser storage unavailable. Print to keep a copy.';}};
document.querySelector('#reset').onclick=()=>{load();document.querySelector('#status').textContent='All calculator inputs reset.';};
try{load(JSON.parse(localStorage.getItem('weld-tools-production-v3')));}catch{load();}
