import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const { login, isLoggingIn, forgotPassword } = useAuthStore();
  
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
      setForgotError('Could not send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5001/api/auth/google?prompt=select_account';
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-32 right-32 w-8 h-8 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute bottom-32 right-20 w-12 h-12 bg-pink-400 rounded-full opacity-25"></div>
      <div className="absolute bottom-20 left-32 w-6 h-6 bg-green-400 rounded-full opacity-40"></div>
      <div className="absolute top-1/2 left-10 w-4 h-4 bg-red-400 rounded-full opacity-30"></div>
      
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
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-2xl">N</span>
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
        <div className="flex-1 max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-2">
              NETSPHERE
            </h1>
            <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 relative z-10">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-center animate-fade-in flex items-center justify-center gap-2" role="alert">
                <svg className="w-5 h-5 mr-1 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"/>
                </svg>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    name="email" 
                    type="email"
                    value={form.email} 
                    onChange={handleChange} 
                    className={`w-full border rounded-lg px-10 py-3 ${
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
                <label className="block mb-2 font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full border rounded-lg px-10 py-3 pr-12 ${
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
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldError.password && (
                  <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                    ⚠️ {fieldError.password}
                  </div>
                )}
                
                {/* Forgot password link */}
                <div className="text-right mt-2">
                  <button 
                    type="button" 
                    className="text-blue-500 text-sm font-medium transition-colors" 
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                {isLoggingIn ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/signup"
                className="text-blue-500 font-semibold transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative animate-fade-in">
            <button 
              className="absolute top-4 right-4 text-gray-400 text-2xl font-bold transition-colors" 
              onClick={() => { 
                setShowForgot(false); 
                setForgotSent(false); 
                setForgotEmail(''); 
                setForgotError(''); 
              }}
            >
              ×
            </button>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-2 text-center text-gray-800">Reset your password</h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {forgotSent ? (
              <div className="text-center animate-fade-in">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
                <p className="text-green-600 text-center mb-4">
                  If an account exists for this email, you'll receive a reset link shortly.
                </p>
                <button
                  className="text-blue-500 font-medium transition-colors"
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
                  <label className="block mb-2 text-sm font-medium text-gray-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="email" 
                      className="w-full border border-gray-200 rounded-lg px-10 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white" 
                      value={forgotEmail} 
                      onChange={e => setForgotEmail(e.target.value)} 
                      placeholder="Enter your email" 
                      required 
                    />
                  </div>
                  {forgotError && (
                    <div className="text-red-500 text-xs mt-1 animate-fade-in flex items-center gap-1" role="alert">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"/>
                      </svg>
                      {forgotError}
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}