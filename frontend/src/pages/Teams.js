import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Flag, Menu, Search, Users, Calendar } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

const API = 'http://localhost:8000';

async function apiFetch(path) {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Token ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Map any raw stage/group value from the API to one of our defined stages
const STAGES = [
  { key: 'group',  label: 'Group Stage', short: 'Groups', color: 'from-blue-500 to-blue-700' },
  { key: 'r32',    label: 'Round of 32', short: 'R32',    color: 'from-indigo-500 to-indigo-700' },
  { key: 'r16',    label: 'Round of 16', short: 'R16',    color: 'from-purple-500 to-purple-700' },
  { key: 'qf',     label: 'Quarter Finals', short: 'QF',  color: 'from-pink-500 to-pink-700' },
  { key: 'sf',     label: 'Semi Finals', short: 'SF',     color: 'from-rose-500 to-rose-700' },
  { key: 'final',  label: 'Final',       short: 'Final',  color: 'from-yellow-500 to-orange-600' },
  { key: 'other',  label: 'Other',       short: 'Other',  color: 'from-gray-500 to-gray-700' },
];

function classifyStage(m) {
  const raw = (m.stage || m.round || m.group || m.matchday || '').toString().toLowerCase();
  if (/\bfinal\b/.test(raw) && !/semi/.test(raw) && !/quarter/.test(raw)) return 'final';
  if (/semi/.test(raw) || /\bsf\b/.test(raw))                              return 'sf';
  if (/quarter/.test(raw) || /\bqf\b/.test(raw))                           return 'qf';
  if (/round of 16|r16|\br16\b|last 16/.test(raw))                         return 'r16';
  if (/round of 32|r32|\br32\b|last 32/.test(raw))                         return 'r32';
  if (/group/.test(raw) || /^[a-h]$/.test(raw.trim()))                     return 'group';
  // If it looks like "Group A / B / …"
  if (/^group [a-l]/.test(raw))                                             return 'group';
  return 'other';
}

function getTeamName(val) {
  if (!val) return '?';
  if (typeof val === 'string') return val;
  return val.name || val.shortName || '?';
}

function formatDate(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return String(val); }
}

