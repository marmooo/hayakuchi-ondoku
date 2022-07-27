const gameTime = 120;
let yomiDict = new Map();
let problem = "";
let problems = [];
let answer = "生麦生米生卵";
let correctCount = 0;
let englishVoices = [];
const voiceInput = setVoiceInput();
let endAudio, incorrectAudio, correctAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
  if (localStorage.getItem("voice") == 0) {
    document.getElementById("voiceOn").classList.add("d-none");
    document.getElementById("voiceOff").classList.remove("d-none");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

function toggleVoice() {
  if (localStorage.getItem("voice") != 0) {
    localStorage.setItem("voice", 0);
    document.getElementById("voiceOn").classList.add("d-none");
    document.getElementById("voiceOff").classList.remove("d-none");
    speechSynthesis.cancel();
  } else {
    localStorage.setItem("voice", 1);
    document.getElementById("voiceOn").classList.remove("d-none");
    document.getElementById("voiceOff").classList.add("d-none");
    speak(answer);
  }
}

function playAudio(audioBuffer, volume) {
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    audioSource.connect(gainNode);
    audioSource.start();
  } else {
    audioSource.connect(audioContext.destination);
    audioSource.start();
  }
}

function unlockAudio() {
  audioContext.resume();
}

function loadAudio(url) {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          resolve(audioBuffer);
        }, (err) => {
          reject(err);
        });
      });
    });
}

function loadAudios() {
  promises = [
    loadAudio("mp3/end.mp3"),
    loadAudio("mp3/incorrect1.mp3"),
    loadAudio("mp3/correct3.mp3"),
  ];
  Promise.all(promises).then((audioBuffers) => {
    endAudio = audioBuffers[0];
    incorrectAudio = audioBuffers[1];
    correctAudio = audioBuffers[2];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    englishVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}
loadVoices();

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.onend = () => {
    voiceInput.start();
  };
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "ja-JP";
  voiceInput.stop();
  speechSynthesis.speak(msg);
}

function respeak() {
  speak(answer);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function nextProblem() {
  const [sentence, yomi] = problems[getRandomInt(0, problems.length - 1)];
  problem = sentence;
  answer = yomi;
  document.getElementById("problem").textContent = problem;
  document.getElementById("yomi").textContent = yomi;
  document.getElementById("reply").textContent = "こたえてください";
  if (localStorage.getItem("voice") != 0) {
    speak(answer);
  }
}

function initProblems() {
  const grade = document.getElementById("grade").selectedIndex;
  fetch("data/" + grade + ".csv")
    .then((response) => response.text())
    .then((csv) => {
      problems = [];
      csv.split("\n").forEach((line) => {
        if (line.startsWith("#")) return true;
        // if (line.startsWith("#")) {
        //   line = line.slice(2);
        // }
        const [sentence, yomi] = line.split(",");
        problems.push([sentence, yomi]);
      });
    });
}

function setVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    document.getElementById("noSTT").classList.remove("d-none");
  } else {
    const voiceInput = new webkitSpeechRecognition();
    voiceInput.lang = "ja-JP";
    // voiceInput.interimResults = true;
    voiceInput.continuous = true;

    voiceInput.onstart = () => {
      const startButton = document.getElementById("startVoiceInput");
      const stopButton = document.getElementById("stopVoiceInput");
      startButton.classList.add("d-none");
      stopButton.classList.remove("d-none");
    };
    voiceInput.onend = () => {
      if (!speechSynthesis.speaking) {
        voiceInput.start();
      }
    };
    voiceInput.onresult = (event) => {
      const reply = event.results[0][0].transcript;
      const replyObj = document.getElementById("reply");
      if (isEquals(reply, answer, yomiDict) || isEquals(reply, answer.slice(0, -1), yomiDict)) {
        correctCount += 1;
        playAudio(correctAudio);
        replyObj.textContent = "◯ " + answer;
        nextProblem();
      } else {
        playAudio(incorrectAudio);
        replyObj.textContent = "× " + reply;
      }
      voiceInput.stop();
    };
    return voiceInput;
  }
}

