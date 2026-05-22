const MODES = {
  free: "You are a friendly English conversation tutor. Have a natural, encouraging conversation with the user. After your reply, on a new line write FEEDBACK: followed by one short, specific grammar or vocabulary tip based on what they wrote. If everything was correct, write FEEDBACK: Perfect English — great job!",
  interview: "You are a professional interviewer helping the user practice English for job interviews. Ask one interview question at a time and respond naturally to their answers, like a real interviewer. After each reply, write FEEDBACK: with one tip on their interview vocabulary, phrasing, or confidence.",
  travel: "You are roleplaying real travel situations — airports, hotels, restaurants, asking for directions, shopping. Play the role of the staff member or local. After each reply, write FEEDBACK: with one practical travel English phrase or tip.",
  grammar: "You are a patient English grammar teacher. The user will write sentences. First show the corrected sentence (mark changes in CAPS). Then in one sentence explain what was wrong. Then give them an encouraging nudge to try another. Structure it as: Corrected: ... | What changed: ... | Try another!",
  story: "You and the user are building a fun story together, taking turns adding 1-2 sentences each. Continue the story from where they left off, then add FEEDBACK: with one vocabulary suggestion.",
  debate: "You are a debate partner helping the user practice expressing opinions in English. Present a viewpoint, respond to their arguments, then write FEEDBACK: with one tip on expressing opinions more fluently."
};

let currentMode         = "free";
let conversationHistory = [];
let isListening         = false;
let selectedVoice       = null;
let speechRate          = 0.95;

const messagesDiv = document.getElementById("messages");
const userInput   = document.getElementById("user-input");
const sendBtn     = document.getElementById("send-btn");
const micBtn      = document.getElementById("mic-btn");
const stopBtn     = document.getElementById("stop-btn");
const levelSelect = document.getElementById("level");
const voiceSelect = document.getElementById("voice-select");
const rateRange   = document.getElementById("rate-range");
const rateLabel   = document.getElementById("rate-label");

// --- Load voices ---
function loadVoices() {
  const englishVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
  voiceSelect.innerHTML = "";
  if (englishVoices.length === 0) {
    voiceSelect.innerHTML = "<option>Default voice</option>";
    return;
  }
  englishVoices.forEach((voice, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = voice.name + " (" + voice.lang + ")";
    voiceSelect.appendChild(opt);
  });
  const preferred = englishVoices.findIndex(v =>
    v.name.includes("Samantha") || v.name.includes("Google US English") || v.name.includes("Karen")
  );
  voiceSelect.selectedIndex = preferred >= 0 ? preferred : 0;
  selectedVoice = englishVoices[voiceSelect.selectedIndex];
}
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

voiceSelect.addEventListener("change", function () {
  const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
  selectedVoice = voices[this.value];
});

rateRange.addEventListener("input", function () {
  speechRate = parseFloat(this.value);
  rateLabel.textContent = speechRate.toFixed(2) + "x";
});

// --- Speak reply ---
function speakReply(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = "en-US";
  utterance.rate  = speechRate;
  utterance.pitch = 1.0;
  if (selectedVoice) utterance.voice = selectedVoice;
  window.speechSynthesis.speak(utterance);
}

stopBtn.addEventListener("click", () => window.speechSynthesis.cancel());

// --- Speech recognition ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang           = "en-US";
  recognition.interimResults = false;

  recognition.onresult = function (event) {
    userInput.value = event.results[0][0].transcript;
    sendMessage();
  };

  recognition.onend = function () {
    isListening = false;
    micBtn.textContent = "🎤 Speak";
    micBtn.classList.remove("listening");
  };

  recognition.onerror = function (event) {
    isListening = false;
    micBtn.textContent = "🎤 Speak";
    micBtn.classList.remove("listening");
    addMessage("ai", event.error === "not-allowed"
      ? "Microphone access blocked. Please allow microphone permission and try again."
      : "Voice error: " + event.error + ". Try typing instead."
    );
  };
}

micBtn.addEventListener("click", function () {
  if (!recognition) { alert("Voice not supported. Use Chrome or Edge."); return; }
  if (isListening) {
    recognition.stop();
  } else {
    window.speechSynthesis.cancel();
    isListening = true;
    micBtn.textContent = "🔴 Listening...";
    micBtn.classList.add("listening");
    recognition.start();
  }
});

// --- Mode switching ---
document.querySelectorAll(".mode-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode         = btn.dataset.mode;
    conversationHistory = [];
    window.speechSynthesis.cancel();
    addMessage("ai", "Switched to " + btn.textContent + " mode! Say something or type to get started.");
  });
});

// --- Send on Enter ---
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
sendBtn.addEventListener("click", sendMessage);

// --- Add message bubble ---
function addMessage(role, text, feedback) {
  const wrapper = document.createElement("div");
  wrapper.className = "message " + role;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "ai" ? "🤖" : "🧑";

  const content = document.createElement("div");
  content.className = "content";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  content.appendChild(bubble);

  if (feedback) {
    const tip = document.createElement("div");
    tip.className = "feedback";
    tip.textContent = "💡 " + feedback;
    content.appendChild(tip);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(content);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --- Typing indicator ---
function showTyping() {
  const wrapper = document.createElement("div");
  wrapper.className = "message ai";
  wrapper.id = "typing-indicator";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "🤖";
  const bubble = document.createElement("div");
  bubble.className = "bubble typing-bubble";
  bubble.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

// --- Send message to Python server ---
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  sendBtn.disabled = true;
  addMessage("user", text);
  conversationHistory.push({ role: "user", content: text });
  showTyping();

  const systemPrompt = MODES[currentMode] +
    " The user is a " + levelSelect.value + " English learner. Adapt your language accordingly.";

  try {
    const response = await fetch(CONFIG.WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: systemPrompt,
        messages: conversationHistory
      })
    });

    const data = await response.json();

    if (!data.content || !data.content[0]) {
      removeTyping();
      addMessage("ai", "Error: " + JSON.stringify(data));
      sendBtn.disabled = false;
      return;
    }

    const fullReply    = data.content[0].text;
    const parts        = fullReply.split(/\nFEEDBACK:/i);
    const replyText    = parts[0].trim();
    const feedbackText = parts[1] ? parts[1].trim() : null;

    conversationHistory.push({ role: "assistant", content: fullReply });
    removeTyping();
    addMessage("ai", replyText, feedbackText);
    speakReply(replyText);

  } catch (error) {
    removeTyping();
    addMessage("ai", "Could not reach the server. Make sure Python server is running on port 5000.");
    console.error(error);
  }

  sendBtn.disabled = false;
  userInput.focus();
}