import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Scale, Search, Calendar, Shield, Star,
  Users, MapPin, ArrowRight, Sparkles, Award,
  CheckCircle, TrendingUp, Zap, Building2, Heart,
  FileText, Video, Phone, Mail, ChevronRight,
  Briefcase, MessageCircle, Clock, Globe, Lock,
  CreditCard, UserCheck, Gavel, FileCheck
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({
    stats: false,
    features: false,
    lawyers: false,
    testimonials: false
  });

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);

  // Animated counter hook
  const useAnimatedCounter = (end: number, duration: number, isVisible: boolean) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(progress * end);

        if (progress >= 1) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(current);
        }
      }, 16);

      return () => clearInterval(timer);
    }, [end, duration, isVisible]);

    return count;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Trigger animations on scroll
      const checkVisibility = (elementId: string, key: keyof typeof isVisible) => {
        const element = document.getElementById(elementId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const isInView = rect.top < window.innerHeight * 0.8;
          if (isInView && !isVisible[key]) {
            setIsVisible(prev => ({ ...prev, [key]: true }));
          }
        }
      };

      checkVisibility('stats-section', 'stats');
      checkVisibility('features-section', 'features');
      checkVisibility('lawyers-section', 'lawyers');
      checkVisibility('testimonials-section', 'testimonials');
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible]);

  // Fetch real reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('/reviews');
        setReviews(response.data.reviews);
        setAverageRating(response.data.average_rating);
        setTotalReviews(response.data.total_count);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const stats = [
    { value: 500, suffix: '+', label: 'Verified Lawyers', icon: Users, color: 'from-blue-500 to-purple-500' },
    { value: 10000, suffix: '+', label: 'Consultations', icon: Calendar, color: 'from-purple-500 to-pink-500' },
    { value: 98, suffix: '%', label: 'Success Rate', icon: TrendingUp, color: 'from-pink-500 to-rose-500' },
    { value: 4.9, suffix: '', label: 'Client Rating', icon: Star, color: 'from-orange-500 to-red-500' }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Professionals',
      description: 'Every lawyer is thoroughly vetted with credentials and background checks',
      color: 'from-blue-400 to-purple-400'
    },
    {
      icon: MapPin,
      title: 'Location Based',
      description: 'Find lawyers near you with distance and directions',
      color: 'from-purple-400 to-pink-400'
    },
    {
      icon: Calendar,
      title: 'Instant Booking',
      description: 'Book consultations instantly with availability scheduling',
      color: 'from-pink-400 to-rose-400'
    },
    {
      icon: Award,
      title: 'Top Rated',
      description: 'Access highly-rated lawyers with proven track records',
      color: 'from-rose-400 to-orange-400'
    },
    {
      icon: Briefcase,
      title: 'Case Management',
      description: 'Track your legal cases with integrated management tools',
      color: 'from-orange-400 to-yellow-400'
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your information is protected with end-to-end encryption',
      color: 'from-teal-400 to-cyan-400'
    }
  ];

  const specializations = [
    { name: 'Corporate Law', icon: Building2, count: '120+ lawyers' },
    { name: 'Criminal Defense', icon: Shield, count: '85+ lawyers' },
    { name: 'Family Law', icon: Heart, count: '95+ lawyers' },
    { name: 'Real Estate', icon: MapPin, count: '75+ lawyers' }
  ];

  const testimonials = [
    {
      name: 'Maria Santos',
      role: 'Business Owner',
      content: 'LegalKonect connected me with an exceptional corporate lawyer. The platform is intuitive and the quality of lawyers is outstanding.',
      rating: 5,
      image: '👩‍💼'
    },
    {
      name: 'Juan Dela Cruz',
      role: 'Real Estate Investor',
      content: 'Found the perfect property lawyer within minutes. Professional service and seamless booking process.',
      rating: 5,
      image: '👨‍💼'
    },
    {
      name: 'Anna Reyes',
      role: 'Entrepreneur',
      content: 'The payment system is secure and the lawyers are top-notch. Highly recommend for anyone seeking legal consultation.',
      rating: 5,
      image: '👩‍💻'
    }
  ];

  const processSteps = [
    { icon: Search, title: 'Search', description: 'Find lawyers by specialization' },
    { icon: UserCheck, title: 'Verify', description: 'Check credentials & reviews' },
    { icon: Calendar, title: 'Book', description: 'Schedule your consultation' },
    { icon: Gavel, title: 'Connect', description: 'Get expert legal guidance' }
  ];

  const AnimatedCounter = ({ value, suffix }: { value: number; suffix: string }) => {
    const count = useAnimatedCounter(value, 2000, isVisible.stats);
    return (
      <span>
        {suffix === '' ? count.toFixed(1) : count.toLocaleString()}{suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-screen py-16 lg:py-20 flex items-center"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #60a5fa 50%, #93c5fd 75%, #dbeafe 100%)',
        }}>

        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
        </div>

        {/* Glass Morphism Card Container */}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full z-10">
          <div className="glass-card rounded-3xl p-8 lg:p-12 backdrop-blur-xl">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left Content */}
              <div className="space-y-7">
                <div className="space-y-5">
                  <div className="mb-5">
                    <img src="/logo.png" alt="LegalKonect" className="h-16 lg:h-18 mb-4" />
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Boost Your
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 block">
                      Legal Journey
                    </span>
                    Faster
                  </h1>

                  <p className="text-lg lg:text-xl text-gray-700 leading-relaxed">
                    Connect with verified legal professionals instantly.
                    Experience seamless consultations with top-rated lawyers
                    in your area. Your legal solution is just one click away.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/lawyers')}
                    className="group px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => navigate('/lawyer/register')}
                    className="px-7 py-3.5 bg-white/30 backdrop-blur text-gray-900 rounded-full font-semibold border-2 border-white/50 hover:bg-white/40 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Join as Lawyer
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-7 pt-7 border-t border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">100%</div>
                      <div className="text-sm text-gray-700">Verified</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">24/7</div>
                      <div className="text-sm text-gray-700">Available</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">PH</div>
                      <div className="text-sm text-gray-700">Coverage</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Content - 3D Illustration */}
              <div className="relative lg:block hidden">
                <div className="relative animate-float">
                  {/* Main Rocket Illustration */}
                  <div className="rocket-container">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                      {/* Rocket Body */}
                      <defs>
                        <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f093fb" />
                          <stop offset="100%" stopColor="#f5576c" />
                        </linearGradient>
                        <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#667eea" />
                          <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                      </defs>
                      
                      {/* Clouds */}
                      <ellipse cx="100" cy="320" rx="60" ry="20" fill="white" opacity="0.8" />
                      <ellipse cx="300" cy="340" rx="70" ry="25" fill="white" opacity="0.6" />
                      <ellipse cx="200" cy="360" rx="80" ry="30" fill="white" opacity="0.7" />
                      
                      {/* Rocket */}
                      <g transform="translate(200, 180) rotate(-45 0 0)">
                        {/* Body */}
                        <rect x="-40" y="-80" width="80" height="120" rx="40" fill="url(#rocketGradient)" />
                        {/* Top */}
                        <path d="M -40 -80 Q 0 -120 40 -80" fill="url(#rocketGradient)" />
                        {/* Window */}
                        <circle cx="0" cy="-20" r="20" fill="url(#windowGradient)" />
                        <circle cx="0" cy="-20" r="15" fill="white" opacity="0.3" />
                        {/* Fins */}
                        <path d="M -40 20 L -60 60 L -40 40 Z" fill="#f5576c" />
                        <path d="M 40 20 L 60 60 L 40 40 Z" fill="#f5576c" />
                        {/* Flame */}
                        <ellipse cx="0" cy="60" rx="25" ry="40" fill="#ffeaa7" opacity="0.8" className="animate-pulse" />
                        <ellipse cx="0" cy="60" rx="15" ry="30" fill="#fdcb6e" opacity="0.9" className="animate-pulse" />
                      </g>
                      
                      {/* Person riding */}
                      <g transform="translate(160, 140)">
                        <circle cx="0" cy="0" r="15" fill="#2d3436" />
                        <rect x="-15" y="10" width="30" height="35" rx="5" fill="#ff6348" />
                        <rect x="-20" y="15" width="8" height="20" rx="3" fill="#ff6348" />
                        <rect x="12" y="15" width="8" height="20" rx="3" fill="#ff6348" />
                      </g>
                      
                      {/* Stars */}
                      <circle cx="50" cy="50" r="2" fill="white" className="animate-twinkle" />
                      <circle cx="350" cy="80" r="2" fill="white" className="animate-twinkle" style={{ animationDelay: '0.5s' }} />
                      <circle cx="320" cy="150" r="2" fill="white" className="animate-twinkle" style={{ animationDelay: '1s' }} />
                      <circle cx="80" cy="180" r="2" fill="white" className="animate-twinkle" style={{ animationDelay: '1.5s' }} />
                    </svg>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '1s' }} />

                  {/* Legal Icons Floating */}
                  <div className="absolute top-8 right-8 p-3 bg-white/80 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.3s' }}>
                    <Scale className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="absolute bottom-20 left-8 p-3 bg-white/80 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.6s' }}>
                    <Gavel className="w-6 h-6 text-blue-500" />
                  </div>

                  <div className="absolute top-1/2 -right-4 p-3 bg-white/80 rounded-xl shadow-lg animate-float" style={{ animationDelay: '0.9s' }}>
                    <FileCheck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features-section" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose LegalKonect
            </h2>
            <p className="text-xl text-gray-600">
              Modern solutions for your legal needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                style={{
                  animation: isVisible.features ? `fadeInUp 0.6s ease-out ${index * 0.1}s both` : 'none'
                }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Your legal journey in 4 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center group">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-4 border-blue-600 flex items-center justify-center text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>

                {/* Connector */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400 opacity-30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section id="lawyers-section" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Legal Specializations
            </h2>
            <p className="text-xl text-gray-600">
              Find experts in every area of law
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specializations.map((spec, index) => (
              <button
                key={index}
                onClick={() => navigate('/lawyers', { state: { specialization: spec.name } })}
                className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-left"
                style={{
                  animation: isVisible.lawyers ? `fadeInUp 0.6s ease-out ${index * 0.1}s both` : 'none'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                    <spec.icon className="w-7 h-7 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-2 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{spec.name}</h3>
                <p className="text-sm text-gray-500">{spec.count}</p>
              </button>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              View All Lawyers
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Client Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Real experiences from real people
            </p>
          </div>
          
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white rounded-3xl p-10 shadow-xl">
                      <div className="flex justify-center mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      
                      <p className="text-xl text-gray-700 mb-8 text-center italic">
                        "{testimonial.content}"
                      </p>
                      
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-3xl">
                          {testimonial.image}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-sm text-gray-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeTestimonial === index
                      ? 'w-8 bg-gradient-to-r from-blue-600 to-blue-400'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands who found their perfect legal match
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-10 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Find a Lawyer
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-transparent text-white rounded-full font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Add Custom Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          mix-blend-mode: multiply;
          animation: blob 7s infinite;
          pointer-events: none;
        }
        
        .blob-1 {
          top: 10%;
          left: 10%;
          width: 300px;
          height: 300px;
          background: rgba(102, 126, 234, 0.3);
        }
        
        .blob-2 {
          top: 50%;
          right: 20%;
          width: 250px;
          height: 250px;
          background: rgba(240, 147, 251, 0.3);
          animation-delay: 2s;
        }
        
        .blob-3 {
          bottom: 20%;
          left: 30%;
          width: 200px;
          height: 200px;
          background: rgba(255, 234, 167, 0.3);
          animation-delay: 4s;
        }
        
        .blob-4 {
          bottom: 10%;
          right: 10%;
          width: 280px;
          height: 280px;
          background: rgba(223, 230, 233, 0.3);
          animation-delay: 6s;
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(30px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 30px) scale(0.9);
          }
          75% {
            transform: translate(50px, 20px) scale(1.05);
          }
        }
        
        .rocket-container {
          width: 100%;
          max-width: 360px;
          height: 360px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}