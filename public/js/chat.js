// ─── Chat Page JS ───────────────────────────────────────────────
// Uses Socket.IO for real-time messaging

(() => {
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    if (!orderId) {
        window.location.replace("/orders");
        return;
    }

    const user = Auth.getUser();
    const role = Auth.getRole();
    let socket = null;

    const messagesEl = document.getElementById("chatMessages");
    const emptyEl = document.getElementById("chatEmpty");
    const inputEl = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSendBtn");
    const charCountEl = document.getElementById("charCount");
    const rateInfoEl = document.getElementById("chatRateInfo");
    const inputArea = document.getElementById("chatInputArea");

    // ─── Load Chat Info ──────────────────────────────────
    async function loadChatInfo() {
        try {
            const res = await Auth.authFetch(`/api/chat/${orderId}/info`);
            const result = await res.json();

            if (!result.success) {
                showChatError(result.error || "Cannot load chat");
                inputArea.classList.add("disabled");
                return;
            }

            const info = result.data;
            document.getElementById("chatPartnerName").textContent = info.partnerName;
            document.getElementById("chatProductName").textContent = `Order #${info.orderId} - ${info.productName}`;

            if (info.status !== "pending") {
                inputArea.classList.add("disabled");
                rateInfoEl.textContent = "Chat is only available for pending orders.";
            }

            if (role === "customer") {
                rateInfoEl.textContent = "You can send 1 message per hour.";
            }
        } catch {
            showChatError("Failed to load chat info");
        }
    }

    // ─── Load Existing Messages ──────────────────────────
    async function loadMessages() {
        try {
            const res = await Auth.authFetch(`/api/chat/${orderId}`);
            const result = await res.json();

            if (!result.success) return;

            if (result.data.length > 0) {
                emptyEl.style.display = "none";
                result.data.forEach(renderMessage);
                scrollToBottom();
            }
        } catch {
            // silently fail — socket will handle new messages
        }
    }

    // ─── Render a Message ────────────────────────────────
    function renderMessage(msg) {
        emptyEl.style.display = "none";

        const isOwn = msg.sender_id === user.id;
        const bubble = document.createElement("div");
        bubble.className = `msg-bubble ${isOwn ? "msg-own" : "msg-other"}`;

        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const senderName = msg.sender_name || msg.sender_role;

        bubble.innerHTML = `
            ${!isOwn ? `<div class="msg-sender">${escapeHtml(senderName)}</div>` : ""}
            <div class="msg-text">${escapeHtml(msg.message)}</div>
            <div class="msg-time">${time}</div>
        `;

        messagesEl.appendChild(bubble);
    }

    function escapeHtml(str) {
        if (!str) return "";
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // ─── Socket.IO Connection ────────────────────────────
    function connectSocket() {
        socket = io({
            auth: { token: Auth.getToken() },
        });

        socket.on("connect", () => {
            socket.emit("join_order", parseInt(orderId));
        });

        socket.on("joined", () => {
            // successfully joined room
        });

        socket.on("new_message", (msg) => {
            renderMessage(msg);
            scrollToBottom();
        });

        socket.on("chat_error", (errorMsg) => {
            showChatError(errorMsg);
        });

        socket.on("connect_error", (err) => {
            showChatError("Connection failed: " + err.message);
        });

        socket.on("disconnect", () => {
            // will auto-reconnect
        });
    }

    // ─── Send Message ────────────────────────────────────
    function sendMessage() {
        const message = inputEl.value.trim();
        if (!message || !socket) return;

        if (message.length > 300) {
            showChatError("Message must be 300 characters or less.");
            return;
        }

        socket.emit("send_message", { orderId: parseInt(orderId), message });
        inputEl.value = "";
        charCountEl.textContent = "0";
    }

    // ─── Error Toast ─────────────────────────────────────
    function showChatError(msg) {
        const existing = document.querySelector(".chat-error-toast");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = "chat-error-toast";
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // ─── Event Listeners ─────────────────────────────────
    inputEl.addEventListener("input", () => {
        charCountEl.textContent = inputEl.value.length;
    });

    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener("click", sendMessage);

    // ─── Init ────────────────────────────────────────────
    document.addEventListener("DOMContentLoaded", async () => {
        await loadChatInfo();
        await loadMessages();
        connectSocket();
    });
})();
