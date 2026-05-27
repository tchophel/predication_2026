import React, { useState, useEffect } from 'react';
import { Trophy, Star, CheckCircle, XCircle, Menu, Search, ChevronLeft, ChevronRight, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const PredictionList = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoints, setSelectedPoints] = useState({});
  const [awardingPoints, setAwardingPoints] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const pointOptions = [
    { value: 7, label: '7 pts', userGets: 14, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 5, label: '5 pts', userGets: 10, color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 2, label: '2 pts', userGets: 4, color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 0, label: '0 pts', userGets: 0, color: 'bg-red-100 text-red-800 border-red-300' }
  ];

  useEffect(() => {
    fetchPredictions();
  }, []);

  useEffect(() => {
    if (predictions.length > 0 && !loading) {
      const predictionsNeedingAward = predictions.filter(pred => {
        const { score_a, score_b } = pred.match_details || {};
        const hasResult = score_a !== undefined && score_b !== undefined && score_a !== null && score_b !== null;
        const needsAwarding = pred.points_awarded === null || pred.points_awarded === undefined;
        return hasResult && needsAwarding;
      });

      if (predictionsNeedingAward.length > 0) {
        const performAutoAward = async () => {
          try {
            const token = localStorage.getItem('authToken');
            const awardPromises = predictionsNeedingAward.map(async (prediction) => {
              const { predicted_a, predicted_b } = prediction;
              const { score_a, score_b } = prediction.match_details || {};
              
              let base_points = 0;
              
              if (predicted_a === score_a && predicted_b === score_b) {
                base_points = 7;
              } else if (predicted_a === score_a || predicted_b === score_b) {
                base_points = 5;
              } else if ((predicted_a > predicted_b && score_a > score_b) || 
                       (predicted_a < predicted_b && score_a < score_b) ||
                       (predicted_a === predicted_b && score_a === score_b)) {
                base_points = 2;
              } else {
                base_points = 0;
              }
              
              const response = await fetch(`/api/predictions/matches/${prediction.id}/award-points/`, {
                method: 'POST',
                headers: {
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              return response;
            });

            await Promise.all(awardPromises);
            fetchPredictions();
            
            setSuccessMessage(`Automatically awarded points for ${predictionsNeedingAward.length} predictions`);
            setTimeout(() => setSuccessMessage(''), 3000);
          } catch (error) {
            console.error('Error auto-awarding points:', error);
          }
        };

        performAutoAward();
      }
    }
  }, [predictions, loading]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setErrorMessage('No authentication token found');
        setPredictions([]);
        setLoading(false);
        return;
      }

      const predictionsResponse = await fetch('/api/predictions/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (predictionsResponse.ok) {
        const userPreds = await predictionsResponse.json();
        
        let predictionsArray = [];
        if (Array.isArray(userPreds)) {
          predictionsArray = userPreds;
        } else if (userPreds && typeof userPreds === 'object') {
          predictionsArray = userPreds.results || userPreds.data || userPreds.predictions || [];
        }
        
        const predictionsData = predictionsArray.map(prediction => ({
          id: prediction.id,
          user_name: prediction.user_name,
          user: prediction.user,
          predicted_a: prediction.predicted_a,
          predicted_b: prediction.predicted_b,
          used_two_star: prediction.used_two_star,
          points_awarded: prediction.points_awarded,
          match_details: prediction.match_details,
          base_points: prediction.base_points,
          final_points: prediction.final_points,
          can_edit: prediction.can_edit,
          created_at: prediction.created_at,
          updated_at: prediction.updated_at
        }));
        
        setPredictions(predictionsData);
        
        if (predictionsData.length === 0) {
          console.log('No predictions found');
        }
      } else {
        setErrorMessage(`Failed to load predictions: HTTP ${predictionsResponse.status}`);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setErrorMessage(`Failed to load predictions: ${error.message}`);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = (prediction) => {
    const { predicted_a, predicted_b, used_two_star } = prediction;
    const { score_a, score_b } = prediction.match_details || {};
    
    if (score_a === undefined || score_b === undefined || score_a === null || score_b === null) {
      return { base_points: 0, final_points: 0, status: 'Not Played' };
    }
    
    let base_points = 0;
    
    if (predicted_a === score_a && predicted_b === score_b) {
      base_points = 7;
    } else if (predicted_a === score_a || predicted_b === score_b) {
      base_points = 5;
    } else if ((predicted_a > predicted_b && score_a > score_b) || 
             (predicted_a < predicted_b && score_a < score_b) ||
             (predicted_a === predicted_b && score_a === score_b)) {
      base_points = 2;
    } else {
      base_points = 0;
    }
    
    const final_points = used_two_star ? base_points * 2 : base_points;
    
    return {
      base_points,
      final_points,
      status: base_points > 0 ? 'Correct' : 'Wrong'
    };
  };

  const awardPoints = async (predictionId, userId) => {
    const points = selectedPoints[predictionId];
    if (!points && points !== 0) {
      setErrorMessage('Please select points to award');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      setAwardingPoints(true);
      
      const response = await api.post('/api/predictions/award-points/', {
        prediction_id: predictionId,
        points: points
      });

      const awardedPoints = response.data.prediction.points_awarded;
      const userPoints = awardedPoints * 2;
      
      setSuccessMessage(`Successfully awarded ${awardedPoints} points! User receives ${userPoints} points`);
      
      await fetchPredictions();

      setSelectedPoints(prev => {
        const newSelected = { ...prev };
        delete newSelected[predictionId];
        return newSelected;
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error awarding points:', error);
      setErrorMessage(`Failed to award points: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setAwardingPoints(false);
    }
  };

  const isAdmin = user?.is_staff || user?.username === 'admin';

  const filteredPredictions = Array.isArray(predictions) ? predictions.filter(prediction => {
    const matchesSearch = prediction.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prediction.match_details?.team_a_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prediction.match_details?.team_b_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' ||
                         (statusFilter === 'awarded' && prediction.points_awarded) ||
                         (statusFilter === 'pending' && !prediction.points_awarded);
    
    return matchesSearch && matchesFilter;
  }) : [];

  const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPredictions = filteredPredictions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading predictions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <div className="flex-1">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Gradient */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 shadow-xl">
              <div className="relative z-10">
                <h6 className="text-2xl md:text-2xl font-bold text-white mb-2">Prediction Awards</h6>
                <p className="text-blue-100">Manage and award points for user predictions</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Search and Filters - Modernized */}
          <div className="mb-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by user or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Wrong</option>
                  <option value="awarded">Correct</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-800 font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Mobile Card Layout */}
          <div className="lg:hidden">
            <div className="space-y-4">
              {paginatedPredictions.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">No predictions found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
                </div>
              ) : (
                paginatedPredictions.map((prediction) => {
                  const calculated = calculatePoints(prediction);
                  return (
                    <div key={prediction.id} className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 mb-1">
                            {prediction.match_details?.team_a_name || 'Team A'} vs {prediction.match_details?.team_b_name || 'Team B'}
                          </h4>
                          <p className="text-xs text-gray-500">{prediction.user_name || prediction.user?.username}</p>
                          <p className="text-xs text-gray-500">{formatDate(prediction.match_details?.start_time)}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          prediction.points_awarded !== null && prediction.points_awarded !== undefined
                            ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white' 
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                        }`}>
                          {prediction.points_awarded !== null && prediction.points_awarded !== undefined ? 'Awarded' : 'Pending'}
                        </span>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3 mb-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">Prediction</p>
                            <div className="flex items-center">
                              <span className="text-sm font-bold text-gray-900">
                                {prediction.predicted_a} - {prediction.predicted_b}
                              </span>
                              {prediction.used_two_star && (
                                <Star className="h-3 w-3 text-yellow-500 ml-1" />
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">Actual</p>
                            <p className="text-sm font-bold text-gray-900">
                              {prediction.match_details?.score_a !== undefined && prediction.match_details?.score_b !== undefined 
                                ? `${prediction.match_details.score_a} - ${prediction.match_details.score_b}`
                                : 'Not played'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className={`text-lg font-bold ${calculated.final_points > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {calculated.final_points} pts
                          {calculated.final_points > 0 && prediction.used_two_star && (
                            <Star className="h-4 w-4 text-yellow-500 inline ml-1" />
                          )}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          calculated.status === 'Not Played' 
                            ? 'bg-gray-200 text-gray-700'
                            : calculated.status === 'Correct'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white'
                            : 'bg-gradient-to-r from-red-400 to-pink-600 text-white'
                        }`}>
                          {calculated.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Match
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Prediction
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPredictions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                          <Trophy className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">No predictions found</p>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPredictions.map((prediction) => {
                      const calculated = calculatePoints(prediction);
                      return (
                        <tr key={prediction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-bold text-gray-900">
                                {prediction.match_details?.team_a_name || 'Team A'} vs {prediction.match_details?.team_b_name || 'Team B'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(prediction.match_details?.start_time)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{prediction.user_name || prediction.user?.username}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="text-sm font-bold text-gray-900">
                                {prediction.predicted_a} - {prediction.predicted_b}
                              </span>
                              {prediction.used_two_star && (
                                <div className="ml-2 bg-yellow-100 px-2 py-1 rounded-full flex items-center">
                                  <Star className="h-3 w-3 text-yellow-600" />
                                  <span className="text-xs font-bold text-yellow-700 ml-1">2-Star</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {prediction.match_details?.score_a !== undefined && prediction.match_details?.score_b !== undefined 
                                ? `${prediction.match_details.score_a} - ${prediction.match_details.score_b}`
                                : 'Not played'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className={`text-sm font-bold flex items-center ${
                                calculated.final_points > 0 ? 'text-green-600' : 'text-gray-500'
                              }`}>
                                {calculated.final_points} pts
                                {calculated.final_points > 0 && prediction.used_two_star && (
                                  <Star className="h-4 w-4 text-yellow-500 ml-1" />
                                )}
                              </div>
                              {calculated.final_points > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Base: {calculated.base_points} pts
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                              calculated.status === 'Not Played' 
                                ? 'bg-gray-200 text-gray-700'
                                : calculated.status === 'Correct'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white'
                                : 'bg-gradient-to-r from-red-400 to-pink-600 text-white'
                            }`}>
                              {calculated.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Modernized */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
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

          {/* Points System Info - Redesigned */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Award className="h-6 w-6 mr-2 text-blue-600" />
              Points System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-green-900">Exact Score</h3>
                    <p className="text-sm text-green-700">Perfect prediction</p>
                  </div>
                  <div className="text-3xl font-bold text-green-600">7</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-blue-900">One Score</h3>
                    <p className="text-sm text-blue-700">One team exact</p>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">5</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-yellow-900">Winner</h3>
                    <p className="text-sm text-yellow-700">Right outcome</p>
                  </div>
                  <div className="text-3xl font-bold text-yellow-600">2</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">Wrong</h3>
                    <p className="text-sm text-gray-700">No match</p>
                  </div>
                  <div className="text-3xl font-bold text-gray-600">0</div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
              <div className="flex items-center">
                <Star className="h-6 w-6 text-yellow-600 mr-2" />
                <p className="text-sm font-bold text-yellow-900">
                  2-Star Bonus: Doubles your points (14, 10, or 4 points)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};