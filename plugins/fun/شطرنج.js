// plugins/شطرنج.js
// ♟️ SOLO CHESS GAME ♟️
import { Buffer } from 'buffer';

const FOOTER = `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

export default {
    name: "شطرنج",
    aliases: ["chess", "نيـرو", "niro"],
    category: "games",
    desc: "لعبة شطرنج تفاعلية مع ذكاء اصطناعي",
    usage: ".شطرنج",

    async run({ sock, message, reply, react }) {
        const chatId = message.key.remoteJid;

        try {
            await sock.sendMessage(chatId, {
                react: { text: '♟️', key: message.key }
            });

            // ═══════════════════════════════════════════════
            // 🎮 كود HTML كامل للعبة الشطرنج
            // ═══════════════════════════════════════════════
            const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<title>SOLO CHESS</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;padding:0;background:radial-gradient(ellipse at top,#1a1408 0%,#0a0e1a 50%,#050810 100%);color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;min-height:100vh;overflow-x:hidden}

/* ════ SOLO Header ════ */
.solo-header{text-align:center;margin:10px auto 12px;padding:8px 24px;background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(16,185,129,.08));border:1.5px solid rgba(245,158,11,.4);border-radius:16px;display:inline-block;width:calc(100% - 20px);max-width:520px;position:relative;left:50%;transform:translateX(-50%)}
.solo-header__brand{font-size:15px;font-weight:900;color:#fbbf24;letter-spacing:3px;text-shadow:0 0 15px rgba(251,191,36,.6)}
.solo-header__sub{font-size:9px;color:rgba(251,191,36,.7);letter-spacing:4px;margin-top:2px;font-weight:800}

.app{width:100%;max-width:520px;margin:auto;padding:0 10px 25px}
.title{text-align:center;font-size:22px;font-weight:900;letter-spacing:2px;margin:8px 0 4px;color:#fff;text-shadow:0 0 15px rgba(245,158,11,.4)}
.sub{text-align:center;color:rgba(251,191,36,.75);font-size:11px;margin-bottom:12px;font-weight:700;letter-spacing:1px}

.panel{background:linear-gradient(180deg,rgba(15,18,26,.85),rgba(10,12,18,.85));border:1.5px solid rgba(245,158,11,.25);border-radius:16px;padding:10px;margin-bottom:10px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 4px 20px rgba(0,0,0,.4),inset 0 0 30px rgba(245,158,11,.04)}

.stats{display:flex;justify-content:space-between;align-items:center;gap:7px}
.stat{flex:1;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:12px;padding:8px 5px;text-align:center}
.stat small{display:block;color:rgba(251,191,36,.7);font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}
.stat b{display:block;margin-top:3px;font-size:15px;color:#fff;font-weight:900}
#turn{color:#10b981;text-shadow:0 0 10px rgba(16,185,129,.5)}
#clock{color:#fbbf24;text-shadow:0 0 10px rgba(251,191,36,.5)}

.boardWrap{width:100%;padding:6px;border-radius:18px;background:linear-gradient(135deg,rgba(245,158,11,.2),rgba(10,14,26,.9));box-shadow:0 12px 40px rgba(0,0,0,.5),inset 0 0 40px rgba(245,158,11,.08);border:1.5px solid rgba(245,158,11,.3)}

.board{width:100%;aspect-ratio:1/1;display:grid;grid-template-columns:repeat(8,1fr);border-radius:14px;overflow:hidden;touch-action:manipulation}

.square{position:relative;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;cursor:pointer}
.light{background:linear-gradient(135deg,#f0d9b5,#e8c9a0)}
.dark{background:linear-gradient(135deg,#b58863,#9c6f4a)}
.square.selected{box-shadow:inset 0 0 0 4px rgba(251,191,36,.9),inset 0 0 20px rgba(251,191,36,.4)}
.square.last{box-shadow:inset 0 0 0 999px rgba(245,158,11,.2)}

.piece{position:relative;z-index:3;font-family:"Times New Roman",serif;font-size:clamp(31px,9.3vw,54px);line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5));transition:transform .12s}
.square:active .piece{transform:scale(.9)}

.moveDot{position:absolute;width:18%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#10b981,#059669);box-shadow:0 0 8px rgba(16,185,129,.9),0 0 15px rgba(16,185,129,.4);z-index:2;animation:pulseDot 1s infinite}
@keyframes pulseDot{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}

.captureHint{position:absolute;width:75%;height:75%;border-radius:50%;border:4px solid rgba(239,68,68,.9);box-shadow:0 0 12px rgba(239,68,68,.6);z-index:2;animation:pulseCap 1s infinite}
@keyframes pulseCap{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}

.check{box-shadow:inset 0 0 0 999px rgba(255,50,50,.35),inset 0 0 25px #ff3131 !important;animation:checkPulse .7s infinite}
@keyframes checkPulse{0%,100%{box-shadow:inset 0 0 0 999px rgba(255,50,50,.35),inset 0 0 20px #ff3131}50%{box-shadow:inset 0 0 0 999px rgba(255,50,50,.5),inset 0 0 30px #ff3131}}

.coords{position:absolute;font-size:9px;font-weight:900;opacity:.7;pointer-events:none}
.coordRank{top:3px;right:4px}
.coordFile{bottom:3px;left:4px}

.controls{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
button{border:0;border-radius:12px;padding:12px 6px;color:#fff;font-weight:900;font-size:11px;cursor:pointer;letter-spacing:.5px;transition:transform .08s,filter .15s;box-shadow:0 4px 12px rgba(0,0,0,.3)}
button:active{transform:scale(.95);filter:brightness(.9)}
.primary{background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e1a;box-shadow:0 4px 16px rgba(245,158,11,.4)}
.gold{background:linear-gradient(135deg,#8b5cf6,#6d28d9);box-shadow:0 4px 16px rgba(139,92,246,.4)}
.green{background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 16px rgba(16,185,129,.4)}
button:not(.primary):not(.gold):not(.green){background:linear-gradient(135deg,#334155,#1e293b);box-shadow:0 4px 16px rgba(51,65,85,.4)}

.moves{max-height:140px;overflow-y:auto;direction:ltr;display:flex;flex-wrap:wrap;gap:6px;padding:2px}
.move{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:5px 8px;font-size:11px;color:#fbbf24;font-weight:700;font-family:'Courier New',monospace}

.message{text-align:center;min-height:22px;font-size:13px;color:#fbbf24;margin-top:8px;font-weight:800;letter-spacing:.5px;padding:6px;background:rgba(245,158,11,.06);border-radius:10px;border:1px solid rgba(245,158,11,.15)}

.overlay{position:fixed;inset:0;background:rgba(5,2,4,.9);backdrop-filter:blur(10px);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{width:min(420px,100%);background:linear-gradient(160deg,#1a1408,#0a0e1a);border:2px solid rgba(245,158,11,.4);border-radius:24px;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.8),inset 0 0 60px rgba(245,158,11,.06)}
.modal h2{margin:0 0 6px;font-size:22px;color:#fbbf24;letter-spacing:2px;text-shadow:0 0 15px rgba(251,191,36,.5)}
.modal p{color:rgba(251,191,36,.7);font-size:12px;margin:0 0 18px;font-weight:700;letter-spacing:1px}

.levels{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.level{padding:16px 8px;background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(16,185,129,.06));border:1.5px solid rgba(245,158,11,.3);border-radius:14px;color:#fff;cursor:pointer;transition:transform .08s,box-shadow .15s}
.level:active{transform:scale(.96)}
.level:hover{box-shadow:0 6px 20px rgba(245,158,11,.3);border-color:rgba(245,158,11,.6)}
.level b{display:block;font-size:14px;margin-bottom:5px;color:#fbbf24}
.level span{color:rgba(255,255,255,.6);font-size:10px;font-weight:600}

.promotion{display:none;position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);align-items:center;justify-content:center}
.promoBox{background:linear-gradient(160deg,#1a1408,#0a0e1a);border:2px solid rgba(245,158,11,.4);border-radius:20px;padding:20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.8)}
.promoBox b{color:#fbbf24;font-size:14px;letter-spacing:1px;display:block;margin-bottom:12px}
.promoChoices{display:flex;gap:10px;margin-top:10px}
.promoChoices button{width:64px;height:64px;font-size:36px;background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(16,185,129,.1));border:1.5px solid rgba(245,158,11,.3);border-radius:14px}
.promoChoices button:hover{background:linear-gradient(135deg,rgba(245,158,11,.3),rgba(16,185,129,.2));border-color:#fbbf24}

.hidden{display:none!important}

@media(max-width:360px){.app{padding:0 6px 20px}.controls button{font-size:10px;padding:10px 4px}.promoChoices button{width:56px;height:56px;font-size:30px}}
</style>
</head>
<body>

<div class="solo-header">
  <div class="solo-header__brand">🏮 S O L O 🏮</div>
  <div class="solo-header__sub">L E V E L I N G</div>
</div>

<div class="overlay" id="start">
  <div class="modal">
    <h2>♟️ SOLO CHESS</h2>
    <p>Choose Difficulty • 🏮 SOLO LEVELING 🏮</p>
    <div class="levels">
      <button class="level" onclick="startGame(0)"><b>🟢 EASY</b><span>Random moves</span></button>
      <button class="level" onclick="startGame(1)"><b>🔵 NORMAL</b><span>Basic AI</span></button>
      <button class="level" onclick="startGame(2)"><b>🟡 HARD</b><span>Better logic</span></button>
      <button class="level" onclick="startGame(3)"><b>🔴 EXPERT</b><span>Deep search</span></button>
    </div>
  </div>
</div>

<div class="promotion" id="promotion">
  <div class="promoBox">
    <b>CHOOSE PIECE</b>
    <div class="promoChoices">
      <button onclick="promote('q')">♕</button>
      <button onclick="promote('r')">♖</button>
      <button onclick="promote('b')">♗</button>
      <button onclick="promote('n')">♘</button>
    </div>
  </div>
</div>

<div class="app">
  <div class="title">♟️ SOLO CHESS</div>
  <div class="sub">Tap a piece to see legal moves</div>

  <div class="panel">
    <div class="stats">
      <div class="stat"><small>LEVEL</small><b id="levelText">-</b></div>
      <div class="stat"><small>TURN</small><b id="turn">You</b></div>
      <div class="stat"><small>TIME</small><b id="clock">10:00</b></div>
    </div>
  </div>

  <div class="boardWrap"><div class="board" id="board"></div></div>
  <div class="message" id="message">Choose a level to begin</div>

  <div class="panel">
    <div class="controls">
      <button class="primary" onclick="newGame(true)">🔄 NEW</button>
      <button class="gold" onclick="undoMove()">↩️ UNDO</button>
      <button class="green" onclick="hint()">💡 HINT</button>
      <button onclick="showLevels()">🎯 LEVEL</button>
      <button onclick="flipBoard()">🔃 FLIP</button>
      <button onclick="clearSelection()">✖️ CLEAR</button>
    </div>
  </div>

  <div class="panel">
    <b style="color:#fbbf24;font-size:11px;letter-spacing:2px">📜 MOVE HISTORY</b>
    <div class="moves" id="moves" style="margin-top:8px"></div>
  </div>
</div>

<script>
const WHITE='w',BLACK='b';
const PIECES={wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};
const VALUES={p:100,n:320,b:330,r:500,q:900,k:20000};
const START=['br','bn','bb','bq','bk','bb','bn','br','bp','bp','bp','bp','bp','bp','bp','bp',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'wp','wp','wp','wp','wp','wp','wp','wp','wr','wn','wb','wq','wk','wb','wn','wr'];

let board=[...START],turn=WHITE,selected=null,legalMoves=[],lastMove=null,history=[],moveText=[],level=0,gameStarted=false,gameOver=false,flipped=false,pendingPromotion=null,castling={wK:true,wQ:true,bK:true,bQ:true},enPassant=null,seconds=600,timer=null;
const files=['a','b','c','d','e','f','g','h'];

const boardEl=document.getElementById('board'),messageEl=document.getElementById('message'),movesEl=document.getElementById('moves'),turnEl=document.getElementById('turn'),clockEl=document.getElementById('clock'),levelEl=document.getElementById('levelText');

function colorOf(p){return p?p[0]:null}
function typeOf(p){return p?p[1]:null}
function row(i){return Math.floor(i/8)}
function col(i){return i%8}
function idx(r,c){return r*8+c}
function inside(r,c){return r>=0&&r<8&&c>=0&&c<8}
function nameSquare(i){return files[col(i)]+(8-row(i))}
function cloneState(){return{board:[...board],turn,castling:{...castling},enPassant,lastMove,moveText:[...moveText]}}
function restoreState(s){board=[...s.board];turn=s.turn;castling={...s.castling};enPassant=s.enPassant;lastMove=s.lastMove;moveText=[...s.moveText];selected=null;legalMoves=[];render();updateMoves();updateStatus()}

function startGame(lvl){
  level=lvl;gameStarted=true;gameOver=false;
  document.getElementById('start').classList.add('hidden');
  newGame(false);
  const names=['EASY','NORMAL','HARD','EXPERT'];
  levelEl.textContent=names[level];
  seconds=600;clearInterval(timer);
  timer=setInterval(()=>{
    if(gameOver)return;
    if(turn===WHITE){seconds--;if(seconds<=0){seconds=0;gameOver=true;messageEl.textContent='⏱️ Time up — AI wins';clearInterval(timer);}}
    updateClock();
  },1000);
  updateClock();
}

function newGame(show=true){
  board=[...START];turn=WHITE;selected=null;legalMoves=[];lastMove=null;history=[];moveText=[];gameOver=false;
  castling={wK:true,wQ:true,bK:true,bQ:true};enPassant=null;
  if(show && !gameStarted){document.getElementById('start').classList.remove('hidden');}
  render();updateMoves();updateStatus();
}

function showLevels(){document.getElementById('start').classList.remove('hidden');}

function updateClock(){
  let m=Math.floor(seconds/60),s=seconds%60;
  clockEl.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

function render(){
  boardEl.innerHTML='';
  for(let visual=0;visual<64;visual++){
    let i=flipped?63-visual:visual;
    const r=row(i),c=col(i);
    const sq=document.createElement('div');
    sq.className='square '+((r+c)%2===0?'light':'dark');
    if(selected===i)sq.classList.add('selected');
    if(lastMove&&(lastMove.from===i||lastMove.to===i))sq.classList.add('last');
    const piece=board[i];
    if(piece){const p=document.createElement('div');p.className='piece';p.textContent=PIECES[piece];sq.appendChild(p);}
    if(selected!==null){
      const move=legalMoves.find(x=>x.to===i);
      if(move){
        if(board[i]){const cap=document.createElement('div');cap.className='captureHint';sq.appendChild(cap);}
        else{const dot=document.createElement('div');dot.className='moveDot';sq.appendChild(dot);}
      }
    }
    if(isKingInCheck(board,WHITE)&&board[i]==='wk')sq.classList.add('check');
    if(isKingInCheck(board,BLACK)&&board[i]==='bk')sq.classList.add('check');
    if(c===0){const rank=document.createElement('span');rank.className='coords coordRank';rank.textContent=8-r;sq.appendChild(rank);}
    if(r===7){const file=document.createElement('span');file.className='coords coordFile';file.textContent=files[c];sq.appendChild(file);}
    sq.onclick=()=>clickSquare(i);
    boardEl.appendChild(sq);
  }
}

function clickSquare(i){
  if(!gameStarted||gameOver||turn!==WHITE)return;
  const piece=board[i];
  if(selected===null){
    if(piece&&colorOf(piece)===WHITE){selected=i;legalMoves=getLegalMoves(board,WHITE).filter(m=>m.from===i);render();}
    return;
  }
  const chosen=legalMoves.find(m=>m.to===i);
  if(chosen){makeHumanMove(chosen);return;}
  if(piece&&colorOf(piece)===WHITE){selected=i;legalMoves=getLegalMoves(board,WHITE).filter(m=>m.from===i);render();return;}
  clearSelection();
}

function clearSelection(){selected=null;legalMoves=[];render();}

function makeHumanMove(move){
  history.push(cloneState());
  if(move.promotion){pendingPromotion=move;document.getElementById('promotion').style.display='flex';return;}
  applyMove(move);selected=null;legalMoves=[];render();updateMoves();
  turn=BLACK;
  if(checkGameEnd())return;
  updateStatus();render();
  setTimeout(aiMove,250);
}

function promote(piece){
  document.getElementById('promotion').style.display='none';
  if(!pendingPromotion)return;
  const move=pendingPromotion;pendingPromotion=null;move.promotion=piece;
  applyMove(move);selected=null;legalMoves=[];render();updateMoves();
  turn=BLACK;
  if(checkGameEnd())return;
  updateStatus();render();
  setTimeout(aiMove,250);
}

function applyMove(move){
  const p=board[move.from],captured=board[move.to];
  board[move.to]=p;board[move.from]=null;
  if(move.enPassant){const cap=move.to+(p[0]===WHITE?8:-8);board[cap]=null;}
  if(move.castle){
    if(move.to>move.from){board[move.to-1]=board[move.to+1];board[move.to+1]=null;}
    else{board[move.to+1]=board[move.to-2];board[move.to-2]=null;}
  }
  if(move.promotion)board[move.to]=p[0]+move.promotion;
  updateCastling(p,move.from,move.to,captured);
  if(typeOf(p)==='p'&&Math.abs(move.to-move.from)===16)enPassant=(move.to+move.from)/2;
  else enPassant=null;
  lastMove={from:move.from,to:move.to};
  moveText.push(formatMove(move,p,captured));
}

function updateCastling(p,from,to,captured){
  if(p==='wk'){castling.wK=false;castling.wQ=false;}
  if(p==='bk'){castling.bK=false;castling.bQ=false;}
  if(p==='wr'&&from===63)castling.wK=false;
  if(p==='wr'&&from===56)castling.wQ=false;
  if(p==='br'&&from===7)castling.bK=false;
  if(p==='br'&&from===0)castling.bQ=false;
  if(captured==='wr'&&to===63)castling.wK=false;
  if(captured==='wr'&&to===56)castling.wQ=false;
  if(captured==='br'&&to===7)castling.bK=false;
  if(captured==='br'&&to===0)castling.bQ=false;
}

function formatMove(move,p,captured){
  let text=nameSquare(move.from)+'-'+nameSquare(move.to);
  if(move.castle)text=move.to>move.from?'O-O':'O-O-O';
  if(captured)text+=' x';
  if(move.promotion)text+='='+move.promotion.toUpperCase();
  return text;
}

function getPseudoMoves(b,side){
  const moves=[];
  for(let i=0;i<64;i++){
    const p=b[i];
    if(!p||colorOf(p)!==side)continue;
    const type=typeOf(p),r=row(i),c=col(i);
    if(type==='p'){
      const dir=side===WHITE?-1:1,start=side===WHITE?6:1,promo=side===WHITE?0:7;
      const oneR=r+dir;
      if(inside(oneR,c)&&!b[idx(oneR,c)]){
        const to=idx(oneR,c);
        if(oneR===promo){['q','r','b','n'].forEach(x=>moves.push({from:i,to,promotion:x}));}
        else{moves.push({from:i,to});if(r===start){const twoR=r+dir*2;if(!b[idx(twoR,c)])moves.push({from:i,to:idx(twoR,c)});}}
      }
      for(const dc of [-1,1]){
        const nr=r+dir,nc=c+dc;
        if(!inside(nr,nc))continue;
        const to=idx(nr,nc);
        if(b[to]&&colorOf(b[to])!==side){
          if(nr===promo){['q','r','b','n'].forEach(x=>moves.push({from:i,to,promotion:x}));}
          else moves.push({from:i,to});
        }
        if(enPassant===to)moves.push({from:i,to,enPassant:true});
      }
    }
    if(type==='n'){
      const jumps=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for(const [dr,dc] of jumps){
        const nr=r+dr,nc=c+dc;
        if(!inside(nr,nc))continue;
        const to=idx(nr,nc);
        if(!b[to]||colorOf(b[to])!==side)moves.push({from:i,to});
      }
    }
    if(['b','r','q'].includes(type)){
      const dirs=[];
      if(type==='b'||type==='q')dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if(type==='r'||type==='q')dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      for(const [dr,dc] of dirs){
        let nr=r+dr,nc=c+dc;
        while(inside(nr,nc)){
          const to=idx(nr,nc);
          if(!b[to])moves.push({from:i,to});
          else{if(colorOf(b[to])!==side)moves.push({from:i,to});break;}
          nr+=dr;nc+=dc;
        }
      }
    }
    if(type==='k'){
      for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
        if(!dr&&!dc)continue;
        const nr=r+dr,nc=c+dc;
        if(!inside(nr,nc))continue;
        const to=idx(nr,nc);
        if(!b[to]||colorOf(b[to])!==side)moves.push({from:i,to});
      }
      if(side===WHITE&&i===60){
        if(castling.wK&&!b[61]&&!b[62]&&b[63]==='wr'&&!isSquareAttacked(b,60,BLACK)&&!isSquareAttacked(b,61,BLACK)&&!isSquareAttacked(b,62,BLACK))moves.push({from:60,to:62,castle:true});
        if(castling.wQ&&!b[59]&&!b[58]&&!b[57]&&b[56]==='wr'&&!isSquareAttacked(b,60,BLACK)&&!isSquareAttacked(b,59,BLACK)&&!isSquareAttacked(b,58,BLACK))moves.push({from:60,to:58,castle:true});
      }
      if(side===BLACK&&i===4){
        if(castling.bK&&!b[5]&&!b[6]&&b[7]==='br'&&!isSquareAttacked(b,4,WHITE)&&!isSquareAttacked(b,5,WHITE)&&!isSquareAttacked(b,6,WHITE))moves.push({from:4,to:6,castle:true});
        if(castling.bQ&&!b[3]&&!b[2]&&!b[1]&&b[0]==='br'&&!isSquareAttacked(b,4,WHITE)&&!isSquareAttacked(b,3,WHITE)&&!isSquareAttacked(b,2,WHITE))moves.push({from:4,to:2,castle:true});
      }
    }
  }
  return moves;
}

function isSquareAttacked(b,sq,by){
  const r=row(sq),c=col(sq);
  const pawnDir=by===WHITE?-1:1;
  for(const dc of [-1,1]){
    const rr=r-pawnDir,cc=c+dc;
    if(inside(rr,cc)&&b[idx(rr,cc)]===by+'p')return true;
  }
  const jumps=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for(const [dr,dc] of jumps){
    const rr=r+dr,cc=c+dc;
    if(inside(rr,cc)&&b[idx(rr,cc)]===by+'n')return true;
  }
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc)continue;
    const rr=r+dr,cc=c+dc;
    if(inside(rr,cc)&&b[idx(rr,cc)]===by+'k')return true;
  }
  const lines=[[-1,0,'r'],[1,0,'r'],[0,-1,'r'],[0,1,'r'],[-1,-1,'b'],[-1,1,'b'],[1,-1,'b'],[1,1,'b']];
  for(const [dr,dc,typ] of lines){
    let rr=r+dr,cc=c+dc;
    while(inside(rr,cc)){
      const p=b[idx(rr,cc)];
      if(p){
        if(colorOf(p)===by){const t=typeOf(p);if(t===typ||t==='q')return true;}
        break;
      }
      rr+=dr;cc+=dc;
    }
  }
  return false;
}

function isKingInCheck(b,side){
  const king=b.indexOf(side+'k');
  if(king<0)return true;
  return isSquareAttacked(b,king,side===WHITE?BLACK:WHITE);
}

function simulateMove(b,move){
  const copy=[...b],p=copy[move.from];
  copy[move.to]=p;copy[move.from]=null;
  if(move.enPassant)copy[move.to+(p[0]===WHITE?8:-8)]=null;
  if(move.castle){
    if(move.to>move.from){copy[move.to-1]=copy[move.to+1];copy[move.to+1]=null;}
    else{copy[move.to+1]=copy[move.to-2];copy[move.to-2]=null;}
  }
  if(move.promotion)copy[move.to]=p[0]+move.promotion;
  return copy;
}

function getLegalMoves(b,side){
  const pseudo=getPseudoMoves(b,side);
  return pseudo.filter(move=>!isKingInCheck(simulateMove(b,move),side));
}

function checkGameEnd(){
  const moves=getLegalMoves(board,turn);
  if(moves.length===0){
    gameOver=true;clearInterval(timer);
    if(isKingInCheck(board,turn)){
      if(turn===WHITE)messageEl.textContent='♚ CHECKMATE — AI wins';
      else messageEl.textContent='👑 CHECKMATE — You win!';
    }else messageEl.textContent='🤝 DRAW — No legal moves';
    updateStatus();return true;
  }
  if(isKingInCheck(board,turn))messageEl.textContent=turn===WHITE?'⚠️ CHECK! Your king is in danger':'⚠️ AI in check';
  else messageEl.textContent=turn===WHITE?'Tap a piece to see legal moves':'🤖 AI thinking...';
  return false;
}

function updateStatus(){
  if(gameOver)return;
  turnEl.textContent=turn===WHITE?'You':'AI 🤖';
  if(isKingInCheck(board,turn))messageEl.textContent=turn===WHITE?'⚠️ CHECK! Defend your king':'⚠️ AI in check';
  else messageEl.textContent=turn===WHITE?'Tap a piece to see legal moves':'🤖 AI thinking...';
}

function updateMoves(){
  movesEl.innerHTML='';
  moveText.forEach((x,i)=>{
    const d=document.createElement('div');
    d.className='move';
    d.textContent=((i%2===0)?Math.floor(i/2+1)+'. ':'')+x;
    movesEl.appendChild(d);
  });
  movesEl.scrollTop=movesEl.scrollHeight;
}

function aiMove(){
  if(gameOver)return;
  turn=BLACK;updateStatus();
  const moves=getLegalMoves(board,BLACK);
  if(!moves.length){checkGameEnd();return;}
  let chosen;
  if(level===0)chosen=moves[Math.floor(Math.random()*moves.length)];
  else{
    const depth=level===1?1:level===2?2:3;
    chosen=findBestMove(depth);
  }
  history.push(cloneState());
  applyMove(chosen);
  turn=WHITE;
  render();updateMoves();checkGameEnd();updateStatus();
}

function findBestMove(depth){
  const moves=getLegalMoves(board,BLACK);
  let best=null,bestScore=-Infinity;
  for(const move of moves){
    const score=minimax(simulateMove(board,move),depth-1,false,-Infinity,Infinity);
    if(score>bestScore){bestScore=score;best=move;}
  }
  return best||moves[0];
}

function minimax(b,depth,maximizing,alpha,beta){
  const side=maximizing?BLACK:WHITE;
  const moves=getLegalMoves(b,side);
  if(moves.length===0){
    if(isKingInCheck(b,side))return side===BLACK?-999999:999999;
    return 0;
  }
  if(depth===0)return evaluate(b);
  if(maximizing){
    let value=-Infinity;
    for(const move of moves){
      value=Math.max(value,minimax(simulateMove(b,move),depth-1,false,alpha,beta));
      alpha=Math.max(alpha,value);
      if(alpha>=beta)break;
    }
    return value;
  }else{
    let value=Infinity;
    for(const move of moves){
      value=Math.min(value,minimax(simulateMove(b,move),depth-1,true,alpha,beta));
      beta=Math.min(beta,value);
      if(alpha>=beta)break;
    }
    return value;
  }
}

function evaluate(b){
  let score=0;
  for(const p of b){
    if(!p)continue;
    const value=VALUES[typeOf(p)];
    score+=colorOf(p)===BLACK?value:-value;
  }
  const center=[27,28,35,36];
  center.forEach(i=>{if(b[i])score+=colorOf(b[i])===BLACK?20:-20;});
  return score;
}

function hint(){
  if(!gameStarted||gameOver||turn!==WHITE)return;
  const moves=getLegalMoves(board,WHITE);
  if(!moves.length)return;
  let chosen;
  if(level===0)chosen=moves[Math.floor(Math.random()*moves.length)];
  else{
    const depth=level===1?1:level===2?2:3;
    let best=Infinity;
    for(const move of moves){
      const score=minimax(simulateMove(board,move),depth-1,true,-Infinity,Infinity);
      if(score<best){best=score;chosen=move;}
    }
  }
  selected=chosen.from;
  legalMoves=moves.filter(m=>m.from===chosen.from);
  render();
  setTimeout(()=>{if(selected===chosen.from){selected=null;legalMoves=[];render();}},1800);
}

function undoMove(){
  if(!history.length||gameOver)return;
  const state=history.pop();
  restoreState(state);
  gameOver=false;
  messageEl.textContent='↩️ Move undone';
}

function flipBoard(){flipped=!flipped;render();}

newGame();
</script>
</body>
</html>`;

            // ═══════════════════════════════════════════════
            // 🎯 تـحـويـل HTML لـ Base64
            // ═══════════════════════════════════════════════
            const data = Buffer.from(JSON.stringify({
                response_id: "solo-chess-" + Date.now(),
                sections: [{
                    view_model: {
                        primitive: {
                            __typename: "GenAIaeacdsnwHtmlPrimitive",
                            payload: html,
                            trusted_sources: ["solo.dev"]
                        },
                        __typename: "GenAISingleLayoutViewModel"
                    }
                }]
            })).toString('base64');

            // ═══════════════════════════════════════════════
            // 📤 إرسال الرسالة التفاعلية
            // ═══════════════════════════════════════════════
            await sock.relayMessage(
                chatId,
                {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        botMetadata: {
                            messageDisclaimerText: "",
                            botResponseId: "solo-chess-" + Date.now(),
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
                                        messageText: "♟️ 𝐒𝐎𝐋𝐎 𝐂𝐇𝐄𝐒𝐒\n🏮 𝑺𝑶𝑳𝑶 𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮"
                                    }
                                ],
                                unifiedResponse: {
                                    data
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

            await sock.sendMessage(chatId, {
                react: { text: "✅", key: message.key }
            });

        } catch (error) {
            console.error("❌ SOLO CHESS ERROR:", error?.message || error);
            await sock.sendMessage(chatId, {
                react: { text: "❌", key: message.key }
            });
            return reply(`*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ ❌ فــشــلــت الــلــعــبــة ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ${error?.message || 'حاول مرة تانية'}*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};