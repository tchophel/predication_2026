import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Trophy, Clock, Star, TrendingUp, Globe, Search, Users, Calendar, BarChart3, FileText, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Users as UsersManagement } from './Users';
import { Navbar } from '../components/Navbar';

export const Dashboard = () => {
  const { user } = useAuth();
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
    { name: "United States", country: "United States", badge: "https://crests.football-data.org/USA.svg", confederation: "CONCACAF", status: "Host" },
    { name: "Canada", country: "Canada", badge: "https://crests.football-data.org/CAN.svg", confederation: "CONCACAF", status: "Host" },
    { name: "Mexico", country: "Mexico", badge: "https://crests.football-data.org/MEX.svg", confederation: "CONCACAF", status: "Host" },
    { name: "Costa Rica", country: "Costa Rica", badge: "https://crests.football-data.org/CRI.svg", confederation: "CONCACAF", status: "Likely" },
    { name: "Jamaica", country: "Jamaica", badge: "https://crests.football-data.org/JAM.svg", confederation: "CONCACAF", status: "Likely" },
    { name: "Panama", country: "Panama", badge: "https://crests.football-data.org/PAN.svg", confederation: "CONCACAF", status: "Likely" },
    
    // UEFA (16 slots)
    { name: "Germany", country: "Germany", badge: "https://crests.football-data.org/759.svg", confederation: "UEFA", status: "Likely" },
    { name: "France", country: "France", badge: "https://crests.football-data.org/773.svg", confederation: "UEFA", status: "Likely" },
    { name: "Spain", country: "Spain", badge: "https://crests.football-data.org/760.svg", confederation: "UEFA", status: "Likely" },
    { name: "England", country: "England", badge: "https://crests.football-data.org/770.svg", confederation: "UEFA", status: "Likely" },
    { name: "Italy", country: "Italy", badge: "https://crests.football-data.org/784.svg", confederation: "UEFA", status: "Likely" },
    { name: "Portugal", country: "Portugal", badge: "https://crests.football-data.org/765.svg", confederation: "UEFA", status: "Likely" },
    { name: "Netherlands", country: "Netherlands", badge: "https://crests.football-data.org/8601.svg", confederation: "UEFA", status: "Likely" },
    { name: "Belgium", country: "Belgium", badge: "https://crests.football-data.org/805.svg", confederation: "UEFA", status: "Likely" },
    { name: "Croatia", country: "Croatia", badge: "https://crests.football-data.org/799.svg", confederation: "UEFA", status: "Likely" },
    { name: "Denmark", country: "Denmark", badge: "https://crests.football-data.org/782.svg", confederation: "UEFA", status: "Likely" },
    { name: "Switzerland", country: "Switzerland", badge: "https://crests.football-data.org/788.svg", confederation: "UEFA", status: "Likely" },
    { name: "Austria", country: "Austria", badge: "https://crests.football-data.org/754.svg", confederation: "UEFA", status: "Likely" },
    { name: "Poland", country: "Poland", badge: "https://crests.football-data.org/794.svg", confederation: "UEFA", status: "Likely" },
    { name: "Ukraine", country: "Ukraine", badge: "https://crests.football-data.org/UKR.svg", confederation: "UEFA", status: "Likely" },
    { name: "Sweden", country: "Sweden", badge: "https://crests.football-data.org/792.svg", confederation: "UEFA", status: "Likely" },
    { name: "Serbia", country: "Serbia", badge: "https://crests.football-data.org/SRB.svg", confederation: "UEFA", status: "Likely" },
    
    // CONMEBOL (6 slots)
    { name: "Argentina", country: "Argentina", badge: "https://crests.football-data.org/783.svg", confederation: "CONMEBOL", status: "Likely" },
    { name: "Brazil", country: "Brazil", badge: "https://crests.football-data.org/781.svg", confederation: "CONMEBOL", status: "Likely" },
    { name: "Uruguay", country: "Uruguay", badge: "https://crests.football-data.org/URY.svg", confederation: "CONMEBOL", status: "Likely" },
    { name: "Colombia", country: "Colombia", badge: "https://crests.football-data.org/COL.svg", confederation: "CONMEBOL", status: "Likely" },
    { name: "Ecuador", country: "Ecuador", badge: "https://crests.football-data.org/ECU.svg", confederation: "CONMEBOL", status: "Likely" },
    { name: "Chile", country: "Chile", badge: "https://crests.football-data.org/CHI.svg", confederation: "CONMEBOL", status: "Likely" },
    
    // CAF (9 slots)
    { name: "Senegal", country: "Senegal", badge: "https://crests.football-data.org/SEN.svg", confederation: "CAF", status: "Likely" },
    { name: "Morocco", country: "Morocco", badge: "https://crests.football-data.org/MAR.svg", confederation: "CAF", status: "Likely" },
    { name: "Tunisia", country: "Tunisia", badge: "https://crests.football-data.org/TUN.svg", confederation: "CAF", status: "Likely" },
    { name: "Egypt", country: "Egypt", badge: "https://crests.football-data.org/EGY.svg", confederation: "CAF", status: "Likely" },
    { name: "Nigeria", country: "Nigeria", badge: "https://crests.football-data.org/NGA.svg", confederation: "CAF", status: "Likely" },
    { name: "Cameroon", country: "Cameroon", badge: "https://crests.football-data.org/CMR.svg", confederation: "CAF", status: "Likely" },
    { name: "Ghana", country: "Ghana", badge: "https://crests.football-data.org/GHA.svg", confederation: "CAF", status: "Likely" },
    { name: "Algeria", country: "Algeria", badge: "https://crests.football-data.org/ALG.svg", confederation: "CAF", status: "Likely" },
    { name: "Ivory Coast", country: "Ivory Coast", badge: "https://crests.football-data.org/CIV.svg", confederation: "CAF", status: "Likely" },
    
    // AFC (8 slots)
    { name: "Japan", country: "Japan", badge: "https://crests.football-data.org/JPN.svg", confederation: "AFC", status: "Likely" },
    { name: "South Korea", country: "South Korea", badge: "https://crests.football-data.org/KOR.svg", confederation: "AFC", status: "Likely" },
    { name: "Iran", country: "Iran", badge: "https://crests.football-data.org/IRN.svg", confederation: "AFC", status: "Likely" },
    { name: "Australia", country: "Australia", badge: "https://crests.football-data.org/AUS.svg", confederation: "AFC", status: "Likely" },
    { name: "Saudi Arabia", country: "Saudi Arabia", badge: "https://crests.football-data.org/KSA.svg", confederation: "AFC", status: "Likely" },
    { name: "Qatar", country: "Qatar", badge: "https://crests.football-data.org/QAT.svg", confederation: "AFC", status: "Likely" },
    { name: "Iraq", country: "Iraq", badge: "https://crests.football-data.org/IRQ.svg", confederation: "AFC", status: "Likely" },
    { name: "United Arab Emirates", country: "UAE", badge: "https://crests.football-data.org/UAE.svg", confederation: "AFC", status: "Likely" },
    
    // OFC (1 slot)
    { name: "New Zealand", country: "New Zealand", badge: "https://crests.football-data.org/NZL.svg", confederation: "OFC", status: "Likely" },
    
    // Playoff Winners (2 slots)
    { name: "Wales", country: "Wales", badge: "https://crests.football-data.org/WAL.svg", confederation: "UEFA", status: "Playoff" },
    { name: "Peru", country: "Peru", badge: "https://crests.football-data.org/PER.svg", confederation: "CONMEBOL", status: "Playoff" },
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
        setStats({
          total_predictions: 12,
          correct_predictions: 7,
          two_star_used: 2,
          upcoming_matches: 3
        });
        
        if (isAdmin) {
          setAdminStats({
            total_users: 156,
            total_matches: 48,
            total_predictions: 1243,
            paid_users: 89
          });
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main Navigation */}
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome back, {user?.username}!
            </h1>
            <p className="mt-2 text-gray-600 text-lg">
              {isOnAdminRoute && isAdmin ? 'Welcome back, admin! Ready to make some predictions?' : 'Here\'s your prediction dashboard'}
            </p>
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

          {/* World Cup 2026 Teams - Shown to All Users */}
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
  );
};
// User Content Component
const UserContent = ({ user, stats }) => (
  <>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon={Trophy} label="Total Points" value={user?.total_points || 0} color="yellow" />
      <StatCard icon={TrendingUp} label="Predictions Made" value={stats.total_predictions} color="green" />
      <StatCard icon={Star} label="Two-Star Used" value={`${stats.two_star_used}/3`} color="blue" />
      <StatCard icon={Clock} label="Upcoming Matches" value={stats.upcoming_matches} color="purple" />
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RecentPredictions />
      <UpcomingMatches />
    </div>
  </>
);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${colors[color]}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recent Predictions Component
const RecentPredictions = () => (
  <div className="bg-white shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Predictions</h3>
      <div className="space-y-3">
        {[
          { match: "Brazil vs Argentina", prediction: "2-1", points: "+7 pts", success: true },
          { match: "France vs Germany", prediction: "1-2", points: "+5 pts", success: true },
          { match: "Spain vs Italy", prediction: "1-1", points: "0 pts", success: false }
        ].map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">{item.match}</p>
              <p className="text-sm text-gray-500">Your prediction: {item.prediction}</p>
            </div>
            <span className={`font-medium ${item.success ? 'text-green-600' : 'text-red-600'}`}>
              {item.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Upcoming Matches Component
const UpcomingMatches = () => (
  <div className="bg-white shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Matches</h3>
      <div className="space-y-3">
        {[
          { match: "England vs Netherlands", time: "Starts in 2 hours" },
          { match: "Portugal vs Belgium", time: "Starts tomorrow" }
        ].map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">{item.match}</p>
              <p className="text-sm text-gray-500">{item.time}</p>
            </div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
              Predict
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Admin Content Component
const AdminContent = ({ activeTab, adminStats }) => {
  switch (activeTab) {
    case 'users':
      return <UsersManagement />;
    case 'matches':
      return <MatchesManagement />;
    case 'import':
      return <ImportMatches />;
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
    <AdminStatCard icon={BarChart3} label="Paid Users" value={stats.paid_users} gradient="from-yellow-400 to-orange-500" />
  </div>
);

// Admin Stat Card Component
const AdminStatCard = ({ icon: Icon, label, value, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/90 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="bg-white/20 p-3 rounded-xl">
        <Icon className="h-8 w-8 text-white" />
      </div>
    </div>
  </div>
);

// Admin Management Components
const MatchesManagement = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-900">Match Management</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
        Create Match
      </button>
    </div>
    <div className="text-center py-12">
      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">Match management interface coming soon</p>
    </div>
  </div>
);

const ImportMatches = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Import Matches</h2>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</p>
      <p className="text-sm text-gray-500 mb-4">Upload a CSV file with match data</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
        Choose File
      </button>
    </div>
  </div>
);

const SystemSettings = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Limit per User
          </label>
          <input
            type="number"
            defaultValue="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prediction Lock Time (minutes)
          </label>
          <input
            type="number"
            defaultValue="5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Save Settings
        </button>
      </div>
    </div>
  </div>
);

// World Cup Teams Section Component
const WorldCupTeamsSection = ({
  worldCupTeams,
  filteredTeams,
  searchTerm,
  setSearchTerm,
  selectedConfederation,
  setSelectedConfederation,
  confederations,
  confederationCounts,
  teamsLoading,
  teamsError,
  fetchWorldCupTeams
}) => (
  <div className="bg-white shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
          <Globe className="h-7 w-7 mr-2 text-blue-600" />
          FIFA World Cup 2026 Teams
        </h3>
        <button
          onClick={fetchWorldCupTeams}
          disabled={teamsLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {teamsLoading ? 'Loading...' : 'Refresh Teams'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Globe className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900">World Cup 2026</h4>
            <p className="text-sm text-blue-700 mt-1">
              48 teams competing across USA 🇺🇸, Canada 🇨🇦, and Mexico 🇲🇽
            </p>
            <p className="text-xs text-blue-600 mt-1">
              *Qualifications ongoing. Final list will be confirmed by mid-2025
            </p>
          </div>
        </div>
      </div>

      {teamsError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          {teamsError}
        </div>
      )}

      {worldCupTeams.length > 0 && (
        <>
          {/* Search and Filter */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedConfederation}
              onChange={(e) => setSelectedConfederation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {confederations.map(conf => (
                <option key={conf} value={conf}>
                  {conf === 'ALL' ? 'All Confederations' : `${conf} (${confederationCounts[conf] || 0})`}
                </option>
              ))}
            </select>
          </div>

          {/* Confederation Summary */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <ConfederationCard name="UEFA" count={confederationCounts['UEFA']} region="Europe" color="red" />
            <ConfederationCard name="CAF" count={confederationCounts['CAF']} region="Africa" color="green" />
            <ConfederationCard name="CONMEBOL" count={confederationCounts['CONMEBOL']} region="South America" color="yellow" />
            <ConfederationCard name="CONCACAF" count={confederationCounts['CONCACAF']} region="North America" color="blue" />
            <ConfederationCard name="AFC" count={confederationCounts['AFC']} region="Asia" color="purple" />
            <ConfederationCard name="OFC" count={confederationCounts['OFC']} region="Oceania" color="indigo" />
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredTeams.map((team, index) => (
              <TeamCard key={team.name || `team-${index}`} team={team} />
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No teams found matching your search</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600 border-t pt-4">
            <div>
              Showing <span className="font-semibold text-gray-900">{filteredTeams.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{worldCupTeams.length}</span> teams
            </div>
            <div className="text-xs">
              Total slots: <span className="font-semibold">48 teams</span>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

// Confederation Card Component
const ConfederationCard = ({ name, count, region, color }) => {
  const colors = {
    red: 'bg-red-50 border-red-200 text-red-600 text-red-700 text-red-500',
    green: 'bg-green-50 border-green-200 text-green-600 text-green-700 text-green-500',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600 text-yellow-700 text-yellow-500',
    blue: 'bg-blue-50 border-blue-200 text-blue-600 text-blue-700 text-blue-500',
    purple: 'bg-purple-50 border-purple-200 text-purple-600 text-purple-700 text-purple-500',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600 text-indigo-700 text-indigo-500'
  };

  const [bg, border, textPrimary, textSecondary, textTertiary] = colors[color].split(' ');

  return (
    <div className={`${bg} p-3 rounded-lg border ${border}`}>
      <div className={`text-xs ${textPrimary} font-semibold`}>{name}</div>
      <div className={`text-2xl font-bold ${textSecondary}`}>{count || 0}</div>
      <div className={`text-xs ${textTertiary}`}>{region}</div>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team }) => (
  <div className="relative text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
    {team.status && (
      <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
        team.status === 'Host' ? 'bg-yellow-100 text-yellow-700' :
        team.status === 'Qualified' ? 'bg-green-100 text-green-700' :
        team.status === 'Likely' ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {team.status}
      </div>
    )}
    {team.badge && (
      <img 
        src={team.badge} 
        alt={team.name}
        className="h-12 w-12 mx-auto mb-3 object-contain"
        onError={(e) => { 
          e.target.onerror = null;
          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23e5e7eb"/><text x="24" y="28" font-size="20" text-anchor="middle" fill="%236b7280">?</text></svg>';
        }}
      />
    )}
    <p className="font-semibold text-sm text-gray-900 mb-1">{team.name}</p>
    <p className="text-xs text-gray-500">{team.confederation}</p>
  </div>
);