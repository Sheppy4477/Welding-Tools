(function(root){
const groups={deposition:['deposition','wireDiameter','wireFeed','efficiency'],travel:['travel','deposition','passes','weightPerFoot'],operator:['factor','arcTime','totalTime']};
function solve(group,target,values){
 const keys=groups[group];if(!keys||!keys.includes(target))throw Error('Choose a valid variable to solve.');
 const v={};for(const key of keys){if(key===target)continue;const raw=values[key];const x=Number(raw);if(raw==null||String(raw).trim()===''||!Number.isFinite(x)||x<0)throw Error('Enter valid nonnegative values for all known variables.');v[key]=x;}
 const divide=(a,b)=>{if(b===0)throw Error(a===0?'These values do not determine a unique answer.':'Cannot solve with a zero divisor.');return a/b;};
 if(group==='deposition'){
  if(target==='deposition')v[target]=13.1*v.wireDiameter**2*v.wireFeed*v.efficiency/100;
  if(target==='wireDiameter')v[target]=Math.sqrt(divide(v.deposition,13.1*v.wireFeed*v.efficiency/100));
  if(target==='wireFeed')v[target]=divide(v.deposition,13.1*v.wireDiameter**2*v.efficiency/100);
  if(target==='efficiency')v[target]=divide(v.deposition*100,13.1*v.wireDiameter**2*v.wireFeed);
  if(v.efficiency>100)throw Error('Process efficiency must be between 0 and 100%.');
 }
 if(group==='travel'){
  if(target==='travel')v[target]=divide(v.deposition*v.passes,5*v.weightPerFoot);
  if(target==='deposition')v[target]=divide(v.travel*5*v.weightPerFoot,v.passes);
  if(target==='passes')v[target]=divide(v.travel*5*v.weightPerFoot,v.deposition);
  if(target==='weightPerFoot')v[target]=divide(v.deposition*v.passes,5*v.travel);
  if(v.weightPerFoot<=0)throw Error('Weld metal weight per foot must be greater than zero.');
  if(v.passes<1||Math.abs(v.passes-Math.round(v.passes))>1e-9)throw Error('These values require a non-whole pass count. Number of weld passes must be a whole number of at least 1.');
  v.passes=Math.round(v.passes);
 }
 if(group==='operator'){
  if(target==='factor')v[target]=divide(v.arcTime*100,v.totalTime);
  if(target==='arcTime')v[target]=v.factor*v.totalTime/100;
  if(target==='totalTime')v[target]=divide(v.arcTime*100,v.factor);
  if(v.totalTime<=0)throw Error('Total time must be greater than zero.');
  if(v.factor>100||v.arcTime>v.totalTime)throw Error('Operator factor must be 0–100%, and arc time cannot exceed total time.');
 }
 if(!Number.isFinite(v[target]))throw Error('Inputs are too large to calculate.');return v[target];
}
function calculate(v){const deposition=solve('deposition','deposition',v);return {deposition,travel:solve('travel','travel',{...v,deposition}),factor:solve('operator','factor',v)};}
root.WeldCalculator={calculate,solve};
})(globalThis);
