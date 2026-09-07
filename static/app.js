"use strict";
const TOOLS = [
    { id: "chat", name: "1. JARVIS Chat Pro", icon: "🤖", prompt: "You are JARVIS Chat Pro, a helpful supreme assistant." },
    { id: "code", name: "2. Python & Code Studio", icon: "💻", prompt: "You are an expert software engineer and code assistant." },
    { id: "analyzer", name: "3. Document Analyzer", icon: "📄", prompt: "You analyze texts and documents with high precision." },
    { id: "search", name: "4. Supreme Web Intel", icon: "🌐", prompt: "You provide up-to-date real-time intelligence." }
];
let state = { activeTool: "chat", conversationId: null, isProcessing: false };
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
    renderTools();
    bindEvents();
});

function renderTools() {
    const list = $("toolsList");
    if (!list) return;
    list.innerHTML = "";
    TOOLS.forEach(tool => {
        const btn = document.createElement("button");
        btn.className = `tool-item ${tool.id === state.activeTool ? "active" : ""}`;
        btn.innerHTML = `<span>${tool.icon}</span> <span style="flex:1; text-align:left;">${tool.name}</span>`;
        btn.onclick = () => {
            state.activeTool = tool.id;
            $("activeToolIcon").textContent = tool.icon;
            $("activeToolName").textContent = tool.name;
            renderTools();
            showToast(`Switched to ${tool.name}`);
        };
        list.appendChild(btn);
    });
}

function bindEvents() {
    $("sendBtn")?.addEventListener("click", sendMessage);
    $("messageInput")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    $("settingsBtn")?.addEventListener("click", () => $("settingsModal")?.classList.remove("hidden"));
    $("closeModalBtn")?.addEventListener("click", () => $("settingsModal")?.classList.add("hidden"));
    $("saveKeyBtn")?.addEventListener("click", () => {
        const key = $("apiKeyInput")?.value.trim();
        if (key) { localStorage.setItem("groq_api_key", key); showToast("API Key saved locally."); $("settingsModal")?.classList.add("hidden"); }
    });
    $("exportBtn")?.addEventListener("click", () => {
        const chat = $("chat");
        if (!chat) return;
        const blob = new Blob([chat.innerText], { type: "text/markdown" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "jarvis-chat-export.md";
        a.click();
        showToast("Chat exported.");
    });
    $("newChatBtn")?.addEventListener("click", () => {
        $("chat").innerHTML = `<div id="welcome" class="welcome-screen"><div class="welcome-logo">J</div><h2>Welcome to JARVIS AI Supreme</h2><p>Select a module from the sidebar or type a prompt below to begin.</p></div>`;
        state.conversationId = null;
        showToast("Started new chat.");
    });
}

async function sendMessage() {
    if (state.isProcessing) return;
    const input = $("messageInput");
    const query = input?.value.trim();
    if (!query) return;
    input.value = "";
    appendMessage(query, "user");
    state.isProcessing = true;

    const toolConfig = TOOLS.find(t => t.id === state.activeTool);
    const customKey = localStorage.getItem("groq_api_key") || "";

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(customKey ? { "x-groq-key": customKey } : {}) },
            body: JSON.stringify({ message: query, tool: state.activeTool, system_prompt: toolConfig?.prompt || "", conversation_id: state.conversationId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Request failed");
        state.conversationId = data.conversation_id;
        appendMessage(data.answer, "assistant");
    } catch (err) {
        appendMessage(`⚠️ **Error:** ${err.message}`, "assistant");
    } finally {
        state.isProcessing = false;
    }
}

function appendMessage(text, role) {
    $("welcome")?.remove();
    const chat = $("chat");
    if (!chat) return;
    const div = document.createElement("div");
    div.className = `message ${role}-message`;
    div.innerHTML = role === "assistant" ? `<div class="assistant-avatar">🤖</div><div class="message-bubble">${escapeHtml(text).replace(/\n/g, "<br>")}</div>` : `<div class="message-bubble">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function showToast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
