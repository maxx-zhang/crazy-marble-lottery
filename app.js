const COOLDOWN_SECONDS=300;
// GitHub Pages 只托管静态文件，没有 Node.js API；在静态托管地址下使用本地模式。
const IS_STANDALONE=location.protocol==='file:'||location.hostname.endsWith('github.io');
const PRIZES=[['50颗弹珠',30],['100颗弹珠',35],['150颗弹珠',10],['200颗弹珠',3],['1积分卡',15],['5积分卡',4],['10积分卡',2],['15积分卡',1]];
const visitorKey='crazy-marble-visitor-id-v1';
const cooldownKey='crazy-marble-cooldown-v1';
const prizeKey='crazy-marble-last-prize-v1';
const stage=document.getElementById('screenStage');
const screenImage=document.getElementById('screenImage');
const drawButton=document.getElementById('drawButton');
const probabilityButton=document.getElementById('probabilityButton');
const resultButton=document.getElementById('resultButton');
const livePrize=document.getElementById('livePrize');
const screenLoading=document.getElementById('screenLoading');
const probabilityModal=document.getElementById('probabilityModal');
const probabilityClose=document.getElementById('probabilityClose');
let currentView='home';

function getVisitorId(){let id=localStorage.getItem(visitorKey);if(!id){id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;localStorage.setItem(visitorKey,id)}return id}
function remaining(){return Math.max(0,Math.ceil((Number(localStorage.getItem(cooldownKey)||0)-Date.now())/1000))}
function setCooldown(){localStorage.setItem(cooldownKey,String(Date.now()+COOLDOWN_SECONDS*1000))}
function setView(view,prize=''){currentView=view;stage.className='screen-stage'+(view==='result'?' is-result':'');screenImage.src=view==='result'?'assets/result-reference.png':'assets/home-reference.png';screenImage.alt=view==='result'?'疯狂弹珠中奖结果':'疯狂弹珠抽奖首页';livePrize.textContent=prize;livePrize.setAttribute('aria-label',prize);window.scrollTo(0,0)}
function setBusy(busy){drawButton.disabled=busy||remaining()>0}
function pickLocalPrize(){const roll=Math.floor(Math.random()*100);let cursor=0;for(const [name,probability] of PRIZES){cursor+=probability;if(roll<cursor)return name}return PRIZES[PRIZES.length-1][0]}
function openProbability(){window.scrollTo(0,0);probabilityModal.classList.add('is-open');probabilityModal.setAttribute('aria-hidden','false')}
function closeProbability(){probabilityModal.classList.remove('is-open');probabilityModal.setAttribute('aria-hidden','true');if(currentView==='result'){const prize=localStorage.getItem(prizeKey)||livePrize.textContent;setView('result',prize)}}
async function draw(){
  if(remaining()>0){const savedPrize=localStorage.getItem(prizeKey);if(savedPrize)setView('result',savedPrize);return}
  setBusy(true);screenLoading.style.display='grid';
  try{
    if(IS_STANDALONE){const prize=pickLocalPrize();setCooldown();localStorage.setItem(prizeKey,prize);setView('result',prize);return}
    const response=await fetch('/api/draw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId:getVisitorId()})});
    const data=await response.json();
    if(!response.ok||!data.success){
      if(data.code==='COOLDOWN'){localStorage.setItem(cooldownKey,String(Date.now()+data.remainingSeconds*1000));const savedPrize=localStorage.getItem(prizeKey);if(savedPrize)setView('result',savedPrize);setBusy(false);return}
      throw new Error('draw failed')
    }
    setCooldown();localStorage.setItem(prizeKey,data.prize.name);setView('result',data.prize.name)
  }catch(_){setBusy(false)}finally{screenLoading.style.display='none'}
}

drawButton.addEventListener('click',draw);
probabilityButton.addEventListener('click',openProbability);
resultButton.addEventListener('click',openProbability);
probabilityClose.addEventListener('click',closeProbability);
probabilityModal.addEventListener('click',event=>{if(event.target===probabilityModal)closeProbability()});

const savedPrize=localStorage.getItem(prizeKey);
if(remaining()>0&&savedPrize){setView('result',savedPrize)}else{localStorage.removeItem(prizeKey);setView('home');setBusy(false)}
