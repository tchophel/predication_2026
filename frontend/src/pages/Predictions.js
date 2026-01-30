import React, { useState, useEffect } from 'react';
import { Trophy, Star, Menu, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn('No auth token found');
          setLoading(false);
          return;
        }

        const timestamp = Date.now();
        const response = await fetch(`http://localhost:8000/api/predictions/my/?_t=${timestamp}`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const predictionsData = await response.json();
          setPredictions(Array.isArray(predictionsData) ? predictionsData : []);
        } else {
          console.error('Failed to fetch predictions:', response.status);
          setPredictions([]);
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  
  const getPredictionStatus = (prediction) => {
    const match = prediction.match_details;
    
    if (!match) return 'pending';
    
    if (match.status === 'upcoming' || 
        match.status === 'SCHEDULED' || 
        (match.score_a === null && match.score_b === null)) {
      return 'pending';
    }
    
    if (prediction.points_awarded === null || prediction.points_awarded === undefined) {
      if (match.status === 'completed' || match.status === 'FINISHED') {
        return 'incorrect';
      }
      return 'pending';
    }
    
    if (prediction.points_awarded > 0) {
      return 'correct';
    }
    
    return 'incorrect';
  };

  // Calculate statistics
  const correctPredictions = predictions.filter(p => getPredictionStatus(p) === 'correct').length;
  const pendingPredictions = predictions.filter(p => getPredictionStatus(p) === 'pending').length;
  const totalPredictions = predictions.length;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
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
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
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
                <div className="flex justify-between items-center">
                  <div>
                    <h6 className="text-xl md:text-2xl font-bold text-white mb-1">My Predictions</h6>
                    <p className="text-blue-100 text-sm">Track your match predictions and performance</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Scoring System */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Scoring System
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                      7
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900">Exact Score</h4>
                      <p className="text-xs text-green-700">Perfect match!</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                      5
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900">One Score</h4>
                      <p className="text-xs text-blue-700">One team exact</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-yellow-900">Winner</h4>
                      <p className="text-xs text-yellow-700">Right outcome</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                      0
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Wrong</h4>
                      <p className="text-xs text-gray-700">No match</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
                <div className="flex items-start">
                  <Star className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-900 mb-1">2-Star Power-Up</p>
                    <p className="text-sm text-yellow-800">
                      Double your points when correct! (14, 10, or 4 points)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prediction History */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Your Predictions</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">
                    {correctPredictions} correct, {predictions.length - correctPredictions - pendingPredictions} wrong
                  </span>
                  <span className="text-sm text-gray-300">
                    {predictions.length} total predictions
                  </span>
                </div>
              </div>
            </div>
            
            {predictions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No Predictions Yet</h4>
                <p className="text-gray-600 mb-6">Start making predictions to see them here</p>
              </div>
            ) : (
              <>
                {/* Prediction Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 mb-1">{predictions.length}</div>
                      <div className="text-sm text-gray-600">Total Predictions Made</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">{correctPredictions}</div>
                      <div className="text-sm text-gray-600">Correct Predictions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-1">{pendingPredictions}</div>
                      <div className="text-sm text-gray-600">Pending Results</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-indigo-200">
                    <p className="text-center text-sm text-gray-600">
                      You have made predictions for {predictions.length} matches with {correctPredictions} correct so far!
                    </p>
                  </div>
                </div>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Match</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Your Prediction</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actual Result</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {predictions.map((prediction) => {
                        const status = getPredictionStatus(prediction);
                        return (
                          <tr key={prediction.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {prediction.match_details?.team_a_name || 'Team A'} vs {prediction.match_details?.team_b_name || 'Team B'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {prediction.match_details?.tournament_name} {prediction.match_details?.tournament_year}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <span className="font-bold text-lg text-gray-900">
                                  {prediction.predicted_a} - {prediction.predicted_b}
                                </span>
                                {prediction.used_two_star && (
                                  <div className="ml-2 bg-yellow-100 px-2 py-1 rounded-full flex items-center">
                                    <Star className="h-4 w-4 text-yellow-600" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-lg text-gray-900">
                                {prediction.match_details?.score_a !== null && prediction.match_details?.score_b !== null 
                                  ? `${prediction.match_details.score_a} - ${prediction.match_details.score_b}`
                                  : '-'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                prediction.points_awarded > 0 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {prediction.points_awarded !== null && prediction.points_awarded !== undefined 
                                  ? `${prediction.points_awarded > 0 ? '+' : ''}${prediction.points_awarded} pts` 
                                  : 'TBD'
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                status === 'correct' 
                                  ? 'bg-green-100 text-green-700 border border-green-300' 
                                  : status === 'incorrect'
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                              }`}>
                                {status === 'correct' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {status === 'incorrect' && <XCircle className="h-3 w-3 mr-1" />}
                                {status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-gray-200">
                  {predictions.map((prediction) => {
                    const status = getPredictionStatus(prediction);
                    return (
                      <div key={prediction.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {prediction.match_details?.team_a_name || 'Team A'} vs {prediction.match_details?.team_b_name || 'Team B'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {prediction.match_details?.tournament_name} {prediction.match_details?.tournament_year}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            status === 'correct' ? 'bg-green-100 text-green-700' :
                            status === 'incorrect' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-600 font-medium mb-1">Your Prediction</p>
                            <div className="flex items-center">
                              <span className="font-bold text-lg">{prediction.predicted_a} - {prediction.predicted_b}</span>
                              {prediction.used_two_star && <Star className="h-4 w-4 text-yellow-500 ml-2" />}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 font-medium mb-1">Actual Result</p>
                            <span className="font-bold text-lg">
                              {prediction.match_details?.score_a !== null && prediction.match_details?.score_b !== null 
                                ? `${prediction.match_details.score_a} - ${prediction.match_details.score_b}`
                                : '-'
                              }
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className={`font-bold ${
                            prediction.points_awarded > 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {prediction.points_awarded !== null && prediction.points_awarded !== undefined 
                              ? `${prediction.points_awarded > 0 ? '+' : ''}${prediction.points_awarded} points` 
                              : 'Pending'
                            }
                          </div>
                          {prediction.used_two_star && (
                            <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                              <Star className="h-3 w-3 mr-1" />
                              2-Star
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};