import { useState } from 'react';
import { X, User, Lock, Mail } from 'lucide-react';

// LoginModule component (both login and signup)

function LoginModule({ isOpen, onClose, onLogin }) {
  const [isSignup, setIsSignup] = useState(false); // Toggle between login/signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // Nothing rendered if module is closed
  if (!isOpen) return null;

  // Handles submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password || (isSignup && !username)) {
      setError('Please fill in all fields');
      return;
    }

    // TODO: Replace with actual API call to backend
    // For now, simulates a successful login
    if (isSignup) {
      console.log('Signup attempt:', { username, email, password });
      // Simulate signup success
      onLogin({ username, email });
      resetForm();
      onClose();
    } else {
      console.log('Login attempt:', { email, password });
      // Simulate login success
      onLogin({ username: email.split('@')[0], email });
      resetForm();
      onClose();
    }
  };

  // Reset form fields
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
  };

  // Handle module close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    // Module background
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Module content */}
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Module header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignup ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignup 
              ? 'Sign up to save and track vulnerabilities' 
              : 'Log in to access your saved data'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login/Signup form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username field (only for signup) */}
          {isSignup && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="Choose a username"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="•••••••••"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition-colors font-medium"
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {/* Toggle between login/signup */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </span>
          {' '}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="text-red-700 hover:text-red-800 font-medium"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </div>

        {/* Optional: Skip login */}
        <div className="mt-4 text-center">
          <button
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Continue without logging in
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModule;