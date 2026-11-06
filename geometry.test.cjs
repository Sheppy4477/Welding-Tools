// Run with Node.js: node geometry.test.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const box = {};
vm.runInNewContext(fs.readFileSync(__dirname + '/geometry-core.js', 'utf8'), box);
const {calculate, joint, material} = box.WeldGeometry;
const v = {joint:'fillet',legA:.25,legB:.25,landMode:'without',depth:1,gap:.0625,land:.125,angle:30,radius:.25,weldLength:48,extra:0,weldDensity:.283,quantity:2,basis:'gross'};
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
const reinforced=calculate({...v,joint:'u',extra:20},[p]);
close(reinforced.cut,joint({...v,joint:'u'}).removedVolume);
const net=calculate({...v,joint:'bevel',basis:'net'},[p]);
close(net.netVolume,576);
close(material({shape:'tube',diameter:2,wall:.125,length:12,count:1,density:.283}).volume,Math.PI*(4-1.75**2)*3);
assert.throws(()=>joint({...v,joint:'u',radius:4}));
assert.throws(()=>joint({...v,joint:'bevel',landMode:'with',land:1}));
assert.throws(()=>calculate({...v,joint:'u'},[p,{...p,density:.1}]));
assert.throws(()=>calculate({...v,quantity:1.5},[p]));
assert.throws(()=>joint({...v,weldLength:''}));
assert.throws(()=>calculate({...v,joint:'u',weldLength:1000000},[p]));
for(const name of ['geometry.js','geometry-core.js','app.js','calculator.js'])new vm.Script(fs.readFileSync(__dirname+'/'+name,'utf8'));
console.log('Geometry tests passed: profiles with/without land, numeric U integration, mass balance, material shapes, validation, and script syntax.');
