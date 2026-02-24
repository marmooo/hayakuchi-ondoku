import { createWorker } from "https://cdn.jsdelivr.net/npm/emoji-particle@0.0.4/+esm";

const replyPlease = document.getElementById("replyPlease");
const reply = document.getElementById("reply");
const gameTime = 120;
const emojiParticle = initEmojiParticle();
let yomiDict = new Map();
let problem = "";
let problems = [];
let answer = "生麦生米生卵";
let correctCount = 0;
let japaneseVoices = [];
let audioContext;
let voiceStopped = false;
const audioBufferCache = {};
loadVoices();
const voiceInput = setVoiceInput();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("voice") == 0) {
    document.getElementById("voiceOn").classList.add("d-none");
    document.getElementById("voiceOff").classList.remove("d-none");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
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

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("end", "mp3/end.mp3");
    loadAudio("correct", "mp3/correct3.mp3");
    loadAudio("incorrect", "mp3/incorrect1.mp3");
  }
  document.removeEventListener("click", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
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
    japaneseVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}

function initEmojiParticle() {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    pointerEvents: "none",
    top: "0px",
    left: "0px",
  });
  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;
  document.body.prepend(canvas);

  const offscreen = canvas.transferControlToOffscreen();
  const worker = createWorker();
  worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);

  globalThis.addEventListener("resize", () => {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    worker.postMessage({ type: "resize", width, height });
  });
  return { canvas, offscreen, worker };
}

function speak(text) {
  speechSynthesis.cancel();
  const msg = new globalThis.SpeechSynthesisUtterance(text);
  msg.voice = japaneseVoices[Math.floor(Math.random() * japaneseVoices.length)];
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
  for (let i = 0; i < correctCount; i++) {
    emojiParticle.worker.postMessage({
      type: "spawn",
      options: {
        particleType: "popcorn",
        originX: Math.random() * emojiParticle.canvas.width,
        originY: Math.random() * emojiParticle.canvas.height,
      },
    });
  }
  const [sentence, yomi] = problems[getRandomInt(0, problems.length - 1)];
  problem = sentence;
  answer = yomi;
  document.getElementById("problem").textContent = problem;
  document.getElementById("yomi").textContent = yomi;
  document.getElementById("reply").textContent = "こたえてください";
  if (localStorage.getItem("voice") != 0) {
    speak(answer);
  }
  startVoiceInput();
}

async function initProblems() {
  const grade = document.getElementById("grade").selectedIndex;
  const response = await fetch("data/" + grade + ".csv");
  const csv = await response.text();
  problems = [];
  csv.split("\n").forEach((line) => {
    if (line.startsWith("#")) return true;
    // if (line.startsWith("#")) {
    //   line = line.slice(2);
    // }
    const [sentence, yomi] = line.split(",");
    problems.push([sentence, yomi]);
  });
}

function setVoiceInput() {
  if (!globalThis.webkitSpeechRecognition) {
    document.getElementById("noSTT").classList.remove("d-none");
  } else {
    const voiceInput = new globalThis.webkitSpeechRecognition();
    voiceInput.lang = "ja-JP";
    // voiceInput.interimResults = true;
    voiceInput.continuous = true;

    voiceInput.onend = () => {
      if (voiceStopped) return;
      voiceInput.start();
    };
    voiceInput.onresult = (event) => {
      voiceInput.stop();
      const replyText = event.results[0][0].transcript;
      if (
        matchesYomi(replyText, answer, yomiDict) ||
        matchesYomi(replyText, answer.slice(0, -1), yomiDict)
      ) {
        correctCount += 1;
        playAudio("correct");
        reply.textContent = "⭕ " + answer;
        nextProblem();
        replyPlease.classList.remove("d-none");
        reply.classList.add("d-none");
      } else {
        playAudio("incorrect");
        reply.textContent = "❌ " + replyText;
        replyPlease.classList.add("d-none");
        reply.classList.remove("d-none");
      }
    };
    return voiceInput;
  }
}

function startVoiceInput() {
  voiceStopped = false;
  document.getElementById("startVoiceInput").classList.add("d-none");
  document.getElementById("stopVoiceInput").classList.remove("d-none");
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  try {
    voiceInput.start();
  } catch {
    // continue regardless of error
  }
}

function stopVoiceInput() {
  voiceStopped = true;
  document.getElementById("startVoiceInput").classList.remove("d-none");
  document.getElementById("stopVoiceInput").classList.add("d-none");
  replyPlease.classList.remove("d-none");
  reply.classList.add("d-none");
  voiceInput.abort();
}

