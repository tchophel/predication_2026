import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Trophy, Clock, Star, TrendingUp, Users, Calendar, FileText, MessageSquare, Menu, Zap, Award, Target, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Users as UsersManagement } from './Users';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAdmin = user?.username === 'admin';
  const isOnAdminRoute = location.pathname === '/admin';
  const [stats, setStats] = useState({
    total_predictions: 0,
    correct_predictions: 0,
    two_star_used: 0,
    upcoming_matches: 0
  });
  const [loading, setLoading] = useState(true);
  const [worldCupTeams, setWorldCupTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfederation, setSelectedConfederation] = useState('ALL');

  // Admin state
  const [activeTab] = useState('dashboard');
  const [adminStats, setAdminStats] = useState({
    total_users: 0,
    total_matches: 0,
    total_predictions: 0,
    paid_users: 0
  });

  // World Cup 2026 Teams (48 teams)
  const worldCup2026Teams = useMemo(() => [
    // CONCACAF (6 slots)
    { name: "United States", country: "United States", badge: "https://flagcdn.com/w80/us.png", confederation: "CONCACAF", status: "Host" },
    { name: "Canada", country: "Canada", badge: "https://flagcdn.com/w80/ca.png", confederation: "CONCACAF", status: "Host" },
    { name: "Mexico", country: "Mexico", badge: "https://flagcdn.com/w80/mx.png", confederation: "CONCACAF", status: "Host" },
    { name: "Costa Rica", country: "Costa Rica", badge: "https://flagcdn.com/w80/cr.png", confederation: "CONCACAF", status: "Likely" },
    { name: "Jamaica", country: "Jamaica", badge: "https://flagcdn.com/w80/jm.png", confederation: "CONCACAF", status: "Likely" },
    { name: "Panama", country: "Panama", badge: "https://flagcdn.com/w80/pa.png", confederation: "CONCACAF", status: "Likely" },
    
    // UEFA (16 slots)
    { name: "Germany", country: "Germany", badge: "https://flagcdn.com/w80/de.png", confederation: "UEFA", status: "Likely" },
    { name: "France", country: "France", badge: "https://flagcdn.com/w80/fr.png", confederation: "UEFA", status: "Likely" },
    { name: "Spain", country: "Spain", badge: "https://flagcdn.com/w80/es.png", confederation: "UEFA", status: "Likely" },
    { name: "England", country: "England", badge: "https://flagcdn.com/w80/gb-eng.png", confederation: "UEFA", status: "Likely" },
    { name: "Italy", country: "Italy", badge: "https://flagcdn.com/w80/it.png", confederation: "UEFA", status: "Likely" },
    { name: "Portugal", country: "Portugal", badge: "https://flagcdn.com/w80/pt.png", confederation: "UEFA", status: "Likely" },
    { name: "Netherlands", country: "Netherlands", badge: "https://flagcdn.com/w80/nl.png", confederation: "UEFA", status: "Likely" },
    { name: "Belgium", country: "Belgium", badge: "https://flagcdn.com/w80/be.png", confederation: "UEFA", status: "Likely" },
    { name: "Croatia", country: "Croatia", badge: "https://flagcdn.com/w80/hr.png", confederation: "UEFA", status: "Likely" },
    { name: "Denmark", country: "Denmark", badge: "https://flagcdn.com/w80/dk.png", confederation: "UEFA", status: "Likely" },
    { name: "Switzerland", country: "Switzerland", badge: "https://flagcdn.com/w80/ch.png", confederation: "UEFA", status: "Likely" },
    { name: "Austria", country: "Austria", badge: "https://flagcdn.com/w80/at.png", confederation: "UEFA", status: "Likely" },
    { name: "Poland", country: "Poland", badge: "https://flagcdn.com/w80/pl.png", confederation: "UEFA", status: "Likely" },
    { name: "Ukraine", country: "Ukraine", badge: "https://flagcdn.com/w80/ua.png", confederation: "UEFA", status: "Likely" },
    { name: "Sweden", country: "Sweden", badge: "https://flagcdn.com/w80/se.png", confederation: "UEFA", status: "Likely" },
    { name: "Serbia", country: "Serbia", badge: "https://flagcdn.com/w80/rs.png", confederation: "UEFA", status: "Likely" },
    
    // CONMEBOL (6 slots)
    { name: "Argentina", country: "Argentina", badge: "https://flagcdn.com/w80/ar.png", confederation: "CONMEBOL", status: "Likely" },
    { name: "Brazil", country: "Brazil", badge: "https://flagcdn.com/w80/br.png", confederation: "CONMEBOL", status: "Likely" },
    { name: "Uruguay", country: "Uruguay", badge: "https://flagcdn.com/w80/uy.png", confederation: "CONMEBOL", status: "Likely" },
    { name: "Colombia", country: "Colombia", badge: "https://flagcdn.com/w80/co.png", confederation: "CONMEBOL", status: "Likely" },
    { name: "Ecuador", country: "Ecuador", badge: "https://flagcdn.com/w80/ec.png", confederation: "CONMEBOL", status: "Likely" },
    { name: "Chile", country: "Chile", badge: "https://flagcdn.com/w80/cl.png", confederation: "CONMEBOL", status: "Likely" },
    
    // CAF (9 slots)
    { name: "Senegal", country: "Senegal", badge: "https://flagcdn.com/w80/sn.png", confederation: "CAF", status: "Likely" },
    { name: "Morocco", country: "Morocco", badge: "https://flagcdn.com/w80/ma.png", confederation: "CAF", status: "Likely" },
    { name: "Tunisia", country: "Tunisia", badge: "https://flagcdn.com/w80/tn.png", confederation: "CAF", status: "Likely" },
    { name: "Egypt", country: "Egypt", badge: "https://flagcdn.com/w80/eg.png", confederation: "CAF", status: "Likely" },
    { name: "Nigeria", country: "Nigeria", badge: "https://flagcdn.com/w80/ng.png", confederation: "CAF", status: "Likely" },
    { name: "Cameroon", country: "Cameroon", badge: "https://flagcdn.com/w80/cm.png", confederation: "CAF", status: "Likely" },
    { name: "Ghana", country: "Ghana", badge: "https://flagcdn.com/w80/gh.png", confederation: "CAF", status: "Likely" },
    { name: "Algeria", country: "Algeria", badge: "https://flagcdn.com/w80/dz.png", confederation: "CAF", status: "Likely" },
    { name: "Ivory Coast", country: "Ivory Coast", badge: "https://flagcdn.com/w80/ci.png", confederation: "CAF", status: "Likely" },
    
    // AFC (8 slots)
    { name: "Japan", country: "Japan", badge: "https://flagcdn.com/w80/jp.png", confederation: "AFC", status: "Likely" },
    { name: "South Korea", country: "South Korea", badge: "https://flagcdn.com/w80/kr.png", confederation: "AFC", status: "Likely" },
    { name: "Iran", country: "Iran", badge: "https://flagcdn.com/w80/ir.png", confederation: "AFC", status: "Likely" },
    { name: "Australia", country: "Australia", badge: "https://flagcdn.com/w80/au.png", confederation: "AFC", status: "Likely" },
    { name: "Saudi Arabia", country: "Saudi Arabia", badge: "https://flagcdn.com/w80/sa.png", confederation: "AFC", status: "Likely" },
    { name: "Qatar", country: "Qatar", badge: "https://flagcdn.com/w80/qa.png", confederation: "AFC", status: "Likely" },
    { name: "Iraq", country: "Iraq", badge: "https://flagcdn.com/w80/iq.png", confederation: "AFC", status: "Likely" },
    { name: "United Arab Emirates", country: "UAE", badge: "https://flagcdn.com/w80/ae.png", confederation: "AFC", status: "Likely" },
    
    // OFC (1 slot)
    { name: "New Zealand", country: "New Zealand", badge: "https://flagcdn.com/w80/nz.png", confederation: "OFC", status: "Likely" },
    
    // Playoff Winners (2 slots)
    { name: "Wales", country: "Wales", badge: "https://flagcdn.com/w80/gb-wls.png", confederation: "UEFA", status: "Playoff" },
    { name: "Peru", country: "Peru", badge: "https://flagcdn.com/w80/pe.png", confederation: "CONMEBOL", status: "Playoff" },
  ], []);

  const fetchWorldCupTeams = useCallback(async () => {
    setTeamsLoading(true);
    setTeamsError('');
    
    try {
      const response = await fetch('http://localhost:3002/api/football/competitions/2000/teams');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.teams && Array.isArray(data.teams)) {
        const teams = data.teams.map(team => ({
          name: team.name,
          country: team.name,
          badge: team.crest,
          id: team.id,
          shortName: team.shortName,
          tla: team.tla,
          confederation: team.area?.name || 'Unknown',
          status: 'Qualified'
        }));
        
        setWorldCupTeams(teams);
      } else {
        throw new Error('No teams found in API response');
      }
    } catch (error) {
      console.error('Error fetching World Cup teams:', error);
      setTeamsError(`Using offline data (API unavailable: ${error.message})`);
      setWorldCupTeams(worldCup2026Teams);
    } finally {
      setTeamsLoading(false);
    }
  }, [worldCup2026Teams]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        // Fetch user stats from database
        if (token) {
          try {
            const predictionsResponse = await fetch('/api/predictions/my/', {
              headers: {
                'Authorization': `Token ${token}`
              }
            });
            
            if (predictionsResponse.ok) {
              const userPredictions = await predictionsResponse.json();
              const totalPredictions = Array.isArray(userPredictions) ? userPredictions.length : 0;
              const correctPredictions = Array.isArray(userPredictions) ? 
                userPredictions.filter(pred => pred.points_awarded && pred.points_awarded > 0).length : 0;
              const twoStarUsed = Array.isArray(userPredictions) ? 
                userPredictions.filter(pred => pred.used_two_star).length : 0;
              
              setStats({
                total_predictions: totalPredictions,
                correct_predictions: correctPredictions,
                two_star_used: twoStarUsed,
                upcoming_matches: 0 // Will be updated below
              });
            }
          } catch (error) {
            console.error('Error fetching user predictions for stats:', error);
          }
          
          // Fetch upcoming matches count
          try {
            const matchesResponse = await fetch('/api/matches/', {
              headers: {
                'Authorization': `Token ${token}`
              }
            });
            
            if (matchesResponse.ok) {
              const matches = await matchesResponse.json();
              const now = new Date();
              const upcomingMatches = Array.isArray(matches) ? 
                matches.filter(match => new Date(match.start_time) > now).length : 0;
              
              setStats(prev => ({
                ...prev,
                upcoming_matches: upcomingMatches
              }));
            }
          } catch (error) {
            console.error('Error fetching matches for stats:', error);
          }
        }
        
        // Fetch admin stats if user is admin
        if (isAdmin && token) {
          try {
            const [usersResponse, matchesResponse, predictionsResponse] = await Promise.all([
              fetch('/api/auth/users/', {
                headers: { 'Authorization': `Token ${token}` }
              }),
              fetch('/api/matches/', {
                headers: { 'Authorization': `Token ${token}` }
              }),
              fetch('/api/predictions/all/', {
                headers: { 'Authorization': `Token ${token}` }
              })
            ]);
            
            const usersData = usersResponse.ok ? await usersResponse.json() : [];
            const matchesData = matchesResponse.ok ? await matchesResponse.json() : [];
            const predictionsData = predictionsResponse.ok ? await predictionsResponse.json() : [];
            
            setAdminStats({
              total_users: Array.isArray(usersData) ? usersData.length : 0,
              total_matches: Array.isArray(matchesData) ? matchesData.length : 0,
              total_predictions: Array.isArray(predictionsData) ? predictionsData.length : 0,
              paid_users: 0 // TODO: Update when payment system is implemented
            });
          } catch (error) {
            console.error('Error fetching admin stats:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchWorldCupTeams();
  }, [fetchWorldCupTeams, isAdmin]);

  // Filter teams
  const filteredTeams = worldCupTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConfederation = selectedConfederation === 'ALL' || team.confederation === selectedConfederation;
    return matchesSearch && matchesConfederation;
  });

  const confederations = ['ALL', ...new Set(worldCupTeams.map(team => team.confederation))];
  
  const confederationCounts = worldCupTeams.reduce((acc, team) => {
    acc[team.confederation] = (acc[team.confederation] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <div className="flex-1">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header with Gradient */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 shadow-xl">
              <div className="relative z-10">
                <h6 className="text-xl md:text-2xl font-bold text-white mb-1">
                  Welcome back, {user?.first_name} {user?.last_name}! 👋
                </h6>
                <p className="text-blue-100 text-sm">
                  {isOnAdminRoute && isAdmin ? 'Admin Dashboard - Manage the platform' : 'Ready to make some winning predictions?'}
                </p>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-yellow-400/20 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {isOnAdminRoute && isAdmin ? (
              <AdminContent 
                activeTab={activeTab} 
                adminStats={adminStats}
              />
            ) : (
              <UserContent 
                user={user} 
                stats={stats}
              />
            )}

            {/* World Cup 2026 Teams */}
            <WorldCupTeamsSection
              worldCupTeams={worldCupTeams}
              filteredTeams={filteredTeams}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedConfederation={selectedConfederation}
              setSelectedConfederation={setSelectedConfederation}
              confederations={confederations}
              confederationCounts={confederationCounts}
              teamsLoading={teamsLoading}
              teamsError={teamsError}
              fetchWorldCupTeams={fetchWorldCupTeams}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// World Cup Teams Section Component
const WorldCupTeamsSection = ({ 
  filteredTeams, 
  searchTerm, 
  setSearchTerm, 
  selectedConfederation, 
  setSelectedConfederation, 
  confederations, 
  confederationCounts,
  teamsLoading,
  teamsError 
}) => {
  const confederationColors = {
    'AFC': 'from-red-400 to-red-600',
    'CAF': 'from-green-400 to-green-600',
    'CONCACAF': 'from-blue-400 to-blue-600',
    'CONMEBOL': 'from-yellow-400 to-yellow-600',
    'UEFA': 'from-purple-400 to-purple-600',
    'OFC': 'from-teal-400 to-teal-600',
    'ALL': 'from-gray-400 to-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="h-4 w-4 text-white mr-1.5" />
            <h2 className="text-base font-bold text-white">World Cup 2026 Teams</h2>
          </div>
          <div className="text-white text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
            {filteredTeams.length}
          </div>
        </div>
      </div>

      <div className="p-3">
        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={selectedConfederation}
            onChange={(e) => setSelectedConfederation(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            {confederations.map(conf => (
              <option key={conf} value={conf}>
                {conf === 'ALL' ? 'All' : `${conf} (${confederationCounts[conf] || 0})`}
              </option>
            ))}
          </select>
        </div>

        {/* Confederation Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {confederations.map(conf => (
            <button
              key={conf}
              onClick={() => setSelectedConfederation(conf)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                selectedConfederation === conf
                  ? `bg-gradient-to-r ${confederationColors[conf]} text-white shadow-sm`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {conf === 'ALL' ? 'All' : conf} {conf !== 'ALL' && `(${confederationCounts[conf] || 0})`}
            </button>
          ))}
        </div>

        {/* Teams Grid */}
        {teamsLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded p-1.5 animate-pulse">
                <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto mb-1"></div>
                <div className="h-2 bg-gray-200 rounded mb-0.5"></div>
                <div className="h-1.5 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-1">
            {filteredTeams.map((team, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded p-1.5 hover:shadow-sm transition-all duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="relative mb-1">
                  <img
                    src={team.badge}
                    alt={team.name}
                    className="w-6 h-6 mx-auto object-contain group-hover:scale-110 transition-transform"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/24?text=?';
                    }}
                  />
                  {team.status === 'Host' && (
                    <div className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold px-0.5 py-0.25 rounded">
                      H
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-medium text-xs text-gray-900 mb-0.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {team.name.length > 8 ? team.name.substring(0, 8) + '...' : team.name}
                  </div>
                  <div className="text-xs text-gray-500">{team.confederation.length > 3 ? team.confederation.substring(0, 3) : team.confederation}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTeams.length === 0 && !teamsLoading && (
          <div className="text-center py-4">
            <Globe className="h-8 w-8 text-gray-300 mx-auto mb-1" />
            <p className="text-gray-500 text-xs">No teams found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick Chat Component
const QuickChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChatRooms();
    fetchUsers();
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedRoom) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/messaging/rooms/${selectedRoom.id}/messages/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.slice(-5));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom, fetchMessages]);

  const fetchChatRooms = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/messaging/rooms/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/messaging/users/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/messaging/rooms/${selectedRoom.id}/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });
      
      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createQuickRoom = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/messaging/rooms/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'General Chat',
          description: 'Quick chat room for general discussion',
          is_group_chat: true
        })
      });
      
      if (response.ok) {
        fetchChatRooms();
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Chat</h3>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Chat</h3>
          </div>
          <div className="flex space-x-2">
            {chatRooms.length === 0 && (
              <button
                onClick={createQuickRoom}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            )}
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 flex items-center gap-1 transition-colors"
            >
              <Users className="w-3 h-3" />
              {users.length}
            </button>
            <Link
              to="/chat"
              className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 flex items-center gap-1 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Full
            </Link>
          </div>
        </div>

        {showUserList && (
          <div className="mb-4 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg max-h-32 overflow-y-auto border border-green-200">
            <div className="text-xs font-semibold text-green-900 mb-2">Online Users</div>
            <div className="space-y-1">
              {users.slice(0, 5).map(userItem => (
                <div key={userItem.id} className="text-xs text-green-700 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  {userItem.first_name} {userItem.last_name} -{userItem.username}
                </div>
              ))}
            </div>
          </div>
        )}

        {chatRooms.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedRoom?.id || ''}
              onChange={(e) => setSelectedRoom(chatRooms.find(r => r.id === Number.parseInt(e.target.value)))}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a room...</option>
              {chatRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.participants?.length || 0})
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRoom ? (
          <>
            <div className="h-48 overflow-y-auto mb-4 p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg space-y-2 border border-gray-200">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`text-sm ${message.sender.username === user?.username ? 'text-right' : 'text-left'}`}
                >
                  <div className={`inline-block px-3 py-2 rounded-lg ${
                    message.sender.username === user?.username
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <div className="text-xs font-medium mb-1">{message.sender.username}</div>
                    <div>{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.sender.username === user?.username ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {chatRooms.length === 0 ? 'Create a room to start chatting' : 'Select a room to join'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// User Content Component
const UserContent = ({ user, stats }) => (
  <>
    {/* Stats Cards with Gradient */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <GradientStatCard icon={Trophy} label="Total Points" value={`${user?.total_points || 0}`} gradient="from-yellow-400 to-orange-500" />
      <GradientStatCard icon={Target} label="Predictions Made" value={stats.total_predictions} gradient="from-green-400 to-emerald-600" />
      <GradientStatCard icon={Star} label="2-Star Used" value={`${stats.two_star_used}/2`} gradient="from-blue-400 to-indigo-600" />
      <GradientStatCard icon={Clock} label="Upcoming Matches" value={stats.upcoming_matches} gradient="from-purple-400 to-pink-600" />
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <RecentPredictions />
      <UpcomingMatches />
      <QuickChat />
    </div>
  </>
);

// Gradient Stat Card Component
const GradientStatCard = ({ icon: Icon, label, value, gradient }) => {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-10 w-10 text-white" />
          <Zap className="h-6 w-6 text-white/60" />
        </div>
        <p className="text-sm font-medium text-white/90 mb-1">{label}</p>
        <p className="text-4xl font-bold text-white">{value}</p>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
};

// Recent Predictions Component
const RecentPredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPredictions = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/predictions/my/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });

        if (response.ok) {
          const predictionsData = await response.json();
          const recentPredictions = Array.isArray(predictionsData) 
            ? predictionsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
            : [];
          setPredictions(recentPredictions);
        }
      } catch (error) {
        console.error('Error fetching recent predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPredictions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Predictions</h3>
          </div>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Predictions</h3>
        </div>
        <div className="space-y-3">
          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No predictions yet</p>
            </div>
          ) : (
            predictions.map((prediction) => (
              <div key={prediction.id} className="flex justify-between items-center p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {prediction.match_details?.team_a_name || 'Team A'} vs {prediction.match_details?.team_b_name || 'Team B'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Prediction: {prediction.predicted_a} - {prediction.predicted_b}
                    {prediction.used_two_star && <Star className="inline h-3 w-3 ml-1 text-yellow-500" />}
                  </p>
                </div>
                <span className={`font-bold text-sm px-3 py-1 rounded-full ${
                  prediction.points_awarded > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {prediction.points_awarded !== null && prediction.points_awarded !== undefined 
                    ? `${prediction.points_awarded > 0 ? '+' : ''}${prediction.points_awarded} pts`
                    : 'TBD'
                  }
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Upcoming Matches Component
const UpcomingMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('/api/matches/', {
          headers: token ? {
            'Authorization': `Token ${token}`
          } : {}
        });

        if (response.ok) {
          const matchesData = await response.json();
          const now = new Date();
          const upcomingMatches = Array.isArray(matchesData) ? 
            matchesData
              .filter(match => {
                const matchTime = new Date(match.start_time);
                return matchTime > now && match.status !== 'FINISHED' && match.status !== 'IN_PROGRESS';
              })
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
              .slice(0, 3) : [];
          setMatches(upcomingMatches);
        }
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMatches();
    const interval = setInterval(fetchUpcomingMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeUntilMatch = (startTime) => {
    const matchTime = new Date(startTime);
    const currentTime = new Date();
    const timeDiff = matchTime.getTime() - currentTime.getTime();
    const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
    
    if (hoursUntilMatch < 1) {
      const minutesUntilMatch = timeDiff / (1000 * 60);
      return `${Math.round(minutesUntilMatch)}m`;
    } else if (hoursUntilMatch < 24) {
      return `${Math.round(hoursUntilMatch)}h`;
    } else {
      const daysUntilMatch = hoursUntilMatch / 24;
      return `${Math.round(daysUntilMatch)}d`;
    }
  };

  const handlePredictClick = (match) => {
    window.location.href = `/matches?match=${match.id}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Matches</h3>
          </div>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Matches</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Live</span>
          </div>
        </div>
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No upcoming matches</p>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="flex justify-between items-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {match.team_a_name || 'Team A'} vs {match.team_b_name || 'Team B'}
                  </p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 text-blue-600 mr-1" />
                    <p className="text-xs text-blue-700 font-medium">
                      In {formatTimeUntilMatch(match.start_time)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handlePredictClick(match)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                >
                  Predict
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Admin Content Component
const AdminContent = ({ activeTab, adminStats }) => {
  switch (activeTab) {
    case 'users':
      return <UsersManagement />;
    case 'matches':
      return <MatchesManagement />;
    case 'settings':
      return <SystemSettings />;
    case 'dashboard':
    default:
      return <AdminDashboard stats={adminStats} />;
  }
};

// Admin Dashboard Component
const AdminDashboard = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <AdminStatCard icon={Users} label="Total Users" value={stats.total_users} gradient="from-blue-400 to-blue-600" />
    <AdminStatCard icon={Calendar} label="Total Matches" value={stats.total_matches} gradient="from-green-400 to-green-600" />
    <AdminStatCard icon={FileText} label="Predictions" value={stats.total_predictions} gradient="from-purple-400 to-purple-600" />
    <AdminStatCard icon={Award} label="Paid Users" value={stats.paid_users} gradient="from-yellow-400 to-orange-500" />
  </div>
);

// Admin Stat Card Component
const AdminStatCard = ({ icon: Icon, label, value, gradient }) => (
  <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/90 text-sm font-medium mb-1">{label}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-xl">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
  </div>
);

// Admin Management Components
const MatchesManagement = () => (
  <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Match Management</h2>
      <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105">
        Create Match
      </button>
    </div>
    <div className="text-center py-16">
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
        <Calendar className="h-12 w-12 text-gray-400" />
      </div>
      <p className="text-gray-500 text-lg">Match management interface coming soon</p>
    </div>
  </div>
);

const SystemSettings = () => (
  <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Default Limit per User
          </label>
          <input
            type="number"
            defaultValue="3"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Prediction Lock Time (minutes)
          </label>
          <input
            type="number"
            defaultValue="5"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105">
          Save Settings
        </button>
      </div>
    </div>
  </div>
);