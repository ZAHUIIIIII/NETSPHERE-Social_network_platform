import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, User, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = [
  'Username',
  'Birthday',
  'Gender', 
  'Email',
  'Verification',
  'Password',
];

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 10;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { registerInitiate, registerVerify, isSigningUp } = useAuthStore();
  
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    username: '',
    birthday: '',
    gender: '',
    email: '',
    verificationCode: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [fieldError, setFieldError] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const nextStep = async () => {
    setError('');
    let errors = {};
    
    if (step === 0) {
      if (!form.username.trim()) {
        errors.username = 'Username is required.';
      } else if (form.username.length < 3) {
        errors.username = 'Username must be at least 3 characters.';
      } else if (/\s/.test(form.username)) {
        errors.username = 'Username cannot contain spaces.';
      }
    }
    
    if (step === 1 && !form.birthday) {
      errors.birthday = 'Birthday is required.';
    }
    
    if (step === 2 && !form.gender) {
      errors.gender = 'Please select your gender.';
    }
    
    if (step === 3 && !validateEmail(form.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;
    
    if (step === 3) {
      setLoading(true);
      try {
        await registerInitiate({
          username: form.username,
          birthday: form.birthday,
          gender: form.gender,
          email: form.email,
        });
        setStep(step + 1);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not send verification code. Please check your information and try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Only send email and code for verification, no password
      await registerVerify({
        email: form.email,
        code: form.verificationCode,
      });
      setEmailVerified(true);
      setStep(step + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    let errors = {};
    if (!validatePassword(form.password)) {
      errors.password = 'Password must be at least 10 characters.';
    }
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;
    
    setLoading(true);
    try {
      await registerVerify({
        email: form.email,
        code: form.verificationCode,
        password: form.password,
      });
      setSuccess(true);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength function
  function getPasswordStrength(password) {
    if (!password) return '';
    let score = 0;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Medium';
    return 'Strong';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-32 right-32 w-8 h-8 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute bottom-32 right-20 w-12 h-12 bg-pink-400 rounded-full opacity-25"></div>
      <div className="absolute bottom-20 left-32 w-6 h-6 bg-green-400 rounded-full opacity-40"></div>
      <div className="absolute top-1/2 left-10 w-4 h-4 bg-red-400 rounded-full opacity-30"></div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 relative z-10">
        <div className="mb-6">
          <div className="flex justify-between mb-4">
            {steps.map((label, idx) => (
              <div 
                key={label} 
                className={`flex-1 text-center text-xs ${
                  idx === step 
                    ? 'font-bold text-blue-600 bg-blue-100 py-1 px-2 rounded-md' 
                    : idx < step 
                    ? 'text-blue-500 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-center animate-fade-in flex items-center justify-center gap-2" role="alert">
            <svg className="w-5 h-5 mr-1 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-center animate-fade-in flex items-center justify-center gap-2" role="alert">
            <svg className="w-5 h-5 mr-1 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7"/>
            </svg>
            Account created successfully! Redirecting you...
          </div>
        )}

        {/* Step 0: Username */}
        {step === 0 && (
          <div>
            <label className="block mb-2 font-medium text-gray-700">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                name="username" 
                value={form.username} 
                onChange={handleChange} 
                className={`w-full border rounded-lg px-10 py-3 ${
                  fieldError.username ? 'border-red-400' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900`} 
                placeholder="Choose a username" 
              />
            </div>
            {fieldError.username && (
              <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                ⚠️ {fieldError.username}
              </div>
            )}
            <button 
              className="mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={nextStep} 
              disabled={!form.username || loading}
            >
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
              {loading ? 'Loading...' : 'Next'}
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full block text-center py-3 border border-gray-200 rounded-lg text-gray-700 font-medium"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Step 1: Birthday */}
        {step === 1 && (
          <div>
            <label className="block mb-2 font-medium text-gray-700">Birthday</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                name="birthday" 
                type="date" 
                value={form.birthday} 
                onChange={handleChange} 
                className={`w-full border rounded-lg px-10 py-3 ${
                  fieldError.birthday ? 'border-red-400' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900`} 
              />
            </div>
            {fieldError.birthday && (
              <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                ⚠️ {fieldError.birthday}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors" 
                onClick={prevStep} 
                disabled={loading}
              >
                Back
              </button>
              <button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={nextStep} 
                disabled={!form.birthday || loading}
              >
                {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                {loading ? 'Loading...' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <div>
            <label className="block mb-2 font-medium text-gray-700">Gender</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select 
                name="gender" 
                value={form.gender} 
                onChange={handleChange} 
                className={`w-full border rounded-lg px-10 py-3 ${
                  fieldError.gender ? 'border-red-400' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {fieldError.gender && (
              <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                ⚠️ {fieldError.gender}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors" 
                onClick={prevStep} 
                disabled={loading}
              >
                Back
              </button>
              <button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={nextStep} 
                disabled={!form.gender || loading}
              >
                {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                {loading ? 'Loading...' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Email */}
        {step === 3 && (
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
                } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400`} 
                placeholder="Enter your email" 
                style={{ color: '#111827' }}
              />
            </div>
            {fieldError.email && (
              <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                ⚠️ {fieldError.email}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors" 
                onClick={prevStep} 
                disabled={loading}
              >
                Back
              </button>
              <button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={nextStep} 
                disabled={!form.email || loading}
              >
                {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                {loading ? 'Sending Code...' : 'Send Code'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Verification */}
        {step === 4 && !emailVerified && (
          <form onSubmit={handleVerify}>
            <label className="block mb-2 font-medium text-gray-700">Verification Code</label>
            <input
              name="verificationCode"
              value={form.verificationCode}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 text-center text-lg tracking-wider"
              placeholder="Enter 6-digit code"
              maxLength="6"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">
              We sent a verification code to <strong>{form.email}</strong>
            </p>
            <div className="flex justify-between mt-6">
              <button 
                type="button" 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors" 
                onClick={prevStep} 
                disabled={loading}
              >
                Back
              </button>
              <button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={!form.verificationCode || loading}
              >
                {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>
        )}

        {/* Step 5: Password */}
        {step === 5 && (
          <form onSubmit={handleSetPassword}>
            <label className="block mb-2 font-medium text-gray-700">Create Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 pr-12 ${
                  fieldError.password ? 'border-red-400' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-gray-900`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {form.password && (
              <div className={`mt-2 text-xs font-semibold ${
                getPasswordStrength(form.password) === 'Weak' ? 'text-red-500' : 
                getPasswordStrength(form.password) === 'Medium' ? 'text-yellow-500' : 'text-green-600'
              }`}>
                Strength: {getPasswordStrength(form.password)}
              </div>
            )}
            
            {fieldError.password && (
              <div className="text-red-500 text-xs mt-1 animate-fade-in" role="alert">
                ⚠️ {fieldError.password}
              </div>
            )}
            
            <div className="mt-6">
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={!form.password || loading}
              >
                {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
