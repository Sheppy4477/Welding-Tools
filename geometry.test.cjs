// Run with Node.js: node geometry.test.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const box = {};
vm.runInNewContext(fs.readFileSync(__dirname + '/geometry-core.js', 'utf8'), box);
const {calculate, joint, material} = box.WeldGeometry;
const v = {joint:'fillet',legA:.25,legB:.25,landMode:'without',depth:1,plateWidth:6,gap:.0625,land:.125,angle:30,radius:.25,weldLength:48,capHeight:0,rootHeight:0,rootWidth:.125,weldDensity:.283,quantity:2,basis:'gross'};
const p = {shape:'rectangle',length:48,width:6,thickness:1,count:2,density:.283};
const close = (a,b,tol=1e-9) => assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);
close(joint(v).area,.03125);
close(calculate(v,[p]).totalWeight, (576+1.5)*.283);
close(material(p).surface,1368);
for (const landMode of ['without','with']) {
 const b={...v,joint:'bevel',angle:45,landMode};
 const h=1-(landMode==='with'?.125:0);
 close(joint(b).area,.0625+h*h/2);
 const u={...v,joint:'u',landMode};
 // Independent midpoint integration of the circular/straight half profile.
 const theta=u.angle*Math.PI/360,yt=u.radius*(1-Math.sin(theta)),xt=u.radius*Math.cos(theta);
 const count=100000,dy=h/count;
 let integral=0;
 for(let i=0;i<count;i++){const y=(i+.5)*dy;integral+=(y<yt?Math.sqrt(u.radius*u.radius-(y-u.radius)**2):xt+(y-yt)*Math.tan(theta))*dy;}
 close(joint(u).removedArea,2*integral,1e-8);
 const result=calculate(u,[p]);
 close(result.netVolume+result.weld.volume,576+.0625*48);
 close(result.totalWeight,(576+.0625*48)*.283);
}
const squareU=joint({...v,joint:'u',angle:0});
close(squareU.removedArea,2*(.25**2*(Math.PI/4)+.25*.75));
const reinforced=calculate({...v,joint:'u',capHeight:.0625,rootHeight:.03125},[p]);
close(reinforced.cut,joint({...v,joint:'u'}).removedVolume);
close(reinforced.weld.capArea,reinforced.weld.capWidth*.0625/2);
close(reinforced.weld.rootArea,.0625*.03125/2);
close(reinforced.weld.volume,(reinforced.weld.baseArea+reinforced.weld.capArea+reinforced.weld.rootArea)*48);
close(reinforced.totalWeight,calculate({...v,joint:'u'},[p]).totalWeight+(reinforced.weld.capArea+reinforced.weld.rootArea)*48*.283);
close(joint({...v,capHeight:.1,rootHeight:.5}).capArea,0);
close(joint({...v,rootHeight:.5}).rootArea,0);
assert.throws(()=>joint({...v,joint:'bevel',capHeight:-.1}));
assert.throws(()=>joint({...v,joint:'u',rootHeight:.1,gap:-.1}));
assert.throws(()=>joint({...v,joint:'bevel',rootHeight:-.1}));
const net=calculate({...v,joint:'bevel',basis:'net'},[p]);
close(net.netVolume,576-net.cut);
close(material({shape:'tube',diameter:2,wall:.125,length:12,count:1,density:.283}).volume,Math.PI*(4-1.75**2)*3);
assert.throws(()=>joint({...v,joint:'u',radius:4}));
assert.throws(()=>joint({...v,joint:'bevel',landMode:'with',land:1}));
close(calculate({...v,joint:'u'},[p,{...p,density:.1}]).grossVolume,576);
assert.throws(()=>calculate({...v,quantity:1.5},[p]));
assert.throws(()=>joint({...v,weldLength:''}));
assert.throws(()=>calculate({...v,joint:'u',plateWidth:.0001}));
for(const name of ['geometry.js','geometry-core.js','app.js','calculator.js','density-reference.js'])new vm.Script(fs.readFileSync(__dirname+'/'+name,'utf8'));
console.log('Geometry tests passed: profiles with/without land, numeric U integration, mass balance, material shapes, validation, and script syntax.');
vm.runInNewContext(fs.readFileSync(__dirname+'/calculator.js','utf8'),box);
const productionDefaults=vm.runInNewContext(fs.readFileSync(__dirname+'/app.js','utf8').split('const sections=')[0]+'defaults');
const productionBase=box.WeldCalculator.calculate(productionDefaults);
const productionCap=box.WeldCalculator.calculate({...productionDefaults,capHeight:.1});
close(productionCap.weld,productionBase.weld);
const grooveDefaults={...productionDefaults,joint:'groove'};
const productionGroove=box.WeldCalculator.calculate(grooveDefaults);
const productionRoot=box.WeldCalculator.calculate({...grooveDefaults,rootHeight:.1,rootWidth:.25});
close(productionRoot.weld-productionGroove.weld,grooveDefaults.gap*.1/2*120*.283);
console.log('Reinforcement tests passed: cap/root half-width-times-height areas, weld weight, assembly mass balance, validation, and production calculator.');
// Independent reference cases for the symmetric two-plate geometry.
const referenceCases=[
 {name:'Mild steel',depth:.625,plateWidth:3,weldLength:12,angle:60,gap:.1875,capHeight:.125,rootHeight:.0625,weldDensity:.283,
 expected:{removedArea:.22552744890219756,capWidth:.90918783648703216,netMaterialArea:3.5244725510978023,netVolume:42.293670613173632,netWeight:11.969108783528137,baseArea:.34271494890219756,capArea:.05682423978043951,rootArea:.005859375,area:.40539856368263705,volume:4.864782764191645,weight:1.3767335222662354,totalWeight:13.345842305794372}},
 {name:'Titanium',depth:.25,plateWidth:3,weldLength:12,angle:75,gap:.0625,capHeight:.125,rootHeight:0,weldDensity:.163,
 expected:{removedArea:.047957936748685023,capWidth:.44616349398948019,netMaterialArea:1.4520420632513149,netVolume:17.424504759015779,netWeight:2.8401942757195719,baseArea:.063582936748685023,capArea:.027885218374342512,rootArea:0,area:.091468155123027528,volume:1.0976178614763303,weight:.17891171142064186,totalWeight:3.0191059871402137}}
];
for(const reference of referenceCases){
 const inputs={...v,...reference,joint:'v',landMode:'without',basis:'net',rootWidth:999};
 const result=calculate(inputs,[]);
 for(const [key,expected]of Object.entries(reference.expected))close(key in result.weld?result.weld[key]:result[key],expected);
 // Alter the land, length, and density together and independently reconcile areas and mass.
 const changed={...inputs,landMode:'with',land:reference.depth/4,weldLength:24,weldDensity:.2};
 const h=changed.depth-changed.land,b=h*Math.tan(changed.angle*Math.PI/360),cut=h*b;
 const ideal=changed.gap*changed.depth+cut;
 const cap=(changed.gap+2*b)*changed.capHeight/2,root=changed.gap*changed.rootHeight/2;
 const updated=calculate(changed,[]);
 close(updated.netMaterialArea,2*3*changed.depth-cut);
 close(updated.weld.weight,(ideal+cap+root)*24*.2);
 close(updated.totalWeight,(2*3*changed.depth+changed.gap*changed.depth+cap+root)*24*.2);
}
close(joint({...v,joint:'v',landMode:'with',land:1,angle:60}).removedArea,0);
close(joint({...v,joint:'v',gap:0,rootHeight:.1}).rootArea,0);
assert.throws(()=>calculate({...v,joint:'v',plateWidth:0},[]));
assert.throws(()=>joint({...v,joint:'v',angle:0}));
assert.throws(()=>joint({...v,joint:'v',angle:180}));
console.log('Symmetric V groove checks passed: reference geometry and weight results match; land, length, density, fixed two-plate model, root-gap width, and angle boundaries checked.');
const densityInputs={...v,...referenceCases[0],joint:'v',materialDensity:.283};
const densityBase=calculate(densityInputs,[]);
const densityOverride=calculate({...densityInputs,weldDensity:.163},[]);
close(densityOverride.netWeight,densityBase.netVolume*.163);
close(densityOverride.weld.weight,densityBase.weld.volume*.163);
close(densityOverride.totalWeight,(densityBase.netVolume+densityBase.weld.volume)*.163);
const materialOverride=calculate({...densityInputs,materialDensity:.098},[]);
close(materialOverride.weld.weight,densityBase.weld.weight);
close(materialOverride.netWeight,densityBase.netWeight);
const eventHandlers={},densityButtons=[],selection={textContent:''};
const densityGroup={append:button=>densityButtons.push(button)};
const densityDocument={addEventListener:(name,handler)=>{eventHandlers[name]=handler;},createElement:()=>({attributes:{},setAttribute(name,value){this.attributes[name]=value;}})};
vm.runInNewContext(fs.readFileSync(__dirname+'/density-reference.js','utf8'),{globalThis:box,document:densityDocument});
const makeInput=value=>{let stored=String(value);return {get value(){return stored;},set value(next){stored=String(next);}};};
const densityFields=[makeInput(.283),makeInput(.283),makeInput(.283)];let recalculations=0;
const densityControl=box.DensityReference.mount({set innerHTML(value){},querySelector:selector=>selector==='.density-buttons'?densityGroup:selection},()=>densityFields,()=>recalculations++);
assert.equal(densityButtons.length,4);
for(let i=0;i<densityButtons.length;i++){
 densityButtons[i].onclick();
 assert.ok(densityFields.every(input=>Number(input.value)===box.DensityReference.materials[i].density));
 assert.equal(densityButtons[i].attributes['aria-pressed'],'true');
}
assert.equal(recalculations,4);
densityFields[0].value=.251;
eventHandlers.input();
assert.equal(densityFields[0].value,'0.251');
assert.ok(densityButtons.every(button=>button.attributes['aria-pressed']==='false'));
assert.ok(selection.textContent.startsWith('Custom densities'));
console.log('Density checks passed: all four reference buttons, selection state, recalculation, custom overrides, and shared material/weld density.');
vm.runInNewContext(fs.readFileSync(__dirname+'/geometry-results.js','utf8'),box);
const geometryStartup=vm.runInNewContext(fs.readFileSync(__dirname+'/geometry.js','utf8').split('function makeField')[0]+'({initial,fieldDefs})');
const startup=calculate(geometryStartup.initial);
assert.ok(startup.cut>0);
close(startup.netMaterialArea,startup.materialArea-startup.deductedArea);
close(startup.netVolume,startup.grossVolume-startup.cut);
close(startup.netWeight,startup.netVolume*.283);
close(startup.totalWeight,startup.netWeight+startup.weld.weight);
const resultHtml=box.GeometryResults.render(startup);
for(const label of ['id="materialResults"','id="weldResults"','Preparation deduction','Net material','Weld cross-section area','Weld volume','Weld weight'])assert.ok(resultHtml.includes(label));
assert.ok(!resultHtml.includes('NaN'));
assert.ok(!resultHtml.includes('undefined'));
// Shared plate and weld length keeps net area defined.
const partial=calculate({...v,joint:'bevel',weldLength:12},[p]);
close(partial.netMaterialArea,partial.materialArea-partial.weld.removedArea);
close(partial.netVolume,partial.netMaterialArea*12);
console.log('Startup and result-box checks passed: valid example, bevel deductions, material/weld totals, and shared plate/weld length handling.');
for(const profile of ['v','bevel','u','fillet']){
 const inputs={...geometryStartup.initial,joint:profile,rootWidth:99,basis:'net'};
 const result=calculate(inputs);
 close(result.grossVolume,2*inputs.plateWidth*inputs.depth*inputs.weldLength);
 close(result.netMaterialArea,result.materialArea-result.weld.removedArea);
 close(result.netWeight,(result.grossVolume-result.weld.removedVolume)*inputs.weldDensity);
 close(result.totalWeight,result.netWeight+result.weld.weight);
 const changed=calculate({...inputs,weldDensity:.2});
 close(changed.netWeight,result.netVolume*.2);
 close(changed.weld.weight,result.weld.volume*.2);
 if(profile==='fillet'){
  close(result.cut,0);close(result.weld.capHeight,0);close(result.weld.capArea,0);close(result.weld.rootArea,0);
  close(result.weld.area,inputs.legA*inputs.legB/2);
 }else close(result.weld.rootArea,inputs.gap*inputs.rootHeight/2);
}
for(const key of ['plateWidth','depth','weldLength','weldDensity']){
 const field=geometryStartup.fieldDefs.find(field=>field[0]===key);
 assert.ok(field&&!field[3],key+' must be available for every profile');
}
assert.equal(geometryStartup.fieldDefs.find(field=>field[0]==='capHeight')[3],'bevel,u,v');
assert.ok(!geometryStartup.fieldDefs.some(field=>field[0]==='rootWidth'));
console.log('All-profile shared inputs passed: two equal plates, preparation subtraction, root-gap reinforcement width, profile densities, and fillet exclusions.');
const singleFillet={...geometryStartup.initial,joint:'fillet',filletSides:'single',legA:.25,legB:.375,oppositeLegA:.5,oppositeLegB:.25};
const oneSide=calculate(singleFillet);
const twoSides=calculate({...singleFillet,filletSides:'both'});
close(oneSide.weld.area,.25*.375/2);
close(twoSides.weld.area,(.25*.375+.5*.25)/2);
close(twoSides.weld.volume,twoSides.weld.area*12);
close(twoSides.weld.weight,twoSides.weld.volume*.283);
close(twoSides.netWeight,oneSide.netWeight);
close(twoSides.grossVolume,oneSide.grossVolume);
close(twoSides.totalWeight,oneSide.netWeight+twoSides.weld.weight);
close(calculate({...singleFillet,materialDensity:99}).totalWeight,oneSide.totalWeight);
close(calculate({...singleFillet,weldDensity:.098}).totalWeight,(oneSide.netVolume+oneSide.weld.volume)*.098);
close(calculate({...singleFillet,oppositeLegA:'',oppositeLegB:-1}).weld.area,oneSide.weld.area);
assert.throws(()=>calculate({...singleFillet,filletSides:'both',oppositeLegA:0}));
assert.throws(()=>calculate({...singleFillet,filletSides:'both',oppositeLegB:''}));
close(calculate({...singleFillet,joint:'v',filletSides:'both',oppositeLegA:''}).weld.area,startup.weld.area);
assert.equal(twoSides.weld.oppositeProfile.length,3);
assert.ok(twoSides.weld.oppositeProfile.every(point=>point[0]<=-singleFillet.depth));
assert.ok(box.GeometryResults.render(twoSides).includes('Weld #2'));
assert.ok(!box.GeometryResults.render(oneSide).includes('Side 2 weight'));
assert.ok(!geometryStartup.fieldDefs.some(field=>field[0]==='materialDensity'));
for(const key of ['oppositeLegA','oppositeLegB'])assert.equal(geometryStartup.fieldDefs.find(field=>field[0]===key)[3],'opposite');
console.log('Fillet checks passed: one shared density, unequal opposite legs, both-side totals, unchanged stock weight, optional validation, and profile switching.');
// User-specified aluminum example: two 6 × 0.625 × 12 plates, 3/8 and 5/8 fillets.
const aluminumFillets=calculate({...geometryStartup.initial,joint:'fillet',plateWidth:6,depth:.625,weldLength:12,weldDensity:.0975,filletSides:'both',legA:.375,legB:.375,oppositeLegA:.625,oppositeLegB:.625});
close(aluminumFillets.materialArea,7.5);
close(aluminumFillets.netVolume,90);
close(aluminumFillets.netWeight,8.775);
close(aluminumFillets.weld.firstFilletArea,.0703125);
close(aluminumFillets.weld.firstFilletArea*12,.84375);
close(aluminumFillets.weld.firstFilletArea*12*.0975,.082265625);
close(aluminumFillets.weld.oppositeFilletArea,.1953125);
close(aluminumFillets.weld.oppositeFilletArea*12,2.34375);
close(aluminumFillets.weld.oppositeFilletArea*12*.0975,.228515625);
close(aluminumFillets.weld.area,.265625);
close(aluminumFillets.weld.volume,3.1875);
close(aluminumFillets.weld.weight,.31078125);
close(aluminumFillets.totalWeight,9.08578125);
assert.equal(aluminumFillets.totalWeight.toFixed(3),'9.086');
const aluminumHtml=box.GeometryResults.render(aluminumFillets);
for(const label of ['One plate','Two plates total','Weld #1','Weld #2','Combined welds'])assert.ok(aluminumHtml.includes(label));
close(box.DensityReference.materials.find(material=>material.name==='Aluminum').density,.0975);
console.log('Aluminum fillet example matched: 8.775 lb material + 0.31078125 lb weld = 9.08578125 lb (9.086 lb rounded).');
vm.runInNewContext(fs.readFileSync(__dirname+'/geometry-steps.js','utf8'),box);
for(const profile of ['v','bevel','u','fillet'])for(const landMode of ['with','without']){
 const inputs={...geometryStartup.initial,joint:profile,landMode,filletSides:'both',oppositeLegA:.375,oppositeLegB:.625};
 const report=box.GeometrySteps.build(inputs),rows=report.groups.flatMap(group=>group.rows),result=calculate(inputs);
 close(rows.find(row=>row.label==='Net material weight').value,result.netWeight);
 close(rows.find(row=>row.label==='Combined weld volume').value,result.weld.volume);
 close(rows.find(row=>row.label==='Combined weld weight').value,result.weld.weight);
 close(rows.find(row=>row.label==='Material plus weld weight').value,result.totalWeight);
 if(profile==='u')close(rows.find(row=>row.label==='Curved area, each side').value*2+rows.find(row=>row.label==='Straight area, each side').value*2,result.weld.removedArea);
 if(profile==='fillet')assert.ok(rows.some(row=>row.label==='Weld #2 weight'));
 const html=box.GeometrySteps.render(inputs);assert.ok(!html.includes('NaN'));assert.ok(!html.includes('undefined'));
}
assert.throws(()=>box.GeometrySteps.build({...geometryStartup.initial,plateWidth:''}));
const stepsButton={setAttribute(key,value){this[key]=value;}},stepsPanel={hidden:true,scrollIntoView(){}},stepsContent={innerHTML:''};
const stepsBox={WeldGeometry:box.WeldGeometry};
vm.runInNewContext(fs.readFileSync(__dirname+'/geometry-steps.js','utf8'),{globalThis:stepsBox,document:{getElementById:id=>({showCalculations:stepsButton,calculationSteps:stepsPanel,stepsContent})[id]}});
let liveInputs={...geometryStartup.initial};const controller=stepsBox.GeometrySteps.mount(()=>liveInputs);
controller.update(liveInputs);assert.equal(stepsButton.disabled,false);
stepsButton.onclick();assert.equal(stepsPanel.hidden,false);assert.equal(stepsButton['aria-expanded'],'true');
const firstSteps=stepsContent.innerHTML;liveInputs={...liveInputs,weldLength:24};controller.update(liveInputs);assert.notEqual(stepsContent.innerHTML,firstSteps);
controller.invalidate();assert.equal(stepsPanel.hidden,true);assert.equal(stepsButton.disabled,true);assert.equal(stepsContent.innerHTML,'');
controller.update(liveInputs);stepsButton.onclick();stepsButton.onclick();assert.equal(stepsPanel.hidden,true);
console.log('Calculation-step checks passed: every profile, land options, U components, totals, invalid input, toggle state, and live updates.');