async function initYomiDict() {
  // https://jsben.ch/q4RPK
  const dict = new Map();
  fetch("data/yomi.csv")
    .then((response) => response.text())
    .then((csv) => {
      csv.trimEnd().split("\n").forEach((line) => {
        line.split("\n").forEach((line) => {
          const arr = line.split(",");
          const yomi = arr[0];
          const kanjis = arr.slice(1);
          for (const kanji of kanjis) {
            if (dict.has(kanji)) {
              const yomis = dict.get(kanji);
              yomis.push(yomi);
              dict.set(kanji, yomis);
            } else {
              dict.set(kanji, [yomi]);
            }
          }
        });
      });
      for (const [kanji, yomis] of dict) {
        const sortedYomis = yomis.sort((a, b) => b.length - a.length);
        dict.set(kanji, sortedYomis);
      }
      yomiDict = dict;
    });
}

/**
 * https://note.kiriukun.com/entry/20181229-numbers-to-chinese-numerals
 * 数値を漢数字表記に変換
 * @param  {String|Number} num - 半角数字
 * @return {String} 漢数字表記
 * @throws {TypeError} 半角数字以外の文字が含まれている場合
 * @throws {RangeError} 数値が Number.MIN_SAFE_INTEGER ～ Number.MAX_SAFE_INTEGER の範囲外の場合
 */
const numbersToKanji = (num) => {
  if (num === undefined || num === null || num === "") {
    return "";
  }
  if (!(/^-?[0-9]+$/g.test(num))) {
    throw new TypeError("半角数字以外の文字が含まれています。漢数字に変換できませんでした。-> " + num);
  }
  num = Number(num);
  if (!Number.isSafeInteger(num)) {
    throw new RangeError(
      "数値が " + Number.MIN_SAFE_INTEGER + " ～ " + Number.MAX_SAFE_INTEGER +
        " の範囲外です。漢数字に変換できませんでした。-> " + num,
    );
  }
  if (num === 0) {
    return "零";
  }
  let ret = "";
  if (num < 0) {
    ret += "マイナス";
    num *= -1;
  }
  const kanjiNums = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const kanjiNames = [
    "十",
    "百",
    "千",
    "万",
    "億",
    "兆",
    "京",
    "垓",
    "𥝱",
    "穣",
    "溝",
    "澗",
    "正",
    "載",
    "極",
    "恒河沙",
    "阿僧祇",
    "那由他",
    "不可思議",
    "無量大数",
  ];
  const exponents = [
    1,
    2,
    3,
    4,
    8,
    12,
    16,
    20,
    24,
    28,
    32,
    36,
    40,
    44,
    48,
    52,
    56,
    60,
    64,
    68,
  ];
  const exponentsLen = exponents.length;
  for (let i = exponentsLen; i >= 0; --i) {
    const bias = Math.pow(10, exponents[i]);
    if (num >= bias) {
      const top = Math.floor(num / bias);
      if (top >= 10) {
        ret += numbersToKanji(top);
      } else {
        if (top == 1 && exponents[i] <= 3) {
          // ※先頭の数字が1、かつ指数が3 (千の位) 以下の場合のみ『一』をつけない
        } else {
          ret += kanjiNums[top];
        }
      }
      ret += kanjiNames[i];
      num -= top * bias;
    }
  }
  ret += kanjiNums[num];
  return ret;
};

function formatSentence(sentence) {
  return hiraToKana(sentence)
    .toLowerCase()
    .replace(/[\s　・。、「」!！?？]/g, "")
    .replace(/\d+/g, (n) => numbersToKanji(n));
}

