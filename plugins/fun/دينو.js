// plugins/دينو.js
// ⚔️ SOLO DINO RUNNER — Enhanced ⚔️

// ============================================================
// 🎮 HTML اللعبة (Enhanced + English)
// ============================================================

const GAME_HTML = `<style>*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}</style>
<body style="margin:0;background:radial-gradient(ellipse at top,#0a0e1a 0%,#151a28 50%,#050810 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#eee;touch-action:manipulation;cursor:pointer;min-height:100vh;overflow-x:hidden">
<div style="width:100%;max-width:900px;margin:auto;padding:16px;box-sizing:border-box">

<!-- ═══════ SOLO HEADER ═══════ -->
<div style="text-align:center;margin-bottom:12px">
<div style="display:inline-block;background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(16,185,129,.08));border:1.5px solid rgba(245,158,11,.4);border-radius:20px;padding:8px 28px;backdrop-filter:blur(10px);box-shadow:0 4px 20px rgba(245,158,11,.15)">
<div style="font-size:16px;font-weight:900;color:#fbbf24;letter-spacing:3px;text-shadow:0 0 15px rgba(251,191,36,.6)">🏮 S O L O 🏮</div>
<div style="font-size:9px;color:rgba(251,191,36,.7);letter-spacing:4px;margin-top:2px;font-weight:800">L E V E L I N G</div>
</div>
</div>

<!-- ═══════ MAIN CARD ═══════ -->
<div style="background:linear-gradient(180deg,rgba(20,25,40,.95),rgba(10,14,26,.95));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:2px solid rgba(245,158,11,.35);border-radius:20px;overflow:hidden;box-shadow:0 12px 50px rgba(0,0,0,.7),inset 0 0 60px rgba(245,158,11,.04)">

<!-- Top bar: Title + Score -->
<div style="padding:16px 22px;border-bottom:1px solid rgba(245,158,11,.15);display:flex;justify-content:space-between;align-items:center;background:linear-gradient(90deg,rgba(245,158,11,.05),transparent,rgba(16,185,129,.05))">
<div>
<div style="font-size:10px;letter-spacing:2.5px;color:#f59e0b;font-weight:900;text-transform:uppercase">⚡ Solo Runner</div>
<div style="font-size:22px;font-weight:900;color:#fff;text-shadow:0 0 15px rgba(245,158,11,.4);margin-top:2px">Dino Run</div>
</div>
<div style="text-align:right">
<div id="score" style="font-size:26px;font-weight:900;color:#10b981;text-shadow:0 0 15px rgba(16,185,129,.7);transition:transform .15s;font-variant-numeric:tabular-nums;font-family:'Courier New',monospace">00000</div>
<div id="best" style="font-size:10px;color:rgba(251,191,36,.75);margin-top:2px;font-weight:800;letter-spacing:1px;font-variant-numeric:tabular-nums">BEST 00000</div>
</div>
</div>

<!-- Stats bar -->
<div style="padding:10px 22px;display:flex;gap:10px;background:rgba(0,0,0,.2)">
<div style="flex:1;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:6px 10px;text-align:center">
<div style="font-size:8px;color:rgba(251,191,36,.65);letter-spacing:1.5px;font-weight:800">SPEED</div>
<div id="speedStat" style="font-size:14px;font-weight:900;color:#fbbf24;font-variant-numeric:tabular-nums">5.0x</div>
</div>
<div style="flex:1;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:6px 10px;text-align:center">
<div style="font-size:8px;color:rgba(16,185,129,.65);letter-spacing:1.5px;font-weight:800">LEVEL</div>
<div id="levelStat" style="font-size:14px;font-weight:900;color:#10b981;font-variant-numeric:tabular-nums">1</div>
</div>
<div style="flex:1;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:6px 10px;text-align:center">
<div style="font-size:8px;color:rgba(239,68,68,.65);letter-spacing:1.5px;font-weight:800">LIVES</div>
<div id="livesStat" style="font-size:14px;font-weight:900;color:#ef4444;font-variant-numeric:tabular-nums">❤❤❤</div>
</div>
</div>

<!-- Canvas Area -->
<div style="padding:16px">
<canvas id="game" width="800" height="280" style="width:100%;height:auto;background:radial-gradient(ellipse at bottom,rgba(16,185,129,.05),rgba(0,0,0,.3));border:1.5px solid rgba(245,158,11,.25);border-radius:14px;display:block;box-shadow:inset 0 0 40px rgba(0,0,0,.6),0 4px 20px rgba(245,158,11,.08)"></canvas>
</div>

<!-- Footer -->
<div style="padding:10px 22px;text-align:center;border-top:1px solid rgba(245,158,11,.15);background:rgba(0,0,0,.2)">
<div style="font-size:9px;color:rgba(251,191,36,.7);font-weight:800;letter-spacing:2.5px">⚡ ENGINEERED BY SOLO ⚡</div>
</div>

</div></div>

<script>
const c=document.getElementById('game'),x=c.getContext('2d');
const scoreEl=document.getElementById('score'),bestEl=document.getElementById('best');
const speedStatEl=document.getElementById('speedStat'),levelStatEl=document.getElementById('levelStat'),livesStatEl=document.getElementById('livesStat');
const W=800,H=280,GY=250;

let d,o,clouds,particles,ambient,trail,stars,score,best=0,speed,gameOver,last,shake,flash,runT,spawnTimer,milestone,squash,lives,level,invuln;

function loadBest(){
let vals=[];
try{let v=localStorage.getItem('solo_dino_v3');if(v)vals.push(parseInt(v,10))}catch(e){}
try{let v=sessionStorage.getItem('solo_dino_v3');if(v)vals.push(parseInt(v,10))}catch(e){}
return vals.length?Math.max(...vals.filter(v=>!isNaN(v))):0
}
function saveBest(v){
let val=String(Math.floor(v));
try{localStorage.setItem('solo_dino_v3',val)}catch(e){}
try{sessionStorage.setItem('solo_dino_v3',val)}catch(e){}
}
best=loadBest();

function reset(){
d={x:80,y:GY-44,w:42,h:44,vy:0,jumping:false};
o=[];
clouds=[];
for(let i=0;i<6;i++)clouds.push({x:Math.random()*W,y:20+Math.random()*70,w:50+Math.random()*60,s:.15+Math.random()*.35});
particles=[];
trail=[];
stars=[];
for(let i=0;i<60;i++)stars.push({x:Math.random()*W,y:Math.random()*H*.65,r:.3+Math.random()*1.3,a:.3+Math.random()*.7,tw:Math.random()*10});
if(!ambient){ambient=[];for(let i=0;i<25;i++)ambient.push({x:Math.random()*W,y:Math.random()*H,r:.5+Math.random()*2,vx:.1+Math.random()*.4,ph:Math.random()*10})}
score=0;speed=5;gameOver=false;last=0;shake=0;flash=0;runT=0;milestone=0;squash=1;
spawnTimer=70+Math.random()*30;
lives=3;level=1;invuln=0;
bestEl.textContent='BEST '+String(Math.floor(best)).padStart(5,'0');
speedStatEl.textContent='5.0x';
levelStatEl.textContent='1';
livesStatEl.textContent='❤❤❤';
}

function burst(px,py,n,col,spd){
for(let i=0;i<n;i++)particles.push({x:px,y:py,vx:(Math.random()-.5)*spd,vy:-Math.random()*spd,life:1,col,size:2+Math.random()*3})
}

function jumpDino(){
if(gameOver){reset();return}
if(!d.jumping){
d.jumping=true;d.vy=-14;squash=.7;
burst(d.x+d.w/2,GY,12,'251,191,36',4)
}
}

function cactus(){
let h=30+Math.random()*30;
o.push({x:W+20,y:GY-h,w:20+Math.random()*8,h,type:'cactus'});
if(Math.random()<.25){
o.push({x:W+20+40+Math.random()*12,y:GY-(24+Math.random()*22),w:20,h:24+Math.random()*22,type:'cactus'})
}
}

function bird(){
o.push({x:W+20,y:GY-70-Math.random()*40,w:44,h:28,type:'bird',wing:0});
}

function hit(a,b){
return a.x+6<b.x+b.w&&a.x+a.w-6>b.x&&a.y+6<b.y+b.h&&a.y+a.h>b.y
}

function drawStars(){
stars.forEach((s,i)=>{
let a=s.a*.6+Math.sin(runT*.03+s.tw)*.3;
x.fillStyle='rgba(255,255,255,'+Math.max(a,0)+')';
x.beginPath();x.arc(s.x,s.y,s.r,0,7);x.fill();
if(!gameOver)s.x-=.15*speed*.1;
if(s.x<-2)s.x=W+2;
})
}

function drawTrail(){
trail.forEach((p,i)=>{
let a=.25*(i/trail.length);
x.fillStyle='rgba(245,158,11,'+a+')';
x.beginPath();
x.roundRect(p.x,p.y,d.w,d.h,8);
x.fill();
})
}

function drawDino(){
x.save();
let cx=d.x+d.w/2,cy=d.y+d.h/2;
x.translate(cx,cy);
x.scale(1/squash,squash);
x.translate(-cx,-cy);

// Invulnerability flash
if(invuln>0 && Math.floor(invuln)%2===0){
x.globalAlpha=.5;
}

let legOff=d.jumping?0:Math.sin(runT*.6)*6;

// Shadow under dino
x.save();
x.fillStyle='rgba(0,0,0,.3)';
x.beginPath();
x.ellipse(d.x+d.w/2,GY+2,d.w*.55,5,0,0,7);
x.fill();
x.restore();

// Glow
x.shadowColor='rgba(16,185,129,.6)';x.shadowBlur=12;

// Body (green)
x.fillStyle='#10b981';
x.beginPath();
x.roundRect(d.x,d.y,d.w,d.h,8);
x.fill();

// Belly (lighter)
x.shadowBlur=0;
x.fillStyle='#6ee7b7';
x.beginPath();
x.ellipse(d.x+d.w*.45,d.y+d.h*.65,d.w*.28,d.h*.2,0,0,7);
x.fill();

// Head
x.fillStyle='#10b981';
x.shadowColor='rgba(16,185,129,.6)';x.shadowBlur=12;
x.beginPath();
x.roundRect(d.x+d.w*.65,d.y+d.h*.08,d.w*.55,d.h*.55,6);
x.fill();
x.shadowBlur=0;

// Eye (white)
x.fillStyle='#fff';
x.beginPath();
x.arc(d.x+d.w*.98,d.y+d.h*.25,4,0,7);
x.fill();

// Pupil (gold)
x.fillStyle='#fbbf24';
x.beginPath();
x.arc(d.x+d.w*1.0,d.y+d.h*.25,2.2,0,7);
x.fill();

// Mouth
x.strokeStyle='#065f46';
x.lineWidth=1.5;
x.beginPath();
x.moveTo(d.x+d.w*1.05,d.y+d.h*.42);
x.lineTo(d.x+d.w*1.15,d.y+d.h*.42);
x.stroke();

// Spikes on back
x.fillStyle='#047857';
for(let i=0;i<3;i++){
let px=d.x+d.w*.25+i*d.w*.15;
let py=d.y+2;
x.beginPath();
x.moveTo(px,py);
x.lineTo(px+4,py-6);
x.lineTo(px+8,py);
x.closePath();
x.fill();
}

// Legs
x.fillStyle='#047857';
x.beginPath();x.roundRect(d.x+d.w*.55,d.y+d.h,7,10+legOff,3);x.fill();
x.beginPath();x.roundRect(d.x+d.w*.15,d.y+d.h,7,10-legOff,3);x.fill();

// Arm
x.fillStyle='#10b981';
x.beginPath();
x.ellipse(d.x+d.w*.7,d.y+d.h*.6,6,4,-0.3,0,7);
x.fill();

x.restore();
}

function drawCactus(q){
x.save();
x.shadowColor='rgba(245,158,11,.5)';x.shadowBlur=14;

// Main trunk
x.fillStyle='#f59e0b';
x.beginPath();
x.roundRect(q.x,q.y,q.w,q.h,6);
x.fill();
x.shadowBlur=0;

// Vertical lines
x.strokeStyle='rgba(0,0,0,.15)';
x.lineWidth=1;
for(let i=1;i<4;i++){
x.beginPath();
x.moveTo(q.x+q.w*i/4,q.y+4);
x.lineTo(q.x+q.w*i/4,q.y+q.h-4);
x.stroke();
}

// Left arm
x.fillStyle='#f59e0b';
x.beginPath();x.roundRect(q.x-8,q.y+q.h*.35,8,6,2);x.fill();
x.beginPath();x.roundRect(q.x-8,q.y+q.h*.2,7,10,2);x.fill();

// Right arm
x.beginPath();x.roundRect(q.x+q.w,q.y+q.h*.5,8,6,2);x.fill();
x.beginPath();x.roundRect(q.x+q.w+1,q.y+q.h*.35,7,10,2);x.fill();

// Spikes
x.fillStyle='#fbbf24';
x.beginPath();x.arc(q.x+q.w*.25,q.y+6,1.5,0,7);x.fill();
x.beginPath();x.arc(q.x+q.w*.75,q.y+q.h*.5,1.5,0,7);x.fill();
x.beginPath();x.arc(q.x+q.w*.5,q.y+q.h*.85,1.5,0,7);x.fill();

x.restore();
}

function drawBird(q){
x.save();
let wing=Math.sin(runT*.3)*8;
// Body
x.fillStyle='#334155';
x.beginPath();
x.ellipse(q.x+q.w/2,q.y+q.h/2,q.w*.5,q.h*.3,0,0,7);
x.fill();
// Wings
x.beginPath();
x.moveTo(q.x+q.w*.35,q.y+q.h*.5);
x.lineTo(q.x+q.w*.15,q.y+q.h*.5+wing);
x.lineTo(q.x+q.w*.4,q.y+q.h*.65);
x.closePath();
x.fill();
x.beginPath();
x.moveTo(q.x+q.w*.65,q.y+q.h*.5);
x.lineTo(q.x+q.w*.85,q.y+q.h*.5+wing);
x.lineTo(q.x+q.w*.6,q.y+q.h*.65);
x.closePath();
x.fill();
// Head
x.beginPath();
x.arc(q.x+q.w*.85,q.y+q.h*.35,5,0,7);
x.fill();
// Eye
x.fillStyle='#ef4444';
x.beginPath();
x.arc(q.x+q.w*.87,q.y+q.h*.33,2,0,7);
x.fill();
x.restore();
}

function drawParticles(){
particles.forEach(p=>{
x.fillStyle='rgba('+p.col+','+Math.max(p.life,0)+')';
x.beginPath();
x.arc(p.x,p.y,p.size,0,7);
x.fill();
})
}

function drawAmbient(){
ambient.forEach(p=>{
let a=.12+Math.sin(runT*.05+p.ph)*.08;
x.fillStyle='rgba(251,191,36,'+a+')';
x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill();
})
}

function draw(){
x.clearRect(0,0,W,H);
x.save();
if(shake>0)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);

// Stars
drawStars();
drawAmbient();

// Clouds
x.fillStyle='rgba(255,255,255,.15)';
clouds.forEach(q=>{
let b=Math.sin(runT*.03+q.x*.01)*3;
x.beginPath();
x.arc(q.x,q.y+b,q.w*.3,0,7);
x.arc(q.x+q.w*.25,q.y+b-3,q.w*.35,0,7);
x.arc(q.x+q.w*.5,q.y+b,q.w*.28,0,7);
x.fill();
});

// Ground line
x.strokeStyle='rgba(245,158,11,.6)';
x.lineWidth=2.5;
x.setLineDash([14,10]);
x.lineDashOffset=-runT*speed*.7;
x.beginPath();x.moveTo(0,GY);x.lineTo(W,GY);x.stroke();
x.setLineDash([]);

// Ground glow
let grd=x.createLinearGradient(0,GY,0,GY+30);
grd.addColorStop(0,'rgba(245,158,11,.15)');
grd.addColorStop(1,'rgba(245,158,11,0)');
x.fillStyle=grd;
x.fillRect(0,GY,W,30);

drawTrail();
if(!gameOver||invuln>0)drawDino();

o.forEach(q=>{
if(q.type==='bird')drawBird(q);
else drawCactus(q);
});

drawParticles();

if(flash>0){
x.fillStyle='rgba(255,60,60,'+(flash*.4)+')';
x.fillRect(0,0,W,H);
}

// Level Up notification
if(milestone>0&&runT-lastMilestoneT<90){
let a=Math.max(0,1-(runT-lastMilestoneT)/90);
x.fillStyle='rgba(251,191,36,'+a+')';
x.font='bold 30px Arial';
x.textAlign='center';
x.fillText('LEVEL '+level+'!',W/2,H/2-20);
x.textAlign='left';
}

x.restore();

// Game Over
if(gameOver){
x.fillStyle='rgba(10,14,26,.85)';
x.fillRect(0,0,W,H);

x.textAlign='center';

// Title
x.font='bold 42px Arial';
x.fillStyle='#ef4444';
x.shadowColor='rgba(239,68,68,.8)';x.shadowBlur=20;
x.fillText('GAME OVER',W/2,H/2-40);
x.shadowBlur=0;

// Score
x.font='bold 22px Arial';
x.fillStyle='#10b981';
x.fillText('SCORE: '+Math.floor(score),W/2,H/2+2);

x.font='14px Arial';
x.fillStyle='rgba(251,191,36,.85)';
x.fillText('BEST: '+Math.floor(best),W/2,H/2+28);

x.font='bold 12px Arial';
x.fillStyle='rgba(255,255,255,.6)';
x.fillText('TAP TO RESTART',W/2,H/2+58);

x.font='bold 11px Arial';
x.fillStyle='rgba(251,191,36,.75)';
x.fillText('🏮 SOLO LEVELING 🏮',W/2,H/2+90);

x.textAlign='left';
}
}

let lastMilestoneT=-999;

function loop(t){
if(!last)last=t;
let dt=Math.min((t-last)/16.67,2);
last=t;
runT+=dt;

if(!gameOver){
d.y+=d.vy*dt;d.vy+=.75*dt;
if(d.y>=GY-d.h){
if(d.jumping){burst(d.x+d.w/2,GY,12,'251,191,36',4);squash=1.35}
d.y=GY-d.h;d.vy=0;d.jumping=false
}
if(d.jumping)trail.push({x:d.x,y:d.y});
if(trail.length>7)trail.shift();
if(!d.jumping)trail.length=0;
squash+=(1-squash)*.18*dt;

// Running dust
if(!d.jumping&&Math.floor(runT)%10===0&&Math.random()<.35){
burst(d.x+8,GY-2,1,'251,191,36',1.5)
}

// Ambient move
ambient.forEach(p=>{p.x-=p.vx*dt;if(p.x<-4)p.x=W+4});

if(invuln>0)invuln-=dt;

// Spawn
spawnTimer-=dt;
if(spawnTimer<=0){
if(score>200&&Math.random()<.2){bird()}
else{cactus()}
spawnTimer=Math.max(35,60-speed*1.5)+Math.random()*35
}

// Move obstacles
o.forEach(q=>{
q.x-=speed*dt;
if(q.type==='bird')q.wing+=dt*.15;
});
o=o.filter(q=>q.x>-80);

// Clouds
clouds.forEach(q=>{q.x-=q.s*dt;if(q.x<-120)q.x=W+Math.random()*150});

// Particles
particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.3*dt;p.life-=.03*dt});
particles=particles.filter(p=>p.life>0);

// Speed
speed=Math.min(13,speed+.002*dt);

// Score
score+=dt*.8;
if(score>best)best=score;

// Level up
let newLevel=Math.floor(score/500)+1;
if(newLevel>level){
level=newLevel;
milestone=level;
lastMilestoneT=runT;
levelStatEl.textContent=level;
scoreEl.style.transform='scale(1.4)';
setTimeout(()=>scoreEl.style.transform='scale(1)',180);
}

// HUD updates
scoreEl.textContent=String(Math.floor(score)).padStart(5,'0');
bestEl.textContent='BEST '+String(Math.floor(best)).padStart(5,'0');
speedStatEl.textContent=speed.toFixed(1)+'x';

// Collision
if(invuln<=0){
for(const q of o){
if(hit(d,q)){
lives--;
if(lives>0){
invuln=60;
shake=10;
burst(d.x+d.w/2,d.y+d.h/2,15,'239,68,68',5);
} else {
gameOver=true;shake=16;flash=1;
saveBest(best);
burst(d.x+d.w/2,d.y+d.h/2,25,'239,68,68',6)
}
// Update lives display
livesStatEl.textContent='❤'.repeat(Math.max(lives,0))+'🖤'.repeat(Math.max(3-lives,0));
break;
}
}
}
}

if(shake>0)shake=Math.max(0,shake-.6*dt);
if(flash>0)flash=Math.max(0,flash-.05*dt);

draw();
requestAnimationFrame(loop)
}

document.addEventListener('pointerdown',e=>{e.preventDefault();jumpDino()});
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();jumpDino()}});

reset();
requestAnimationFrame(loop);
</script></body>`;

