(function(root){
const f=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:8});
function build(v){const r=root.WeldGeometry.calculate(v),w=r.weld,groups=[];let rows=[];
 const add=(label,formula,substitution,value,unit)=>rows.push({label,formula,substitution,value,unit});
 const group=title=>{groups.push({title,rows});rows=[];};
 if(v.joint==='fillet'){
  add('Weld #1 area','A₁ = leg A × leg B ÷ 2',`${f(v.legA)} × ${f(v.legB)} ÷ 2`,w.firstFilletArea,'in²');
  if(v.filletSides==='both')add('Weld #2 area','A₂ = opposite leg A × opposite leg B ÷ 2',`${f(v.oppositeLegA)} × ${f(v.oppositeLegB)} ÷ 2`,w.oppositeFilletArea,'in²');
  add('Combined weld area','Aw = A₁ + A₂',`${f(w.firstFilletArea)} + ${f(w.oppositeFilletArea)}`,w.area,'in²');
 }else{
  const land=v.landMode==='with'?Number(v.land):0,H=Number(v.depth)-land,g=Number(v.gap);
  add('Prepared height','H = thickness − land',`${f(v.depth)} − ${f(land)}`,H,'in');
  if(v.joint==='v'||v.joint==='bevel'){
   const beta=v.joint==='v'?Number(v.angle)/2:Number(v.angle),b=H*Math.tan(beta*Math.PI/180),sides=v.joint==='v'?2:1;
   add('Angle on prepared face',v.joint==='v'?'β = included angle ÷ 2':'β = entered bevel angle',v.joint==='v'?`${f(v.angle)} ÷ 2`:f(v.angle),beta,'°');
   add('Bevel width per prepared face','b = H × tan β',`${f(H)} × tan(${f(beta)}°)`,b,'in');
   add('Preparation area removed','Acut = prepared faces × H × b ÷ 2',`${sides} × ${f(H)} × ${f(b)} ÷ 2`,w.removedArea,'in²');
   add('Top opening / cap width','B = gap + prepared faces × b',`${f(g)} + ${sides} × ${f(b)}`,w.capWidth,'in');
  }else{
   const R=Number(v.radius),theta=Number(v.angle)*Math.PI/360,y=R*(1-Math.sin(theta)),x=R*Math.cos(theta),u=y-R;
   const curved=.5*(u*x+R*R*(Math.asin(Math.max(-1,Math.min(1,u/R)))+Math.PI/2)),height=H-y,straight=x*height+.5*height*height*Math.tan(theta);
   add('Half of included angle','θ = included angle ÷ 2',`${f(v.angle)} ÷ 2`,Number(v.angle)/2,'°');
   add('Circular-to-straight transition height','y₀ = R(1 − sin θ)',`${f(R)} × (1 − sin(${f(Number(v.angle)/2)}°))`,y,'in');
   add('Width at transition, each side','x₀ = R cos θ',`${f(R)} × cos(${f(Number(v.angle)/2)}°)`,x,'in');
   add('Curved area, each side','C = ½[(y₀ − R)x₀ + R²(asin((y₀ − R)/R) + π/2)]',`½[(${f(y)} − ${f(R)}) × ${f(x)} + ${f(R)}² × (asin(${f(u/R)}) + π/2)] (asin in radians)`,curved,'in²');
   add('Straight height above transition','h = H − y₀',`${f(H)} − ${f(y)}`,height,'in');
   add('Straight area, each side','S = x₀h + h² tan θ ÷ 2',`${f(x)} × ${f(height)} + ${f(height)}² × tan(${f(Number(v.angle)/2)}°) ÷ 2`,straight,'in²');
   add('Preparation area removed','Acut = 2(C + S)',`2 × (${f(curved)} + ${f(straight)})`,w.removedArea,'in²');
   add('Top opening / cap width','B = gap + 2(x₀ + h tan θ)',`${f(g)} + 2 × (${f(x)} + ${f(height)} × tan(${f(Number(v.angle)/2)}°))`,w.capWidth,'in');
  }
  add('Root-gap rectangle','Agap = gap × thickness',`${f(g)} × ${f(v.depth)}`,g*Number(v.depth),'in²');
  add('Ideal groove fill','Agroove = Acut + Agap',`${f(w.removedArea)} + ${f(g*Number(v.depth))}`,w.baseArea,'in²');
  add('Cap reinforcement area','Acap = top opening × cap height ÷ 2',`${f(w.capWidth)} × ${f(w.capHeight)} ÷ 2`,w.capArea,'in²');
  add('Root reinforcement area','Aroot = root gap × root height ÷ 2',`${f(w.rootWidth)} × ${f(w.rootHeight)} ÷ 2`,w.rootArea,'in²');
  add('Total weld area','Aw = Agroove + Acap + Aroot',`${f(w.baseArea)} + ${f(w.capArea)} + ${f(w.rootArea)}`,w.area,'in²');
 }
 group('Joint geometry');
 const one=Number(v.plateWidth)*Number(v.depth),rho=Number(v.weldDensity),L=Number(v.weldLength);
 add('One plate area','Ap = width × thickness',`${f(v.plateWidth)} × ${f(v.depth)}`,one,'in²');
 add('One plate volume','Vp = Ap × length',`${f(one)} × ${f(L)}`,one*L,'in³');
 add('One plate gross weight','Wp = Vp × density',`${f(one*L)} × ${f(rho)}`,one*L*rho,'lb');
 add('Two plates gross area','Agross = 2 × Ap',`2 × ${f(one)}`,r.materialArea,'in²');
 add('Two plates gross volume','Vgross = Agross × length',`${f(r.materialArea)} × ${f(L)}`,r.grossVolume,'in³');
 add('Two plates gross weight','Wgross = Vgross × density',`${f(r.grossVolume)} × ${f(rho)}`,r.grossWeight,'lb');
 add('Preparation area deduction','Adeduct = Acut',v.joint==='fillet'?'0 (no fillet preparation cutout)':f(w.removedArea),r.deductedArea,'in²');
 add('Preparation volume deduction','Vcut = Acut × length',`${f(w.removedArea)} × ${f(L)}`,r.cut,'in³');
 add('Preparation weight deduction','Wcut = Vcut × density',`${f(r.cut)} × ${f(rho)}`,r.grossWeight-r.netWeight,'lb');
 add('Net material area','Anet = Agross − Acut',`${f(r.materialArea)} − ${f(r.deductedArea)}`,r.netMaterialArea,'in²');
 add('Net material volume','Vnet = Anet × length',`${f(r.netMaterialArea)} × ${f(L)}`,r.netVolume,'in³');
 add('Net material weight','Wnet = Vnet × density',`${f(r.netVolume)} × ${f(rho)}`,r.netWeight,'lb');
 group('Material, including preparation deductions');
 if(v.joint==='fillet'){
  add('Weld #1 volume','V₁ = A₁ × length',`${f(w.firstFilletArea)} × ${f(L)}`,w.firstFilletArea*L,'in³');
  add('Weld #1 weight','W₁ = V₁ × density',`${f(w.firstFilletArea*L)} × ${f(rho)}`,w.firstFilletArea*L*rho,'lb');
  if(v.filletSides==='both'){
   add('Weld #2 volume','V₂ = A₂ × length',`${f(w.oppositeFilletArea)} × ${f(L)}`,w.oppositeFilletArea*L,'in³');
   add('Weld #2 weight','W₂ = V₂ × density',`${f(w.oppositeFilletArea*L)} × ${f(rho)}`,w.oppositeFilletArea*L*rho,'lb');
  }
 }
 add('Combined weld volume','Vw = Aw × length',`${f(w.area)} × ${f(L)}`,w.volume,'in³');
 add('Combined weld weight','Ww = Vw × density',`${f(w.volume)} × ${f(rho)}`,w.weight,'lb');
 group('Weld volume and weight');
 add('Material plus weld volume','Vtotal = Vnet + Vw',`${f(r.netVolume)} + ${f(w.volume)}`,r.totalVolume,'in³');
 add('Material plus weld weight','Wtotal = Wnet + Ww',`${f(r.netWeight)} + ${f(w.weight)}`,r.totalWeight,'lb');
 add('Batch weight','Wbatch = Wtotal × quantity',`${f(r.totalWeight)} × ${f(r.quantity)}`,r.totalWeight*r.quantity,'lb');
 group('Assembly and batch totals');return {groups,result:r};
}
function render(v){const report=build(v);return report.groups.map((g,i)=>`<div class="steps-group"><h3>${i+1}. ${g.title}</h3><ol>${g.rows.map(row=>`<li><h4>${row.label}</h4><p>${row.formula}</p><p>${row.substitution} = <strong>${f(row.value)} ${row.unit}</strong></p></li>`).join('')}</ol></div>`).join('')+'<p class="note">Results use full precision. Substituted numbers are displayed to 8 decimal places.</p>';}
function mount(read){const button=document.getElementById('showCalculations'),panel=document.getElementById('calculationSteps'),content=document.getElementById('stepsContent');let open=false;
 function update(v){root.WeldGeometry.calculate(v);button.disabled=false;if(open)content.innerHTML=render(v);}
 function invalidate(){open=false;button.disabled=true;button.textContent='Show step-by-step calculations';button.setAttribute('aria-expanded','false');panel.hidden=true;content.innerHTML='';}
 button.onclick=()=>{try{const v=read();root.WeldGeometry.calculate(v);open=!open;button.setAttribute('aria-expanded',String(open));button.textContent=open?'Hide step-by-step calculations':'Show step-by-step calculations';panel.hidden=!open;if(open){content.innerHTML=render(v);panel.scrollIntoView({behavior:'smooth',block:'start'});}}catch{invalidate();}};
 return {update,invalidate};
}
root.GeometrySteps={build,render,mount};
})(globalThis);
