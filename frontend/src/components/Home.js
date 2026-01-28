import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Clock, Users, Target, Shield, Zap, Send, ArrowRightCircle, Award, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from './Navbar';
import botIcon from '../assets/images/icons.png';

export const Home = () => {
  const { user } = useAuth();
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDatabaseInfo = async (query) => {
    const token = localStorage.getItem('authToken');
    const lowerQuery = query.toLowerCase();
    
    try {
      if (lowerQuery.includes('match') || lowerQuery.includes('upcoming') || lowerQuery.includes('game')) {
        const response = await fetch('http://localhost:8000/api/matches/upcoming/', {
          headers: token ? { 'Authorization': `Token ${token}` } : {}
        });
        
        if (response.ok) {
          const matches = await response.json();
          return {
            type: 'matches',
            data: matches.slice(0, 5),
            text: `Found ${matches.length} upcoming matches:`
          };
        }
      }
      
      if (lowerQuery.includes('live') || lowerQuery.includes('playing') || lowerQuery.includes('now')) {
        const response = await fetch('http://localhost:8000/api/matches/live/', {
          headers: token ? { 'Authorization': `Token ${token}` } : {}
        });
        
        if (response.ok) {
          const matches = await response.json();
          return {
            type: 'live_matches',
            data: matches,
            text: `Currently ${matches.length} live matches:`
          };
        }
      }
      
      if (lowerQuery.includes('prediction') || lowerQuery.includes('my') || lowerQuery.includes('stats')) {
        if (token) {
          const response = await fetch('http://localhost:8000/api/predictions/my/', {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (response.ok) {
            const predictions = await response.json();
            const totalPoints = predictions.reduce((sum, p) => sum + (p.points_awarded || 0), 0);
            const correctPredictions = predictions.filter(p => p.points_awarded > 0).length;
            const twoStarUsed = predictions.filter(p => p.used_two_star).length;
            
            return {
              type: 'stats',
              data: { totalPoints, correctPredictions, totalPredictions: predictions.length, twoStarUsed },
              text: `Your prediction stats:`
            };
          }
        }
      }
      
      if (lowerQuery.includes('leaderboard') || lowerQuery.includes('top') || lowerQuery.includes('ranking')) {
        const response = await fetch('http://localhost:8000/api/leaderboard/', {
          headers: token ? { 'Authorization': `Token ${token}` } : {}
        });
        
        if (response.ok) {
          const leaderboard = await response.json();
          return {
            type: 'leaderboard',
            data: leaderboard.slice(0, 5),
            text: `Top 5 users:`
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching database info:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { type: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const dbInfo = await fetchDatabaseInfo(inputMessage);
    
    if (dbInfo) {
      setMessages(prev => [...prev, { type: 'bot', text: dbInfo.text, data: dbInfo }]);
    } else {
      const response = await getBotResponse(inputMessage);
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }
    
    setIsLoading(false);
  };

  const getBotResponse = async (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('hy') || lowerQuery.includes('hey')) {
      const greetings = [
        "Hi there! 👋 How can I help you today?",
        "Hello! 😊 What would you like to know?",
        "Hey! Welcome! How can I assist you?",
        "Hi! Great to see you! What can I help you with?"
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
      return "🏆 Winning Tips: Research teams, check recent form, consider home advantage, use 2-Star wisely, start with safer predictions!";
    }

   if (lowerQuery.includes('registration')) {
      return "To register: 1) Click 'Sign Up' on the homepage, 2) Fill in your details (name, email, phone), 3) Pay the registration fee of Nu. 500, 4) Wait for admin approval, 5) Start making predictions once approved! Payment can be made via bank transfer or mobile banking.";
    }

    return "I can help with: rules, score, and registration. Try asking about any of these!";
  };

  const formatBotMessage = (message) => {
    if (message.data) {
      switch (message.data.type) {
        case 'matches':
          return (
            <div>
              <p className="mb-2">{message.text}</p>
              <div className="space-y-2">
                {message.data.data.map((match, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 text-sm">
                    <strong>{match.team_a_name} vs {match.team_b_name}</strong><br/>
                    📅 {new Date(match.start_time).toLocaleString()}<br/>
                    🏆 {match.tournament_name}
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'live_matches':
          return (
            <div>
              <p className="mb-2">{message.text}</p>
              <div className="space-y-2">
                {message.data.data.map((match, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-300 p-3 rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <strong>{match.team_a_name} vs {match.team_b_name}</strong>
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </span>
                    </div>
                    📊 Score: {match.score_a} - {match.score_b}
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'stats':
          return (
            <div>
              <p className="mb-2">{message.text}</p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><Trophy className="h-4 w-4 mr-2 text-yellow-500"/>Points</span>
                  <strong>{message.data.data.totalPoints}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500"/>Correct</span>
                  <strong>{message.data.data.correctPredictions}/{message.data.data.totalPredictions}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><Star className="h-4 w-4 mr-2 text-yellow-500"/>2-Star</span>
                  <strong>{message.data.data.twoStarUsed}/2</strong>
                </div>
              </div>
            </div>
          );
        
        case 'leaderboard':
          return (
            <div>
              <p className="mb-2">{message.text}</p>
              <div className="space-y-2">
                {message.data.data.map((user, idx) => (
                  <div key={idx} className={`p-3 rounded-lg text-sm flex items-center justify-between ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">#{idx + 1}</span>
                      <span>{user.username}</span>
                    </div>
                    <span className="font-bold">{user.total_points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          );
        
        default:
          return message.text;
      }
    }
    return message.text;
  };

  return (
    <>
      {user && user.username ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full">
                  <Trophy className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Welcome back, {user.username}! 👋
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Ready to make some winning predictions?
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Go to Dashboard
                <ArrowRightCircle className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Hero Section with Gradient */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 mb-12 shadow-2xl">
                <div className="relative z-10 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                      <Trophy className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Match Prediction System
                  </h1>
                  <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
                    Test your football knowledge and compete with friends in our exciting prediction tournament!
                  </p>
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/login"
                      className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-800 transition-all transform hover:scale-105 shadow-lg border-2 border-white/30"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              {/* Quick Start Steps - Modernized */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Quick Start Guide
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { icon: Users, step: 1, title: "Register", desc: "Create your account", gradient: "from-blue-400 to-blue-600" },
                    { icon: Shield, step: 2, title: "Get Approved", desc: "Admin confirms", gradient: "from-green-400 to-green-600" },
                    { icon: Target, step: 3, title: "Predict", desc: "Make predictions", gradient: "from-purple-400 to-purple-600" },
                    { icon: Trophy, step: 4, title: "Win", desc: "Climb leaderboard", gradient: "from-yellow-400 to-orange-500" }
                  ].map((item, index) => (
                    <div key={index} className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-10 rounded-full blur-2xl`}></div>
                      <div className="relative z-10">
                        <div className="flex justify-center mb-4">
                          <div className={`bg-gradient-to-br ${item.gradient} text-white rounded-full p-4`}>
                            <item.icon className="h-8 w-8" />
                          </div>
                        </div>
                        <div className={`bg-gradient-to-br ${item.gradient} text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3 font-bold text-lg`}>
                          {item.step}
                        </div>
                        <h3 className="font-bold text-gray-900 text-center text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-600 text-center mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules & Scoring - Side by Side with Gradients */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Rules */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <Shield className="h-6 w-6 mr-2" />
                      Rules & Guidelines
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { title: "Registration", desc: "Create account with email. Admin approval required after payment.", icon: Users, color: "blue" },
                      { title: "Prediction Deadline", desc: "Submit predictions at least 5 minutes before match starts.", icon: Clock, color: "red" },
                      { title: "One Per Match", desc: "One prediction per match. Edit allowed until deadline.", icon: Target, color: "purple" },
                      { title: "Fair Play", desc: "Multiple accounts will result in disqualification.", icon: Shield, color: "green" }
                    ].map((rule, idx) => (
                      <div key={idx} className={`bg-gradient-to-br from-${rule.color}-50 to-${rule.color}-100 border-l-4 border-${rule.color}-500 p-4 rounded-lg`}>
                        <div className="flex items-start">
                          <rule.icon className={`h-5 w-5 text-${rule.color}-600 mr-3 mt-0.5 flex-shrink-0`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">{rule.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{rule.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scoring System */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <Star className="h-6 w-6 mr-2" />
                      Scoring System
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { title: "Exact Score", desc: "Perfect prediction", points: 7, gradient: "from-green-400 to-emerald-600", icon: Trophy },
                      { title: "One Score", desc: "One team exact", points: 5, gradient: "from-blue-400 to-indigo-600", icon: Target },
                      { title: "Winner", desc: "Right outcome", points: 2, gradient: "from-yellow-400 to-orange-500", icon: Award },
                      { title: "Wrong", desc: "No match", points: 0, gradient: "from-gray-400 to-gray-600", icon: Clock }
                    ].map((score, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-4 bg-gradient-to-r ${score.gradient} rounded-xl text-white transform hover:scale-105 transition-all`}>
                        <div className="flex items-center">
                          <score.icon className="h-6 w-6 mr-3" />
                          <div>
                            <h3 className="font-bold">{score.title}</h3>
                            <p className="text-sm opacity-90">{score.desc}</p>
                          </div>
                        </div>
                        <div className="text-3xl font-bold">{score.points}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2-Star Power-Up Feature */}
              <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 mb-12 shadow-xl">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center">
                    <Star className="h-8 w-8 mr-2" />
                    2-Star Power-Up Feature
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { icon: Zap, title: "Double Points", desc: "Get 14, 10, or 4 points when correct", bg: "bg-white/20" },
                      { icon: Target, title: "Limited Use", desc: "Only 2 power-ups available total", bg: "bg-white/20" },
                      { icon: Trophy, title: "Strategic", desc: "Use on confident predictions", bg: "bg-white/20" }
                    ].map((feature, idx) => (
                      <div key={idx} className={`${feature.bg} backdrop-blur-sm rounded-xl p-6 text-center text-white border border-white/30`}>
                        <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <feature.icon className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                        <p className="text-sm opacity-90">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              {/* How to Play - Compact */}
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
                <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  How to Play
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { num: 1, title: "Create Account", desc: "Sign up with email and password", icon: Users, color: "blue" },
                    { num: 2, title: "Get Approved", desc: "Complete payment and wait for approval", icon: Shield, color: "green" },
                    { num: 3, title: "Browse Matches", desc: "View upcoming tournaments", icon: Target, color: "purple" },
                    { num: 4, title: "Make Predictions", desc: "Predict scores before deadline", icon: Star, color: "yellow" },
                    { num: 5, title: "Track Results", desc: "Watch live and earn points", icon: TrendingUp, color: "pink" },
                    { num: 6, title: "Win Prizes", desc: "Climb leaderboard for rewards", icon: Trophy, color: "orange" }
                  ].map((step, idx) => (
                    <div key={idx} className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-${step.color}-100 opacity-30 rounded-full blur-2xl`}></div>
                      <div className="relative z-10">
                        <div className={`bg-gradient-to-r from-${step.color}-400 to-${step.color}-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3`}>
                          {step.num}
                        </div>
                        <step.icon className={`h-6 w-6 text-${step.color}-600 mb-2`} />
                        <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl p-6 mb-12">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                  <Clock className="h-6 w-6 mr-2" />
                  Important Notes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Predictions lock 5 minutes before start",
                    "2-Star power-ups cannot be undone",
                    "Admin decisions are final",
                    "Multiple accounts = disqualification",
                    "Prize distribution within 7 days"
                  ].map((note, idx) => (
                    <div key={idx} className="flex items-start text-red-800">
                      <CheckCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 text-white text-center shadow-2xl">
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Predicting?</h2>
                  <p className="text-xl mb-8 opacity-90">Join thousands of football fans!</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/register"
                      className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
                    >
                      Get Started Now
                    </Link>
                    <Link
                      to="/login"
                      className="bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-800 transition-all transform hover:scale-105 shadow-xl border-2 border-white/30"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Chatbot - Modernized */}
      <div className={`fixed bottom-4 right-4 z-50 ${isChatOpen ? 'w-[90vw] sm:w-96 h-[80vh] sm:h-[600px]' : 'w-auto h-auto'}`}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <img src={botIcon} alt="Chatbot" className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-white shadow-2xl transform group-hover:scale-110 transition-transform" />
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
                      {message.type === 'bot' ? formatBotMessage(message) : message.text}
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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