import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, LegalDocument } from '../../types/document';
import { INITIAL_CHAT_MESSAGES, MOCK_QA_RESPONSES } from '../../data/mockData';
import { askDocumentQuestion } from '../../services/api/legalAnalysisApi';
import { 
  ArrowUpRight, 
  Bot, 
  HelpCircle, 
  Info, 
  Quote, 
  Send, 
  Sparkles, 
  User 
} from 'lucide-react';

interface ChatPanelProps {
  document?: LegalDocument;
  onJumpToClause?: (clauseRef: string) => void;
}

let chatMsgCounter = 0;
function createMessageId(prefix: string): string {
  chatMsgCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${chatMsgCounter}`;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ document: doc, onJumpToClause }) => {
  const isUploadedDoc = Boolean(doc && (doc.isUploaded || doc.source === 'uploaded'));
  
  // For uploaded document, start with a fresh welcome message or initial message
  const initialMessages: ChatMessage[] = isUploadedDoc
    ? [
        {
          id: `welcome-${doc?.id || 'doc'}`,
          sender: 'assistant',
          text: `Welcome to LegalLens Document Assistant.\n\nI am connected to the text of **${doc?.name || 'your uploaded document'}** (${doc?.sections.length || 0} extracted sections).\n\nAsk me any question about your obligations, payment terms, termination rules, or risks. All answers are strictly grounded in this document.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    : INITIAL_CHAT_MESSAGES;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSnippetIdx, setActiveSnippetIdx] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = isUploadedDoc
    ? [
        'What are my main obligations?',
        'Can I terminate this agreement early?',
        'What payments or fees are specified?',
        'What is the governing law and jurisdiction?'
      ]
    : [
        'What are my main obligations?',
        'Can I terminate this agreement early?',
        'What payments am I responsible for?',
        'Which clauses should I review carefully?'
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (questionText: string) => {
    const textToSend = questionText.trim();
    if (!textToSend || isTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: ChatMessage = {
      id: createMessageId('usr'),
      sender: 'user',
      text: textToSend,
      timestamp: timeStr
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    // If REAL uploaded document: call live Groq Q&A API
    if (isUploadedDoc && doc) {
      try {
        const result = await askDocumentQuestion(textToSend, doc);

        const botMessage: ChatMessage = {
          id: createMessageId('bot'),
          sender: 'assistant',
          text: result.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFoundInDocument: result.isFoundInDocument,
          citations: result.citations.map((c) => ({
            clauseRef: c.sectionNumber || 'Document Section',
            title: c.title,
            pageNumber: c.pageNumber,
            sourceSnippet: c.sourceSnippet
          }))
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (err: any) {
        console.error('Document Q&A error:', err);
        const errMsg = err?.message || 'The AI service is temporarily unavailable. Please try again.';
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId('bot-err'),
            sender: 'assistant',
            text: `⚠️ **Unable to complete inquiry:**\n${errMsg}\n\nPlease check connection or try again in a few moments.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // IF DEMO SAMPLE DOCUMENT: Use canned/demo responses
    setTimeout(() => {
      let botResponseText = '';
      let citations: { clauseRef: string; title: string; pageNumber?: number | null; sourceSnippet?: string }[] | undefined;

      const canned = MOCK_QA_RESPONSES[textToSend];
      if (canned) {
        botResponseText = canned.answer;
        citations = canned.citations;
      } else {
        botResponseText = `[Demo Response] Based on the indexed agreement:\n\nRegarding "${textToSend}":\n\n• **Governing Terms:** Review Section 3.0 (Term & Termination) and Section 4.0 (Invoicing & Fees) for specific conditions.\n• **Advisory Note:** Real uploaded documents use live document analysis for grounded answers with exact citations.\n• **Important:** This informational response does not constitute legal counsel.`;
        citations = [
          { clauseRef: 'Section 3.0', title: 'Term & Renewal', pageNumber: 3 },
          { clauseRef: 'Section 4.0', title: 'Fees & Invoicing', pageNumber: 4 }
        ];
      }

      const botMessage: ChatMessage = {
        id: createMessageId('bot'),
        sender: 'assistant',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputQuery);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ask this document</h3>
            <span className="text-[10px] text-slate-500 font-medium">
              Answers are grounded in the uploaded document.
            </span>
          </div>
        </div>

        {isUploadedDoc ? (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>Grounded in Uploaded Doc</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
            <span>Demo Document Q&amp;A</span>
          </div>
        )}
      </div>

      {/* Screen Reader Live Status Region */}
      <div role="status" aria-live="polite" className="sr-only">
        {isTyping && 'LegalLens is analyzing document excerpts...'}
        {messages.length > 0 && messages[messages.length - 1].sender === 'assistant' && `Assistant answered: ${messages[messages.length - 1].text}`}
      </div>

      {/* Messages Scroll Area */}
      <div 
        role="log"
        aria-label="Document question and answer history"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div 
                className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200"
                aria-hidden="true"
              >
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Citations block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Source Citations:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {msg.citations.map((cite, idx) => {
                      const citeKey = `${msg.id}-${idx}`;
                      const isSnippetOpen = activeSnippetIdx === citeKey;

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onJumpToClause?.(cite.clauseRef || (cite.sectionNumber ? `${cite.sectionNumber} — ${cite.title}` : cite.title))}
                              className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-indigo-700 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                              title="Click to jump to section in document viewer"
                              aria-label={`Jump to ${cite.clauseRef || cite.sectionNumber || 'section'}: ${cite.title}`}
                            >
                              <span className="font-semibold">{cite.clauseRef || cite.sectionNumber}:</span>
                              <span className="text-slate-700 truncate max-w-[200px]">{cite.title}</span>
                              {cite.pageNumber !== undefined && cite.pageNumber !== null && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  (p.{cite.pageNumber})
                                </span>
                              )}
                              <ArrowUpRight className="w-3 h-3 text-indigo-500 shrink-0" aria-hidden="true" />
                            </button>

                            {cite.sourceSnippet && (
                              <button
                                type="button"
                                onClick={() => setActiveSnippetIdx(isSnippetOpen ? null : citeKey)}
                                aria-expanded={isSnippetOpen}
                                className="text-[10px] text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer inline-flex items-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                              >
                                <Quote className="w-2.5 h-2.5" aria-hidden="true" />
                                <span>{isSnippetOpen ? 'Hide text' : 'View excerpt'}</span>
                              </button>
                            )}
                          </div>

                          {/* Expanded Source Snippet */}
                          {isSnippetOpen && cite.sourceSnippet && (
                            <div className="p-2 rounded-lg bg-white border border-indigo-100 text-[11px] text-slate-700 font-serif italic leading-relaxed shadow-2xs">
                              &ldquo;{cite.sourceSnippet}&rdquo;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                className="text-xs mt-1.5 text-right font-mono text-slate-500"
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div 
                className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-10" role="status">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" aria-hidden="true" />
            <span className="font-mono text-[11px] text-slate-600">LegalLens analyzing document excerpts...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      <div 
        role="group" 
        aria-label="Suggested document inquiries"
        className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 shrink-0"
      >
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mb-1.5">
          <HelpCircle className="w-3 h-3 text-indigo-600" aria-hidden="true" />
          <span>Suggested Inquiries:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              aria-label={`Ask: ${q}`}
              className="text-[11px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-full px-2.5 py-1 transition-colors cursor-pointer text-left truncate max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <label htmlFor="chat-query-input" className="sr-only">
          Ask a question about this document
        </label>
        <div className="relative flex items-center">
          <input
            id="chat-query-input"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isUploadedDoc ? `Ask a question about ${doc?.name || 'this document'}...` : 'Ask a question about this document...'}
            disabled={isTyping}
            aria-label="Ask a question about this document"
            className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => handleSendMessage(inputQuery)}
            disabled={!inputQuery.trim() || isTyping}
            aria-label="Send question"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-indigo-600" aria-hidden="true" /> Answers cite verified contract clauses.
          </span>
          <span className="font-mono">Enter ↵ to send</span>
        </div>
      </div>
    </div>
  );
};
