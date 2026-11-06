let breakdownWindow=null;
function sendBreakdown(){if(breakdownWindow&&!breakdownWindow.closed)breakdownWindow.postMessage({type:'weld-geometry-inputs',...read()},location.origin==='null'?'*':location.origin);}
document.getElementById('openBreakdown').onclick=()=>{
 breakdownWindow=window.open('breakdown.html','weldPhysicalBreakdown','popup,width=1180,height=850,resizable=yes,scrollbars=yes');
 if(!breakdownWindow){document.getElementById('status').textContent='Allow pop-ups for this site to open the physical breakdown window.';return;}
 breakdownWindow.focus();
 document.getElementById('status').textContent='Physical breakdown opened in a separate window.';
};
window.addEventListener('message',event=>{if(event.source===breakdownWindow&&event.origin===location.origin&&event.data?.type==='weld-breakdown-ready')sendBreakdown();});
document.addEventListener('geometry-updated',sendBreakdown);
