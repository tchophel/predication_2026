import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Users, TrendingUp, Star, Menu, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

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

        const response = await fetch('http://localhost:8000/api/predictions/my/', {
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
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No predictions yet. Make your first prediction above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {predictions.map((prediction) => (
        <div key={prediction.id} className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center bg-white px-3 py-1 rounded-lg shadow-sm">
              <span className="font-bold text-gray-900">
                {prediction.predicted_a} - {prediction.predicted_b}
              </span>
              {prediction.used_two_star && (
                <Star className="h-4 w-4 text-yellow-500 ml-2" />
              )}
            </div>
            <div className="text-sm text-gray-700">
              {prediction.match_details?.team_a_name} vs {prediction.match_details?.team_b_name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {new Date(prediction.created_at).toLocaleDateString()}
            </div>
            {prediction.points_awarded !== null && (
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                prediction.points_awarded > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {prediction.points_awarded > 0 ? `+${prediction.points_awarded}` : '0'} pts
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [predictions, setPredictions] = useState({});
  const [userPredictions, setUserPredictions] = useState([]);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [predictionData, setPredictionData] = useState({
    predicted_score_a: '',
    predicted_score_b: '',
    used_two_star: false
  });
  const [twoStarStatus, setTwoStarStatus] = useState(null);

  const convertToBhutanTime = (utcString) => {
    const date = new Date(utcString);
    const bhutanTime = new Date(date.getTime() + (6 * 60 * 60 * 1000));
    return bhutanTime;
  };

  const formatBhutanTime = (timeString) => {
    const bhutanTime = convertToBhutanTime(timeString);
    return bhutanTime.toLocaleString('en-US', {
      timeZone: 'Asia/Thimphu',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUseTwoStarForMatch = (match) => {
    if (!match) return false;
    if (match.group) return true;
    
    const tournamentName = (match.tournament_name || '').toLowerCase();
    const matchName = (match.name || '').toLowerCase();
    
    if (tournamentName.includes('round of 32') || tournamentName.includes('round of 16') ||
        matchName.includes('round of 32') || matchName.includes('round of 16') ||
        tournamentName.includes('r32') || tournamentName.includes('r16') ||
        matchName.includes('r32') || matchName.includes('r16')) {
      return true;
    }
    
    return false;
  };

  const canUseTwoStar = () => {
    if (!twoStarStatus || !twoStarStatus.enabled) return false;
    if (twoStarStatus.global_used >= twoStarStatus.max_per_user_global) return false;
    if (!canUseTwoStarForMatch(selectedMatch)) return false;
    
    const isEditing = selectedMatch && hasPrediction(selectedMatch.id);
    
    if (isEditing) {
      const existingPrediction = getPrediction(selectedMatch.id);
      if (existingPrediction && existingPrediction.used_two_star) return true;
      if (!existingPrediction?.used_two_star && predictionData.used_two_star) {
        return twoStarStatus.global_used < twoStarStatus.max_per_user_global;
      }
      return true;
    }
    
    return twoStarStatus.global_used < twoStarStatus.max_per_user_global;
  };

  const getTournamentStarsUsed = () => {
    if (!twoStarStatus) return 0;
    return twoStarStatus.global_used || 0;
  };

  const getTwoStarErrorMessage = () => {
    if (!twoStarStatus || !twoStarStatus.enabled) return '2-Star feature is disabled';
    if (predictionData.used_two_star) return '';
    if (!canUseTwoStarForMatch(selectedMatch)) {
      return '2-Star predictions are only available for Group Stage, Round of 32, and Round of 16 matches';
    }
    const globalUsed = twoStarStatus.global_used;
    if (globalUsed >= twoStarStatus.max_per_user_global) {
      return `Maximum total stars reached (${twoStarStatus.max_per_user_global})`;
    }
    return '2-Star not available for this match';
  };

  const getStarsRemaining = () => {
    if (!twoStarStatus) return 0;
    return Math.max(0, twoStarStatus.max_per_user_global - twoStarStatus.global_used);
  };

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          const response = await fetch('http://localhost:8000/api/matches/', {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (response.ok) {
            const dbMatches = await response.json();
            setMatches(dbMatches);
            localStorage.setItem('matches', JSON.stringify(dbMatches));
          }
        }
        
        if (token) {
          const twoStarResponse = await fetch('http://localhost:8000/api/predictions/two-star-status/', {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (twoStarResponse.ok) {
            setTwoStarStatus(await twoStarResponse.json());
          }
        }
        
        if (token) {
          const predictionsResponse = await fetch('http://localhost:8000/api/predictions/my/', {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (predictionsResponse.ok) {
            const userPreds = await predictionsResponse.json();
            setUserPredictions(Array.isArray(userPreds) ? userPreds : []);
            
            const predsObj = {};
            if (Array.isArray(userPreds)) {
              userPreds.forEach(pred => {
                predsObj[pred.match] = {
                  id: pred.id,
                  predicted_score_a: pred.predicted_a,
                  predicted_score_b: pred.predicted_b,
                  used_two_star: pred.used_two_star || false,
                  points_awarded: pred.points_awarded
                };
              });
            }
            setPredictions(predsObj);
          }
        }
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const getMatchStatus = (match) => {
    if (match.status === 'completed') return 'completed';
    const now = new Date();
    const startTime = new Date(match.start_time);
    if (now >= startTime) return 'started';
    return 'upcoming';
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return getMatchStatus(match) === filter;
  }).sort((a, b) => {
    const statusA = getMatchStatus(a);
    const statusB = getMatchStatus(b);
    
    if (statusA === 'completed' && statusB !== 'completed') return 1;
    if (statusA !== 'completed' && statusB === 'completed') return -1;
    
    return new Date(a.start_time) - new Date(b.start_time);
  });

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMatches = filteredMatches.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'from-blue-400 to-blue-600';
      case 'started': return 'from-red-400 to-red-600';
      case 'completed': return 'from-gray-400 to-gray-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const handleMakePrediction = (match) => {
    setSelectedMatch(match);
    setPredictionData({ predicted_score_a: '', predicted_score_b: '', used_two_star: false });
    setShowPredictionModal(true);
  };

  const canEditPrediction = (match) => {
    if (match.status !== 'upcoming') return false;
    const matchTime = new Date(match.start_time);
    const currentTime = new Date();
    const timeDiff = matchTime.getTime() - currentTime.getTime();
    const minutesUntilMatch = timeDiff / (1000 * 60);
    return minutesUntilMatch > 5;
  };

  const handleEditPrediction = (match) => {
    const prediction = getPrediction(match.id);
    setSelectedMatch(match);
    setPredictionData({
      predicted_score_a: prediction.predicted_score_a.toString(),
      predicted_score_b: prediction.predicted_score_b.toString(),
      used_two_star: prediction.used_two_star || false
    });
    setShowPredictionModal(true);
  };

  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to make predictions');
      return;
    }

    try {
      const existingPrediction = Array.isArray(userPredictions) ? userPredictions.find(pred => pred.match === selectedMatch.id) : null;
      
      const requestPredictionData = {
        predicted_a: parseInt(predictionData.predicted_score_a),
        predicted_b: parseInt(predictionData.predicted_score_b),
        used_two_star: predictionData.used_two_star
      };

      let response;
      if (existingPrediction) {
        response = await fetch(`http://localhost:8000/api/predictions/${existingPrediction.id}/update/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify(requestPredictionData)
        });
      } else {
        response = await fetch(`http://localhost:8000/api/predictions/matches/${selectedMatch.id}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify(requestPredictionData)
        });
      }

      if (response.ok) {
        const predictionsResponse = await fetch('http://localhost:8000/api/predictions/my/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (predictionsResponse.ok) {
          const userPreds = await predictionsResponse.json();
          setUserPredictions(Array.isArray(userPreds) ? userPreds : []);
          
          const predsObj = {};
          if (Array.isArray(userPreds)) {
            userPreds.forEach(pred => {
              predsObj[pred.match] = {
                predicted_score_a: pred.predicted_a,
                predicted_score_b: pred.predicted_b,
                used_two_star: pred.used_two_star || false,
                id: pred.id
              };
            });
          }
          setPredictions(predsObj);
        }
        
        const twoStarResponse = await fetch('http://localhost:8000/api/predictions/two-star-status/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (twoStarResponse.ok) {
          setTwoStarStatus(await twoStarResponse.json());
        }
        
        setShowPredictionModal(false);
        setSelectedMatch(null);
        setPredictionData({ predicted_score_a: '', predicted_score_b: '', used_two_star: false });
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Failed to save prediction');
    }
  };

  const hasPrediction = (matchId) => predictions[matchId];
  const getPrediction = (matchId) => predictions[matchId];

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
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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
                  <h6 className="text-xl md:text-2xl font-bold text-white mb-1">Matches</h6>
                  <p className="text-blue-100 text-sm">View and predict upcoming matches (Times in Bhutan Time - UTC+6)</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Filter Buttons - Modernized */}
            <div className="mb-6 bg-white shadow-lg rounded-2xl p-4 border border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { key: 'all', label: 'All Matches', icon: Trophy },
                  { key: 'upcoming', label: 'Upcoming', icon: Clock },
                  { key: 'started', label: 'Started', icon: Zap },
                  { key: 'completed', label: 'Completed', icon: Calendar }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center ${
                      filter === key
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedMatches.map((match) => (
                <div key={match.id} className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 transform hover:-translate-y-1">
                  <div className="p-6">
                    {/* Status Badge with Gradient */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getStatusColor(getMatchStatus(match))}`}>
                        {getMatchStatus(match).toUpperCase()}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Trophy className="h-4 w-4 mr-1" />
                        <span className="font-medium">{match.tournament_year}</span>
                      </div>
                    </div>

                    {match.group && (
                      <div className="flex items-center text-sm text-purple-600 mb-3 bg-purple-50 px-3 py-1 rounded-lg">
                        <Users className="h-4 w-4 mr-1" />
                        {match.group}
                      </div>
                    )}

                    {/* Teams Display */}
                    <div className="text-center mb-4">
                      <div className="flex justify-between items-center mb-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                        <div className="flex-1 text-right">
                          <p className="font-bold text-lg text-gray-900">{match.team_a_name}</p>
                          <p className="text-xs text-gray-500">{match.team_a_code}</p>
                        </div>
                        <div className="px-4">
                          {match.status === 'completed' ? (
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {match.score_a} - {match.score_b}
                            </div>
                          ) : (
                            <div className="text-gray-400 font-semibold">vs</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900">{match.team_b_name}</p>
                          <p className="text-xs text-gray-500">{match.team_b_code}</p>
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{formatBhutanTime(match.start_time)}</span>
                      </div>
                      <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4 mr-2 text-green-600" />
                        <span>{match.venue}</span>
                      </div>
                    </div>

                    {/* Prediction Section */}
                    {match.status === 'upcoming' && (
                      <div className="mt-4">
                        {hasPrediction(match.id) ? (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-green-700">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                <span className="text-sm font-bold">
                                  {getPrediction(match.id).predicted_score_a} - {getPrediction(match.id).predicted_score_b}
                                </span>
                                {getPrediction(match.id).used_two_star && (
                                  <div className="flex items-center ml-2 bg-yellow-100 px-2 py-1 rounded-full">
                                    <Star className="h-3 w-3 text-yellow-600 mr-1" />
                                    <span className="text-xs text-yellow-700 font-bold">2-Star</span>
                                  </div>
                                )}
                              </div>
                              {canEditPrediction(match) ? (
                                <button
                                  onClick={() => handleEditPrediction(match)}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-bold"
                                >
                                  Edit
                                </button>
                              ) : (
                                <span className="text-gray-500 text-xs font-medium">Locked</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            {canEditPrediction(match) ? (
                              <button
                                onClick={() => handleMakePrediction(match)}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                              >
                                Make Prediction
                              </button>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                <p className="text-gray-500 text-sm text-center font-medium">
                                  Predictions Locked
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Modernized */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mb-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">
                  {currentPage} / {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {paginatedMatches.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No matches found</p>
              </div>
            )}

            {/* Recent Predictions Section */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Recent Predictions</h3>
              </div>
              <div className="p-6">
                <RecentPredictions />
              </div>
            </div>

            {/* Prediction Modal - Modernized */}
            {showPredictionModal && selectedMatch && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-sm opacity-50"></div>
                  
                  <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                      <h3 className="text-xl font-bold text-white">Make Prediction</h3>
                      <p className="text-sm text-blue-100">
                        {selectedMatch.team_a_name} vs {selectedMatch.team_b_name}
                      </p>
                    </div>
                    
                    <form onSubmit={handleSubmitPrediction} className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {selectedMatch.team_a_name}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={predictionData.predicted_score_a}
                            onChange={(e) => setPredictionData(prev => ({ ...prev, predicted_score_a: e.target.value }))}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            {selectedMatch.team_b_name}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={predictionData.predicted_score_b}
                            onChange={(e) => setPredictionData(prev => ({ ...prev, predicted_score_b: e.target.value }))}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-bold"
                          />
                        </div>
                      </div>

                      {twoStarStatus && twoStarStatus.enabled && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <span className="font-bold text-gray-900">Use 2-Star?</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={predictionData.used_two_star}
                                onChange={(e) => setPredictionData(prev => ({ ...prev, used_two_star: e.target.checked }))}
                                className="sr-only peer"
                                disabled={!canUseTwoStar()}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                            </label>
                          </div>
                          
                          <div className="text-xs text-gray-700 space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>Stars Remaining:</span>
                              <span className="text-yellow-700">{getStarsRemaining()}/{twoStarStatus.max_per_user_global}</span>
                            </div>
                            {!canUseTwoStar() && (
                              <div className="text-red-600 text-xs mt-2 font-medium">
                                {getTwoStarErrorMessage()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowPredictionModal(false)}
                          className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};