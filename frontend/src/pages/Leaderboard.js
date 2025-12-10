import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Mock data - replace with actual API call
        const mockLeaderboard = [
          { rank: 1, username: 'john_doe', total_points: 45, correct_predictions: 12, accuracy: 75 },
          { rank: 2, username: 'jane_smith', total_points: 38, correct_predictions: 10, accuracy: 71 },
          { rank: 3, username: 'mike_wilson', total_points: 35, correct_predictions: 9, accuracy: 69 },
          { rank: 4, username: 'sarah_jones', total_points: 32, correct_predictions: 8, accuracy: 67 },
          { rank: 5, username: 'admin', total_points: 28, correct_predictions: 7, accuracy: 64 },
          { rank: 6, username: 'alex_brown', total_points: 25, correct_predictions: 6, accuracy: 60 },
          { rank: 7, username: 'emma_davis', total_points: 22, correct_predictions: 5, accuracy: 56 },
          { rank: 8, username: 'chris_miller', total_points: 18, correct_predictions: 4, accuracy: 50 },
        ];
        setLeaderboard(mockLeaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
      default:
        return 'bg-white border-gray-200';
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="mt-2 text-gray-600">Top predictors in the tournament</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Top 3 podium */}
        {leaderboard.slice(0, 3).map((user, index) => (
          <div key={user.rank} className={`relative bg-white shadow-lg rounded-lg border-2 ${getRankBgColor(user.rank)}`}>
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                {getRankIcon(user.rank)}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{user.username}</h3>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">{user.total_points}</div>
                <div className="text-sm text-gray-600">Total Points</div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">{user.correct_predictions}</div>
                    <div className="text-xs text-gray-500">Correct</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-800">{user.accuracy}%</div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rest of the leaderboard */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Full Rankings</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correct Predictions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((user) => (
                  <tr key={user.rank} className={user.rank <= 3 ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(user.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">{user.total_points}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.correct_predictions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.accuracy}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No predictions have been made yet.</p>
        </div>
      )}
    </div>
    </>
  );
};
