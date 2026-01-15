import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Search, Home, ChevronLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Popular questions for quick access
  const popularQuestions = [
    "How do I book an appointment?",
    "What payment methods do you accept?",
    "Can I cancel my appointment?",
    "How do I find lawyers near me?"
  ];

  // LegalKonect system features context
  const systemFeatures = {
    booking: {
      keywords: ['book', 'appointment', 'schedule', 'reserve', 'consultation', 'meeting', 'session'],
      response: "📅 **Booking on LegalKonect**\n\nYou can easily book appointments with verified lawyers:\n\n1. Browse our lawyer directory\n2. Select a lawyer and view their schedule\n3. Choose an available time slot\n4. Pay the reservation fee (10% of consultation fee)\n5. Get instant confirmation\n\nWould you like to know more about booking?"
    },
    payment: {
      keywords: ['payment', 'pay', 'fee', 'cost', 'price', 'money', 'gcash', 'card', 'visa', 'mastercard', 'paymaya', 'transaction'],
      response: "💳 **Payment on LegalKonect**\n\nWe accept multiple payment methods:\n\n• Credit/Debit Cards (Visa, Mastercard)\n• GCash\n• PayMaya\n\nReservation System:\n• Pay 10% reservation fee upfront\n• Pay remaining 90% after consultation\n• Secure payment via PayMongo\n\nAll transactions are encrypted and secure!"
    },
    cancellation: {
      keywords: ['cancel', 'refund', 'reschedule', 'change', 'modify', 'postpone', 'move'],
      response: "🔄 **Cancellation & Refund Policy**\n\nLegalKonect offers flexible options:\n\n• **Cancel Before Appointment**: Full refund of reservation fee\n• **Reschedule**: Request new date/time (lawyer approval required)\n• **Refunds**: Processed within 5-7 business days\n\nNote: Lawyers can also cancel/reschedule appointments."
    },
    lawyers: {
      keywords: ['lawyer', 'attorney', 'find', 'search', 'specialization', 'location', 'near', 'practice', 'expert', 'advocate'],
      response: "👨‍⚖️ **Finding Lawyers on LegalKonect**\n\nOur platform helps you find the right lawyer:\n\n• **Search by Specialization**: Family Law, Criminal Law, Corporate, etc.\n• **Filter by Location**: Find lawyers near you\n• **View Profiles**: See experience, ratings, and reviews\n• **Check Availability**: Real-time schedule visibility\n\nAll lawyers are verified and licensed!"
    },
    reviews: {
      keywords: ['review', 'rating', 'feedback', 'testimonial', 'comment', 'experience', 'opinion'],
      response: "⭐ **Reviews & Ratings**\n\nLegalKonect has a transparent review system:\n\n• Leave reviews after completed consultations\n• Rate lawyers on quality and professionalism\n• Read verified client reviews\n• Admin-approved to ensure authenticity\n\nYour feedback helps other clients make informed decisions!"
    },
    account: {
      keywords: ['account', 'profile', 'register', 'signup', 'login', 'password', 'email', 'username'],
      response: "👤 **Your LegalKonect Account**\n\nManage your account easily:\n\n• **Sign Up**: Create account with email or Google\n• **Profile Management**: Update your information anytime\n• **Appointment History**: Track all your consultations\n• **Notifications**: Get updates on appointments\n\nYour account is secure and your data is protected!"
    },
    verification: {
      keywords: ['verify', 'verified', 'license', 'credential', 'authentic', 'legit', 'real', 'fake'],
      response: "✅ **Lawyer Verification**\n\nLegalKonect ensures lawyer authenticity:\n\n• All lawyers are manually verified by our admin team\n• We check license numbers and credentials\n• Only approved lawyers can accept bookings\n• Continuous monitoring for quality assurance\n\nYou can trust that you're connecting with real, licensed lawyers!"
    },
    google: {
      keywords: ['google', 'calendar', 'gmail', 'sync', 'integration'],
      response: "📆 **Google Integration**\n\nLegalKonect integrates with Google services:\n\n• **Google Sign-In**: Quick account creation\n• **Google Calendar Sync**: Lawyers can sync their schedules\n• **Automatic Updates**: Appointments added to calendar\n\nYour Google account is secure and we only access what's needed!"
    }
  };

  // Detect intent from user query
  const detectIntent = (query: string): string | null => {
    const lowerQuery = query.toLowerCase();

    for (const [feature, data] of Object.entries(systemFeatures)) {
      if (data.keywords.some(keyword => lowerQuery.includes(keyword))) {
        return feature;
      }
    }

    return null;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/faqs/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [isOpen, categories.length, fetchCategories]);

  const fetchCategoryFaqs = async (slug: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/faqs/category/${slug}`);
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

      const response = await axios.get(`${API_BASE_URL}/faqs/search`, {
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
          "👋 **Welcome to LegalKonect!**\n\nI'm your virtual assistant, here to help you navigate our platform.\n\nI can assist you with:\n• Booking appointments with lawyers\n• Payment and pricing information\n• Cancellations and refunds\n• Finding the right lawyer for your case\n\nWhat would you like to know?",
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

    // First, try to detect intent for LegalKonect system features
    const intent = detectIntent(textToSend);

    const matchingFAQs = await searchFAQs(textToSend);

    setIsTyping(false);

    if (matchingFAQs.length > 0) {
      // FAQs found - show them with system context
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
    } else if (intent) {
      // No FAQ match but detected system feature intent
      setTimeout(() => {
        const featureResponse = systemFeatures[intent as keyof typeof systemFeatures].response;
        addBotMessage(featureResponse, undefined, undefined, false);

        // Add follow-up suggestions
        setTimeout(() => {
          addBotMessage(
            "Need more help? Try these:",
            undefined,
            ["Browse all FAQs", "Talk to a lawyer", "View pricing"]
          );
        }, 800);
      }, 300);
    } else {
      // No match - provide helpful LegalKonect-specific guidance
      setTimeout(() => {
        addBotMessage(
          "🤔 I'm not sure about that specific question, but I can help you with:\n\n• Booking appointments with lawyers\n• Understanding our payment system\n• Cancellation and refund policies\n• Finding the right lawyer for your case\n• Reviews and ratings\n\nWhat would you like to know more about?",
          undefined,
          ["How to book", "Payment options", "Find a lawyer", "Browse FAQs"]
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
          "📧 **Contact LegalKonect Support**\n\n**Email:** support@legalkonect.com\n**Response Time:** Within 24 hours\n\nOur support team can help with:\n• Account issues\n• Payment concerns\n• Technical problems\n• General inquiries\n\nHow else can I help you?",
          undefined,
          popularQuestions
        );
      }, 500);
    } else if (reply === "Talk to a lawyer") {
      addUserMessage(reply);
      setTimeout(() => {
        addBotMessage(
          "👨‍⚖️ **Connect with a Lawyer**\n\n1. Visit our lawyer directory\n2. Browse by specialization or location\n3. View lawyer profiles and reviews\n4. Book an appointment directly\n\nReady to find the right lawyer for your case?",
          undefined,
          ["Browse lawyers", "How to book", "View specializations"]
        );
      }, 500);
    } else if (reply === "View pricing") {
      addUserMessage(reply);
      setTimeout(() => {
        addBotMessage(
          "💰 **LegalKonect Pricing**\n\n**Reservation Fee:** 10% of consultation fee (paid upfront)\n**Consultation Fee:** Set by each lawyer (view on their profile)\n**Remaining Payment:** 90% due after consultation\n**Platform Fee:** 10% (included in lawyer's rate)\n\nNo hidden charges! All fees are clearly displayed before booking.",
          undefined,
          ["How to book", "Payment methods", "Refund policy"]
        );
      }, 500);
    } else if (reply === "How to book") {
      handleSendMessage("How do I book an appointment?");
    } else if (reply === "Payment options") {
      handleSendMessage("What payment methods do you accept?");
    } else if (reply === "Find a lawyer") {
      handleSendMessage("How do I find lawyers near me?");
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
      await axios.get(`${API_BASE_URL}/faqs/${faq.id}`);
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
          "👋 **LegalKonect Assistant**\n\nAsk me anything about:\n• Booking consultations\n• Payment methods\n• Finding lawyers\n• Your appointments\n\nHow can I help you today?",
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
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center overflow-y-auto">
      <div className="mb-4 sm:mb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-lg flex items-center justify-center">
          <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        How can we help you?
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6" style={{ animation: 'fadeIn 0.7s ease-out' }}>
        Choose an option below to get started
      </p>

      <div className="w-full space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <button
          onClick={goToChat}
          className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-md hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base font-medium transform hover:scale-105 active:scale-95"
          style={{ animation: 'fadeIn 0.8s ease-out' }}
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Ask a Question</span>
        </button>

        <button
          onClick={goToCategories}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base font-medium transform hover:scale-105 active:scale-95"
          style={{ animation: 'fadeIn 0.9s ease-out' }}
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Browse FAQs</span>
        </button>
      </div>

      <div className="w-full bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200" style={{ animation: 'fadeIn 1s ease-out' }}>
        <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Popular Questions</p>
        <div className="space-y-2">
          {popularQuestions.slice(0, 3).map((q, i) => (
            <button
              key={i}
              onClick={() => {
                goToChat();
                setTimeout(() => handleSendMessage(q), 500);
              }}
              className="w-full text-left text-xs sm:text-sm text-gray-700 hover:text-blue-600 bg-white hover:bg-gray-50 p-2 sm:p-3 rounded-md transition-all duration-200 border border-gray-200 transform hover:-translate-y-0.5"
              style={{ animation: `fadeIn 0.3s ease-out ${1.1 + i * 0.1}s both` }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-6 text-xs text-gray-600" style={{ animation: 'fadeIn 1.4s ease-out' }}>
        Or contact us at <span className="text-blue-600 font-medium">support@legalkonect.com</span>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3 bg-white">
        <button
          onClick={goToWelcome}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md p-1.5 sm:p-2 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Browse by Category</h3>
          <p className="text-xs sm:text-sm text-gray-600">Select a topic to explore</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className="w-full bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-600 hover:shadow-md transition-all duration-200 text-left transform hover:-translate-y-1"
            style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                <div className="text-xl sm:text-2xl transition-transform duration-200 group-hover:scale-110">{category.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900">
                    {category.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">{category.description}</p>
                  <span className="inline-block mt-1 sm:mt-2 text-xs text-gray-500">
                    {category.faqs_count} question{category.faqs_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transform rotate-180 transition-transform duration-200 group-hover:translate-x-1 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCategoryFAQs = () => (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-4 flex items-center space-x-3 bg-white">
        <button
          onClick={goToCategories}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md p-2 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-2xl">{selectedCategory?.icon}</div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{selectedCategory?.name}</h3>
          <p className="text-sm text-gray-600">{categoryFaqs.length} questions available</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full space-y-3">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 text-sm">Loading questions...</p>
          </div>
        ) : (
          categoryFaqs.map((faq, index) => (
            <button
              key={faq.id}
              onClick={() => handleFAQClick(faq)}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-md transition-all duration-200 text-left transform hover:-translate-y-1"
              style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-md flex items-center justify-center font-semibold text-xs">
                  Q
                </div>
                <p className="flex-1 font-medium text-gray-900 text-sm">
                  {faq.question}
                </p>
                <ChevronLeft className="flex-shrink-0 w-5 h-5 text-gray-400 transform rotate-180 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 text-white p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3 border-b border-blue-700">
        <button
          onClick={goToWelcome}
          className="text-white hover:bg-blue-700 rounded-md p-1.5 sm:p-2 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-semibold text-sm sm:text-base">FAQ Assistant</h3>
          <p className="text-xs text-blue-100">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className="space-y-2"
            style={{
              animation: message.isBot ? 'slideInLeft 0.3s ease-out' : 'slideInRight 0.3s ease-out'
            }}
          >
            <div
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 text-sm ${
                  message.isBot
                    ? 'bg-white border border-gray-200 text-gray-900'
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

            {/* Feedback buttons */}
            {message.isBot && message.showFeedback && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-white rounded-lg p-2 border border-gray-200 text-sm">
                  <span className="text-xs text-gray-600">Was this helpful?</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleFeedback(message.id, 'up')}
                      className={`p-1.5 rounded-md transition-colors ${
                        message.feedback === 'up'
                          ? 'bg-green-500 text-white'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      disabled={message.feedback !== undefined}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'down')}
                      className={`p-1.5 rounded-md transition-colors ${
                        message.feedback === 'down'
                          ? 'bg-red-500 text-white'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      disabled={message.feedback !== undefined}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick reply buttons */}
            {message.quickReplies && message.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
                    style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.1}s both` }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question..."
            className="flex-1 border border-gray-300 rounded-md px-3 sm:px-4 py-2 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-sm"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading || isTyping}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          aria-label="Open FAQ Chat"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[680px] w-full h-full bg-white sm:rounded-lg shadow-xl flex flex-col z-50 border-0 sm:border sm:border-gray-200 overflow-hidden"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <button
            onClick={closeChat}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5 transition-all duration-200 hover:rotate-90 z-10"
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

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default FAQChatbot;
