import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Plus, Edit, Trash2, Users, Filter, X, Save } from 'lucide-react';
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const MatchManagement = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    team_a_name: '',
    team_a_code: '',
    team_b_name: '',
    team_b_code: '',
    start_time: '',
    venue: '',
    tournament_name: 'FIFA World Cup',
    tournament_year: 2026,
    group: '',
    status: 'upcoming'
  });

  // World Cup 2026 participating countries
  const worldCup2026Teams = [
    { name: 'United States', code: 'USA', confederation: 'CONCACAF' },
    { name: 'Canada', code: 'CAN', confederation: 'CONCACAF' },
    { name: 'Mexico', code: 'MEX', confederation: 'CONCACAF' },
    { name: 'Argentina', code: 'ARG', confederation: 'CONMEBOL' },
    { name: 'Brazil', code: 'BRA', confederation: 'CONMEBOL' },
    { name: 'Uruguay', code: 'URU', confederation: 'CONMEBOL' },
    { name: 'Ecuador', code: 'ECU', confederation: 'CONMEBOL' },
    { name: 'Colombia', code: 'COL', confederation: 'CONMEBOL' },
    { name: 'Peru', code: 'PER', confederation: 'CONMEBOL' },
    { name: 'Chile', code: 'CHI', confederation: 'CONMEBOL' },
    { name: 'Spain', code: 'ESP', confederation: 'UEFA' },
    { name: 'England', code: 'ENG', confederation: 'UEFA' },
    { name: 'France', code: 'FRA', confederation: 'UEFA' },
    { name: 'Netherlands', code: 'NED', confederation: 'UEFA' },
    { name: 'Germany', code: 'GER', confederation: 'UEFA' },
    { name: 'Italy', code: 'ITA', confederation: 'UEFA' },
    { name: 'Portugal', code: 'POR', confederation: 'UEFA' },
    { name: 'Belgium', code: 'BEL', confederation: 'UEFA' },
    { name: 'Croatia', code: 'CRO', confederation: 'UEFA' },
    { name: 'Denmark', code: 'DEN', confederation: 'UEFA' },
    { name: 'Switzerland', code: 'SUI', confederation: 'UEFA' },
    { name: 'Poland', code: 'POL', confederation: 'UEFA' },
    { name: 'Serbia', code: 'SRB', confederation: 'UEFA' },
    { name: 'Morocco', code: 'MAR', confederation: 'CAF' },
    { name: 'Senegal', code: 'SEN', confederation: 'CAF' },
    { name: 'Tunisia', code: 'TUN', confederation: 'CAF' },
    { name: 'Cameroon', code: 'CMR', confederation: 'CAF' },
    { name: 'Ghana', code: 'GHA', confederation: 'CAF' },
    { name: 'Nigeria', code: 'NGR', confederation: 'CAF' },
    { name: 'Ivory Coast', code: 'CIV', confederation: 'CAF' },
    { name: 'Egypt', code: 'EGY', confederation: 'CAF' },
    { name: 'Algeria', code: 'ALG', confederation: 'CAF' },
    { name: 'Japan', code: 'JPN', confederation: 'AFC' },
    { name: 'South Korea', code: 'KOR', confederation: 'AFC' },
    { name: 'Australia', code: 'AUS', confederation: 'AFC' },
    { name: 'Iran', code: 'IRN', confederation: 'AFC' },
    { name: 'Saudi Arabia', code: 'KSA', confederation: 'AFC' },
    { name: 'Qatar', code: 'QAT', confederation: 'AFC' },
    { name: 'United Arab Emirates', code: 'UAE', confederation: 'AFC' },
    { name: 'Iraq', code: 'IRQ', confederation: 'AFC' },
    { name: 'Uzbekistan', code: 'UZB', confederation: 'AFC' }
  ];

  // World Cup 2026 venues
  const worldCup2026Venues = [
    'MetLife Stadium (New York/New Jersey)',
    'SoFi Stadium (Los Angeles)',
    'AT&T Stadium (Dallas)',
    'Lumen Field (Seattle)',
    'Gillette Stadium (Boston)',
    'Levi\'s Stadium (San Francisco)',
    'BMO Field (Toronto)',
    'Estadio Akron (Guadalajara)',
    'NRG Stadium (Houston)',
    'Lincoln Financial Field (Philadelphia)',
    'Hard Rock Stadium (Miami)',
    'Arrowhead Stadium (Kansas City)',
    'Mercedes-Benz Stadium (Atlanta)',
    'Nissan Stadium (Nashville)',
    'Camping World Stadium (Orlando)',
    'Estadio Monumental (Mexico City)'
  ];

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/matches/');
      setMatches(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Convert datetime-local to ISO format
      const startTime = new Date(formData.start_time).toISOString();
      
      const matchData = {
        team_a_name: formData.team_a_name,
        team_a_code: formData.team_a_code,
        team_b_name: formData.team_b_name,
        team_b_code: formData.team_b_code,
        start_time: startTime,
        status: formData.status,
        venue: formData.venue,
        tournament_name: formData.tournament_name,
        tournament_year: parseInt(formData.tournament_year),
        group: formData.group || null,
      };

      if (editingMatch) {
        // Update existing match
        await api.put(`/api/matches/${editingMatch.id}/`, matchData);
      } else {
        // Create new match
        await api.post('/api/matches/', matchData);
      }
      
      await fetchMatches();
      resetForm();
    } catch (error) {
      console.error('Error saving match:', error);
      if (error.response?.data) {
        const errors = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        setError(`Failed to save match: ${errors}`);
      } else {
        setError('Failed to save match. Please try again.');
      }
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    
    // Convert ISO date to datetime-local format
    const startTime = new Date(match.start_time);
    const localDateTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setFormData({
      team_a_name: match.team_a_name,
      team_a_code: match.team_a_code,
      team_b_name: match.team_b_name,
      team_b_code: match.team_b_code,
      start_time: localDateTime,
      venue: match.venue,
      tournament_name: match.tournament_name || 'FIFA World Cup',
      tournament_year: match.tournament_year || 2026,
      group: match.group || '',
      status: match.status
    });
    setShowAddModal(true);
  };

  const handleDelete = async (matchId) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      try {
        await api.delete(`/api/matches/${matchId}/`);
        await fetchMatches();
        setError('');
      } catch (error) {
        console.error('Error deleting match:', error);
        setError('Failed to delete match');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      team_a_name: '',
      team_a_code: '',
      team_b_name: '',
      team_b_code: '',
      start_time: '',
      venue: '',
      tournament_name: 'FIFA World Cup',
      tournament_year: 2026,
      group: '',
      status: 'upcoming'
    });
    setEditingMatch(null);
    setShowAddModal(false);
    setError('');
  };

  const handleTeamSelect = (teamType, team) => {
    setFormData(prev => ({
      ...prev,
      [`${teamType}_name`]: team.name,
      [`${teamType}_code`]: team.code
    }));
  };

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

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const groupMatchesByDate = (matchesList) => {
    const grouped = {};
    
    matchesList.forEach(match => {
      const date = new Date(match.start_time);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    
    return grouped;
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'group') return match.group;
    return match.status === filter;
  });

  const groupedMatches = groupMatchesByDate(filteredMatches);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Match Management</h1>
            <p className="mt-2 text-gray-600">Manage FIFA World Cup 2026 matches</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Match</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <div className="flex space-x-2">
            {['all', 'upcoming', 'live', 'finished'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Match Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingMatch ? 'Edit Match' : 'Add New Match'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team A <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="team_a_name"
                    value={formData.team_a_name}
                    onChange={(e) => {
                      const selectedTeam = worldCup2026Teams.find(team => team.name === e.target.value);
                      if (selectedTeam) {
                        handleTeamSelect('team_a', selectedTeam);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Team A</option>
                    {worldCup2026Teams.map(team => (
                      <option key={team.code} value={team.name}>
                        {team.name} ({team.code}) - {team.confederation}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team B <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="team_b_name"
                    value={formData.team_b_name}
                    onChange={(e) => {
                      const selectedTeam = worldCup2026Teams.find(team => team.name === e.target.value);
                      if (selectedTeam) {
                        handleTeamSelect('team_b', selectedTeam);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Team B</option>
                    {worldCup2026Teams.map(team => (
                      <option key={team.code} value={team.name}>
                        {team.name} ({team.code}) - {team.confederation}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Venue</option>
                    {worldCup2026Venues.map(venue => (
                      <option key={venue} value={venue}>
                        {venue}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tournament_name"
                    value={formData.tournament_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="tournament_year"
                    value={formData.tournament_year}
                    onChange={handleInputChange}
                    required
                    min="2020"
                    max="2030"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group (Optional)
                  </label>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No Group</option>
                    {Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                      <option key={letter} value={`Group ${letter}`}>Group {letter}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingMatch ? 'Update' : 'Create'} Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grouped Matches by Date */}
      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {date}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {dateMatches.length} match{dateMatches.length > 1 ? 'es' : ''} scheduled
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {dateMatches.map((match) => (
                <div key={match.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </span>
                      {match.group && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Users className="h-3 w-3 mr-1" />
                          {match.group}
                        </span>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <Trophy className="h-4 w-4 mr-1" />
                        {match.tournament_name} {match.tournament_year}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(match)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit match"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(match.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete match"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className="font-semibold text-lg">{match.team_a_name}</p>
                        <p className="text-sm text-gray-500">{match.team_a_code}</p>
                      </div>
                      
                      <div className="text-center">
                        {match.status === 'finished' ? (
                          <div className="text-2xl font-bold">
                            {match.score_a} - {match.score_b}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xl">vs</div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="font-semibold text-lg">{match.team_b_name}</p>
                        <p className="text-sm text-gray-500">{match.team_b_code}</p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-end">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDateTime(match.start_time)}
                      </div>
                      <div className="flex items-center justify-end">
                        <Calendar className="h-4 w-4 mr-2" />
                        {match.venue}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No matches found</p>
          <p className="text-gray-400 text-sm">Click "Add Match" to create your first match</p>
        </div>
      )}
    </div>
  );
};