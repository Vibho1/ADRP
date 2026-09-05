"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { signIn, signOut, useSession } from "next-auth/react";


type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null); // <-- Add this!
  const [chatId, setChatId] = useState<string>(""); // 👈 Add this state
  const [pastChats, setPastChats] = useState<{ title: string; messages: any[] }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000";


  const { data: session } = useSession();

  useEffect(() => {
    let savedChatId = localStorage.getItem("currentChatId");
    if (!savedChatId) {
      savedChatId = Date.now().toString(); // Generate a unique ID (timestamp)
      localStorage.setItem("currentChatId", savedChatId);
    }
    setChatId(savedChatId);
  }, []);


  useEffect(() => {
    // Only fetch history if we have BOTH an email and a chatId ready
    if (session?.user?.email && chatId) {
      fetch(`${baseUrl}/gateway/history?email=${session.user.email}&chatId=${chatId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setMessages(data); 
          } else {
            setMessages([]); // Clear screen if this room has no history
          }
        })
        .catch((err) => console.error("Failed to load history:", err));
    }
  }, [session, chatId]); // 👈 Add chatId to dependency array



  // Auto-scroll to the bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`${baseUrl}/gateway/chats?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPastChats(data);
        })
        .catch((err) => console.error("Failed to load chats:", err));
    }
  }, [session, chatId]); // Re-fetch sidebar every time a new chat is created


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // 1. Add user's message to the chat
    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt(""); // Clear the input box
    setLoading(true);

    try {
      // Use FormData to send both text and the PDF file!
      const formData = new FormData();
      formData.append("prompt", userMessage.content);
      formData.append("userEmail", session?.user?.email || "anonymous");
      formData.append("chatId", chatId); // 👈 Add this line!
      if (file) {
        formData.append("file", file);
      }
      const res = await fetch(`${baseUrl}/gateway/prompt`, {
        method: "POST",
        body: formData, // Notice: No Content-Type headers here! The browser handles it automatically.
      });


      const data = await res.json();
      
      // 3. Extract the actual text from the response safely
      // Sometimes Gemini returns a raw string, sometimes it returns an array of text blocks
      let assistantText = "";
      if (typeof data.data?.message === "string") {
        assistantText = data.data.message;
      } else if (Array.isArray(data.data?.message)) {
        // If it's the array of blocks from the Agent Core
        assistantText = data.data.message.map((block: any) => block.text).join("\n");
      } else {
        assistantText = JSON.stringify(data.data, null, 2); // Fallback
      }

      // 4. Add the assistant's response to the chat
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to the Gateway." }]);
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">

      {/* LEFT SIDEBAR - Past Chats */}
      {session && (
        <div className={`shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-64 p-4" : "w-0 p-0 border-0"}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest whitespace-nowrap">Past Chats</h2>
            <button
              onClick={() => {
                const newId = Date.now().toString();
                localStorage.setItem("currentChatId", newId);
                setChatId(newId);
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-md transition-all whitespace-nowrap"
            >
              + New
            </button>
          </div>
          {pastChats.length === 0 && (
            <p className="text-neutral-600 text-xs whitespace-nowrap">No past chats yet.</p>
          )}
          {pastChats.map((chat) => (
            <button
              key={chat.title}
              onClick={() => {
                localStorage.setItem("currentChatId", chat.title);
                setChatId(chat.title);
              }}
              className={`text-left text-sm px-3 py-2 rounded-lg truncate transition-all whitespace-nowrap ${
                chatId === chat.title
                  ? "bg-emerald-700 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {chat.messages?.[0]?.content?.slice(0, 35) || `Chat ${chat.title}`}...
            </button>
          ))}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-hidden">
        <div className="w-full max-w-4xl flex flex-col h-full">

          {/* Top Navigation */}
                    {/* Top Navigation */}
          <div className="w-full flex items-center justify-between py-4 shrink-0">
            
            {/* Toggle Sidebar Button - always on the LEFT */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-lg text-sm transition-all"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>

            {/* Auth buttons - always on the RIGHT */}
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-emerald-400 font-medium">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-3 bg-white hover:bg-neutral-200 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>


          {/* Header */}
          <div className="text-center py-6 shrink-0">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-300 to-indigo-400 bg-clip-text text-transparent">
              Nexus Capital: Due-Diligence Engine
            </h1>
            <p className="text-neutral-400 mt-2">
              Automated Series A analysis using Multi-Agent RAG & Web Search.
            </p>
          </div>

          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-6 mb-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-700">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500">
                No messages yet. Ask me to research a topic!
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      msg.role === "user"
                        ? "bg-emerald-500 text-neutral-950 rounded-br-none"
                        : "bg-neutral-800 text-neutral-200 rounded-bl-none border border-neutral-700"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed">
                        {msg.content}
                      </pre>
                    ) : (
                      <div className="text-sm md:text-base leading-relaxed break-words">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-emerald-400" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-emerald-400" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-emerald-400" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-emerald-300" {...props} />,
                            a: ({node, ...props}) => <a className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            hr: ({node, ...props}) => <hr className="border-neutral-700 my-6" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 border border-neutral-700 text-emerald-400 px-5 py-4 rounded-2xl rounded-bl-none animate-pulse">
                  Agent is thinking and researching...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-neutral-900 rounded-xl border border-neutral-800 p-2">
              <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-3 rounded-lg transition-all border border-neutral-700 mr-2 whitespace-nowrap">
                {file ? "PDF Attached ✅" : "📎 Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything or request deep research..."
                className="w-full bg-transparent text-white px-4 py-3 outline-none placeholder:text-neutral-600 text-base sm:text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-6 py-3 rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>

        </div>
      </main>

    </div>
  );
}