const gameTime=120;let yomiDict=new Map,problem="",problems=[],answer="生麦生米生卵",correctCount=0,audioContext;const audioBufferCache={};let japaneseVoices=[];loadVoices();const voiceInput=setVoiceInput();loadConfig();function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark"),localStorage.getItem("voice")==0&&(document.getElementById("voiceOn").classList.add("d-none"),document.getElementById("voiceOff").classList.remove("d-none"))}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}function toggleVoice(){localStorage.getItem("voice")!=0?(localStorage.setItem("voice",0),document.getElementById("voiceOn").classList.add("d-none"),document.getElementById("voiceOff").classList.remove("d-none"),speechSynthesis.cancel()):(localStorage.setItem("voice",1),document.getElementById("voiceOn").classList.remove("d-none"),document.getElementById("voiceOff").classList.add("d-none"),speak(answer))}function createAudioContext(){return globalThis.AudioContext?new globalThis.AudioContext:(console.error("Web Audio API is not supported in this browser"),null)}function unlockAudio(){audioContext?audioContext.resume():(audioContext=createAudioContext(),loadAudio("end","mp3/end.mp3"),loadAudio("correct","mp3/correct3.mp3"),loadAudio("incorrect","mp3/incorrect1.mp3")),document.removeEventListener("pointerdown",unlockAudio),document.removeEventListener("keydown",unlockAudio)}async function loadAudio(e,t){if(!audioContext)return;if(audioBufferCache[e])return audioBufferCache[e];try{const s=await fetch(t),o=await s.arrayBuffer(),n=await audioContext.decodeAudioData(o);return audioBufferCache[e]=n,n}catch(t){throw console.error(`Loading audio ${e} error:`,t),t}}function playAudio(e,t){if(!audioContext)return;const o=audioBufferCache[e];if(!o){console.error(`Audio ${e} is not found in cache`);return}const n=audioContext.createBufferSource();n.buffer=o;const s=audioContext.createGain();t&&(s.gain.value=t),s.connect(audioContext.destination),n.connect(s),n.start()}function loadVoices(){const e=new Promise(e=>{let t=speechSynthesis.getVoices();if(t.length!==0)e(t);else{let n=!1;speechSynthesis.addEventListener("voiceschanged",()=>{n=!0,t=speechSynthesis.getVoices(),e(t)}),setTimeout(()=>{n||document.getElementById("noTTS").classList.remove("d-none")},1e3)}});e.then(e=>{japaneseVoices=e.filter(e=>e.lang=="ja-JP")})}loadVoices();function speak(e){speechSynthesis.cancel();const t=new globalThis.SpeechSynthesisUtterance(e);t.onend=()=>{voiceInput.start()},t.voice=japaneseVoices[Math.floor(Math.random()*japaneseVoices.length)],t.lang="ja-JP",voiceInput.stop(),speechSynthesis.speak(t)}function respeak(){speak(answer)}function getRandomInt(e,t){return e=Math.ceil(e),t=Math.floor(t),Math.floor(Math.random()*(t-e)+e)}function nextProblem(){const[t,e]=problems[getRandomInt(0,problems.length-1)];problem=t,answer=e,document.getElementById("problem").textContent=problem,document.getElementById("yomi").textContent=e,document.getElementById("reply").textContent="こたえてください",localStorage.getItem("voice")!=0&&speak(answer)}function initProblems(){const e=document.getElementById("grade").selectedIndex;fetch("data/"+e+".csv").then(e=>e.text()).then(e=>{problems=[],e.split(`
`).forEach(e=>{if(e.startsWith("#"))return!0;const[t,n]=e.split(",");problems.push([t,n])})})}function setVoiceInput(){if(globalThis.webkitSpeechRecognition){const e=new globalThis.webkitSpeechRecognition;return e.lang="ja-JP",e.continuous=!0,e.onstart=()=>{const e=document.getElementById("startVoiceInput"),t=document.getElementById("stopVoiceInput");e.classList.add("d-none"),t.classList.remove("d-none")},e.onend=()=>{speechSynthesis.speaking||e.start()},e.onresult=t=>{const n=t.results[0][0].transcript,s=document.getElementById("reply");isEquals(n,answer,yomiDict)||isEquals(n,answer.slice(0,-1),yomiDict)?(correctCount+=1,playAudio("correct"),s.textContent="⭕ "+answer,nextProblem()):(playAudio("incorrect"),s.textContent="❌ "+n),e.stop()},e}document.getElementById("noSTT").classList.remove("d-none")}function initYomiDict(){const e=new Map;return fetch("data/yomi.csv").then(e=>e.text()).then(t=>{t.trimEnd().split(`
`).forEach(t=>{t.split(`
`).forEach(t=>{const n=t.split(","),s=n[0],o=n.slice(1);for(const t of o)if(e.has(t)){const n=e.get(t);n.push(s),e.set(t,n)}else e.set(t,[s])})});for(const[t,n]of e){const s=n.sort((e,t)=>t.length-e.length);e.set(t,s)}yomiDict=e})}const numbersToKanji=e=>{if(e==null||e==="")return"";if(!/^-?[0-9]+$/g.test(e))throw new TypeError("半角数字以外の文字が含まれています。漢数字に変換できませんでした。-> "+e);if(e=+e,!Number.isSafeInteger(e))throw new RangeError("数値が "+Number.MIN_SAFE_INTEGER+" ～ "+Number.MAX_SAFE_INTEGER+" の範囲外です。漢数字に変換できませんでした。-> "+e);if(e===0)return"零";let t="";e<0&&(t+="マイナス",e*=-1);const s=["","一","二","三","四","五","六","七","八","九"],o=["十","百","千","万","億","兆","京","垓","𥝱","穣","溝","澗","正","載","極","恒河沙","阿僧祇","那由他","不可思議","無量大数"],n=[1,2,3,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68],i=n.length;for(let a=i;a>=0;--a){const r=10**n[a];if(e>=r){const i=Math.floor(e/r);i>=10?t+=numbersToKanji(i):i==1&&n[a]<=3||(t+=s[i]),t+=o[a],e-=i*r}}return t+=s[e],t};function formatSentence(e){return hiraToKana(e).toLowerCase().replace(/[\s　・。、「」!！?？]/g,"").replace(/\d+/g,e=>numbersToKanji(e))}function isEquals(e,t,n){const u=formatSentence(e),r=formatSentence(t),f=5,g=10,p=r.length*r.length*g;let m=0,i=0,s=1,o=0,a=0;const c=[0],l=[0],d=[1];let h=[];for(;i<u.length;){if(m+=1,m>p)return!1;const e=u.slice(i,i+s);if(n.has(e)){const m=n.get(e),t=m.filter(e=>{const t=r.slice(o,o+e.length);return e==t});if(h=t,t.length>0){const e=t[a];if(e){if(c.push(i),d.push(s),l.push(o),i+=s,o+=e.length,s=1,a=0,i==u.length){if(o==r.length)break;c.pop(),d.pop(),l.pop(),i=c.pop(),s=d.pop()+1,o=l.pop()}}else s=d.at(-1)+1,a=0}else s>=f||s>=r.length?c.length==0?(s+=1,a+=0):(i=c.pop(),s=d.pop()+1,o=l.pop()):(s+=1,a=0)}else if(e==r.slice(o,o+s)){if(d.push(s),i+=s,o+=s,a=0,s=1,c.push(i),l.push(o),i==u.length)break}else h.length>a+1?(a+=1,o=l.at(-1)+h[a].length):s==f?(i=c.pop(),s=d.pop()+1,o=l.pop()):s+=1}return o==r.length}function hiraToKana(e){return e.replace(/[ぁ-ゖ]/g,e=>{const t=e.charCodeAt(0)+96;return String.fromCharCode(t)})}function startVoiceInput(){try{voiceInput.start()}catch{}}function stopVoiceInput(){document.getElementById("startVoiceInput").classList.remove("d-none"),document.getElementById("stopVoiceInput").classList.add("d-none"),voiceInput.stop()}let gameTimer;function startGameTimer(){clearInterval(gameTimer);const e=document.getElementById("time");initTime(),gameTimer=setInterval(()=>{const t=parseInt(e.textContent);t>0?e.innerText=t-1:(clearInterval(gameTimer),playAudio("end"),playPanel.classList.add("d-none"),scorePanel.classList.remove("d-none"),document.getElementById("score").textContent=correctCount)},1e3)}function initTime(){document.getElementById("time").textContent=gameTime}function countdown(){gameStart.classList.remove("d-none"),playPanel.classList.add("d-none"),scorePanel.classList.add("d-none");const e=document.getElementById("counter");e.innerText=3;const t=setInterval(()=>{const n=["skyblue","greenyellow","violet","tomato"];if(parseInt(e.innerText)>1){const t=parseInt(e.innerText)-1;e.style.backgroundColor=n[t],e.innerText=t}else clearInterval(t),gameStart.classList.add("d-none"),playPanel.classList.remove("d-none"),correctCount=0,document.getElementById("score").textContent=0,startGameTimer(),nextProblem()},1e3)}initProblems(),initYomiDict(),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("toggleVoice").onclick=toggleVoice,document.getElementById("restartButton").onclick=countdown,document.getElementById("startButton").onclick=countdown,document.getElementById("startVoiceInput").onclick=startVoiceInput,document.getElementById("stopVoiceInput").onclick=stopVoiceInput,document.getElementById("respeak").onclick=respeak,document.getElementById("grade").onchange=initProblems,document.addEventListener("pointerdown",unlockAudio,{once:!0}),document.addEventListener("keydown",unlockAudio,{once:!0})