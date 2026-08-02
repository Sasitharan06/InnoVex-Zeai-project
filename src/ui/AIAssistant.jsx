import React, { useState, useRef, useEffect, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { askVirtuLab, QUICK_ACTIONS } from '../services/grok';

function renderMarkdown(text) {
  if (!text) return '';
  
  // Escape HTML tags to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Multi-line code block with Copy button
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escapedCode = code.trim();
    const encoded = encodeURIComponent(escapedCode);
    return `<div class="ai-code-block">
      <div class="ai-code-header">
        <span>${lang || 'code'}</span>
        <button class="ai-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encoded}')); this.innerText='Copied!'; setTimeout(() => this.innerText='Copy', 2000)">Copy</button>
      </div>
      <pre><code>${escapedCode}</code></pre>
    </div>`;
  });

  // Simple Markdown Table conversion
  html = html.replace(/^\|(.+)\|$/gm, (match, rowContent) => {
    if (rowContent.includes('---')) return '';
    const cells = rowContent.split('|').map(c => c.trim()).filter(c => c !== '');
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
  });
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<div class="ai-table-wrap"><table class="ai-table"><tbody>$1</tbody></table></div>');

  // Headers, quotes, bold, lists, and formulas
  html = html
    .replace(/^&gt;\s+(.+)$/gm, '<blockquote class="ai-blockquote">$1</blockquote>')
    .replace(/^### (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="ai-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="ai-h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
    .replace(/\$\$(.+?)\$\$/g, '<div class="ai-formula">$1</div>')
    .replace(/\$(.+?)\$/g, '<span class="ai-formula inline">$1</span>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^[-•*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="ai-ul">$1</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return html;
}

export default function AIAssistant() {
  const chatOpen = useGameStore((s) => s.chatOpen);
  const setChatOpen = useGameStore((s) => s.setChatOpen);
  
  const initialMessage = {
    role: 'assistant',
    content: "👋 Hello! I'm Chatbot Lab Mentor.\n\nI can:\n\n• Explain concepts\n• Guide experiments\n• Detect mistakes\n• Generate Viva Questions\n• Create Lab Reports\n\nHow can I help you today?"
  };
  const [messages, setMessages] = useState([initialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Grab the full game store context to pass to the LLM
  const currentRoom = useGameStore((s) => s.currentRoom);
  const activeExperiment = useGameStore((s) => s.activeExperiment);
  const chemistry = useGameStore((s) => s.chemistry);
  const physics = useGameStore((s) => s.physics);
  const flameTest = useGameStore((s) => s.flameTest);
  const phTest = useGameStore((s) => s.phTest);
  const precipitation = useGameStore((s) => s.precipitation);
  const iodineClock = useGameStore((s) => s.iodineClock);
  const saltPrep = useGameStore((s) => s.saltPrep);
  const electrolysis = useGameStore((s) => s.electrolysis);
  const distillation = useGameStore((s) => s.distillation);
  const ohmsLaw = useGameStore((s) => s.ohmsLaw);
  const pendulum = useGameStore((s) => s.pendulum);
  const projectile = useGameStore((s) => s.projectile);
  const refraction = useGameStore((s) => s.refraction);
  const induction = useGameStore((s) => s.induction);
  const studentName = useGameStore((s) => s.studentName);

  const getStoreSnapshot = useCallback(() => ({
    studentName,
    currentRoom,
    activeExperiment,
    chemistry,
    physics,
    flameTest,
    phTest,
    precipitation,
    iodineClock,
    saltPrep,
    electrolysis,
    distillation,
    ohmsLaw,
    pendulum,
    projectile,
    refraction,
    induction,
  }), [
    studentName, currentRoom, activeExperiment, chemistry, physics,
    flameTest, phTest, precipitation, iodineClock,
    saltPrep, electrolysis, distillation, ohmsLaw,
    pendulum, projectile, refraction, induction,
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on open and handle Pointer Lock
  useEffect(() => {
    if (chatOpen) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasNewMessage(false);
    } else {
      // Re-request pointer lock to restore gameplay controls
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.requestPointerLock();
      }
    }
  }, [chatOpen]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
      
      if (!chatOpen) {
        // T or Enter triggers chat opening
        if (!isTyping && (e.key === 't' || e.key === 'T' || e.key === 'Enter')) {
          e.preventDefault();
          setChatOpen(true);
        }
      } else {
        // ESC closes chat
        if (e.key === 'Escape') {
          e.preventDefault();
          setChatOpen(false);
        }
        // Ctrl + / focuses input
        if (e.ctrlKey && e.key === '/') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [chatOpen, setChatOpen]);

  const handleSend = useCallback(async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiHistory = newMessages.map(m => ({ role: m.role === 'error' ? 'assistant' : m.role, content: m.content }));
      const stateContext = getStoreSnapshot();
      const response = await askVirtuLab(apiHistory, stateContext);
      
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      if (!chatOpen) {
        setHasNewMessage(true);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: `Connection error: ${err.message}. Please configure API key in your .env file or try again.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, chatOpen, getStoreSnapshot]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Prevent event leakage to canvas/3D movement
    e.stopPropagation();
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* FAB Button */}
      <button
        className={`vl-chat-fab ${chatOpen ? 'open' : ''}`}
        onClick={() => {
          setChatOpen(!chatOpen);
        }}
        title={chatOpen ? 'Close Chatbot Mentor' : 'Open Chatbot Mentor'}
        id="vl-chat-fab"
      >
        {chatOpen ? '✕' : '🤖'}
        {hasNewMessage && !chatOpen && <div className="vl-fab-badge" />}
      </button>

      {/* Slide-out Sidebar Panel */}
      <div
        className={`vl-chat-panel ${chatOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        id="vl-chat-panel"
      >
        {/* Header */}
        <div className="vl-chat-header">
          <div className="vl-chat-avatar">🔬</div>
          <div className="vl-chat-title">
            <h3>Chatbot Lab Mentor</h3>
            <span>Online • Real-time guidance</span>
          </div>
          <button
            className="vl-chat-clear"
            onClick={() => setMessages([initialMessage])}
            title="Clear Chat history"
          >
            🗑
          </button>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="vl-quick-actions">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              className="vl-quick-btn"
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Message Window */}
        <div className="vl-chat-messages" id="vl-messages">
          {messages.length === 0 && !isLoading && (
            <div className="vl-welcome">
              <span className="vl-welcome-icon">👋</span>
              <h4>Hello! I'm VirtuLab Lab Mentor.</h4>
              <p>I can help you with:</p>
              <ul>
                <li>Explain concepts & equations</li>
                <li>Guide through experimental steps</li>
                <li>Detect process errors/mistakes</li>
                <li>Generate challenging Viva Questions</li>
                <li>Create comprehensive Lab Reports</li>
              </ul>
              <p className="vl-welcome-footer">How can I help you today?</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`vl-msg-container ${msg.role}`}>
              <div className={`vl-msg ${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  msg.content
                )}
                
                {msg.role === 'assistant' && (
                  <button
                    className="vl-msg-copy-btn"
                    onClick={() => copyMessage(msg.content)}
                    title="Copy full message text"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="vl-typing-indicator">
              <div className="vl-dot" />
              <div className="vl-dot" />
              <div className="vl-dot" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Bottom Input Area */}
        <div className="vl-chat-input-area">
          <input
            ref={inputRef}
            type="text"
            className="vl-chat-input"
            placeholder="Ask VirtuLab anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            id="vl-chat-input"
          />
          <button
            className="vl-chat-send"
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            title="Send message"
            id="vl-chat-send"
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}
