import React, { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ChatPage() {
    const { user } = useAuth();

    const [links, setLinks] = useState([]);
    const [linksLoading, setLinksLoading] = useState(true);

    const [selectedLinkId, setSelectedLinkId] = useState(null);

    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);

    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);

    // ---------- LOAD LINKS (THREAD LIST) ----------
    useEffect(() => {
        const loadLinks = async () => {
            setLinksLoading(true);
            try {
                const res = await api.get("/api/links/me");
                const list = Array.isArray(res.data) ? res.data : [];
                setLinks(list);

                // auto-select first APPROVED link if none is selected
                if (!selectedLinkId && list.length > 0) {
                    const approved = list.find((l) => l.status === "APPROVED");
                    setSelectedLinkId((approved || list[0]).id);
                }
            } catch (err) {
                console.error("Failed to load links:", err.response?.status, err.response?.data || err);
            } finally {
                setLinksLoading(false);
            }
        };

        loadLinks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- LOAD MESSAGES FOR SELECTED LINK ----------
    useEffect(() => {
        if (!selectedLinkId) return;

        const loadMessages = async () => {
            setMessagesLoading(true);
            try {
                const res = await api.get(`/api/messages/${selectedLinkId}`);
                const list = Array.isArray(res.data) ? res.data : [];
                // sort by created_at just in case
                list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                setMessages(list);
            } catch (err) {
                console.error("Failed to load messages:", err.response?.status, err.response?.data || err);
            } finally {
                setMessagesLoading(false);
            }
        };

        loadMessages();
    }, [selectedLinkId]);

    // ---------- SENDER NAME / THREAD TITLE HELPERS ----------
    const getThreadTitle = (link) => {
        if (!user || !link) return "Chat";

        // Example payloads from your screenshots:
        // - consumer side: { supplier: { company_name } }
        // - supplier side: { consumer: { restaurant_name } }
        if (user.role === "CONSUMER" && link.supplier) {
            return link.supplier.company_name || "Supplier";
        }
        if (link.consumer) {
            return link.consumer.restaurant_name || link.consumer.full_name || "Consumer";
        }

        return "Chat";
    };

    const formatTimestamp = (ts) => {
        if (!ts) return "";
        const d = new Date(ts);
        return d.toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
        });
    };

    // ---------- SEND MESSAGE ----------
    const handleSend = async (e) => {
        e.preventDefault();
        if (!selectedLinkId || !newMessage.trim() || sending) return;

        setSending(true);
        try {
            const payload = { content: newMessage.trim() }; // matches Swagger: { "content": "string" }
            const res = await api.post(`/api/messages/${selectedLinkId}`, payload);

            // backend returns the created message
            const created = res.data;
            setMessages((prev) => [...prev, created]);
            setNewMessage("");
        } catch (err) {
            console.error("Failed to send message:", err.response?.status, err.response?.data || err);
            alert("Failed to send message. Check console for details.");
        } finally {
            setSending(false);
        }
    };

    // ---------- RENDER ----------
    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            {/* LEFT: LINKS LIST */}
            <aside className="w-80 border-r border-gray-100 bg-surface flex flex-col shadow-soft z-10">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-heading font-bold text-xl text-primary-900">Chats</h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Conversations with linked suppliers / consumers.
                    </p>
                </div>

                {linksLoading ? (
                    <div className="p-6 text-sm text-gray-500 animate-pulse">Loading links...</div>
                ) : links.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        You don&apos;t have any links yet.
                        <br />
                        {user?.role === "CONSUMER"
                            ? "Request a link from Suppliers page to start chatting."
                            : "Wait for consumers to request a link to your supplier account."}
                    </div>
                ) : (
                    <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {links.map((link) => {
                            const isActive = link.id === selectedLinkId;
                            const title = getThreadTitle(link);

                            return (
                                <li key={link.id}>
                                    <button
                                        onClick={() => setSelectedLinkId(link.id)}
                                        className={`w-full text-left px-6 py-4 text-sm flex flex-col gap-1 transition-all ${isActive
                                            ? "bg-primary-50/50 border-l-4 border-primary-500"
                                            : "hover:bg-gray-50 border-l-4 border-transparent"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={`font-medium truncate ${isActive ? "text-primary-900" : "text-gray-700"}`}>
                                                {title}
                                            </span>
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${link.status === "APPROVED"
                                                    ? "bg-green-100 text-green-700"
                                                    : link.status === "PENDING"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {link.status}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-gray-400 truncate">
                                            Link #{link.id}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            {/* RIGHT: MESSAGES PANEL */}
            <section className="flex-1 flex flex-col bg-background relative">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-surface shadow-sm flex items-center justify-between z-10">
                    {selectedLinkId ? (
                        <>
                            <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chat for link #{selectedLinkId}</div>
                                <div className="font-heading font-bold text-lg text-primary-900">
                                    {getThreadTitle(links.find((l) => l.id === selectedLinkId))}
                                </div>
                            </div>
                            <button
                                className="text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                onClick={async () => {
                                    if (!selectedLinkId) return;
                                    setMessagesLoading(true);
                                    try {
                                        const res = await api.get(`/api/messages/${selectedLinkId}`);
                                        const list = Array.isArray(res.data) ? res.data : [];
                                        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                                        setMessages(list);
                                    } catch (err) {
                                        console.error(
                                            "Failed to refresh messages:",
                                            err.response?.status,
                                            err.response?.data || err
                                        );
                                    } finally {
                                        setMessagesLoading(false);
                                    }
                                }}
                            >
                                Refresh
                            </button>
                        </>
                    ) : (
                        <div className="text-gray-500 text-sm">
                            Select a chat on the left to start messaging.
                        </div>
                    )}
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 bg-background">
                    {!selectedLinkId ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">No chat selected.</div>
                    ) : messagesLoading ? (
                        <div className="flex items-center justify-center h-full text-sm text-gray-500 animate-pulse">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-sm text-gray-500 bg-surface/50 rounded-2xl m-8 border border-dashed border-gray-200">
                            No messages yet. Start the conversation below.
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isMine =
                                (user?.id && m.sender?.id === user.id) ||
                                (user?.email && m.sender?.email === user.email);

                            return (
                                <div
                                    key={m.id}
                                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm shadow-sm ${isMine
                                            ? "bg-primary-600 text-white rounded-br-none"
                                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                            }`}
                                    >
                                        <div className="flex justify-between gap-4 items-baseline mb-1">
                                            <span className={`font-semibold text-xs ${isMine ? "text-primary-100" : "text-gray-500"}`}>
                                                {m.sender?.full_name || m.sender?.email || "Unknown"}
                                            </span>
                                            <span className={`text-[10px] ${isMine ? "text-primary-200" : "text-gray-400"}`}>
                                                {formatTimestamp(m.created_at)}
                                            </span>
                                        </div>
                                        <div className="whitespace-pre-wrap break-words leading-relaxed">
                                            {m.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Composer */}
                <div className="p-4 bg-surface border-t border-gray-100">
                    <form
                        onSubmit={handleSend}
                        className="flex items-center gap-3 max-w-4xl mx-auto"
                    >
                        <input
                            type="text"
                            className="flex-1 border-gray-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 shadow-inner"
                            placeholder={
                                selectedLinkId ? "Type your message..." : "Select a chat to start messaging"
                            }
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={!selectedLinkId || sending}
                        />
                        <button
                            type="submit"
                            disabled={!selectedLinkId || sending || !newMessage.trim()}
                            className="px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all active:scale-95"
                        >
                            {sending ? "Sending..." : "Send"}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
