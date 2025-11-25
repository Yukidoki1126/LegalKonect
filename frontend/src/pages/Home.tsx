// src/pages/Home.tsx - REDESIGNED
// Professional, minimal design - no heavy gradients, consistent spacing, clean layout
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Scale, Search, Calendar, Shield, Star,
  Users, MapPin, ArrowRight, Sparkles, Award,
  CheckCircle, TrendingUp, Zap, Building2, Heart,
  FileText, Video, Phone, Mail, ChevronRight,
  Briefcase, MessageCircle, Clock, Globe, Lock,
  CreditCard, UserCheck, Gavel, FileCheck, ArrowUpRight,
  Target, Eye, ThumbsUp, BookOpen
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.lawyer) {
          if (user.lawyer.status === 'approved') {
            navigate('/lawyer/dashboard', { replace: true });
          } else if (user.lawyer.status === 'pending') {
            navigate('/pending-approval', { replace: true });
          }
        } else {
          navigate('/lawyers', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const hero = document.getElementById('hero-section');
    if (hero) observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: 500, suffix: '+', label: 'Verified Lawyers', icon: Users },
    { value: 10000, suffix: '+', label: 'Successful Cases', icon: FileCheck },
    { value: 98, suffix: '%', label: 'Client Satisfaction', icon: ThumbsUp },
    { value: 24, suffix: '/7', label: 'Support Available', icon: Clock }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Excellence',
      description: 'Every legal professional undergoes rigorous verification and background checks'
    },
    {
      icon: Target,
      title: 'Precision Matching',
      description: 'AI-powered matching connects you with the perfect legal expert for your case'
    },
    {
      icon: Zap,
      title: 'Instant Access',
      description: 'Connect with lawyers immediately through our streamlined booking platform'
    },
    {
      icon: Lock,
      title: 'Secure & Confidential',
      description: 'End-to-end encryption ensures your legal matters remain completely private'
    }
  ];

  const specializations = [
    {
      name: 'Corporate Law',
      icon: Building2,
      lawyers: '120+ Experts'
    },
    {
      name: 'Criminal Defense',
      icon: Shield,
      lawyers: '85+ Specialists'
    },
    {
      name: 'Family Law',
      icon: Heart,
      lawyers: '95+ Advisors'
    },
    {
      name: 'Real Estate',
      icon: MapPin,
      lawyers: '75+ Professionals'
    }
  ];

  const process = [
    {
      step: '01',
      title: 'Describe Your Case',
      description: 'Tell us about your legal situation in simple terms',
      icon: FileText
    },
    {
      step: '02',
      title: 'Match with Experts',
      description: 'Get matched with verified lawyers specializing in your needs',
      icon: UserCheck
    },
    {
      step: '03',
      title: 'Schedule Consultation',
      description: 'Book a consultation at your convenience',
      icon: Calendar
    },
    {
      step: '04',
      title: 'Resolve with Confidence',
      description: 'Move forward with expert legal guidance',
      icon: Gavel
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Startup Founder',
      content: 'LegalKonect helped us navigate complex incorporation processes with ease. The platform connected us with exactly the right corporate lawyer.',
      rating: 5,
      case: 'Business Incorporation'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Property Investor',
      content: 'Found a real estate attorney who understood my specific needs within minutes. The entire process was seamless and professional.',
      rating: 5,
      case: 'Real Estate Transaction'
    },
    {
      name: 'Emily Watson',
      role: 'Family Matters',
      content: 'During a difficult time, LegalKonect connected me with a compassionate family lawyer who made all the difference.',
      rating: 5,
      case: 'Family Law Consultation'
    }
  ];

  const AnimatedCounter = ({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      let start = 0;
      const end = value;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [value, duration, isVisible]);

    return (
      <span className="font-bold">
        {suffix === '%' ? count : count.toLocaleString()}{suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation - Clean and Professional */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LegalKonect</span>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#specializations" className="text-gray-700 hover:text-blue-600 transition-colors">Specializations</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Success Stories</a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/lawyers')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Find Lawyers
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean and Professional */}
      <section id="hero-section" className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-md border border-blue-100">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Trusted by 10,000+ Clients</span>
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Legal Expertise
                  <span className="text-blue-600 block">
                    Made Accessible
                  </span>
                </h1>

                <p className="text-xl text-gray-600 leading-relaxed">
                  Connect with verified legal professionals who understand your unique needs.
                  Experience seamless consultations, transparent pricing, and results that matter.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/lawyers')}
                  className="group px-8 py-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Find Your Lawyer
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate('/lawyer/register')}
                  className="px-8 py-4 bg-white text-gray-700 rounded-md font-medium border border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  Join as Lawyer
                </button>
              </div>

              {/* Trust Indicators - Simple */}
              <div className="flex flex-wrap gap-6 pt-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-600">Verified Professionals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">24/7 Availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">Secure & Confidential</span>
                </div>
              </div>
            </div>

            {/* Right Content - Professional Card */}
            <div className="relative">
              <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
                {/* Main Card */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Scale className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Corporate Legal Advisory</div>
                      <div className="text-sm text-gray-500">Available Now</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">4.9 (128 reviews)</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">$150/hr</div>
                  </div>
                </div>

                {/* Stats Bar - Clean */}
                <div className="bg-blue-600 rounded-lg p-6 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-sm opacity-90">Case Success Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">24h</div>
                      <div className="text-sm opacity-90">Avg. Response</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">4.9★</div>
                      <div className="text-sm opacity-90">Client Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Clean */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Clean Cards */}
      <section id="features" className="py-20 bg-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why LegalKonect Stands Out
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've reimagined legal services to provide you with an experience that's modern,
              transparent, and truly client-focused.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Clean Process */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple Process, Powerful Results
            </h2>
            <p className="text-xl text-gray-600">
              Your journey to legal resolution in four straightforward steps
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 bg-blue-600 rounded-lg flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-blue-600 mb-2">{step.step}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>

                {/* Connector Line */}
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-3/4 w-full h-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations - Clean Grid */}
      <section id="specializations" className="py-20 bg-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Find Your Legal Expert
            </h2>
            <p className="text-xl text-gray-600">
              Specialized lawyers for every legal need
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specializations.map((spec, index) => (
              <button
                key={index}
                onClick={() => navigate('/lawyers', { state: { specialization: spec.name } })}
                className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-600 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <spec.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{spec.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{spec.lawyers}</p>
                <div className="flex items-center text-blue-600">
                  <span className="text-sm font-medium">Find Experts</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-8 py-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Browse All Specializations
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials - Clean Cards */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Real clients, real results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>

                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500 mb-2">{testimonial.role}</div>
                  <div className="text-xs text-blue-600 font-medium">{testimonial.case}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Simplified */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Find Your Legal Match?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of clients who found the perfect legal representation through LegalKonect
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-10 py-4 bg-white text-blue-600 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Find Your Lawyer Now
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-transparent text-white rounded-md font-medium border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Clean and Simple */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">LegalKonect</span>
              </div>
              <p className="text-gray-400">
                Connecting you with trusted legal professionals for all your legal needs.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Clients</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Find Lawyers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Lawyers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Join Platform</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Guide</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LegalKonect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
