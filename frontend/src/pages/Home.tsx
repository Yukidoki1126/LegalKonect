// src/pages/Home.tsx - Professional design following DESIGN_IMPROVEMENTS.md
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, Search, Calendar, Shield,
  MapPin, ArrowRight, CheckCircle,
  FileText, Clock, Building2, Heart,
  Gavel, UserCheck
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  // Reset page opacity on load for smooth transition
  useEffect(() => {
    document.body.style.opacity = '1';
    document.body.style.transition = '';
  }, []);

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Check if user is admin or super_admin
        if (user.role === 'admin' || user.role === 'super_admin') {
          navigate('/admin', { replace: true });
          return;
        }
        
        // Check if user is a lawyer
        if (user.lawyer) {
          if (user.lawyer.status === 'approved') {
            navigate('/lawyer/dashboard', { replace: true });
          } else if (user.lawyer.status === 'pending') {
            navigate('/pending-approval', { replace: true });
          }
        } else {
          // Regular client user
          navigate('/lawyers', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  const features = [
    {
      icon: Shield,
      title: 'Verified Professionals',
      description: 'All lawyers are carefully verified before joining our platform'
    },
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Schedule consultations at your convenience with instant confirmation'
    },
    {
      icon: Clock,
      title: '24/7 Platform Access',
      description: 'Browse and book lawyers anytime, anywhere'
    },
    {
      icon: CheckCircle,
      title: 'Secure Payments',
      description: 'Your transactions are protected with industry-standard security'
    }
  ];

  const specializations = [
    { name: 'Corporate Law', icon: Building2 },
    { name: 'Criminal Defense', icon: Shield },
    { name: 'Family Law', icon: Heart },
    { name: 'Real Estate', icon: MapPin }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Browse Lawyers',
      description: 'Search by specialization and location',
      icon: Search
    },
    {
      step: '2',
      title: 'Review Profiles',
      description: 'Check credentials and client reviews',
      icon: FileText
    },
    {
      step: '3',
      title: 'Book Appointment',
      description: 'Choose a time that works for you',
      icon: Calendar
    },
    {
      step: '4',
      title: 'Get Legal Help',
      description: 'Meet with your chosen lawyer',
      icon: Gavel
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo - Responsive sizing */}
            <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              {!logoError ? (
                <img 
                  src="/legalkonect.png" 
                  alt="LegalKonect" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                  <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              )}
              <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                LegalKonect
              </span>
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base text-gray-700 hover:text-blue-600 font-medium transition-all hover:bg-blue-50 rounded-lg sm:rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/lawyers')}
                className="px-3 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                Find Lawyers
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-b from-white via-white to-gray-50/50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Startup Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-full mb-8 shadow-sm animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">New Platform - Growing Our Community</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6 animate-fadeIn">
              Connect with<br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Legal Professionals</span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              A simple platform to find and book consultations with verified lawyers.
              We're just getting started, and we'd love for you to join us.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => {
                  document.body.style.opacity = '0';
                  document.body.style.transition = 'opacity 0.3s ease-out';
                  setTimeout(() => navigate('/lawyers'), 300);
                }}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 shadow-button hover:shadow-button-hover flex items-center justify-center gap-2"
              >
                Browse Lawyers
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  document.body.style.opacity = '0';
                  document.body.style.transition = 'opacity 0.3s ease-out';
                  setTimeout(() => navigate('/lawyer/register'), 300);
                }}
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-200 rounded-xl font-semibold hover:border-blue-400 hover:bg-blue-50 transition-all hover:scale-105 shadow-soft hover:shadow-lg"
              >
                Join as Lawyer
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-gray-600 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-soft border border-gray-100">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium">Verified Lawyers</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-soft border border-gray-100">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">Secure Platform</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-soft border border-gray-100">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium">24/7 Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-4">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple & Secure
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're building a platform that makes legal services accessible and transparent
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">Process</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Four simple steps to connect with a lawyer
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
            
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center relative group">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md text-sm font-bold text-blue-600 border-2 border-blue-100">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section id="specializations" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">Expertise</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Legal Specializations
            </h2>
            <p className="text-xl text-gray-600">
              Browse lawyers by their area of expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specializations.map((spec, index) => (
              <button
                key={index}
                onClick={() => navigate('/lawyers', { state: { specialization: spec.name } })}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-card-hover hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 text-left relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <spec.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{spec.name}</h3>
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="text-sm font-semibold">View Lawyers</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-button hover:shadow-button-hover hover:scale-105"
            >
              Browse All Lawyers
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full mb-8 border border-white/30">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-sm font-semibold text-white">Join Our Community</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Whether you need legal help or you're a lawyer looking to join our platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Find a Lawyer
            </button>
            <button
              onClick={() => navigate('/lawyer/register')}
              className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/50 rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              Join as Lawyer
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-12 flex-wrap text-white/90 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Free to Browse</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Secure Platform</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <UserCheck className="w-4 h-4" />
              <span className="font-medium">Verified Lawyers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">LegalKonect</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Connecting clients with legal professionals
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">For Clients</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><button onClick={() => navigate('/lawyers')} className="hover:text-blue-400 transition-colors">Find Lawyers</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-blue-400 transition-colors">Sign Up</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">For Lawyers</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><button onClick={() => navigate('/lawyer/register')} className="hover:text-blue-400 transition-colors">Join Platform</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-blue-400 transition-colors">Lawyer Login</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Platform</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-blue-400 transition-colors">Terms</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-blue-400 transition-colors">Privacy</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800/50 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 LegalKonect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
