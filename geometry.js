const fieldDefs=[
 ['joint','Weld profile',{v:'Symmetric V groove',fillet:'Fillet',bevel:'Single bevel groove',u:'Single U groove'}],
 ['plateWidth','Width of each plate','in'],['depth','Plate thickness / joint depth','in'],['weldLength','Plate length / continuous weld length','in'],
 ['legA','Fillet leg A','in','fillet'],['legB','Fillet leg B','in','fillet'],
 ['landMode','Land / root face',{without:'Without land',with:'With land'},'bevel,u,v'],['land','Land height','in','land'],['gap','Root gap','in','bevel,u,v'],
 ['angle','Bevel angle / total included angle','°','bevel,u,v'],['radius','U root radius','in','u'],
 ['capHeight','Cap reinforcement height','in','bevel,u,v'],['rootHeight','Root reinforcement height','in','bevel,u,v'],
 ['materialDensity','Material density','lb/in³'],['weldDensity','Weld density (editable)','lb/in³']
];
const initial={joint:'v',legA:.25,legB:.25,landMode:'with',depth:.5,plateWidth:3,gap:.125,land:.0625,angle:60,radius:.25,weldLength:12,capHeight:.0625,rootHeight:.03125,weldDensity:.283,materialDensity:.283,quantity:1};
function makeField(id,title,unit,value){
 const label=document.createElement('label'),caption=document.createElement('span');caption.textContent=title;label.append(caption);let input;
 if(typeof unit==='object'){input=document.createElement('select');for(const [key,text]of Object.entries(unit))input.add(new Option(text,key));label.append(input);}
 else{const wrap=document.createElement('div');wrap.className='input-wrap';input=document.createElement('input');input.type='number';input.min='0';input.step='any';input.inputMode='decimal';const small=document.createElement('small');small.textContent=unit;wrap.append(input,small);label.append(wrap);}
 input.id=id;input.setAttribute('aria-label',title);input.value=value;return label;
}
for(const [id,title,unit,condition]of fieldDefs){const el=makeField(id,title,unit,initial[id]);el.dataset.show=condition||'';document.getElementById('weldFields').append(el);}
function read(){return {v:Object.fromEntries(Object.keys(initial).map(key=>[key,document.getElementById(key).value]))};}
function draw(profile){const xs=profile.map(p=>p[0]),ys=profile.map(p=>p[1]),left=Math.min(...xs),bottom=Math.min(...ys),w=Math.max(...xs)-left,h=Math.max(...ys)-bottom,scale=150/Math.max(w,h);const points=profile.map(([x,y])=>(180+(x-left-w/2)*scale)+','+(170-(y-bottom)*scale)).join(' ');document.getElementById('profile').innerHTML='<svg viewBox="0 0 360 195" role="img" aria-label="Ideal weld fill cross-section"><polygon points="'+points+'" fill="#d9f178" fill-opacity=".3" stroke="#d9f178" stroke-width="2"/><text x="180" y="190" text-anchor="middle" fill="#a2b1b0" font-size="10">IDEAL WELD FILL · PROPORTIONAL CROSS-SECTION</text></svg>';}
function update(){const {v}=read();document.getElementById('angle').closest('label').querySelector('span').textContent=v.joint==='bevel'?'Single bevel angle (from vertical)':'Total included angle';document.getElementById('depth').closest('label').querySelector('span').textContent=v.joint==='fillet'?'Plate thickness':'Plate thickness / joint depth';for(const label of document.querySelectorAll('[data-show]')){const show=label.dataset.show;label.hidden=!!show&&!(show==='land'?v.joint!=='fillet'&&v.landMode==='with':show.split(',').includes(v.joint));}
 document.querySelector('#profileCaption').textContent=v.joint==='fillet'?'Right triangular fillet. No cap or root reinforcement; no material preparation is deducted.':v.joint==='bevel'?'One vertical face and one beveled face. The bevel cutout is deducted from the two-plate stock.':v.joint==='v'?'Two equal bevels form a symmetric V groove. Total included angle is split equally; land remains parent material.':'Symmetric U profile with circular roots tangent to the upper walls. Land remains parent material.';
 try{const r=WeldGeometry.calculate(v);document.getElementById('error').textContent='';draw(r.weld.profile);document.getElementById('results').innerHTML=GeometryResults.render(r);}catch(e){document.getElementById('error').textContent=e.message;document.getElementById('results').innerHTML='<p class="note">Correct the inputs to calculate the assembly.</p>';document.getElementById('profile').innerHTML='';}}
function load(v,pieces){const legacy=Array.isArray(pieces)&&v.joint!=='v'?pieces[0]:null;v={...v,plateWidth:legacy?.width??v.plateWidth,depth:legacy?.thickness??v.depth,weldLength:legacy?.length??v.weldLength,materialDensity:legacy?.density??v.materialDensity??v.weldDensity??initial.materialDensity};for(const [key,value]of Object.entries(initial))document.getElementById(key).value=v[key]??value;update();}
const form=document.getElementById('geometryForm');form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('submit',e=>e.preventDefault());
const status=document.getElementById('status');
 document.getElementById('saveGeometry').onclick=()=>{try{localStorage.setItem('weld-geometry-v2',JSON.stringify(read()));status.textContent='Saved in this browser.';}catch{status.textContent='Storage unavailable. Print to keep a copy.';}};
 document.getElementById('resetGeometry').onclick=()=>{load(initial);status.textContent='Example loaded. Save to keep it.';};
 document.getElementById('loadGeometry').onclick=()=>{try{const saved=JSON.parse(localStorage.getItem('weld-geometry-v2')||localStorage.getItem('weld-geometry-v1'));if(!saved?.v){status.textContent='No saved inputs yet.';return;}load(saved.v,saved.pieces);status.textContent='Saved inputs loaded using the two equal plate assumption.';}catch{status.textContent='Saved inputs are unavailable.';}};
load(initial);status.textContent='Example loaded. Change any input to calculate your joint.';
DensityReference.mount(document.getElementById('densityReference'),()=>[document.getElementById('weldDensity'),document.getElementById('materialDensity')],update);
