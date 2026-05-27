import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Menu, TrendingUp, Target, Star } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('/api/leaderboard/', {
          headers: token ? {
            'Authorization': `Token ${token}`
          } : {}
        });

        if (response.ok) {
          const leaderboardData = await response.json();
          console.log('Loaded leaderboard:', leaderboardData);
          setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
        } else {
          console.error('Failed to fetch leaderboard:', response.status);
          setLeaderboard([]);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankGradient = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-orange-500';
      case 2:
        return 'from-gray-400 to-gray-600';
      case 3:
        return 'from-amber-400 to-orange-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  const getRankBgGradient = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-50 via-orange-50 to-yellow-50';
      case 2:
        return 'from-gray-50 via-slate-50 to-gray-50';
      case 3:
        return 'from-amber-50 via-orange-50 to-amber-50';
      default:
        return 'from-white to-white';
    }
  };

  const getRankBorderColor = (rank) => {
    switch (rank) {
      case 1:
        return 'border-yellow-300';
      case 2:
        return 'border-gray-300';
      case 3:
        return 'border-amber-300';
      default:
        return 'border-gray-200';
    }
  };

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
          {/* Header with Gradient */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 shadow-xl">
              <div className="relative z-10">
                <div className="flex items-center mb-1">
                  <Trophy className="h-6 w-6 text-white mr-2" />
                  <h6 className="text-xl md:text-2xl font-bold text-white">Leaderboard</h6>
                </div>
                <p className="text-indigo-100 text-sm">Top predictors in the tournament</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Top 3 Podium - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {leaderboard.slice(0, 3).map((user) => (
              <div 
                key={user.rank} 
                className={`relative overflow-hidden bg-gradient-to-br ${getRankBgGradient(user.rank)} rounded-2xl shadow-xl border-2 ${getRankBorderColor(user.rank)} transform hover:scale-105 transition-all ${user.rank === 1 ? 'md:scale-110' : ''}`}
              >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 p-6 text-center">
                  {/* Rank Badge */}
                  <div className={`absolute top-4 right-4 bg-gradient-to-r ${getRankGradient(user.rank)} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg`}>
                    {user.rank}
                  </div>

                  {/* Rank Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`bg-gradient-to-br ${getRankGradient(user.rank)} p-4 rounded-full`}>
                      {getRankIcon(user.rank)}
                    </div>
                  </div>

                  {/* User Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 truncate px-2">
                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </h3>

                  {/* Points Display */}
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-lg">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {user.total_points}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Total Points</div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center justify-center mb-1">
                        <Target className="h-4 w-4 text-green-600 mr-1" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{user.correct_predictions}</div>
                      <div className="text-xs text-gray-600">Correct</div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{user.accuracy}%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Full Rankings - Modernized */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Full Rankings
              </h3>
            </div>
            
            {/* Desktop Table - Modernized */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Points
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Correct Predictions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Accuracy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, index) => (
                    <tr 
                      key={user.rank} 
                      className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all ${
                        user.rank <= 3 ? 'bg-gradient-to-r ' + getRankBgGradient(user.rank) : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.rank <= 3 ? (
                            <div className={`bg-gradient-to-br ${getRankGradient(user.rank)} p-2 rounded-lg`}>
                              {getRankIcon(user.rank)}
                            </div>
                          ) : (
                            <div className="bg-gray-100 text-gray-700 font-bold rounded-lg px-3 py-2 text-sm">
                              #{user.rank}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankGradient(user.rank)} flex items-center justify-center text-white font-bold mr-3`}>
                            {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="text-lg font-bold text-gray-900">{user.total_points}</span>
                          <span className="text-sm text-gray-500 ml-1">pts</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{user.correct_predictions}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{user.accuracy}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout - Enhanced */}
            <div className="lg:hidden divide-y divide-gray-200">
              {leaderboard.map((user) => (
                <div 
                  key={user.rank} 
                  className={`p-4 ${
                    user.rank <= 3 ? 'bg-gradient-to-r ' + getRankBgGradient(user.rank) : ''
                  } hover:bg-gray-50 transition-all`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {/* Rank Icon/Badge */}
                      {user.rank <= 3 ? (
                        <div className={`bg-gradient-to-br ${getRankGradient(user.rank)} p-2 rounded-lg`}>
                          {getRankIcon(user.rank)}
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-700 font-bold rounded-lg px-3 py-2">
                          #{user.rank}
                        </div>
                      )}
                      
                      {/* User Info */}
                      <div>
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankGradient(user.rank)} flex items-center justify-center text-white font-bold text-xs mr-2`}>
                            {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                          </div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                          </h4>
                        </div>
                      </div>
                    </div>
                    
                    {/* Points Display */}
                    <div className="text-right">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-lg font-bold text-gray-900">{user.total_points}</span>
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 text-center border border-gray-200">
                      <div className="flex items-center justify-center mb-1">
                        <Target className="h-4 w-4 text-green-600 mr-1" />
                      </div>
                      <div className="text-lg font-bold text-gray-800">{user.correct_predictions}</div>
                      <div className="text-xs text-gray-600">Correct</div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 text-center border border-gray-200">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                      </div>
                      <div className="text-lg font-bold text-gray-800">{user.accuracy}%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State - Enhanced */}
          {leaderboard.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Trophy className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Predictions Yet</h3>
              <p className="text-gray-500">Be the first to make a prediction and climb the leaderboard!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};