const matchShape = PropTypes.shape({
  home_team: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  team_a:    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  homeTeam:  PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  away_team: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  team_b:    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  awayTeam:  PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  date:       PropTypes.string,
  start_time: PropTypes.string,
  utcDate:    PropTypes.string,
  datetime:   PropTypes.string,
  venue:      PropTypes.string,
  stadium:    PropTypes.string,
  id:         PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

function MatchRow({ m, stageColor }) {
  const home  = getTeamName(m.home_team || m.team_a || m.homeTeam);
  const away  = getTeamName(m.away_team || m.team_b || m.awayTeam);
  const date  = formatDate(m.date || m.start_time || m.utcDate || m.datetime);
  const venue = m.venue || m.stadium || '';
  return (
    <div className="flex items-center px-5 py-4 hover:bg-blue-50/40 transition-colors">
      <div className="flex-1 text-right pr-4">
        <p className="font-bold text-gray-900 text-sm">{home}</p>
      </div>
      <div className="flex flex-col items-center shrink-0 min-w-[80px]">
        <span className={`bg-gradient-to-r ${stageColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow`}>
          VS
        </span>
        {date && <span className="text-[10px] text-gray-400 mt-1 text-center leading-tight">{date}</span>}
      </div>
      <div className="flex-1 pl-4">
        <p className="font-bold text-gray-900 text-sm">{away}</p>
        {venue && <p className="text-xs text-gray-400 truncate max-w-[160px]">{venue}</p>}
      </div>
    </div>
  );
}
MatchRow.propTypes = { m: matchShape.isRequired, stageColor: PropTypes.string.isRequired };

function TeamCard({ team }) {
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all">
      {team.flag ? (
        <img
          src={team.flag}
          alt={team.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 mb-3"
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-3">
          <Flag className="h-6 w-6 text-blue-400" />
        </div>
      )}
      <p className="font-bold text-gray-900 text-sm leading-tight">{team.name}</p>
      {team.code && <span className="mt-1 text-xs text-gray-400 font-mono">{team.code}</span>}
    </div>
  );
}
TeamCard.propTypes = {
  team: PropTypes.shape({
    id:   PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    code: PropTypes.string,
    flag: PropTypes.string,
    group: PropTypes.string,
  }).isRequired,
};

export const Teams = () => {
  const [teams, setTeams]       = useState([]);
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState('fixtures');
  const [stage, setStage]       = useState('group');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/matches/worldcup/teams/'),
      apiFetch('/api/matches/worldcup/matches/'),
    ])
      .then(([t, m]) => {
        setTeams(t.teams || []);
        setMatches(m.matches || []);
        // auto-select first stage that has matches
        const first = STAGES.find(s => (m.matches || []).some(mx => classifyStage(mx) === s.key));
        if (first) setStage(first.key);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // stages that actually have matches
  const activeStages = STAGES.filter(s => matches.some(m => classifyStage(m) === s.key));

  // matches for the current stage, filtered by search
  const stageMatches = matches
    .filter(m => classifyStage(m) === stage)
    .filter(m => {
      const q = search.toLowerCase();
      if (!q) return true;
      const home  = getTeamName(m.home_team || m.team_a || m.homeTeam).toLowerCase();
      const away  = getTeamName(m.away_team || m.team_b || m.awayTeam).toLowerCase();
      const venue = (m.venue || m.stadium || '').toLowerCase();
      return home.includes(q) || away.includes(q) || venue.includes(q);
    });

  // For Group Stage: sub-group by group letter
  const isGroupStage = stage === 'group';
  const subGroups = isGroupStage
    ? stageMatches.reduce((acc, m) => {
        const g = (m.group || m.stage || 'Fixtures').toString();
        if (!acc[g]) acc[g] = [];
        acc[g].push(m);
        return acc;
      }, {})
    : { all: stageMatches };
  const subGroupKeys = Object.keys(subGroups).sort((a, b) => a.localeCompare(b));

  // Teams tab
  const filteredTeams = teams.filter(t => {
    const q = search.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.code || '').toLowerCase().includes(q) ||
      (t.group || '').toLowerCase().includes(q)
    );
  });
  const groupedTeams = filteredTeams.reduce((acc, t) => {
    const g = t.group || 'Teams';
    if (!acc[g]) acc[g] = [];
    acc[g].push(t);
    return acc;
  }, {});
  const teamGroupKeys = Object.keys(groupedTeams).sort((a, b) => a.localeCompare(b));

  const currentStage = STAGES.find(s => s.key === stage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white shadow-lg text-gray-600"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 p-4 shadow-xl">
            <div className="relative z-10">
              <h1 className="text-2xl font-bold text-white">World Cup 2026</h1>
              <p className="text-green-100 text-sm mt-1">
                {teams.length} teams · {matches.length} fixtures
              </p>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* Fixtures / Teams tab switcher */}
          <div className="flex gap-2 mb-6">
            {[{ key: 'fixtures', label: 'Fixtures', icon: Calendar },
              { key: 'teams',    label: 'Teams',    icon: Users }].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setSearch(''); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-16" />)}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">{error}</div>
          )}

          {/* ── FIXTURES ── */}
          {!loading && !error && tab === 'fixtures' && (
            <>
              {/* Stage navigator */}
              {activeStages.length > 0 && (
                <div className="mb-6 bg-white rounded-2xl shadow border border-gray-100 p-3">
                  <div className="flex flex-wrap gap-2">
                    {activeStages.map(s => (
                      <button
                        key={s.key}
                        onClick={() => { setStage(s.key); setSearch(''); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          stage === s.key
                            ? `bg-gradient-to-r ${s.color} text-white shadow-md scale-105`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage header */}
              {currentStage && (
                <div className={`mb-4 px-5 py-3 rounded-2xl bg-gradient-to-r ${currentStage.color} text-white shadow flex items-center justify-between`}>
                  <span className="font-bold text-lg">{currentStage.label}</span>
                  <span className="text-sm opacity-80">{stageMatches.length} matches</span>
                </div>
              )}

              {/* Search (inside fixtures tab) */}
              <div className="mb-4 bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search team or venue…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                {search && <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
              </div>

              {stageMatches.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No matches for this stage</p>
                </div>
              )}

              {/* Sub-groups (Group A, B… or single list for KO rounds) */}
              {subGroupKeys.map(gKey => (
                <div key={gKey} className="mb-5 bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                  {isGroupStage && (
                    <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{gKey}</span>
                    </div>
                  )}
                  <div className="divide-y divide-gray-50">
                    {subGroups[gKey].map((m, i) => (
                      <MatchRow
                        key={m.id || i}
                        m={m}
                        stageColor={currentStage?.color || 'from-blue-500 to-purple-600'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── TEAMS ── */}
          {!loading && !error && tab === 'teams' && (
            <>
              {/* Search */}
              <div className="mb-6 bg-white rounded-2xl shadow p-3 flex items-center gap-3 border border-gray-100">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search team name, code or group…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                {search && <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
              </div>

              {teamGroupKeys.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No teams found</p>
                </div>
              )}

              {teamGroupKeys.map(group => (
                <div key={group} className="mb-8">
                  {group !== 'Teams' && (
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                      Group {group}
                    </h2>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {groupedTeams[group].map((team, i) => (
                      <TeamCard key={team.id || i} team={team} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
