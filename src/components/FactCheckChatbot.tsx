import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, ExternalLink, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  citations?: { title: string; url: string }[];
  timestamp: string;
}

export const FactCheckChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Hello! I am your TruthLens AI Fact-Checking Assistant. Ask me about any viral claim, news rumor, or public statement, and I will search grounded live wire databases to verify it for you with sources.',
      citations: [
        { title: 'Snopes Fact Check Library', url: 'https://snopes.com' },
        { title: 'Associated Press Fact Check', url: 'https://apnews.com/hub/ap-fact-check' }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputMessage;
    if (!messageText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) throw new Error('Chat API returned error');

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: data.reply,
        citations: data.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'bot',
        text: 'I apologize, I encountered a temporary connection issue. Please try rephrasing your question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'Did NASA confirm alien structures on Mars?',
    'Is there an official WHO warning about a new pandemic in 2026?',
    'Did the Federal Reserve raise interest rates yesterday?'
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[650px]">
      
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">TruthLens Grounded RAG Assistant</h2>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Google Search Grounding Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-2xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-3.5 rounded-2xl space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider">
                    Retrieved Evidence Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 flex items-center gap-1 text-[10px] transition font-medium"
                      >
                        <span className="truncate max-w-[180px]">{c.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <span className={`text-[9px] block text-right font-mono font-bold ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="font-medium">Searching wire reports & verifying sources...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Try asking:</span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="text-[10px] bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition font-medium cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about a claim, news rumor, or event..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-medium"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
