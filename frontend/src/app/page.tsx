"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // 1. Add user's message to the chat
    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt(""); // Clear the input box
    setLoading(true);

    try {
      // 2. Call our NestJS Gateway
      const res = await fetch("http://localhost:3000/gateway/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content }),
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
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-4xl flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="text-center py-6 shrink-0">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            ADRP Deep Research
          </h1>
          <p className="text-neutral-400 mt-2">
            Intelligent routing between Gemini Flash and LangGraph Web Agent.
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
                  <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed">
                    {msg.content}
                  </pre>
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
          {/* Invisible div to scroll to */}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative group shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-neutral-900 rounded-xl border border-neutral-800 p-2">
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
  );
}
