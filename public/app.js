const chat = document.getElementById("chat");
const form = document.getElementById("ask");
const input = document.getElementById("question");
const sendBtn = document.getElementById("send");
const welcome = document.getElementById("welcome");

let history = []; // [{role, content}]
let busy = false;

function renderMarkdown(el, text) {
  const html = window.marked ? marked.parse(text) : text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  el.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
  el.querySelectorAll("a").forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
}

function addMessage(role, text = "") {
  welcome.hidden = true;
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  if (role === "user") el.textContent = text;
  chat.appendChild(el);
  el.scrollIntoView({ behavior: "smooth", block: "end" });
  return el;
}

async function ask(question) {
  if (busy || !question.trim()) return;
  busy = true;
  sendBtn.disabled = true;
  addMessage("user", question);
  const bot = addMessage("bot");
  const status = document.createElement("div");
  status.className = "status";
  status.textContent = "Consulto il regolamento…";
  bot.appendChild(status);

  let answer = "";
  let pending = "";
  let failed = false;

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Errore HTTP ${res.status}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop();
      for (const raw of events) {
        const line = raw.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        const ev = JSON.parse(line.slice(6));
        if (ev.type === "status") {
          status.textContent = ev.text;
        } else if (ev.type === "text") {
          pending += ev.text;
        } else if (ev.type === "text_break") {
          // testo scritto prima di una ricerca carte: lo separiamo dalla risposta successiva
          if (pending.trim()) { answer += pending + "\n\n"; }
          pending = "";
        } else if (ev.type === "error") {
          failed = true;
          answer += (answer ? "\n\n" : "") + `**Errore:** ${ev.text}`;
        }
        if (ev.type === "text" || ev.type === "error" || ev.type === "text_break") {
          renderMarkdown(bot, answer + pending);
          if (!failed && ev.type !== "error") bot.appendChild(status);
        }
      }
    }
    answer += pending;
  } catch (err) {
    failed = true;
    answer = `**Errore:** ${err.message}`;
  }

  status.remove();
  if (!answer.trim()) answer = "_Nessuna risposta ricevuta._";
  renderMarkdown(bot, answer);
  if (failed) bot.classList.add("error");
  else {
    history.push({ role: "user", content: question }, { role: "assistant", content: answer });
    history = history.slice(-20);
  }
  bot.scrollIntoView({ behavior: "smooth", block: "end" });
  busy = false;
  sendBtn.disabled = false;
  input.focus();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = input.value;
  input.value = "";
  ask(q);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => ask(chip.textContent)),
);

document.getElementById("reset").addEventListener("click", () => {
  if (busy) return;
  history = [];
  chat.querySelectorAll(".msg").forEach((m) => m.remove());
  welcome.hidden = false;
  input.focus();
});
