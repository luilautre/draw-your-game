(() => {
const canvas=document.getElementById('stage'),ctx=canvas.getContext('2d');
const colorButtons=[...document.querySelectorAll('[data-color]')], widthInput=document.getElementById('width');
let strokes=[],color='#222222',eraser=false,drawing=false,mode='edit',current=null,player=null,objects=[],lastTime=0;
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
window.addEventListener('resize',resize);
function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function start(e){if(mode!=='edit')return;e.preventDefault();drawing=true;current={color:eraser?'erase':color,width:+widthInput.value,erase:eraser,points:[pos(e)]};strokes.push(current);canvas.setPointerCapture(e.pointerId);draw();}
function move(e){if(!drawing||mode!=='edit')return;e.preventDefault();current.points.push(pos(e));draw();}
function end(){drawing=false;current=null;}
canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
function drawStroke(s){if(s.points.length<1)return;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=s.width;ctx.strokeStyle=s.erase?'#f8fafc':s.color;ctx.beginPath();ctx.moveTo(s.points[0].x,s.points[0].y);for(const p of s.points.slice(1))ctx.lineTo(p.x,p.y);ctx.stroke();}
function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,w,h);for(const s of strokes)drawStroke(s);if(mode==='play'&&player){ctx.fillStyle='#7c3aed';ctx.beginPath();ctx.arc(player.x,player.y,14,0,Math.PI*2);ctx.fill();for(const o of objects){ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(o.x,o.y,Math.max(8,o.radius),0,Math.PI*2);ctx.fill();}}}
function activate(){mode='play';const w=canvas.clientWidth,h=canvas.clientHeight;player={x:Math.min(40,w-20),y:30,vx:0,vy:0};objects=[];for(const s of strokes){if(s.color==='#1685ff'){const p=s.points[Math.floor(s.points.length/2)]||{x:0,y:0};objects.push({x:p.x,y:p.y,radius:s.width*1.3,color:s.color,activated:false});}}document.getElementById('mode').textContent='Éditer';lastTime=performance.now();requestAnimationFrame(step);}
function step(t){if(mode!=='play')return;const dt=Math.min((t-lastTime)/1000,.033);lastTime=t;player.vy+=600*dt;player.x+=player.vx*dt;player.y+=player.vy*dt;const w=canvas.clientWidth,h=canvas.clientHeight,r=14;
if(player.x<r){player.x=r;player.vx=0;}if(player.x>w-r){player.x=w-r;player.vx=0;}if(player.y<r){player.y=r;player.vy=0;}if(player.y>h-r){player.y=h-r;player.vy=0;}
for(const s of strokes){if(s.erase||s.points.length<2)continue;for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy,t0=len2?Math.max(0,Math.min(1,((player.x-a.x)*dx+(player.y-a.y)*dy)/len2)):0,px=a.x+t0*dx,py=a.y+t0*dy,dist=Math.hypot(player.x-px,player.y-py),rr=r+s.width/2;if(dist<rr){if(s.color==='#ef4444'){player={x:40,y:30,vx:0,vy:0};}else if(s.color==='#22c55e'&&player.vy>0){player.vy=-450;}else if(s.color==='#222222'){if(dy>Math.abs(dx)){player.y=py-(rr);player.vy=0;}else if(Math.abs(dx)>=Math.abs(dy)){player.x=px+(player.x<px?-rr:rr);player.vx=0;}else{player.y=py+(player.y<py?-rr:rr);player.vy=0;}}else if(s.color==='#1685ff'){/* blue drawings become activated circles */}}}}
for(const o of objects){if(Math.hypot(player.x-o.x,player.y-o.y)<r+o.radius){o.activated=true;if(player.vy>0)player.vy=-350;}}
draw();requestAnimationFrame(step);}
colorButtons.forEach(b=>b.onclick=()=>{color=b.dataset.color;eraser=false;colorButtons.forEach(x=>x.classList.toggle('active',x===b));document.getElementById('eraser').classList.remove('active');});
document.getElementById('eraser').onclick=()=>{eraser=!eraser;document.getElementById('eraser').classList.toggle('active',eraser);});
document.getElementById('mode').onclick=()=>{if(mode==='edit')activate();else{mode='edit';player=null;objects=[];document.getElementById('mode').textContent='Jouer';draw();}};
document.getElementById('clear').onclick=()=>{strokes=[];player=null;objects=[];mode='edit';document.getElementById('mode').textContent='Jouer';draw();};
document.getElementById('save').onclick=()=>{const data={format:'dphys',version:1,canvas:{width:canvas.clientWidth,height:canvas.clientHeight},strokes};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='level.dphys';a.click();URL.revokeObjectURL(a.href);};
document.getElementById('load').onclick=()=>document.getElementById('file').click();
document.getElementById('file').onchange=e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);if(d.format!=='dphys'||!Array.isArray(d.strokes))throw Error('Format invalide');const sx=canvas.clientWidth/(d.canvas?.width||canvas.clientWidth),sy=canvas.clientHeight/(d.canvas?.height||canvas.clientHeight);strokes=d.strokes.map(s=>({...s,points:s.points.map(p=>({x:p.x*sx,y:p.y*sy}))}));mode='edit';player=null;document.getElementById('mode').textContent='Jouer';draw();}catch(err){alert('Fichier invalide : '+err.message);}};reader.readAsText(f);e.target.value='';};
resize();
})();