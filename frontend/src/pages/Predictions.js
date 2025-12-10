import React, { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        // Mock data - replace with actual API call
        const mockPredictions = [
          {
            id: 1,
            match: {
              team_a: { name: 'Brazil', country_code: 'BRA' },
              team_b: { name: 'Argentina', country_code: 'ARG' },
              start_time: '2024-06-20T20:00:00Z',
              status: 'finished',
              score_a: 2,
              score_b: 1
            },
            predicted_a: 2,
            predicted_b: 1,
            used_two_star: false,
            points: 7,
            status: 'correct'
          },
          {
            id: 2,
            match: {
              team_a: { name: 'France', country_code: 'FRA' },
              team_b: { name: 'Germany', country_code: 'GER' },
              start_time: '2024-06-21T18:00:00Z',
              status: 'finished',
              score_a: 1,
              score_b: 2
            },
            predicted_a: 1,
            predicted_b: 2,
            used_two_star: true,
            points: 10,
            status: 'correct'
          },
          {
            id: 3,
            match: {
              team_a: { name: 'Spain', country_code: 'ESP' },
              team_b: { name: 'Italy', country_code: 'ITA' },
              start_time: '2024-06-22T21:00:00Z',
              status: 'finished',
              score_a: 1,
              score_b: 1
            },
            predicted_a: 2,
            predicted_b: 1,
            used_two_star: false,
            points: 0,
            status: 'incorrect'
          }
        ];
        setPredictions(mockPredictions);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct':
        return 'text-green-600';
      case 'partial':
        return 'text-yellow-600';
      case 'incorrect':
        return 'text-red-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'correct':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'partial':
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'incorrect':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPoints = predictions.reduce((sum, pred) => sum + (pred.points || 0), 0);
  const correctPredictions = predictions.filter(p => p.status === 'correct').length;
  const twoStarUsed = predictions.filter(p => p.used_two_star).length;

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Predictions</h1>
        <p className="mt-2 text-gray-600">View and manage your match predictions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Correct Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{correctPredictions}/{predictions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Two-Star Used</p>
              <p className="text-2xl font-bold text-gray-900">{twoStarUsed}/3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Prediction History</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Prediction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {prediction.match.team_a.name} vs {prediction.match.team_b.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTime(prediction.match.start_time)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {prediction.predicted_a} - {prediction.predicted_b}
                        </span>
                        {prediction.used_two_star && (
                          <Star className="h-4 w-4 text-yellow-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prediction.match.status === 'finished' ? (
                        <span className="text-sm font-medium text-gray-900">
                          {prediction.match.score_a} - {prediction.match.score_b}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getStatusColor(prediction.status)}`}>
                        {prediction.points || 0} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(prediction.status)}
                        <span className={`ml-2 text-sm font-medium ${getStatusColor(prediction.status)}`}>
                          {prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {predictions.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">You haven't made any predictions yet.</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Browse Matches
          </button>
        </div>
      )}
    </div>
    </>
  );
};
