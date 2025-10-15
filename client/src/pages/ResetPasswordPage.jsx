import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuthStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Get token from URL parameters
  const token = searchParams.get('token');

  useEffect(() => {
    // Check if token exists
    if (!token) {
      setTokenValid(false);
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!password || password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMessage = err.response?.data?.message || 'Could not reset password. The link may have expired.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If token is invalid, mark it
      if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // If no token or invalid token, show error state
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired. Please request a new one.'}
            </p>
            <div className="space-y-3">
              <Link 
                to="/login" 
                className="block w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Back to Login
              </Link>
              <button
                onClick={() => navigate('/login')}
                className="w-full text-blue-500 text-sm font-medium hover:underline"
              >
                Request new reset link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-32 right-32 w-8 h-8 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute bottom-32 right-20 w-12 h-12 bg-pink-400 rounded-full opacity-25"></div>
      <div className="absolute bottom-20 left-32 w-6 h-6 bg-green-400 rounded-full opacity-40"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative z-10">
        {/* Back to Login link */}
        <div className="mb-4">
          <Link 
            to="/login" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
            Back to Login
          </Link>
        </div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 text-sm">Create a new password for your account</p>
        </div>
        
        {error && !success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 animate-fade-in flex items-start gap-2" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 animate-fade-in" role="alert">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Password reset successfully!</span>
            </div>
            <p className="text-sm ml-7">Redirecting to login page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border rounded-lg px-4 py-3 pr-12 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 bg-white" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter new password (min 10 characters)" 
                    required 
                    minLength={10}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 10 characters long</p>
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full border rounded-lg px-4 py-3 pr-12 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 bg-white" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm new password" 
                    required 
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`h-1 flex-1 rounded ${password.length >= 10 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1 flex-1 rounded ${password.length >= 12 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Password strength: {
                      password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Strong' :
                      password.length >= 10 ? 'Medium' : 'Weak'
                    }
                  </p>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold mt-6 flex items-center justify-center transition-all duration-200 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl" 
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Reset Password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


