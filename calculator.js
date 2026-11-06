(function(root){
function calculate(v){
 const n=(k,min=0,max=Infinity)=>{const x=Number(v[k]);if(v[k]===''||!Number.isFinite(x)||x<min||x>max)throw Error('Check '+k+': enter a number from '+min+' to '+(max===Infinity?'a finite positive value':max)+'.');return x;};
 const positive=k=>n(k,0.000000001); const qty=positive('quantity');if(!Number.isInteger(qty))throw Error('Quantity must be a whole number.');
 let area;
 if(v.joint==='fillet')area=positive('legA')*positive('legB')/2;
 else if(v.joint==='groove')area=n('gap')*positive('depth')+positive('depth')**2*Math.tan(n('angle',1,179)*Math.PI/360);
 else area=positive('area');
 const capHeight=n('capHeight'),rootHeight=v.joint==='fillet'?0:n('rootHeight');
 const capWidth=v.joint==='fillet'?Math.hypot(positive('legA'),positive('legB')):v.joint==='groove'?n('gap')+2*positive('depth')*Math.tan(n('angle',1,179)*Math.PI/360):capHeight>0?positive('capWidth'):0;
 area+=0.5*capWidth*capHeight+(rootHeight>0?0.5*positive('rootWidth')*rootHeight:0);
 const length=positive('length'),density=positive('weldDensity'),weld=area*length*density;
 let volume;
 if(v.shape==='plate')volume=positive('stockLength')*positive('width')*positive('thickness');
 else if(v.shape==='round')volume=Math.PI*positive('diameter')**2/4*positive('stockLength');
 else if(v.shape==='tube'){const d=positive('diameter'),t=positive('wall');if(t*2>=d)throw Error('Tube wall must be less than half the outside diameter.');volume=Math.PI*(d*d-(d-2*t)**2)/4*positive('stockLength');}
 else volume=n('volume');
 const pieces=n('pieces');if(!Number.isInteger(pieces))throw Error('Stock pieces must be a whole number.');
 const stock=volume*positive('stockDensity')*pieces,eff= n('efficiency',0.000001,100)/100;
 let deposition,arc,travel;
 if(v.rateMode==='travel'){travel=positive('travel');const passes=positive('passes');if(!Number.isInteger(passes))throw Error('Pass count must be a whole number.');arc=length*passes/travel;deposition=weld/arc;}
 else{deposition=v.rateMode==='wire'?Math.PI*positive('wireDiameter')**2/4*positive('wireFeed')*positive('fillerDensity')*eff:positive('directRate')/60;arc=weld/deposition;travel=length/arc;}
 let factor;if(v.factorMode==='measured'){const a=positive('observedArc'),t=positive('observedTotal');if(a>t)throw Error('Observed arc time cannot exceed total working time.');factor=a/t;}else factor=n('factor',0.000001,100)/100;
 const paid=arc/factor,setup=n('setup'),filler=weld/eff,rate=n('labor')+n('overhead');
 const materialCost=stock*n('stockPrice'),fillerCost=filler*n('fillerPrice'),laborCost=(paid+setup)/60*rate,consumableCost=arc/60*n('consumables');
 const weldingCost=fillerCost+laborCost+consumableCost,total=materialCost+weldingCost;
 const result={qty,area,weld,stock,filler,deposition,arc,travel,factor,paid,setup,materialCost,fillerCost,laborCost,consumableCost,weldingCost,total,perWeldPound:weldingCost/weld,perFinishedPound:total/(stock+weld),batchCost:total*qty,batchWeld:weld*qty,batchStock:stock*qty,batchMinutes:(paid+setup)*qty};
 if(Object.values(result).some(x=>!Number.isFinite(x)))throw Error('Inputs produce an estimate too large to calculate.');return result;
}root.WeldCalculator={calculate};
})(globalThis);