function initYomiDict() {
  // https://jsben.ch/q4RPK
  const dict = new Map();
  return fetch("data/yomi.csv")
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
    throw new TypeError(
      "半角数字以外の文字が含まれています。漢数字に変換できませんでした。-> " +
        num,
    );
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

function matchesYomi(reply, answer, yomiDict, debug = false) {
  const formatedReply = formatSentence(reply);
  const formatedAnswer = formatSentence(answer);
  const maxLength = 5;
  const maxYomiNum = 10;
  const stop = formatedAnswer.length * formatedAnswer.length * maxYomiNum;
  let cnt = 0;

  const log = (...args) => {
    if (debug) console.log(...args);
  };

  // 位置 i（reply）と k（answer）から試せる候補リストを作る。
  // maxLength から 1 の順（長いgramを優先）で辞書を引き、
  // answer の位置 k からの文字列と一致する読みがあれば候補に追加する。
  // 辞書にない文字列は直接一致（カタカナ同士など）も候補に加える。
  // 戻り値: [{ str, jj, matched }] の配列
  //   str     : reply から切り出した文字列
  //   jj      : str の文字数（reply を何文字進めるか）
  //   matched : answer と一致した読みの配列（yomiDict の値のサブセット）
  function getCandidates(i, k) {
    const candidates = [];
    for (let jj = maxLength; jj >= 1; jj--) {
      const str = formatedReply.slice(i, i + jj);
      if (str === "") continue;
      if (yomiDict.has(str)) {
        const matched = yomiDict.get(str).filter((yomi) =>
          formatedAnswer.slice(k, k + yomi.length) == yomi
        );
        if (matched.length > 0) {
          candidates.push({ str, jj, matched });
        }
      } else if (str == formatedAnswer.slice(k, k + jj)) {
        // 辞書にない文字列（カタカナや英数字など）は直接一致を試みる
        candidates.push({ str, jj, matched: [str] });
      }
    }
    return candidates;
  }

  // バックトラック付きの照合ループ
  // 基本戦略：
  //   1. 現在位置 i から getCandidates で候補リストを作る
  //   2. 候補を順番に試して reply と answer を同時に消費していく
  //   3. reply を最後まで消費したとき answer も最後まで消費できていれば成功
  //   4. 失敗したらスタックから前の状態を復元して次の候補を試す
  //
  // スタックの各要素: { i, k, candidates, ci, l }
  //   i          : reply の位置
  //   k          : answer の位置
  //   candidates : その i, k で作った候補リスト
  //   ci         : candidates の現在インデックス
  //   l          : matched（読み候補）の現在インデックス
  //
  // 次の候補への移り方：
  //   - まず matched の次の読み（l+1）を試す
  //   - matched が尽きたら candidates の次のgramパターン（ci+1）へ
  //   - candidates も尽きたらスタックをポップしてさらに前へ戻る
  const stack = [];

  let i = 0;
  let k = 0;
  let candidates = getCandidates(i, k);
  let ci = 0; // candidates のインデックス
  let l = 0; // matched のインデックス

  while (true) {
    cnt += 1;
    if (cnt > stop) {
      log("STOP");
      return false;
    }

    log(
      `cnt=${cnt} i=${i} k=${k} ci=${ci} l=${l} candidates=${
        JSON.stringify(candidates.map((c) => c.str))
      }`,
    );

    if (ci < candidates.length && candidates[ci].matched[l]) {
      // 現在の候補で前進できる
      const { str, jj, matched } = candidates[ci];
      const yomi = matched[l];
      log(`  -> advance str=${str} yomi=${yomi}`);

      // 前に戻れるよう現在の状態をスタックに積む
      stack.push({ i, k, candidates, ci, l });

      i += jj;
      k += yomi.length;
      l = 0;

      if (i == formatedReply.length) {
        if (k == formatedAnswer.length) {
          // reply と answer を同時に使い切った → 一致成功
          log(`  -> done!`);
          return true;
        } else {
          // reply は終わったが answer が残っている → バックトラック
          log(
            `  -> end of reply but k=${k} != ${formatedAnswer.length}, backtrack`,
          );
          const prev = stack.pop();
          if (!prev) return false;
          ({ i, k, candidates, ci, l } = prev);
          // 次の候補へ
          if (candidates[ci].matched[l + 1]) {
            l += 1; // 同じgramで別の読みを試す
          } else {
            ci += 1; // 次のgramパターンへ
            l = 0;
          }
        }
      } else {
        // まだ reply が残っている → 次の位置の候補リストを作る
        candidates = getCandidates(i, k);
        ci = 0;
        l = 0;
      }
    } else {
      // 現在位置の候補が全部尽きた → バックトラック
      log(`  -> backtrack`);
      const prev = stack.pop();
      if (!prev) return false; // スタックが空 = どこにも戻れない → 不一致
      ({ i, k, candidates, ci, l } = prev);
      // 次の候補へ
      if (candidates[ci].matched[l + 1]) {
        l += 1; // 同じgramで別の読みを試す
      } else {
        ci += 1; // 次のgramパターンへ
        l = 0;
      }
    }
  }
}

function hiraToKana(str) {
  return str.replace(/[ぁ-ゖ]/g, (match) => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
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
      playAudio("end");
      scoring();
      stopVoiceInput();
    }
  }, 1000);
}

function scoring() {
  playPanel.classList.add("d-none");
  scorePanel.classList.remove("d-none");
  document.getElementById("score").textContent = correctCount;
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

function countdown() {
  speak("Ready"); // unlock
  gameStart.classList.remove("d-none");
  playPanel.classList.add("d-none");
  scorePanel.classList.add("d-none");
  const counter = document.getElementById("counter");
  counter.innerText = 3;
  const timer = setInterval(() => {
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.innerText) > 1) {
      const t = parseInt(counter.innerText) - 1;
      counter.style.backgroundColor = colors[t];
      counter.innerText = t;
    } else {
      clearInterval(timer);
      gameStart.classList.add("d-none");
      playPanel.classList.remove("d-none");
      correctCount = 0;
      document.getElementById("score").textContent = 0;
      startGameTimer();
      nextProblem();
    }
  }, 1000);
}

await initProblems();
initYomiDict();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleVoice").onclick = toggleVoice;
document.getElementById("restartButton").onclick = countdown;
document.getElementById("startButton").onclick = countdown;
document.getElementById("startVoiceInput").onclick = startVoiceInput;
document.getElementById("stopVoiceInput").onclick = stopVoiceInput;
document.getElementById("respeak").onclick = respeak;
document.getElementById("grade").onchange = initProblems;
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
