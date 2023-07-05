const gameTime=120;let yomiDict=new Map,problem="",problems=[],answer="生麦生米生卵",correctCount=0;const audioContext=new AudioContext,audioBufferCache={};loadAudio("end","mp3/end.mp3"),loadAudio("correct","mp3/correct3.mp3"),loadAudio("incorrect","mp3/incorrect1.mp3");let japaneseVoices=[];loadVoices();const voiceInput=setVoiceInput();loadConfig();function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark"),localStorage.getItem("voice")==0&&(document.getElementById("voiceOn").classList.add("d-none"),document.getElementById("voiceOff").classList.remove("d-none"))}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}function toggleVoice(){localStorage.getItem("voice")!=0?(localStorage.setItem("voice",0),document.getElementById("voiceOn").classList.add("d-none"),document.getElementById("voiceOff").classList.remove("d-none"),speechSynthesis.cancel()):(localStorage.setItem("voice",1),document.getElementById("voiceOn").classList.remove("d-none"),document.getElementById("voiceOff").classList.add("d-none"),speak(answer))}async function playAudio(b,c){const d=await loadAudio(b,audioBufferCache[b]),a=audioContext.createBufferSource();if(a.buffer=d,c){const b=audioContext.createGain();b.gain.value=c,b.connect(audioContext.destination),a.connect(b),a.start()}else a.connect(audioContext.destination),a.start()}async function loadAudio(a,c){if(audioBufferCache[a])return audioBufferCache[a];const d=await fetch(c),e=await d.arrayBuffer(),b=await audioContext.decodeAudioData(e);return audioBufferCache[a]=b,b}function unlockAudio(){audioContext.resume()}function loadVoices(){const a=new Promise(b=>{let a=speechSynthesis.getVoices();if(a.length!==0)b(a);else{let c=!1;speechSynthesis.addEventListener("voiceschanged",()=>{c=!0,a=speechSynthesis.getVoices(),b(a)}),setTimeout(()=>{c||document.getElementById("noTTS").classList.remove("d-none")},1e3)}});a.then(a=>{japaneseVoices=a.filter(a=>a.lang=="ja-JP")})}loadVoices();function speak(b){speechSynthesis.cancel();const a=new SpeechSynthesisUtterance(b);a.onend=()=>{voiceInput.start()},a.voice=japaneseVoices[Math.floor(Math.random()*japaneseVoices.length)],a.lang="ja-JP",voiceInput.stop(),speechSynthesis.speak(a)}function respeak(){speak(answer)}function getRandomInt(a,b){return a=Math.ceil(a),b=Math.floor(b),Math.floor(Math.random()*(b-a)+a)}function nextProblem(){const[b,a]=problems[getRandomInt(0,problems.length-1)];problem=b,answer=a,document.getElementById("problem").textContent=problem,document.getElementById("yomi").textContent=a,document.getElementById("reply").textContent="こたえてください",localStorage.getItem("voice")!=0&&speak(answer)}function initProblems(){const a=document.getElementById("grade").selectedIndex;fetch("data/"+a+".csv").then(a=>a.text()).then(a=>{problems=[],a.split("\n").forEach(a=>{if(a.startsWith("#"))return!0;const[b,c]=a.split(",");problems.push([b,c])})})}function setVoiceInput(){if("webkitSpeechRecognition"in window){const a=new webkitSpeechRecognition;return a.lang="ja-JP",a.continuous=!0,a.onstart=()=>{const a=document.getElementById("startVoiceInput"),b=document.getElementById("stopVoiceInput");a.classList.add("d-none"),b.classList.remove("d-none")},a.onend=()=>{speechSynthesis.speaking||a.start()},a.onresult=d=>{const b=d.results[0][0].transcript,c=document.getElementById("reply");isEquals(b,answer,yomiDict)||isEquals(b,answer.slice(0,-1),yomiDict)?(correctCount+=1,playAudio("correct"),c.textContent="⭕ "+answer,nextProblem()):(playAudio("incorrect"),c.textContent="❌ "+b),a.stop()},a}else document.getElementById("noSTT").classList.remove("d-none")}function initYomiDict(){const a=new Map;return fetch("data/yomi.csv").then(a=>a.text()).then(b=>{b.trimEnd().split("\n").forEach(b=>{b.split("\n").forEach(d=>{const b=d.split(","),c=b[0],e=b.slice(1);for(const b of e)if(a.has(b)){const d=a.get(b);d.push(c),a.set(b,d)}else a.set(b,[c])})});for(const[b,c]of a){const d=c.sort((a,b)=>b.length-a.length);a.set(b,d)}yomiDict=a})}const numbersToKanji=a=>{if(a===void 0||a===null||a==="")return"";if(!/^-?[0-9]+$/g.test(a))throw new TypeError("半角数字以外の文字が含まれています。漢数字に変換できませんでした。-> "+a);if(a=Number(a),!Number.isSafeInteger(a))throw new RangeError("数値が "+Number.MIN_SAFE_INTEGER+" ～ "+Number.MAX_SAFE_INTEGER+" の範囲外です。漢数字に変換できませんでした。-> "+a);if(a===0)return"零";let b="";a<0&&(b+="マイナス",a*=-1);const d=["","一","二","三","四","五","六","七","八","九"],e=["十","百","千","万","億","兆","京","垓","𥝱","穣","溝","澗","正","載","極","恒河沙","阿僧祇","那由他","不可思議","無量大数"],c=[1,2,3,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68],f=c.length;for(let g=f;g>=0;--g){const h=Math.pow(10,c[g]);if(a>=h){const f=Math.floor(a/h);f>=10?b+=numbersToKanji(f):f==1&&c[g]<=3||(b+=d[f]),b+=e[g],a-=f*h}}return b+=d[a],b};function formatSentence(a){return hiraToKana(a).toLowerCase().replace(/[\s　・。、「」!！?？]/g,"").replace(/\d+/g,a=>numbersToKanji(a))}function isEquals(q,p,m){const i=formatSentence(q),f=formatSentence(p),l=5,o=10,n=f.length*f.length*o;let k=0,c=0,a=1,b=0,d=0;const h=[0],g=[0],e=[1];let j=[];while(c<i.length){if(k+=1,k>n)return!1;const o=i.slice(c,c+a);if(m.has(o)){const n=m.get(o),k=n.filter(a=>{const c=f.slice(b,b+a.length);return a==c});if(j=k,k.length>0){const j=k[d];if(j){if(h.push(c),e.push(a),g.push(b),c+=a,b+=j.length,a=1,d=0,c==i.length){if(b==f.length)break;h.pop(),e.pop(),g.pop(),c=h.pop(),a=e.pop()+1,b=g.pop()}}else a=e.at(-1)+1,d=0}else a>=l||a>=f.length?h.length==0?(a+=1,d+=0):(c=h.pop(),a=e.pop()+1,b=g.pop()):(a+=1,d=0)}else if(o==f.slice(b,b+a)){if(e.push(a),c+=a,b+=a,d=0,a=1,h.push(c),g.push(b),c==i.length)break}else j.length>d+1?(d+=1,b=g.at(-1)+j[d].length):a==l?(c=h.pop(),a=e.pop()+1,b=g.pop()):a+=1}return b==f.length}function hiraToKana(a){return a.replace(/[\u3041-\u3096]/g,a=>{const b=a.charCodeAt(0)+96;return String.fromCharCode(b)})}function startVoiceInput(){try{voiceInput.start()}catch{}}function stopVoiceInput(){const a=document.getElementById("startVoiceInput"),b=document.getElementById("stopVoiceInput");a.classList.remove("d-none"),b.classList.add("d-none"),document.getElementById("reply").textContent="英語で答えてください",voiceInput.stop()}let gameTimer;function startGameTimer(){clearInterval(gameTimer);const a=document.getElementById("time");initTime(),gameTimer=setInterval(()=>{const b=parseInt(a.textContent);b>0?a.innerText=b-1:(clearInterval(gameTimer),playAudio("end"),playPanel.classList.add("d-none"),scorePanel.classList.remove("d-none"),document.getElementById("score").textContent=correctCount)},1e3)}function initTime(){document.getElementById("time").textContent=gameTime}let countdownTimer;function countdown(){clearTimeout(countdownTimer),gameStart.classList.remove("d-none"),playPanel.classList.add("d-none"),scorePanel.classList.add("d-none");const a=document.getElementById("counter");a.innerText=3,countdownTimer=setInterval(()=>{const b=["skyblue","greenyellow","violet","tomato"];if(parseInt(a.innerText)>1){const c=parseInt(a.innerText)-1;a.style.backgroundColor=b[c],a.innerText=c}else clearTimeout(countdownTimer),gameStart.classList.add("d-none"),playPanel.classList.remove("d-none"),correctCount=0,document.getElementById("score").textContent=0,startGameTimer(),nextProblem()},1e3)}initProblems(),initYomiDict(),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("toggleVoice").onclick=toggleVoice,document.getElementById("restartButton").onclick=countdown,document.getElementById("startButton").onclick=countdown,document.getElementById("startVoiceInput").onclick=startVoiceInput,document.getElementById("stopVoiceInput").onclick=stopVoiceInput,document.getElementById("respeak").onclick=respeak,document.getElementById("grade").onchange=initProblems,document.addEventListener("click",unlockAudio,{once:!0,useCapture:!0})