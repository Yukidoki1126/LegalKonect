// src/pages/Login.tsx - Professional, minimal design
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAuthService } from '../services/adminApi';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Scale, Eye, EyeOff, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset page opacity on load for smooth transition
  useEffect(() => {
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.5s ease-in';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const redirectPath = await login(email, password);
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken: string, userData: any) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google/login`, {
        id_token: accessToken,
      });

      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        await new Promise(resolve => setTimeout(resolve, 100));

        const redirectPath = response.data.user.lawyer ? '/lawyer/dashboard' : '/lawyers';
        window.location.href = redirectPath;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign-In failed');
      setLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  const handleNavigate = (path: string) => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => navigate(path), 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        {/* Back Button */}
        <button
          onClick={() => handleNavigate('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </button>

        {/* Logo and Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-6">
            <img 
              src="https://pub-c2fcfa54c78d46cfbf87fcdba61cfbfe.r2.dev/system_logo/legalkonect.png" 
              alt="LegalKonect" 
              className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 object-cover"
            />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h2>
          <p className="text-gray-600">
            Or{' '}
            <button
              onClick={() => handleNavigate('/register')}
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              create a new account
            </button>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="ml-3 text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-600">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-600">
          Are you a lawyer?{' '}
          <button
            onClick={() => handleNavigate('/lawyer/register')}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Register as a legal professional
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
