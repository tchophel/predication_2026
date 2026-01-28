import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Plus, Edit, Trash2, Users, Filter, X, Save, Award, CheckCircle, Menu, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const MatchManagement = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [error, setError] = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoringMatch, setScoringMatch] = useState(null);
  const [scoreData, setScoreData] = useState({
    score_a: '',
    score_b: ''
  });
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

  const worldCup2026Teams = [
    { name: 'United States', code: 'USA' }, { name: 'Canada', code: 'CAN' }, { name: 'Mexico', code: 'MEX' },
    { name: 'Argentina', code: 'ARG' }, { name: 'Brazil', code: 'BRA' }, { name: 'Uruguay', code: 'URU' },
    { name: 'Ecuador', code: 'ECU' }, { name: 'Colombia', code: 'COL' }, { name: 'Peru', code: 'PER' },
    { name: 'Chile', code: 'CHI' }, { name: 'Spain', code: 'ESP' }, { name: 'England', code: 'ENG' },
    { name: 'France', code: 'FRA' }, { name: 'Netherlands', code: 'NED' }, { name: 'Germany', code: 'GER' },
    { name: 'Italy', code: 'ITA' }, { name: 'Portugal', code: 'POR' }, { name: 'Belgium', code: 'BEL' },
    { name: 'Croatia', code: 'CRO' }, { name: 'Denmark', code: 'DEN' }, { name: 'Switzerland', code: 'SUI' },
    { name: 'Poland', code: 'POL' }, { name: 'Serbia', code: 'SRB' }, { name: 'Morocco', code: 'MAR' },
    { name: 'Senegal', code: 'SEN' }, { name: 'Tunisia', code: 'TUN' }, { name: 'Cameroon', code: 'CMR' },
    { name: 'Ghana', code: 'GHA' }, { name: 'Nigeria', code: 'NGR' }, { name: 'Ivory Coast', code: 'CIV' },
    { name: 'Egypt', code: 'EGY' }, { name: 'Algeria', code: 'ALG' }, { name: 'Japan', code: 'JPN' },
    { name: 'South Korea', code: 'KOR' }, { name: 'Australia', code: 'AUS' }, { name: 'Iran', code: 'IRN' },
    { name: 'Saudi Arabia', code: 'KSA' }, { name: 'Qatar', code: 'QAT' }, { name: 'United Arab Emirates', code: 'UAE' },
    { name: 'Iraq', code: 'IRQ' }, { name: 'Uzbekistan', code: 'UZB' }
  ];

  const worldCup2026Venues = [
    'MetLife Stadium (New York/New Jersey)', 'SoFi Stadium (Los Angeles)', 'AT&T Stadium (Dallas)',
    'Lumen Field (Seattle)', 'Gillette Stadium (Boston)', 'Levi\'s Stadium (San Francisco)',
    'BMO Field (Toronto)', 'Estadio Akron (Guadalajara)', 'NRG Stadium (Houston)',
    'Lincoln Financial Field (Philadelphia)', 'Hard Rock Stadium (Miami)', 'Arrowhead Stadium (Kansas City)',
    'Mercedes-Benz Stadium (Atlanta)', 'Nissan Stadium (Nashville)', 'Camping World Stadium (Orlando)',
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
      const matchData = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        tournament_year: parseInt(formData.tournament_year),
        group: formData.group || null,
      };

      if (editingMatch) {
        await api.put(`/api/matches/${editingMatch.id}/`, matchData);
      } else {
        await api.post('/api/matches/', matchData);
      }
      
      await fetchMatches();
      resetForm();
    } catch (error) {
      console.error('Error saving match:', error);
      setError(`Failed to save match: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    const startTime = new Date(match.start_time);
    const localDateTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      ...match,
      start_time: localDateTime,
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

  const handleScoreMatch = (match) => {
    setScoringMatch(match);
    setScoreData({
      score_a: match.score_a || '',
      score_b: match.score_b || ''
    });
    setShowScoreModal(true);
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    
    if (!scoringMatch) return;
    
    try {
      await api.put(`/api/matches/${scoringMatch.id}/`, {
        ...scoringMatch,
        score_a: Number.parseInt(scoreData.score_a),
        score_b: Number.parseInt(scoreData.score_b),
        status: 'completed'
      });

      setShowScoreModal(false);
      setScoringMatch(null);
      setScoreData({ score_a: '', score_b: '' });
      await fetchMatches();
      setError('');
    } catch (error) {
      console.error('Error scoring match:', error);
      setError('Failed to score match');
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
      case 'upcoming': return 'from-blue-400 to-blue-600';
      case 'started': return 'from-red-400 to-red-600';
      case 'completed': return 'from-gray-400 to-gray-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getMatchStatus = (match) => {
    if (match.status === 'completed') return 'completed';
    const now = new Date();
    const startTime = new Date(match.start_time);
    if (now >= startTime) return 'started';
    return 'upcoming';
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
      const dateKey = new Date(match.start_time).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(match);
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dates = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a), dateB = new Date(b);
      const isAFuture = dateA >= today, isBFuture = dateB >= today;
      
      if (isAFuture !== isBFuture) return isBFuture ? -1 : 1;
      return isAFuture ? dateA - dateB : dateB - dateA;
    });
    
    const result = {};
    dates.forEach(date => result[date] = grouped[date]);
    return result;
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'group') return match.group;
    return getMatchStatus(match) === filter;
  });

  const groupedMatches = groupMatchesByDate(filteredMatches);

  const getPaginatedGroupedMatches = () => {
    const allDates = Object.keys(groupedMatches);
    const totalPages = Math.ceil(allDates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDates = allDates.slice(startIndex, startIndex + itemsPerPage);
    
    const paginatedGrouped = {};
    paginatedDates.forEach(date => paginatedGrouped[date] = groupedMatches[date]);
    
    return {
      paginatedGrouped,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  };

  const { paginatedGrouped, totalPages, hasNextPage, hasPrevPage } = getPaginatedGroupedMatches();

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
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 shadow-xl">
              <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h6 className="text-xl md:text-2xl font-bold text-white mb-1">Match Management</h6>
                  <p className="text-blue-100 text-sm">Manage FIFA World Cup 2026 matches</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Match
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6 bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Matches', icon: Trophy },
                  { key: 'upcoming', label: 'Upcoming', icon: Clock },
                  { key: 'started', label: 'Started', icon: Zap },
                  { key: 'completed', label: 'Completed', icon: CheckCircle }
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
          </div>

          <div className="space-y-6">
            {Object.entries(paginatedGrouped).map(([date, dateMatches]) => (
              <div key={date} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
                  <h3 className="text-lg font-bold flex items-center">
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getStatusColor(getMatchStatus(match))}`}>
                            {getMatchStatus(match).toUpperCase()}
                          </span>
                          {match.group && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-400 to-purple-600 text-white">
                              <Users className="h-3 w-3 mr-1" />
                              {match.group}
                            </span>
                          )}
                          <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                            <Trophy className="h-4 w-4 mr-1" />
                            {match.tournament_year}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getMatchStatus(match) !== 'completed' && (
                            <button onClick={() => handleScoreMatch(match)} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-lg transition-all transform hover:scale-110" title="Score match">
                              <Award className="h-5 w-5" />
                            </button>
                          )}
                          <button onClick={() => handleEdit(match)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-2 rounded-lg transition-all transform hover:scale-110" title="Edit match">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(match.id)} className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition-all transform hover:scale-110" title="Delete match">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-8">
                            <div className="text-center">
                              <p className="font-bold text-lg text-gray-900">{match.team_a_name}</p>
                              <p className="text-sm text-gray-500 bg-white px-2 py-1 rounded mt-1">{match.team_a_code}</p>
                            </div>
                            
                            <div className="text-center">
                              {getMatchStatus(match) === 'completed' ? (
                                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  {match.score_a} - {match.score_b}
                                </div>
                              ) : (
                                <div className="text-gray-400 text-2xl font-bold">vs</div>
                              )}
                            </div>
                            
                            <div className="text-center">
                              <p className="font-bold text-lg text-gray-900">{match.team_b_name}</p>
                              <p className="text-sm text-gray-500 bg-white px-2 py-1 rounded mt-1">{match.team_b_code}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-600">
                          <div className="flex items-center bg-white px-3 py-2 rounded-lg flex-1">
                            <Clock className="h-4 w-4 mr-2 text-blue-600" />
                            {formatDateTime(match.start_time)}
                          </div>
                          <div className="flex items-center bg-white px-3 py-2 rounded-lg flex-1">
                            <Calendar className="h-4 w-4 mr-2 text-green-600" />
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

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!hasPrevPage}
                className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">
                {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={!hasNextPage}
                className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {filteredMatches.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-semibold mb-2">No matches found</p>
              <p className="text-gray-400 text-sm">Click "Add Match" to create your first match</p>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-sm opacity-50"></div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-base font-bold text-white">{editingMatch ? 'Edit Match' : 'Add New Match'}</h2>
                    <button onClick={resetForm} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Team A <span className="text-red-500">*</span></label>
                        <select
                          name="team_a_name"
                          value={formData.team_a_name}
                          onChange={(e) => {
                            const selectedTeam = worldCup2026Teams.find(team => team.name === e.target.value);
                            if (selectedTeam) handleTeamSelect('team_a', selectedTeam);
                          }}
                          required
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        >
                          <option value="">Select Team A</option>
                          {worldCup2026Teams.map(team => (
                            <option key={team.code} value={team.name}>{team.name} ({team.code})</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Team B <span className="text-red-500">*</span></label>
                        <select
                          name="team_b_name"
                          value={formData.team_b_name}
                          onChange={(e) => {
                            const selectedTeam = worldCup2026Teams.find(team => team.name === e.target.value);
                            if (selectedTeam) handleTeamSelect('team_b', selectedTeam);
                          }}
                          required
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        >
                          <option value="">Select Team B</option>
                          {worldCup2026Teams.map(team => (
                            <option key={team.code} value={team.name}>{team.name} ({team.code})</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Start Time <span className="text-red-500">*</span></label>
                        <input
                          type="datetime-local"
                          name="start_time"
                          value={formData.start_time}
                          onChange={handleInputChange}
                          required
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Venue <span className="text-red-500">*</span></label>
                        <select
                          name="venue"
                          value={formData.venue}
                          onChange={handleInputChange}
                          required
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        >
                          <option value="">Select Venue</option>
                          {worldCup2026Venues.map(venue => (
                            <option key={venue} value={venue}>{venue}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Tournament Year <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          name="tournament_year"
                          value={formData.tournament_year}
                          onChange={handleInputChange}
                          required
                          min="2020"
                          max="2030"
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">Group / Stage</label>
                        <select
                          name="group"
                          value={formData.group}
                          onChange={handleInputChange}
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        >
                          <option value="">No Group/Stage</option>
                          <optgroup label="Knockout Rounds">
                            <option value="Round of 32">Round of 32</option>
                            <option value="Round of 16">Round of 16</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-all text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md text-xs"
                      >
                        <Save className="h-3 w-3" />
                        <span>{editingMatch ? 'Update' : 'Create'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showScoreModal && scoringMatch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-sm opacity-50"></div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2 flex justify-between items-center rounded-t-2xl">
                    <h3 className="text-base font-bold text-white">Score Match & Award Points</h3>
                    <button onClick={() => setShowScoreModal(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleScoreSubmit} className="p-3">
                    <div className="mb-2 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-2">
                      <p className="text-xs font-bold text-gray-900 text-center">
                        {scoringMatch.team_a_name} vs {scoringMatch.team_b_name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">{scoringMatch.team_a_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.score_a}
                          onChange={(e) => setScoreData(prev => ({ ...prev, score_a: e.target.value }))}
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-0.5">{scoringMatch.team_b_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.score_b}
                          onChange={(e) => setScoreData(prev => ({ ...prev, score_b: e.target.value }))}
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-2 mb-3">
                      <p className="text-xs text-green-800 font-medium">
                        <strong className="block mb-0.5">Automatic Scoring:</strong>
                        • Exact: 7 pts (14 with 2-Star)<br/>
                        • One Score: 5 pts (10 with 2-Star)<br/>
                        • Winner: 2 pts (4 with 2-Star)<br/>
                        • Wrong: 0 pts
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowScoreModal(false)}
                        className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-all text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-md text-xs"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Submit Score</span>
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
  );
};