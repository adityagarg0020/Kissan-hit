import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  MapPin,
  Calendar,
  Wheat,
  AlertCircle
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';

export default function AiAssistantPage() {
  const { filters, userLocation } = useMarket();
  const { t, language } = useTranslation();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `${t('assistant.welcome.greeting')}\n\n${t('assistant.welcome.intro')}`,
      sources: []
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Update welcome message if user switches language before chatting
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          role: 'assistant',
          content: `${t('assistant.welcome.greeting')}\n\n${t('assistant.welcome.intro')}`,
          sources: []
        }];
      }
      return prev;
    });
  }, [language, t]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: userMsgId, role: 'user', content: text }
    ];

    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);
    setError(null);

    try {
      // Build conversation history for context
      const history = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/market/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: history,
          contextLocation: {
            state: userLocation.state || filters.state || '',
            district: userLocation.district || filters.district || '',
            lat: userLocation.lat,
            lng: userLocation.lng
          },
          contextCrop: filters.commodity || ''
        })
      });

      const data = await res.json();

      if (data.success && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            sources: data.verifiedSources || [],
            mode: data.mode || 'verified'
          }
        ]);
      } else {
        throw new Error(data.error || 'Failed to get a response from AI Assistant.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Unable to reach assistant service. Please check your network connection.');
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: language === 'hi' 
            ? '⚠️ AI इंजन से संपर्क करने में अस्थायी समस्या आई। कृपया अपना प्रश्न पुनः पूछें।' 
            : '⚠️ I encountered a temporary connection issue reaching the AI engine. Please try asking your question again.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t('assistant.welcome.chatCleared'),
        sources: []
      }
    ]);
  };

  const quickPrompts = [
    { text: t('assistant.prompts.wheat'), icon: Wheat },
    { text: t('assistant.prompts.onion'), icon: TrendingUp },
    { text: t('assistant.prompts.tomato'), icon: MapPin },
    { text: t('assistant.prompts.gram'), icon: Calendar }
  ];

  return (
    <div className="ai-assistant-page">
      {/* Header Banner */}
      <div className="page-header-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              🤖 {t('assistant.pageTitle')}
            </h1>
            <p className="page-subtitle">
              {t('assistant.pageSubtitle')}
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={handleClearChat}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            title={t('assistant.header.clearChat')}
          >
            <RefreshCw size={14} /> {t('assistant.header.clearChat')}
          </button>
        </div>
      </div>

      {/* Grounding Transparency Badge */}
      <div className="historical-transparency-banner" style={{ margin: '1rem 0' }}>
        <ShieldCheck size={18} color="var(--primary)" />
        <div>
          <strong>{t('assistant.transparency.title')}</strong>
          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {t('assistant.transparency.desc')}
          </span>
        </div>
      </div>

      {/* Quick Prompt Suggestions */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
          💡 {t('assistant.header.commonQueries')}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                className="btn btn-outline"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--bg-subtle)'
                }}
                onClick={() => handleSendMessage(qp.text)}
                disabled={loading}
              >
                <Icon size={14} color="var(--primary)" /> {qp.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Container Card */}
      <div className="card" style={{ padding: '1.25rem', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '85%' : '90%'
                }}
              >
                {/* Avatar */}
                {!isUser && (
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-deep)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                {/* Bubble */}
                <div>
                  <div
                    style={{
                      backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: isUser ? '#ffffff' : 'var(--text-main)',
                      padding: '0.85rem 1.15rem',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      fontSize: '0.92rem',
                      lineHeight: '1.6',
                      border: isUser ? 'none' : '1px solid var(--border-light)',
                      whiteSpace: 'pre-wrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                    {m.content}
                  </div>

                  {/* Verified Sources Badge if present */}
                  {m.sources && m.sources.length > 0 && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {t('assistant.input.verifiedVia')}
                      </span>
                      {m.sources.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(43, 138, 62, 0.1)',
                            color: '#2b8a3e',
                            fontWeight: 600
                          }}
                        >
                          ✓ {s.tool?.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-gold)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-deep)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={18} />
              </div>
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '0.6rem 1rem',
                  borderRadius: '16px 16px 16px 2px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Sparkles size={14} className="spin" color="var(--primary)" />
                {t('assistant.input.thinking')}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder={t('assistant.input.placeholder')}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              fontSize: '0.92rem',
              borderRadius: 'var(--radius-pill)'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !inputMessage.trim()}
            style={{
              borderRadius: 'var(--radius-pill)',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Send size={16} />
            <span>{t('assistant.input.send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
