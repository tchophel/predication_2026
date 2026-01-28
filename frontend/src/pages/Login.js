import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, Eye, EyeOff, Mail, Send, ArrowRightCircle, Lock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import botIcon from '../assets/images/icons.png';

export const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  
  // Chat functionality states
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  const [messages, setMessages] = useState([
    { type: 'bot', text: `${getTimeBasedGreeting()}! I'm your Chophel AI. How can I assist you? la` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    const pendingPayment = searchParams.get('pending_payment');
    
    if (message === 'registration_success' && pendingPayment === 'true') {
      setSuccessMessage('Registration successful! Please make a payment to activate your account. The admin will send you a confirmation email once payment is verified.');
    }

    // Load saved credentials if remember me was checked
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUsername && savedPassword && savedRememberMe) {
      setFormData({
        username: savedUsername,
        password: savedPassword
      });
      setRememberMe(true);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    
    if (result.success) {
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', formData.username);
        localStorage.setItem('rememberedPassword', formData.password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
      }
      
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    const result = await forgotPassword(forgotEmail);
    
    if (result.success) {
      setForgotSuccess(result.message);
      setForgotEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotSuccess('');
      }, 3000);
    } else {
      setForgotError(result.error);
    }
    
    setForgotLoading(false);
  };

  const getBotResponse = async (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('hy') || lowerQuery.includes('hey')) {
      const greetings = [
        "Hi there! 👋 How can I help you today?",
        "Hello! 😊 What would you like to know?",
        "Hey! Welcome! How can I assist you?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    if (lowerQuery.includes('rule') || lowerQuery.includes('how')) {
      return "Here are the key rules: 1) Register and get approved, 2) Predict scores 5+ minutes before match, 3) One prediction per match, 4) Points: Exact score = 7pts, One score correct = 5pts, Correct winner = 2pts";
    }
    
    if (lowerQuery.includes('score') || lowerQuery.includes('point')) {
      return "Scoring system: Exact score = 7 points, One team score = 5 points, Correct winner = 2 points, Wrong = 0 points. Use 2-Star to double your points!";
    }
    
    if (lowerQuery.includes('star') || lowerQuery.includes('power')) {
      return "2-Star Power-Up: Double your points (14, 10, or 4) when correct. Limited to 2 uses total. Use strategically!";
    }
    
    if (lowerQuery.includes('contact') || lowerQuery.includes('phone') || lowerQuery.includes('number')) {
      return "For support: 📞 +975-17577473 (Mon-Fri, 9 AM-5 PM) or 📧 11104002818@rim.edu.bt";
    }
    
    if (lowerQuery.includes('win')) {
      return "🏆 Winning Tips: Research teams, check recent form, consider home advantage, use 2-Star wisely!";
    }

    return "I can help with: rules, scoring, matches, predictions, leaderboard, and registration!";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessage = { text: inputMessage, type: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const botResponse = await getBotResponse(inputMessage);
      const botMessage = { text: botResponse, type: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { text: 'Sorry, I encountered an error. Please try again.', type: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBotMessage = (text) => {
    return text.split('\n').map((line, index) => (
      <p key={index} className="mb-2">{line}</p>
    ));
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Header with Gradient */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-full shadow-lg">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back!
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in to continue your predictions
            </p>
          </div>

          {/* Login Card with Gradient Border */}
          <div className="relative">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-sm opacity-50"></div>
            
            <div className="relative bg-white rounded-2xl shadow-xl p-8">
              {error && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-start">
                  <div className="flex-shrink-0 mr-2">❌</div>
                  <div>{error}</div>
                </div>
              )}
              
              {successMessage && (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>{successMessage}</div>
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button with Gradient */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal - Modernized */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-sm opacity-50"></div>
            
            <div className="relative bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-full">
                    <Mail className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Reset Your Password
                </h3>
                <p className="text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              
              {forgotError && (
                <div className="mt-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl">
                  {forgotError}
                </div>
              )}
              
              {forgotSuccess && (
                <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>{forgotSuccess}</div>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="mt-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotError('');
                      setForgotSuccess('');
                      setForgotEmail('');
                    }}
                    className="flex-1 flex justify-center py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot - Modernized */}
      <div className={`fixed bottom-4 right-4 z-50 ${isChatOpen ? 'w-[90vw] sm:w-96 h-[80vh] sm:h-[600px]' : 'w-auto h-auto'}`}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <img 
              src={botIcon} 
              alt="Chatbot" 
              className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-white shadow-2xl transform group-hover:scale-110 transition-transform" 
            />
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden border border-gray-200">
            {/* Chat Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center">
                <img src={botIcon} alt="Chatbot" className="h-10 w-10 sm:h-12 sm:w-12 mr-3 rounded-full border-2 border-white" />
                <div>
                  <span className="font-bold text-lg">Chophel AI</span>
                  <div className="flex items-center text-xs text-blue-100">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <ArrowRightCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-gray-50 to-white">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl flex items-start space-x-2 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3' 
                      : 'bg-white border border-gray-200 shadow-sm p-3'
                  }`}>
                    {message.type === 'bot' && (
                      <img src={botIcon} alt="Bot" className="h-6 w-6 rounded-full flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      {message.type === 'bot' ? formatBotMessage(message.text) : message.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 shadow-sm p-3 rounded-2xl">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="border-t p-4 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};