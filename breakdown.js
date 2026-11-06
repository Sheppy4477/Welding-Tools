document.getElementById('printBreakdown').onclick=()=>window.print();
window.addEventListener('message',event=>{
 if(event.source!==window.opener||event.origin!==location.origin||event.data?.type!=='weld-geometry-inputs')return;
 document.getElementById('connection').textContent='Linked to Geometry & weight. Changes in the calculator update this window automatically.';
 try{const report=WeldBreakdown.render(event.data.v,event.data.pieces);document.getElementById('breakdownError').textContent='';document.getElementById('breakdownContent').innerHTML=report.html;}
 catch(e){document.getElementById('breakdownError').textContent=e.message;document.getElementById('breakdownContent').innerHTML='';}
});
if(window.opener)window.opener.postMessage({type:'weld-breakdown-ready'},location.origin==='null'?'*':location.origin);
