import React, { useState, useRef, useEffect, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { sendChatMessage, clearChatHistory, QUICK_ACTIONS } from '../services/zeaiChat';

/**
 * Simple markdown-to-HTML renderer for AI responses.
 * Handles bold, italic, code, headers, and lists.
 */
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Bullet lists
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> items in <ul> or <ol>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Line breaks (double newline = paragraph break)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return html;
}

export default function ZeaiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Game store state for context
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Build a snapshot of the current store state for context injection.
   */
  const getStoreSnapshot = useCallback(() => ({
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
    currentRoom, activeExperiment, chemistry, physics,
    flameTest, phTest, precipitation, iodineClock,
    saltPrep, electrolysis, distillation, ohmsLaw,
    pendulum, projectile, refraction, induction,
  ]);

  /**
   * Send a message to the AI.
   */
  const handleSend = useCallback(async (messageText) => {
    const text = (messageText || inputValue).trim();
    if (!text || isLoading) return;

    // Add user message to UI
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const storeSnapshot = getStoreSnapshot();
      const response = await sendChatMessage(text, storeSnapshot);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);

      // Show badge if panel is closed
      if (!isOpen) {
        setHasNewMessage(true);
      }
    } catch (err) {
      console.error('ZEAI Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: `Connection issue: ${err.message}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, isOpen, getStoreSnapshot]);

  /**
   * Handle Enter key in input.
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Prevent key events from reaching the 3D scene
    e.stopPropagation();
  }, [handleSend]);

  /**
   * Toggle chat panel.
   */
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    setHasNewMessage(false);
  }, []);

  /**
   * Handle quick action click.
   */
  const handleQuickAction = useCallback((prompt) => {
    handleSend(prompt);
  }, [handleSend]);

  /**
   * Clear chat history.
   */
  const handleClear = useCallback(() => {
    setMessages([]);
    clearChatHistory();
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`zeai-chat-fab ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        title={isOpen ? 'Close ZEAI Mentor' : 'Open ZEAI Mentor'}
        id="zeai-chat-fab"
      >
        {isOpen ? '✕' : '🤖'}
        {hasNewMessage && !isOpen && <div className="zeai-fab-badge" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="zeai-chat-panel"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          id="zeai-chat-panel"
        >
          {/* Header */}
          <div className="zeai-chat-header">
            <div className="zeai-chat-avatar">🔬</div>
            <div className="zeai-chat-title">
              <h3>ZEAI Lab Mentor</h3>
              <span>Online — Watching your experiment</span>
            </div>
            <button
              className="zeai-chat-close"
              onClick={handleClear}
              title="Clear chat history"
            >
              🗑
            </button>
          </div>

          {/* Quick Actions */}
          <div className="zeai-quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                className="zeai-quick-btn"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="zeai-chat-messages" id="zeai-messages">
            {messages.length === 0 && !isLoading && (
              <div className="zeai-welcome">
                <span className="zeai-welcome-icon">🔬</span>
                <h4>Welcome to ZEAI Lab Mentor!</h4>
                <p>
                  I'm your AI laboratory instructor. Ask me anything about your experiment,
                  request step-by-step guidance, or use the quick actions above.
                </p>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.role === 'error') {
                return (
                  <div key={i} className="zeai-error">
                    {msg.content}
                  </div>
                );
              }
              return (
                <div key={i} className={`zeai-msg ${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="zeai-typing">
                <div className="zeai-typing-dot" />
                <div className="zeai-typing-dot" />
                <div className="zeai-typing-dot" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="zeai-chat-input-area">
            <input
              ref={inputRef}
              type="text"
              className="zeai-chat-input"
              placeholder="Ask ZEAI anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              id="zeai-chat-input"
            />
            <button
              className="zeai-chat-send"
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              title="Send message"
              id="zeai-chat-send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
