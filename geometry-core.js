(function(root){
const labels={length:'Length',width:'Width',thickness:'Thickness',diameter:'Outside diameter',wall:'Wall thickness',density:'Material density',count:'Piece count',quantity:'Assembly quantity',legA:'Fillet leg A',legB:'Fillet leg B',depth:'Joint depth',gap:'Root gap',land:'Land',angle:'Angle',radius:'Root radius',plateWidth:'Plate width',materialDensity:'Material density',capHeight:'Cap reinforcement height',rootHeight:'Root reinforcement height',rootWidth:'Root reinforcement width',weldDensity:'Weld density',weldLength:'Weld length'};
function number(v,key,min=0,max=Infinity){if(v[key]===undefined||v[key]===null||String(v[key]).trim()==='')throw Error((labels[key]||key)+' is required.');const n=Number(v[key]);if(!Number.isFinite(n)||n<min||n>max)throw Error((labels[key]||key)+' must be '+(min>0?'greater than zero':'zero or greater')+(max<Infinity?' and no more than '+max:'')+'.');return n;}
function positive(v,k){return number(v,k,Number.MIN_VALUE);}
function integer(v,k){const n=positive(v,k);if(!Number.isInteger(n))throw Error(labels[k]+' must be a whole number.');return n;}
function material(v){const length=positive(v,'length'),count=integer(v,'count'),density=positive(v,'density');let area,perimeter;
 if(v.shape==='rectangle'){const w=positive(v,'width'),t=positive(v,'thickness');area=w*t;perimeter=2*(w+t);}
 else if(v.shape==='round'){const d=positive(v,'diameter');area=Math.PI*d*d/4;perimeter=Math.PI*d;}
 else if(v.shape==='tube'){const d=positive(v,'diameter'),t=positive(v,'wall');if(2*t>=d)throw Error('Tube wall must be less than half the outside diameter.');area=Math.PI*(d*d-(d-2*t)**2)/4;perimeter=Math.PI*(2*d-2*t);}
 else throw Error('Choose a material shape.');
 return {area:area*count,volume:area*length*count,surface:(perimeter*length+2*area)*count,density};
}
function joint(v){let removed=0,baseArea,profile=[];const length=positive(v,'weldLength'),density=positive(v,'weldDensity');
 if(v.joint==='fillet'){const a=positive(v,'legA'),b=positive(v,'legB');baseArea=a*b/2;profile=[[0,0],[a,0],[0,b]];}
 else{const depth=positive(v,'depth'),gap=number(v,'gap'),land=v.landMode==='with'?number(v,'land'):0;if(land>depth||(v.joint!=='v'&&land===depth))throw Error('Land must not exceed joint depth (and must be smaller for single bevel and U grooves).');const h=depth-land;
 if(v.joint==='v'){const angle=positive(v,'angle');if(angle>=180)throw Error('Total included angle must be greater than 0 and less than 180 degrees.');const width=h*Math.tan(angle*Math.PI/360);removed=h*width;profile=[[-gap/2,0],[gap/2,0],[gap/2,land],[gap/2+width,depth],[-gap/2-width,depth],[-gap/2,land]];}
 else if(v.joint==='bevel'){const angle=number(v,'angle',0,89)*Math.PI/180;removed=h*h*Math.tan(angle)/2;profile=[[-gap/2,0],[gap/2,0],[gap/2,land],[gap/2+h*Math.tan(angle),depth],[-gap/2,depth]];}
 else if(v.joint==='u'){const theta=number(v,'angle',0,178)*Math.PI/360,r=positive(v,'radius'),yt=r*(1-Math.sin(theta)),xt=r*Math.cos(theta);if(yt>h)throw Error('Root radius does not fit the prepared depth. Reduce radius or land, or increase depth.');const u=yt-r;const curve=.5*(u*xt+r*r*(Math.asin(Math.max(-1,Math.min(1,u/r)))+Math.PI/2));const straight=xt*(h-yt)+.5*(h-yt)**2*Math.tan(theta);removed=2*(curve+straight);const side=[[gap/2,0],[gap/2,land]];for(let i=1;i<=60;i++){const y=h*i/60;const x=y<=yt?Math.sqrt(Math.max(0,r*r-(y-r)**2)):xt+(y-yt)*Math.tan(theta);side.push([gap/2+x,land+y]);}profile=[...side,...side.slice().reverse().map(([x,y])=>[-x,y])];}
 else throw Error('Choose a weld profile.');baseArea=gap*depth+removed;
 }const capHeight=v.joint==='fillet'?0:number(v,'capHeight'),rootHeight=v.joint==='fillet'?0:number(v,'rootHeight');
 const capWidth=v.joint==='fillet'?Math.hypot(Number(v.legA),Number(v.legB)):Math.max(...profile.map(p=>p[0]))-Math.min(...profile.map(p=>p[0]));
 const rootWidth=v.joint==='fillet'?0:number(v,'gap');
 if(capHeight>0&&capWidth<=0)throw Error('Cap reinforcement needs a positive joint face width.');
 const capArea=0.5*capWidth*capHeight,rootArea=0.5*rootWidth*rootHeight,area=baseArea+capArea+rootArea;
 if(area<=0)throw Error('Weld area is zero. Increase the gap, angle, or leg dimensions.');return {baseArea,area,capHeight,capWidth,rootHeight,rootWidth,capArea,rootArea,removedArea:removed,removedVolume:removed*length,volume:area*length,weight:area*length*density,profile};
}
function plates(v){return [{shape:'rectangle',length:positive(v,'weldLength'),width:positive(v,'plateWidth'),thickness:positive(v,'depth'),count:2,density:positive(v,v.materialDensity===undefined?'weldDensity':'materialDensity')}];}
function calculate(v){const stock=plates(v)[0],m=material(stock),quantity=integer(v,'quantity'),weld=joint(v);const cut=weld.removedVolume;if(cut>m.volume+1e-10)throw Error('Bevel preparation exceeds the material volume. Increase plate width or reduce the groove dimensions.');const netVolume=Math.max(0,m.volume-cut),netWeight=netVolume*m.density,netMaterialArea=m.area-weld.removedArea;const result={quantity,materialArea:m.area,netMaterialArea,deductedArea:weld.removedArea,surface:m.surface,grossVolume:m.volume,grossWeight:m.volume*m.density,cut,netVolume,netWeight,weld,totalWeight:netWeight+weld.weight,totalVolume:netVolume+weld.volume};if([result.totalWeight,result.totalVolume,result.surface,result.materialArea,weld.area,result.totalWeight*quantity,result.totalVolume*quantity].some(n=>!Number.isFinite(n)))throw Error('Inputs are too large to calculate.');return result;}
root.WeldGeometry={calculate,joint,material,plates};
})(globalThis);
