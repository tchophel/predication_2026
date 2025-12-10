import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Users, TrendingUp } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState({});
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [predictionData, setPredictionData] = useState({
    predicted_score_a: '',
    predicted_score_b: ''
  });

  // Convert UTC to Bhutan time (UTC+6)
  const convertToBhutanTime = (utcString) => {
    const date = new Date(utcString);
    // Bhutan is UTC+6, so we add 6 hours to UTC
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

  useEffect(() => {
    // Load matches from database first, then localStorage as backup
    const loadMatches = async () => {
      try {
        // Get auth token
        const token = localStorage.getItem('authToken');
        console.log('Loading matches - auth token found:', !!token);
        
        if (token) {
          // Try to load from database first
          console.log('Fetching from database...');
          const response = await fetch('/api/matches/', {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          
          console.log('Database response status:', response.status);
          
          if (response.ok) {
            const dbMatches = await response.json();
            console.log('Loaded matches from database:', dbMatches);
            setMatches(dbMatches);
            // Also update localStorage with database data
            localStorage.setItem('matches', JSON.stringify(dbMatches));
          } else {
            const errorText = await response.text();
            console.warn('Failed to load from database:', errorText);
            console.warn('Using localStorage');
            loadFromLocalStorage();
          }
        } else {
          console.warn('No auth token, using localStorage only');
          loadFromLocalStorage();
        }
        
        // Load existing predictions
        const storedPredictions = localStorage.getItem('predictions');
        if (storedPredictions) {
          setPredictions(JSON.parse(storedPredictions));
        }
      } catch (error) {
        console.error('Error loading matches:', error);
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
      const storedMatches = localStorage.getItem('matches');
      if (storedMatches) {
        const localMatches = JSON.parse(storedMatches);
        console.log('Found matches in localStorage:', localMatches.length);
        setMatches(localMatches);
      } else {
        console.log('No matches found in localStorage');
      }
    };

    loadMatches();
  }, []);

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'live':
        return 'bg-red-100 text-red-800';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMakePrediction = (match) => {
    setSelectedMatch(match);
    setPredictionData({
      predicted_score_a: '',
      predicted_score_b: ''
    });
    setShowPredictionModal(true);
  };

  const canEditPrediction = (match) => {
    if (match.status !== 'upcoming') return false;
    
    const matchTime = new Date(match.start_time);
    const currentTime = new Date();
    const timeDiff = matchTime.getTime() - currentTime.getTime();
    const minutesUntilMatch = timeDiff / (1000 * 60);
    
    // Allow editing only if match is more than 5 minutes away
    return minutesUntilMatch > 5;
  };

  const handleEditPrediction = (match) => {
    const prediction = getPrediction(match.id);
    setSelectedMatch(match);
    setPredictionData({
      predicted_score_a: prediction.predicted_score_a.toString(),
      predicted_score_b: prediction.predicted_score_b.toString()
    });
    setShowPredictionModal(true);
  };

  const handleSubmitPrediction = (e) => {
    e.preventDefault();
    
    const newPrediction = {
      match_id: selectedMatch.id,
      predicted_score_a: parseInt(predictionData.predicted_score_a),
      predicted_score_b: parseInt(predictionData.predicted_score_b),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedPredictions = {
      ...predictions,
      [selectedMatch.id]: newPrediction
    };

    setPredictions(updatedPredictions);
    localStorage.setItem('predictions', JSON.stringify(updatedPredictions));
    setShowPredictionModal(false);
    setSelectedMatch(null);
    setPredictionData({ predicted_score_a: '', predicted_score_b: '' });
  };

  const hasPrediction = (matchId) => {
    return predictions[matchId];
  };

  const getPrediction = (matchId) => {
    return predictions[matchId];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
          <p className="mt-2 text-gray-600">View and predict upcoming matches (Times shown in Bhutan Time - UTC+6)</p>
        </div>

        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Matches
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('live')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === 'live'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setFilter('finished')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === 'finished'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Finished
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <div key={match.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Trophy className="h-4 w-4 mr-1" />
                    {match.tournament_name} {match.tournament_year}
                  </div>
                </div>

                {match.group && (
                  <div className="flex items-center text-sm text-purple-600 mb-3">
                    <Users className="h-4 w-4 mr-1" />
                    {match.group}
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-lg">{match.team_a_name}</p>
                      <p className="text-sm text-gray-500">{match.team_a_code}</p>
                    </div>
                    <div className="px-4">
                      {match.status === 'finished' ? (
                        <div className="text-2xl font-bold">
                          {match.score_a} - {match.score_b}
                        </div>
                      ) : (
                        <div className="text-gray-400">vs</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{match.team_b_name}</p>
                      <p className="text-sm text-gray-500">{match.team_b_code}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatBhutanTime(match.start_time)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {match.venue}
                  </div>
                </div>

                {/* Prediction Section */}
                {match.status === 'upcoming' && (
                  <div className="mt-4">
                    {hasPrediction(match.id) ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-700">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">
                              Your Prediction: {getPrediction(match.id).predicted_score_a} - {getPrediction(match.id).predicted_score_b}
                            </span>
                          </div>
                          {canEditPrediction(match) ? (
                            <button
                              onClick={() => handleEditPrediction(match)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs">Locked</span>
                          )}
                        </div>
                        {!canEditPrediction(match) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Predictions locked 5 minutes before match start
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {canEditPrediction(match) ? (
                          <button
                            onClick={() => handleMakePrediction(match)}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            Make Prediction
                          </button>
                        ) : (
                          <div className="bg-gray-100 text-gray-500 py-2 px-4 rounded-md text-center text-sm">
                            Predictions closed - Match starts soon
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

        {filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No matches found. Add matches in Match Management to see them here.</p>
          </div>
        )}

        {/* Prediction Modal */}
        {showPredictionModal && selectedMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Make Prediction</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedMatch.team_a_name} vs {selectedMatch.team_b_name}
                </p>
              </div>
              
              <form onSubmit={handleSubmitPrediction} className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className="font-medium">{selectedMatch.team_a_name}</p>
                      <p className="text-sm text-gray-500">{selectedMatch.team_a_code}</p>
                    </div>
                    <span className="text-gray-400">vs</span>
                    <div className="text-center">
                      <p className="font-medium">{selectedMatch.team_b_name}</p>
                      <p className="text-sm text-gray-500">{selectedMatch.team_b_code}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedMatch.team_a_name} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={predictionData.predicted_score_a}
                      onChange={(e) => setPredictionData(prev => ({ ...prev, predicted_score_a: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedMatch.team_b_name} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={predictionData.predicted_score_b}
                      onChange={(e) => setPredictionData(prev => ({ ...prev, predicted_score_b: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPredictionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Submit Prediction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
