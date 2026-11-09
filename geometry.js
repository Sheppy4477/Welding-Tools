const fieldDefs=[
 ['joint','Weld profile',{v:'Symmetric V groove',fillet:'Fillet',bevel:'Single bevel groove',u:'Single U groove'}],
 ['plateWidth','Width of each plate','in'],['depth','Plate thickness / joint depth','in'],['weldLength','Plate length / continuous weld length','in'],
 ['legA','Side 1 fillet leg A','in','fillet'],['legB','Side 1 fillet leg B','in','fillet'],['filletSides','Fillet sides',{single:'One side',both:'Add fillet on opposite side'},'fillet'],['oppositeLegA','Side 2 fillet leg A','in','opposite'],['oppositeLegB','Side 2 fillet leg B','in','opposite'],
 ['landMode','Land / root face',{without:'Without land',with:'With land'},'bevel,u,v'],['land','Land height','in','land'],['gap','Root gap','in','bevel,u,v'],
 ['angle','Bevel angle / total included angle','°','bevel,u,v'],['radius','U root radius','in','u'],
 ['capHeight','Cap reinforcement height','in','bevel,u,v'],['rootHeight','Root reinforcement height','in','bevel,u,v'],
 ['weldDensity','Material / weld density (editable)','lb/in³']
];
const initial={joint:'v',legA:.25,legB:.25,filletSides:'single',oppositeLegA:.25,oppositeLegB:.25,landMode:'with',depth:.5,plateWidth:3,gap:.125,land:.0625,angle:60,radius:.25,weldLength:12,capHeight:.0625,rootHeight:.03125,weldDensity:.283,quantity:1};
function makeField(id,title,unit,value){
 const label=document.createElement('label'),caption=document.createElement('span');caption.textContent=title;label.append(caption);let input;
 if(typeof unit==='object'){input=document.createElement('select');for(const [key,text]of Object.entries(unit))input.add(new Option(text,key));label.append(input);}
 else{const wrap=document.createElement('div');wrap.className='input-wrap';input=document.createElement('input');input.type='number';input.min='0';input.step='any';input.inputMode='decimal';const small=document.createElement('small');small.textContent=unit;wrap.append(input,small);label.append(wrap);}
 input.id=id;input.setAttribute('aria-label',title);input.value=value;return label;
}
for(const [id,title,unit,condition]of fieldDefs){const el=makeField(id,title,unit,initial[id]);el.dataset.show=condition||'';document.getElementById('weldFields').append(el);}
function read(){return {v:Object.fromEntries(Object.keys(initial).map(key=>[key,document.getElementById(key).value]))};}
function draw(weld, inputs) {
 const width = Number(inputs.plateWidth), thickness = Number(inputs.depth);
 const shapes = [weld.profile, ...[weld.oppositeProfile].filter(shape => shape.length)];
 let plates;
 if (weld.type === 'fillet') {
  plates = [
   [[-width/2,-thickness],[width/2,-thickness],[width/2,0],[-width/2,0]],
   [[-thickness,0],[0,0],[0,width],[-thickness,width]]
  ];
 } else {
  const points = weld.profile;
  const heights = points.map(point => point[1]);
  const top = Math.max(...heights);
  const firstTop = heights.indexOf(top);
  const lastTop = heights.lastIndexOf(top);
  const left = weld.type === 'u' ? points.slice(lastTop).reverse() : [points[0], ...points.slice(lastTop).reverse()];
  const right = points.slice(weld.type === 'u' ? 0 : 1, firstTop+1);
  const leftEdge = Math.min(left[0][0]-width, left.at(-1)[0]);
  const rightEdge = Math.max(right[0][0]+width, right.at(-1)[0]);
  plates = [
   [...left,[leftEdge,thickness],[leftEdge,0]],
   [...right,[rightEdge,thickness],[rightEdge,0]]
  ];
 }
 const points = [...plates,...shapes].flat();
 const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
 const left = Math.min(...xs), bottom = Math.min(...ys);
 const w = Math.max(...xs)-left, h = Math.max(...ys)-bottom;
 const scale = Math.min(430/w, 136/h);
 const x = n => 250+(n-left-w/2)*scale;
 const y = n => 90+(h/2-(n-bottom))*scale;
 const polygon = (shape, fill, stroke) => '<polygon points="'+shape.map(p=>x(p[0])+','+y(p[1])).join(' ')+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
 const stock = plates.map(plate => polygon(plate,'#435565','#94a9bb')).join('');
 const fill = shapes.map((shape,i) => polygon(shape,i?'#377a92':'#9b6332',i?'#6bcbea':'#ffb45e')).join('');
 const label = n => n.toLocaleString('en-US',{maximumFractionDigits:4});
 document.getElementById('profile').innerHTML = '<svg viewBox="0 0 500 195" role="img" aria-label="Cross-section showing two plates and weld fill">'
  +stock+fill+'<text x="250" y="176" text-anchor="middle" fill="#d6e0e9" font-size="14">Each plate: '
  +label(width)+' in wide × '+label(thickness)+' in thick</text><text x="250" y="192" text-anchor="middle" fill="#a2b1b0" font-size="11">SCHEMATIC CROSS-SECTION · IDEAL WELD FILL</text></svg>';
}
let stepsPanel;
function update(){const {v}=read();document.getElementById('angle').closest('label').querySelector('span').textContent=v.joint==='bevel'?'Single bevel angle (from vertical)':'Total included angle';document.getElementById('weldDensity').closest('label').querySelector('span').textContent='Material / weld density (editable)';document.getElementById('depth').closest('label').querySelector('span').textContent=v.joint==='fillet'?'Plate thickness':'Plate thickness / joint depth';for(const label of document.querySelectorAll('[data-show]')){const show=label.dataset.show;label.hidden=!!show&&!(show==='opposite'?v.joint==='fillet'&&v.filletSides==='both':show==='land'?v.joint!=='fillet'&&v.landMode==='with':show.split(',').includes(v.joint));}
 document.querySelector('#profileCaption').textContent=v.joint==='fillet'?(v.filletSides==='both'?'Two fillets with independent leg lengths, one on each side. Each runs the entered joint length. Amber: side 1. Blue: side 2.':'One right triangular fillet runs the entered joint length.')+' No cap/root reinforcement or material deduction.':v.joint==='bevel'?'One vertical face and one beveled face. The bevel cutout is deducted from the two-plate stock.':v.joint==='v'?'Two equal bevels form a symmetric V groove. Total included angle is split equally; land remains parent material.':'Symmetric U profile with circular roots tangent to the upper walls. Land remains parent material.';
 try{const r=WeldGeometry.calculate(v);try{localStorage.setItem('weld-tools-geometry-result-v1',JSON.stringify({area:r.weld.area,density:r.weld.density}));}catch{}document.getElementById('error').textContent='';draw(r.weld, v);document.getElementById('results').innerHTML=GeometryResults.render(r);stepsPanel?.update(v);}catch(e){try{localStorage.removeItem('weld-tools-geometry-result-v1');}catch{}stepsPanel?.invalidate();document.getElementById('error').textContent=e.message;document.getElementById('results').innerHTML='<p class="note">Correct the inputs to calculate the assembly.</p>';document.getElementById('profile').innerHTML='';}}