// ============================================================
// ⚔️ أمر دينو
// ============================================================

export default {
    name: "دينو",
    aliases: ["dino", "runner", "ديناصور", "لعبة_دينو"],
    description: "SOLO Dino Runner — Enhanced Edition",
    category: "games",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, reply, react }) {

        const chatId = message.key.remoteJid;

        try {

            await react("🦖");

            const responseData = {
                response_id: "solo-dino-" + Date.now(),
                sections: [
                    {
                        view_model: {
                            primitive: {
                                __typename: "GenAIaeacdsnwHtmlPrimitive",
                                payload: GAME_HTML,
                                trusted_sources: ["solo.dev"]
                            },
                            __typename: "GenAISingleLayoutViewModel"
                        }
                    }
                ]
            };

            const dataBase64 = Buffer.from(
                JSON.stringify(responseData, null, 2)
            ).toString('base64');

            await sock.relayMessage(
                chatId,
                {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        botMetadata: {
                            messageDisclaimerText: "",
                            botResponseId: "solo-dino-" + Date.now(),
                            verificationMetadata: {
                                proofs: []
                            }
                        }
                    },
                    botForwardedMessage: {
                        message: {
                            richResponseMessage: {
                                messageType: 1,
                                submessages: [
                                    {
                                        messageType: 2,
                                        messageText: "🦖 SOLO DINO RUNNER"
                                    }
                                ],
                                unifiedResponse: {
                                    data: dataBase64
                                },
                                contextInfo: {
                                    forwardingScore: 1,
                                    isForwarded: true,
                                    forwardedAiBotMessageInfo: {
                                        botJid: "867051314767696@bot"
                                    },
                                    forwardOrigin: 4
                                }
                            }
                        }
                    }
                },
                {}
            );

            await react("✅");

        } catch (error) {

            console.error("❌ SOLO DINO ERROR:", error?.message || error);
            await react("❌");

            return reply(`*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ ❌ فــشــلــت الــلــعــبــة ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ${error?.message || 'حاول مرة تانية'}*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};