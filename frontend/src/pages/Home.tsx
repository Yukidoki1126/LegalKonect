// src/pages/Home.tsx - Professional design following DESIGN_IMPROVEMENTS.md
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, Search, Calendar, Shield,
  MapPin, ArrowRight, CheckCircle,
  FileText, Clock, Building2, Heart,
  Gavel, UserCheck
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  // Reset page opacity on load for smooth transition
  useEffect(() => {
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.5s ease-in';
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LegalKonect</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  document.body.style.opacity = '0';
                  document.body.style.transition = 'opacity 0.3s ease-out';
                  setTimeout(() => navigate('/login'), 300);
                }}
                className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-all hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  document.body.style.opacity = '0';
                  document.body.style.transition = 'opacity 0.3s ease-out';
                  setTimeout(() => navigate('/lawyers'), 300);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-all hover:scale-105"
              >
                Find Lawyers
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Startup Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-600">New Platform - Growing Our Community</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Connect with<br />
              <span className="text-blue-600">Legal Professionals</span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-700 mb-12 leading-relaxed">
              A simple platform to find and book consultations with verified lawyers.
              We're just getting started, and we'd love for you to join us.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => {
                  document.body.style.opacity = '0';
                  document.body.style.transition = 'opacity 0.3s ease-out';
                  setTimeout(() => navigate('/lawyers'), 300);
                }}
                className="group px-8 py-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-all hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
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
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-md font-semibold hover:bg-blue-50 transition-all hover:scale-105 hover:shadow-lg"
              >
                Join as Lawyer
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Verified Lawyers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Secure Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>24/7 Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple & Secure
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              We're building a platform that makes legal services accessible and transparent
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-700">
              Four simple steps to connect with a lawyer
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-bold text-blue-600 mb-2">STEP {step.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section id="specializations" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Legal Specializations
            </h2>
            <p className="text-xl text-gray-700">
              Browse lawyers by their area of expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specializations.map((spec, index) => (
              <button
                key={index}
                onClick={() => navigate('/lawyers', { state: { specialization: spec.name } })}
                className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <spec.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{spec.name}</h3>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm font-medium">View Lawyers</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-8 py-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Browse All Lawyers
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full mb-6">
            <span className="text-sm font-semibold text-white">Join Our Community</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white opacity-90 mb-12">
            Whether you need legal help or you're a lawyer looking to join our platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/lawyers')}
              className="px-10 py-4 bg-white text-blue-600 rounded-md font-bold hover:bg-gray-50 transition-colors"
            >
              Find a Lawyer
            </button>
            <button
              onClick={() => navigate('/lawyer/register')}
              className="px-10 py-4 bg-transparent text-white border-2 border-white rounded-md font-bold hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Join as Lawyer
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap text-white opacity-80 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Free to Browse</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Verified Lawyers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">LegalKonect</span>
              </div>
              <p className="text-sm text-gray-400">
                Connecting clients with legal professionals
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Clients</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/lawyers')} className="hover:text-white transition-colors">Find Lawyers</button></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Sign Up</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Lawyers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/lawyer/register')} className="hover:text-white transition-colors">Join Platform</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Lawyer Login</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 LegalKonect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