function load(v,pieces){const legacy=Array.isArray(pieces)&&v.joint!=='v'?pieces[0]:null;v={...v,plateWidth:legacy?.width??v.plateWidth,depth:legacy?.thickness??v.depth,weldLength:legacy?.length??v.weldLength,weldDensity:v.weldDensity??v.materialDensity??legacy?.density??initial.weldDensity};for(const [key,value]of Object.entries(initial))document.getElementById(key).value=v[key]??value;update();}
const form=document.getElementById('geometryForm');form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('submit',e=>e.preventDefault());
const status=document.getElementById('status');
 document.getElementById('saveGeometry').onclick=()=>{try{localStorage.setItem('weld-geometry-v2',JSON.stringify(read()));status.textContent='Saved in this browser.';}catch{status.textContent='Storage unavailable. Print to keep a copy.';}};
 document.getElementById('resetGeometry').onclick=()=>{load(initial);status.textContent='Example loaded. Save to keep it.';};
 document.getElementById('loadGeometry').onclick=()=>{try{const saved=JSON.parse(localStorage.getItem('weld-geometry-v2')||localStorage.getItem('weld-geometry-v1'));if(!saved?.v){status.textContent='No saved inputs yet.';return;}load(saved.v,saved.pieces);status.textContent='Saved inputs loaded using the two equal plate assumption.';}catch{status.textContent='Saved inputs are unavailable.';}};
load(initial);status.textContent='Example loaded. Change any input to calculate your joint.';
DensityReference.mount(document.getElementById('densityReference'),()=>[document.getElementById('weldDensity')],update);

stepsPanel=GeometrySteps.mount(()=>read().v);stepsPanel.update(read().v);