function isEquals(reply, answer, yomiDict) {
  // 音声認識では記号が付かないので、解答側で使う一部記号だけを揃える
  const formatedReply = formatSentence(reply);
  const formatedAnswer = formatSentence(answer);
  const maxLength = 5; // build.js で制限して高速化 (普通は残り文字数)
  const maxYomiNum = 10; // yomi-dict の最大読み方パターン数
  const stop = formatedAnswer.length * formatedAnswer.length * maxYomiNum;
  let cnt = 0;
  let i = 0;
  let j = 1;
  let k = 0;
  let l = 0;
  let pi = [0];
  let pk = [0];
  let pj = [1];
  let pl = [];
  while (i < formatedReply.length) {
    cnt += 1;
    if (cnt > stop) return false;
    const str = formatedReply.slice(i, i + j);
    if (yomiDict.has(str)) {
      const yomis = yomiDict.get(str);
      const matched = yomis.filter((yomi) => {
        const check = formatedAnswer.slice(k, k + yomi.length);
        if (yomi == check) {
          return true;
        } else {
          return false;
        }
      });
      pl = matched;
      if (matched.length > 0) {
        const yomi = matched[l];
        if (yomi) {
          pi.push(i);
          pj.push(j);
          pk.push(k);
          i += j;
          k += yomi.length;
          j = 1;
          l = 0;
          if (i == formatedReply.length) {
            if (k == formatedAnswer.length) {
              break;
            } else {
              pi.pop();
              pj.pop();
              pk.pop();
              i = pi.pop(); // 前の文字に戻って
              j = pj.pop() + 1; // gram を増やす
              k = pk.pop();
            }
          }
        } else {
          j = pj.at(-1) + 1;
          l = 0;
        }
      } else { // 辞書に登録はされているが読みの選択が悪く一致しない時など
        if (j >= maxLength || j >= formatedAnswer.length) {
          if (pi.length == 0) {
            j += 1;
            l += 0;
          } else {
            i = pi.pop(); // 前の文字に戻って
            j = pj.pop() + 1; // gram を増やす
            k = pk.pop();
          }
        } else { // gramを増やして一致をさがす
          j += 1;
          l = 0;
        }
      }
    } else if (str == formatedAnswer.slice(k, k + j)) {
      pj.push(j);
      i += j;
      k += j;
      l = 0;
      j = 1;
      pi.push(i);
      pk.push(k);
      if (i == formatedReply.length) break;
      // 辞書に読みが登録されていない時
    } else {
      if (pl.length > l + 1) { // 読みが複数あれば
        l += 1;
        k = pk.at(-1) + pl[l].length; // その読みを試してみる
      } else if (j == maxLength) { // 前方の読みが合わないなら
        i = pi.pop(); // 前の文字に戻って
        j = pj.pop() + 1; // gram を増やす
        k = pk.pop();
      } else { // gramを増やして一致をさがす
        j += 1;
      }
    }
  }
  if (k == formatedAnswer.length) {
    return true;
  } else {
    return false;
  }
}

function hiraToKana(str) {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

function startVoiceInput() {
  voiceInput.start();
}

function stopVoiceInput() {
  const startButton = document.getElementById("startVoiceInput");
  const stopButton = document.getElementById("stopVoiceInput");
  startButton.classList.remove("d-none");
  stopButton.classList.add("d-none");
  document.getElementById("reply").textContent = "英語で答えてください";
  voiceInput.stop();
}

let gameTimer;
function startGameTimer() {
  clearInterval(gameTimer);
  const timeNode = document.getElementById("time");
  initTime();
  gameTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.innerText = t - 1;
    } else {
      clearInterval(gameTimer);
      playAudio(endAudio);
      playPanel.classList.add("d-none");
      scorePanel.classList.remove("d-none");
      document.getElementById("score").textContent = correctCount;
    }
  }, 1000);
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

let countdownTimer;
function countdown() {
  clearTimeout(countdownTimer);
  gameStart.classList.remove("d-none");
  playPanel.classList.add("d-none");
  scorePanel.classList.add("d-none");
  const counter = document.getElementById("counter");
  counter.innerText = 3;
  countdownTimer = setInterval(() => {
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.innerText) > 1) {
      const t = parseInt(counter.innerText) - 1;
      counter.style.backgroundColor = colors[t];
      counter.innerText = t;
    } else {
      clearTimeout(countdownTimer);
      gameStart.classList.add("d-none");
      playPanel.classList.remove("d-none");
      correctCount = 0;
      document.getElementById("score").textContent = 0;
      startGameTimer();
      nextProblem();
    }
  }, 1000);
}

initProblems();
initYomiDict();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleVoice").onclick = toggleVoice;
document.getElementById("restartButton").onclick = countdown;
document.getElementById("startButton").onclick = countdown;
document.getElementById("startVoiceInput").onclick = startVoiceInput;
document.getElementById("stopVoiceInput").onclick = stopVoiceInput;
document.getElementById("respeak").onclick = respeak;
document.getElementById("grade").onchange = initProblems;
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
