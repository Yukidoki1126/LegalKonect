import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Search, Home, ChevronLeft, Loader, ThumbsUp, ThumbsDown, Sparkles, Clock } from 'lucide-react';
import axios from 'axios';

interface FAQ {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  type: string;
  order: number;
  views: number;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  };
}

interface FAQCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  faqs_count: number;
}

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  faqId?: number;
  quickReplies?: string[];
  showFeedback?: boolean;
  feedback?: 'up' | 'down' | null;
}

type ViewMode = 'welcome' | 'categories' | 'chat' | 'category-faqs';

const FAQChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
  const [messageIdCounter, setMessageIdCounter] = useState(1);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [categoryFaqs, setCategoryFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Popular questions for quick access
  const popularQuestions = [
    "How do I book an appointment?",
    "What payment methods do you accept?",
    "Can I cancel my appointment?",
    "How do I find lawyers near me?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/faqs/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCategoryFaqs = async (slug: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/faqs/category/${slug}`);
      setCategoryFaqs(response.data.faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFAQs = async (query: string) => {
    try {
      // Clean up the query - remove question marks and extra spaces
      const cleanQuery = query.replace(/\?/g, '').trim();

      const response = await axios.get('http://localhost:8000/api/faqs/search', {
        params: { q: cleanQuery }
      });

      console.log('Search query:', cleanQuery);
      console.log('Search results:', response.data);

      return response.data;
    } catch (error) {
      console.error('Error searching FAQs:', error);
      return [];
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setTimeout(() => {
        addBotMessage(
          "👋 Hi there! I'm your LegalKonect Assistant. I'm here to help answer your questions about our platform.",
          undefined,
          popularQuestions
        );
      }, 300);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const addBotMessage = (text: string, faqId?: number, quickReplies?: string[], showFeedback?: boolean) => {
    const newMessage: ChatMessage = {
      id: messageIdCounter,
      text,
      isBot: true,
      timestamp: new Date(),
      faqId,
      quickReplies,
      showFeedback
    };
    setMessages(prev => [...prev, newMessage]);
    setMessageIdCounter(prev => prev + 1);
  };

  const addUserMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: messageIdCounter,
      text,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setMessageIdCounter(prev => prev + 1);
  };

  const handleFeedback = async (messageId: number, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, feedback } : msg
    ));

    if (feedback === 'down') {
      setTimeout(() => {
        addBotMessage(
          "I'm sorry that wasn't helpful. Would you like to:\n\n• Try rephrasing your question\n• Browse FAQs by category\n• Contact our support team",
          undefined,
          ["Rephrase question", "Browse FAQs", "Contact support"]
        );
      }, 500);
    } else {
      setTimeout(() => {
        addBotMessage(
          "Great! I'm glad I could help! 😊\n\nIs there anything else you'd like to know?",
          undefined,
          popularQuestions
        );
      }, 500);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim()) return;

    addUserMessage(textToSend);
    setInputText('');
    setIsTyping(true);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 800));

    const matchingFAQs = await searchFAQs(textToSend);

    setIsTyping(false);

    if (matchingFAQs.length > 0) {
      setTimeout(() => {
        matchingFAQs.slice(0, 3).forEach((faq: FAQ, index: number) => {
          setTimeout(() => {
            const formattedAnswer = `**${faq.question}**\n\n${faq.answer}`;
            addBotMessage(formattedAnswer, faq.id, undefined, true);
          }, index * 600);
        });

        // Generate related questions
        const relatedQuestions = matchingFAQs
          .slice(3, 6)
          .map((faq: FAQ) => faq.question);

        if (relatedQuestions.length > 0) {
          setTimeout(() => {
            addBotMessage(
              "You might also be interested in:",
              undefined,
              relatedQuestions
            );
          }, Math.min(matchingFAQs.length, 3) * 600);
        }
      }, 300);
    } else {
      setTimeout(() => {
        addBotMessage(
          "🤔 I couldn't find a specific answer to that question.\n\nHere's what you can do:",
          undefined,
          ["Browse all FAQs", "Talk to support", "Try different keywords"]
        );
      }, 300);
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply === "Browse FAQs" || reply === "Browse all FAQs") {
      goToCategories();
    } else if (reply === "Contact support" || reply === "Talk to support") {
      addUserMessage(reply);
      setTimeout(() => {
        addBotMessage(
          "📧 You can reach our support team at:\n\n**Email:** support@legalkonect.com\n\nWe typically respond within 24 hours. How else can I help you?",
          undefined,
          popularQuestions
        );
      }, 500);
    } else {
      handleSendMessage(reply);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCategoryClick = async (category: FAQCategory) => {
    setSelectedCategory(category);
    setViewMode('category-faqs');
    await fetchCategoryFaqs(category.slug);
  };

  const handleFAQClick = async (faq: FAQ) => {
    setViewMode('chat');
    addUserMessage(faq.question);

    try {
      await axios.get(`http://localhost:8000/api/faqs/${faq.id}`);
    } catch (error) {
      console.error('Error tracking FAQ view:', error);
    }

    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsTyping(false);

    setTimeout(() => {
      addBotMessage(`**${faq.question}**\n\n${faq.answer}`, faq.id, undefined, true);

      setTimeout(() => {
        addBotMessage(
          "Is there anything else you'd like to know?",
          undefined,
          popularQuestions
        );
      }, 800);
    }, 200);
  };

  const goToWelcome = () => {
    setViewMode('welcome');
    setSelectedCategory(null);
  };

  const goToCategories = () => {
    setViewMode('categories');
  };

  const goToChat = () => {
    setViewMode('chat');
    if (messages.length === 0) {
      setTimeout(() => {
        addBotMessage(
          "👋 Hi there! I'm your LegalKonect Assistant. What would you like to know?",
          undefined,
          popularQuestions
        );
      }, 300);
    }
  };

  const formatMessageText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-semibold text-gray-900">{part}</strong>;
      }
      return part.split('\n').map((line, i) => (
        <React.Fragment key={`${index}-${i}`}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-[fadeIn_0.4s_ease-out]">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
          <MessageCircle className="w-12 h-12 text-white animate-[bounce_2s_ease-in-out_infinite]" />
        </div>
      </div>

      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
        How can we help you?
      </h3>
      <p className="text-gray-600 mb-8 text-lg">
        Choose an option below to get started
      </p>

      <div className="w-full space-y-3 mb-8">
        <button
          onClick={goToChat}
          className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-2xl flex items-center justify-center space-x-3 font-semibold transform hover:scale-[1.02] hover:-translate-y-0.5"
        >
          <Search className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="text-lg">Ask a Question</span>
        </button>

        <button
          onClick={goToCategories}
          className="group w-full bg-white border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-2xl hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center space-x-3 font-semibold hover:shadow-lg transform hover:scale-[1.02]"
        >
          <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-lg">Browse FAQs</span>
        </button>
      </div>

      <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-bold text-gray-700">Popular Questions</p>
        </div>
        <div className="space-y-2">
          {popularQuestions.slice(0, 3).map((q, i) => (
            <button
              key={i}
              onClick={() => {
                goToChat();
                setTimeout(() => handleSendMessage(q), 500);
              }}
              className="w-full text-left text-sm text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 p-3 rounded-xl transition-all border border-transparent hover:border-blue-200 hover:shadow-md font-medium"
            >
              <span className="mr-2">💬</span>
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Or contact us at <span className="text-blue-600 font-semibold">support@legalkonect.com</span>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
      <div className="border-b-2 border-gray-100 p-5 flex items-center space-x-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <button
          onClick={goToWelcome}
          className="text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl p-2.5 transition-all shadow-sm hover:shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Browse by Category</h3>
          <p className="text-xs text-gray-600 mt-0.5">Select a topic to explore</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            style={{ animationDelay: `${index * 50}ms` }}
            className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-xl transition-all text-left group animate-[slideUp_0.4s_ease-out] hover:-translate-y-1"
          >
            <div className="flex items-start space-x-4">
              <div className="text-4xl group-hover:scale-110 transition-transform bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl group-hover:shadow-lg">
                {category.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                  {category.name}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
                <div className="flex items-center space-x-2 mt-3">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-bold shadow-sm">
                    {category.faqs_count} question{category.faqs_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform rotate-180 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCategoryFAQs = () => (
    <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
      <div className="border-b-2 border-gray-100 p-5 flex items-center space-x-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <button
          onClick={goToCategories}
          className="text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl p-2.5 transition-all shadow-sm hover:shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-3xl bg-white p-2 rounded-xl shadow-sm">{selectedCategory?.icon}</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{selectedCategory?.name}</h3>
          <p className="text-xs text-gray-600 mt-0.5">{categoryFaqs.length} questions available</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-600 font-medium">Loading questions...</p>
          </div>
        ) : (
          categoryFaqs.map((faq, index) => (
            <button
              key={faq.id}
              onClick={() => handleFAQClick(faq)}
              style={{ animationDelay: `${index * 50}ms` }}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-xl transition-all text-left group animate-[slideUp_0.4s_ease-out] hover:-translate-y-1"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                  Q
                </div>
                <p className="flex-1 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-relaxed">
                  {faq.question}
                </p>
                <ChevronLeft className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-blue-600 transform rotate-180 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <button
            onClick={goToWelcome}
            className="text-white hover:bg-white/20 rounded-xl p-2 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">FAQ Assistant</h3>
              <p className="text-xs text-blue-100 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg"></span>
                Online • Ready to help
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 via-blue-50/20 to-white">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
            <div
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                  message.isBot
                    ? 'bg-white border border-gray-200 text-gray-800'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {formatMessageText(message.text)}
                </div>
                <div
                  className={`text-xs mt-2 flex items-center ${
                    message.isBot ? 'text-gray-500' : 'text-blue-100'
                  }`}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* Feedback buttons */}
            {message.isBot && message.showFeedback && (
              <div className="flex justify-start ml-2 animate-[slideUp_0.3s_ease-out]">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 border border-gray-200 shadow-md">
                  <span className="text-xs text-gray-700 font-medium">Was this helpful?</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFeedback(message.id, 'up')}
                      className={`p-2 rounded-lg transition-all shadow-sm ${
                        message.feedback === 'up'
                          ? 'bg-green-500 text-white shadow-green-200'
                          : 'hover:bg-green-50 text-gray-400 hover:text-green-600 hover:shadow-md'
                      }`}
                      disabled={message.feedback !== undefined}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'down')}
                      className={`p-2 rounded-lg transition-all shadow-sm ${
                        message.feedback === 'down'
                          ? 'bg-red-500 text-white shadow-red-200'
                          : 'hover:bg-red-50 text-gray-400 hover:text-red-600 hover:shadow-md'
                      }`}
                      disabled={message.feedback !== undefined}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick reply buttons */}
            {message.quickReplies && message.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-2 animate-[slideUp_0.4s_ease-out]">
                {message.quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(reply)}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    className="px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-700 rounded-xl text-sm font-semibold hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 animate-[slideUp_0.3s_ease-out]"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-gradient-to-r from-white to-blue-50 border border-gray-200 rounded-2xl p-4 shadow-lg">
              <div className="flex space-x-2 items-center">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t-2 border-gray-100 p-5 bg-gradient-to-t from-gray-50 to-white">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question here..."
            className="flex-1 border-2 border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm shadow-sm"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading || isTyping}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center space-x-2">
          <span>Press</span>
          <kbd className="px-2.5 py-1 bg-white border-2 border-gray-300 rounded-lg shadow-sm font-mono font-bold text-gray-700">Enter</kbd>
          <span>to send</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <button
            onClick={toggleChat}
            className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-full shadow-2xl hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-110 transform"
            aria-label="Open FAQ Chat"
          >
            <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
              Need help? Ask us anything!
              <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[440px] h-[680px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-[slideIn_0.3s_ease-out] overflow-hidden">
          <button
            onClick={closeChat}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2 transition-all z-10 shadow-sm hover:shadow-md"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>

          {viewMode === 'welcome' && renderWelcome()}
          {viewMode === 'categories' && renderCategories()}
          {viewMode === 'category-faqs' && renderCategoryFAQs()}
          {viewMode === 'chat' && renderChat()}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default FAQChatbot;
