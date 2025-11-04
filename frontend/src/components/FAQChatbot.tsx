import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Search, Home, ChevronLeft, Loader } from 'lucide-react';
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const response = await axios.get('http://localhost:8000/api/faqs/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching FAQs:', error);
      return [];
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      addBotMessage(
        "👋 Hello! I'm here to help answer your questions about LegalKonect. How can I assist you today?"
      );
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const addBotMessage = (text: string, faqId?: number) => {
    const newMessage: ChatMessage = {
      id: messageIdCounter,
      text,
      isBot: true,
      timestamp: new Date(),
      faqId
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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    addUserMessage(inputText);
    setLoading(true);

    const matchingFAQs = await searchFAQs(inputText);

    setLoading(false);

    if (matchingFAQs.length > 0) {
      setTimeout(() => {
        addBotMessage(
          `I found ${matchingFAQs.length} answer${matchingFAQs.length > 1 ? 's' : ''} that might help:`
        );
        
        matchingFAQs.forEach((faq: FAQ, index: number) => {
          setTimeout(() => {
            addBotMessage(`**${faq.question}**\n\n${faq.answer}`, faq.id);
          }, (index + 1) * 500);
        });

        setTimeout(() => {
          addBotMessage("Was this helpful? Feel free to ask another question!");
        }, (matchingFAQs.length + 1) * 500);
      }, 500);
    } else {
      setTimeout(() => {
        addBotMessage(
          "I couldn't find a specific answer to that question. You can:\n\n" +
          "• Browse FAQs by category\n" +
          "• Rephrase your question\n" +
          "• Contact support at support@legalkonect.com"
        );
      }, 500);
    }

    setInputText('');
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

    setTimeout(() => {
      addBotMessage(`**${faq.question}**\n\n${faq.answer}`, faq.id);
      setTimeout(() => {
        addBotMessage("Do you have any other questions?");
      }, 500);
    }, 300);
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
      addBotMessage(
        "👋 Hello! I'm here to help answer your questions about LegalKonect. How can I assist you today?"
      );
    }
  };

  const formatMessageText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
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
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        How can we help you?
      </h3>
      <p className="text-gray-600 mb-6">
        Choose an option below to get started
      </p>
      
      <div className="w-full space-y-3">
        <button
          onClick={goToChat}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Search className="w-5 h-5" />
          <span>Ask a Question</span>
        </button>
        
        <button
          onClick={goToCategories}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Home className="w-5 h-5" />
          <span>Browse FAQs</span>
        </button>
      </div>

      <div className="mt-8 text-xs text-gray-500">
        Or contact us at support@legalkonect.com
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center space-x-3">
        <button
          onClick={goToWelcome}
          className="text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">Browse by Category</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className="w-full bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{category.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{category.name}</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {category.faqs_count} questions
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCategoryFAQs = () => (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center space-x-3">
        <button
          onClick={goToCategories}
          className="text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xl">{selectedCategory?.icon}</span>
        <h3 className="text-lg font-semibold">{selectedCategory?.name}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          categoryFaqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => handleFAQClick(faq)}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-md transition-all text-left"
            >
              <p className="font-medium text-gray-800">{faq.question}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={goToWelcome}
            className="text-white hover:text-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-semibold">FAQ Assistant</h3>
            <p className="text-xs text-blue-100">Ask me anything!</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isBot
                  ? 'bg-white border border-gray-200 text-gray-800'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {formatMessageText(message.text)}
              </div>
              <div
                className={`text-xs mt-1 ${
                  message.isBot ? 'text-gray-500' : 'text-blue-100'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-600"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || loading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50"
          aria-label="Open FAQ Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          <button
            onClick={closeChat}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
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
    </>
  );
};

export default FAQChatbot;