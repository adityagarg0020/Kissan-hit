import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { useTranslation } from '../../i18n';

export default function AiChatBubble() {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, userLocation } = useMarket();
  const { t, language } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('assistant.welcome.bubbleWelcome'),
      sources: []
    }
  ]);

  const messagesEndRef = useRef(null);

  // Update welcome if language changes and no conversation yet
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          role: 'assistant',
          content: t('assistant.welcome.bubbleWelcome'),
          sources: []
        }];
      }
      return prev;
    });
  }, [language, t]);

  // Auto-scroll inside popup
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const updatedMessages = [
      ...messages,
      { id: userMsgId, role: 'user', content: text }
    ];

    setMessages(updatedMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const history = updatedMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/market/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: history,
          contextLocation: {
            state: userLocation?.state || filters.state || '',
            district: userLocation?.district || filters.district || '',
            lat: userLocation?.lat,
            lng: userLocation?.lng
          },
          contextCrop: filters.commodity || ''
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            sources: data.verifiedSources || []
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: language === 'hi' 
              ? 'इस प्रश्न के लिए वर्तमान में लाइव रिकॉर्ड उपलब्ध नहीं हैं। कृपया किसी अन्य फसल या जिले के बारे में पूछें।'
              : 'I could not retrieve live records for this query right now. Please try asking about another crop or district.',
            sources: []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: language === 'hi'
            ? 'नेटवर्क समस्या। कृपया कनेक्शन जांचें और पुनः प्रयास करें।'
            : 'Connection issue. Please verify your connection or retry.',
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t('assistant.welcome.bubbleWelcome'),
        sources: []
      }
    ]);
  };

  const handleMaximize = () => {
    setIsOpen(false);
    navigate('/ai-assistant');
  };

  // Helper to render simple markdown formatting
  const renderFormatted = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return (
        <span
          key={idx}
          style={{ display: 'block', minHeight: line === '' ? '0.45rem' : 'auto' }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  const quickPrompts = [
    t('assistant.prompts.wheat'),
    t('assistant.prompts.onion'),
    t('assistant.prompts.tomato')
  ];

  return (
    <div className="ai-bubble-wrapper">
      {/* Floating Popup Window */}
      {isOpen && (
        <div className="ai-bubble-popup" role="dialog" aria-label={t('assistant.chatBubble.title')}>
          {/* Header */}
          <div className="ai-bubble-header">
            <div className="ai-bubble-header-info">
              <div className="ai-bubble-avatar">
                <Bot size={18} />
              </div>
              <div>
                <div className="ai-bubble-header-title">{t('assistant.chatBubble.title')}</div>
                <div className="ai-bubble-header-sub">
                  <span className="ai-bubble-header-sub-dot" />
                  {t('assistant.chatBubble.subtitle')}
                </div>
              </div>
            </div>

            <div className="ai-bubble-actions">
              <button
                className="ai-bubble-action-btn"
                title={t('assistant.chatBubble.openFull')}
                onClick={handleMaximize}
                aria-label={t('assistant.chatBubble.openFull')}
              >
                <Maximize2 size={14} />
              </button>
              <button
                className="ai-bubble-action-btn"
                title={t('assistant.chatBubble.resetChat')}
                onClick={handleClear}
                aria-label={t('assistant.chatBubble.resetChat')}
              >
                <RotateCcw size={14} />
              </button>
              <button
                className="ai-bubble-action-btn"
                title={t('assistant.chatBubble.close')}
                onClick={() => setIsOpen(false)}
                aria-label={t('assistant.chatBubble.close')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="ai-bubble-body">
            {/* Quick Prompts */}
            {messages.length <= 2 && (
              <div className="ai-bubble-chips">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    className="ai-bubble-chip"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation list */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ai-bubble-msg ${m.role === 'user' ? 'ai-bubble-msg-user' : 'ai-bubble-msg-bot'}`}
              >
                {renderFormatted(m.content)}
                {m.sources && m.sources.length > 0 && (
                  <span className="ai-bubble-source-tag">
                    <ShieldCheck size={11} /> {t('assistant.chatBubble.verifiedTag')}
                  </span>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="ai-bubble-typing">
                <span className="ai-bubble-typing-dot" />
                <span className="ai-bubble-typing-dot" />
                <span className="ai-bubble-typing-dot" />
                <span style={{ marginLeft: '0.25rem' }}>{t('assistant.chatBubble.analyzing')}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="ai-bubble-footer">
            <div className="ai-bubble-input-row">
              <input
                type="text"
                className="ai-bubble-input"
                placeholder={t('assistant.chatBubble.placeholder')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="ai-bubble-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                aria-label={t('assistant.input.send')}
              >
                <Send size={15} />
              </button>
            </div>
            <div className="ai-bubble-caption">
              {t('assistant.chatBubble.footer')}
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button & Optional Teaser Pill */}
      <div className="ai-bubble-btn-group">
        <button
          className="ai-bubble-btn"
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTeaser(false);
          }}
          aria-label={isOpen ? t('assistant.chatBubble.close') : t('assistant.chatBubble.title')}
          title={t('assistant.chatBubble.title')}
        >
          {isOpen ? <ChevronDown size={24} /> : <Bot size={26} />}
          <span className="ai-bubble-online-badge" />
        </button>

        {!isOpen && showTeaser && (
          <div
            className="ai-bubble-teaser"
            onClick={() => {
              setIsOpen(true);
              setShowTeaser(false);
            }}
          >
            <Sparkles size={14} color="var(--primary)" />
            <span>{t('assistant.chatBubble.teaser')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
