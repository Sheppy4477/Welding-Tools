(function(root){
const materials=[{name:'Steel',density:.283},{name:'Aluminum',density:.098},{name:'Titanium',density:.163},{name:'Stainless steel',density:.289}];
function mount(container,fields,onChange){
 container.innerHTML='<h2>Quick density reference</h2><div class="density-buttons" role="group" aria-label="Material density reference"></div><p class="note">Approximate densities in lb/in³. Selecting a material fills the density fields only. You can edit any density afterward, including weld density.</p><p class="density-selection" role="status"></p>';
 const group=container.querySelector('.density-buttons'),status=container.querySelector('.density-selection');
 const buttons=materials.map(material=>{const button=document.createElement('button');button.type='button';button.innerHTML=`${material.name}<small>${material.density.toFixed(3)} lb/in³</small>`;button.setAttribute('aria-pressed','false');button.onclick=()=>{for(const input of fields())input.value=material.density;onChange();refresh();};group.append(button);return button;});
 function refresh(){const inputs=fields();const active=materials.find(m=>inputs.length>0&&inputs.every(input=>input.value.trim()!==''&&Number(input.value)===m.density));buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(materials[i]===active)));status.textContent=active?active.name+' reference selected. Densities remain editable.':'Custom densities — edit the fields below or select a reference.';}
 document.addEventListener('input',refresh);document.addEventListener('change',refresh);document.addEventListener('click',refresh);refresh();return {refresh};
}root.DensityReference={materials,mount};
})(globalThis);
