import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const { login, isLoggingIn, forgotPassword } = useAuthStore();
  const [searchParams] = useSearchParams();
  
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Check for error message from URL params (e.g., suspended/banned account)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let errors = {};
    
    if (!validateEmail(form.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    if (!form.password) {
      errors.password = 'Password is required.';
    }
    
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;
    
    try {
      await login(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSent(false);
    
    if (!validateEmail(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      // Check if it's a Google user error
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Google')) {
        setForgotError(err.response.data.message);
      } else {
        setForgotError('Could not send reset email. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://netsphere-901z.onrender.com/api';
    window.location.href = `${API_URL}/auth/google?prompt=select_account`;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Background decorative elements - hidden on mobile */}
      <div className="hidden sm:block absolute top-20 left-20 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="hidden sm:block absolute top-32 right-32 w-8 h-8 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
      <div className="hidden sm:block absolute bottom-32 right-20 w-12 h-12 bg-pink-400 rounded-full opacity-25"></div>
      <div className="hidden sm:block absolute bottom-20 left-32 w-6 h-6 bg-green-400 rounded-full opacity-40"></div>
      <div className="hidden sm:block absolute top-1/2 left-10 w-4 h-4 bg-red-400 rounded-full opacity-30"></div>
      
      <div className="w-full max-w-6xl flex items-center justify-center gap-8 lg:gap-16">
        {/* Left side - Decorative card */}
        <div className="hidden lg:flex flex-1 justify-center">
          <div className="relative">
            {/* Main gradient card */}
            <div className="w-80 h-96 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
              {/* Card decorative elements */}
              <div className="absolute top-4 right-4 bg-red-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                Welcome
              </div>
              <div className="absolute top-6 right-20 w-6 h-6 bg-cyan-300 rounded-full opacity-70"></div>
              <div className="absolute bottom-10 left-6 w-4 h-4 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-20 right-8 w-8 h-8 bg-purple-300 rounded-full opacity-60"></div>
              
              {/* Logo in card */}
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
                <img src="/logo.svg" alt="NETSPHERE" className="w-full h-full" />
              </div>
              
              {/* Card content */}
              <h2 className="text-2xl font-bold mb-2 text-center">Welcome Back!</h2>
              <p className="text-blue-100 text-center text-sm">Your network awaits</p>
            </div>
            
            {/* Floating decorative elements around card */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-green-400 rounded-full opacity-80"></div>
            <div className="absolute -bottom-6 -right-6 w-10 h-10 bg-pink-400 rounded-full opacity-70"></div>
            <div className="absolute top-1/2 -left-8 w-6 h-6 bg-yellow-400 rounded-full opacity-60"></div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-2">
              NETSPHERE
            </h1>
            <p className="text-sm sm:text-base text-gray-600 px-2">Welcome back! Please sign in to your account.</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 p-5 sm:p-8 relative z-10">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 text-center text-xs sm:text-sm animate-fade-in flex items-center justify-center gap-2" role="alert">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"/>
                </svg>
                <span className="break-words">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input 
                    name="email" 
                    type="email"
                    value={form.email} 
                    onChange={handleChange} 
                    className={`w-full border rounded-lg px-9 sm:px-10 py-2.5 sm:py-3 text-sm sm:text-base ${
                      fieldError.email ? 'border-red-400' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 bg-white`} 
                    placeholder="Enter your email" 
                    style={{ color: '#111827' }}
                  />
                </div>
                {fieldError.email && (
                  <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                    ⚠️ {fieldError.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full border rounded-lg px-9 sm:px-10 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base ${
                      fieldError.password ? 'border-red-400' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 bg-white`}
                    placeholder="Enter your password"
                    style={{ color: '#111827' }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                {fieldError.password && (
                  <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                    ⚠️ {fieldError.password}
                  </div>
                )}
                
                {/* Forgot password link */}
                <div className="text-right mt-1.5 sm:mt-2">
                  <button 
                    type="button" 
                    className="text-blue-500 text-xs sm:text-sm font-medium transition-colors hover:text-blue-600" 
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" /> : null}
                {isLoggingIn ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 shadow-sm hover:shadow-md hover:border-gray-300"
              onClick={handleGoogleLogin}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="sm:w-5 sm:h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-4 sm:mt-6">
            <p className="text-sm sm:text-base text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/signup"
                className="text-blue-500 font-semibold transition-colors hover:text-blue-600"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-40 animate-fade-in p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 max-w-sm w-full relative animate-fade-in">
            <button 
              className="absolute top-4 right-4 text-gray-400 text-2xl font-bold transition-colors" 
              onClick={() => { 
                setShowForgot(false); 
                setForgotSent(false); 
                setForgotEmail(''); 
                setForgotError(''); 
              }}
            >
            </button>
            
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
            </div>
            
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-center text-gray-800">Reset your password</h2>
            <p className="text-gray-600 text-center mb-4 sm:mb-6 text-xs sm:text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {forgotSent ? (
              <div className="text-center animate-fade-in">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
                <p className="text-green-600 text-center mb-4 text-xs sm:text-sm">
                  If an account exists for this email, you'll receive a reset link shortly.
                </p>
                <button
                  className="text-blue-500 text-sm sm:text-base font-medium transition-colors hover:text-blue-600"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotSent(false);
                    setForgotEmail('');
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="animate-fade-in">
                <div className="mb-4">
                  <label className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-gray-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input 
                      type="email" 
                      className="w-full border border-gray-200 rounded-lg px-9 sm:px-10 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white" 
                      value={forgotEmail} 
                      onChange={e => setForgotEmail(e.target.value)} 
                      placeholder="Enter your email" 
                      required 
                    />
                  </div>
                  {forgotError && (
                    <div className="text-red-500 text-xs mt-1 animate-fade-in flex items-center gap-1" role="alert">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"/>
                      </svg>
                      {forgotError}
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" /> : null}
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </button>
                
                {/* Back to login button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotEmail('');
                    setForgotError('');
                  }}
                  className="w-full mt-2 sm:mt-3 text-gray-600 py-2 rounded-lg text-sm sm:text-base font-medium hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={forgotLoading}
                >
                  Back to login
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}