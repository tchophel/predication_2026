import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Calendar, Clock, Trophy, Users, Star, Menu,
  ChevronLeft, ChevronRight, Zap, Search, Flag, TrendingUp,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

// ─── WC Stage definitions ────────────────────────────────────────────────────
const STAGES = [
  { key: 'group', label: 'Group Stage',    short: 'Groups', color: 'from-blue-500 to-blue-700' },
  { key: 'r32',   label: 'Round of 32',    short: 'R32',    color: 'from-indigo-500 to-indigo-700' },
  { key: 'r16',   label: 'Round of 16',    short: 'R16',    color: 'from-purple-500 to-purple-700' },
  { key: 'qf',    label: 'Quarter Finals', short: 'QF',     color: 'from-pink-500 to-pink-700' },
  { key: 'sf',    label: 'Semi Finals',    short: 'SF',     color: 'from-rose-500 to-rose-700' },
  { key: 'final', label: 'Final',          short: 'Final',  color: 'from-yellow-500 to-orange-600' },
  { key: 'other', label: 'Other',          short: 'Other',  color: 'from-gray-500 to-gray-700' },
];

function classifyStage(m) {
  const raw = [m.stage, m.round, m.group, m.matchday, m.tournament_name, m.name]
    .filter(Boolean).join(' ').toLowerCase();
  if (/\bfinal\b/.test(raw) && !/semi/.test(raw) && !/quarter/.test(raw)) return 'final';
  if (/semi/.test(raw) || /\bsf\b/.test(raw))                              return 'sf';
  if (/quarter/.test(raw) || /\bqf\b/.test(raw))                           return 'qf';
  if (/round of 16|r16|\br16\b|last 16/.test(raw))                         return 'r16';
  if (/round of 32|r32|\br32\b|last 32/.test(raw))                         return 'r32';
  if (/group/.test(raw) || /^[a-h]$/.test((m.group || '').toString().trim().toLowerCase())) return 'group';
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
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
  } catch { return String(val); }
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function FlagBox({ code, flag, name }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="w-12 h-12 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm shrink-0">
      {flag && !imgErr ? (
        <img
          src={flag}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <span className="text-xs font-bold text-gray-500">{code}</span>
      )}
    </div>
  );
}
FlagBox.propTypes = {
  code: PropTypes.string,
  flag: PropTypes.string,
  name: PropTypes.string,
};

const matchShape = PropTypes.shape({
  home_team:   PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  team_a:      PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  homeTeam:    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  away_team:   PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  team_b:      PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  awayTeam:    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  team_a_code: PropTypes.string,
  team_b_code: PropTypes.string,
  home_code:   PropTypes.string,
  away_code:   PropTypes.string,
  date:        PropTypes.string,
  start_time:  PropTypes.string,
  utcDate:     PropTypes.string,
  datetime:    PropTypes.string,
  venue:       PropTypes.string,
  stadium:     PropTypes.string,
  id:          PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

function WcMatchRow({ m, stageColor, flagMap }) {
  const homeKey = getTeamName(m.home_team || m.team_a || m.homeTeam);
  const awayKey = getTeamName(m.away_team || m.team_b || m.awayTeam);
  const date    = formatDate(m.date || m.start_time || m.utcDate || m.datetime);
  const venue   = m.venue || m.stadium || '';
  const homeCode = m.team_a_code || m.home_code || '';
  const awayCode = m.team_b_code || m.away_code || '';
  return (
    <div className="flex items-center px-5 py-4 hover:bg-blue-50/40 transition-colors">
      {/* Home team */}
      <div className="flex-1 flex flex-col items-end gap-1 pr-4">
        <FlagBox code={homeCode || homeKey.slice(0,3).toUpperCase()} flag={flagMap[homeCode]} name={homeKey} />
        <p className="font-bold text-gray-900 text-sm text-right">{homeKey}</p>
      </div>
      {/* VS / score */}
      <div className="flex flex-col items-center shrink-0 min-w-[80px]">
        <span className={`bg-gradient-to-r ${stageColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow`}>VS</span>
        {date && <span className="text-[10px] text-gray-400 mt-1 text-center leading-tight">{date}</span>}
        {venue && <span className="text-[10px] text-gray-400 text-center truncate max-w-[120px]">{venue}</span>}
      </div>
      {/* Away team */}
      <div className="flex-1 flex flex-col items-start gap-1 pl-4">
        <FlagBox code={awayCode || awayKey.slice(0,3).toUpperCase()} flag={flagMap[awayCode]} name={awayKey} />
        <p className="font-bold text-gray-900 text-sm">{awayKey}</p>
      </div>
    </div>
  );
}
WcMatchRow.propTypes = {
  m: matchShape.isRequired,
  stageColor: PropTypes.string.isRequired,
  flagMap: PropTypes.objectOf(PropTypes.string).isRequired,
};

function TeamCard({ team }) {
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {team.flag ? (
        <img
          src={team.flag}
          alt={team.name}
          className="w-14 h-14 rounded-xl object-cover border-2 border-gray-200 mb-3 shadow-sm"
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-3">
          <Flag className="h-7 w-7 text-blue-400" />
        </div>
      )}
      <p className="font-bold text-gray-900 text-sm leading-tight">{team.name}</p>
      {team.code && <span className="mt-1 text-xs text-gray-400 font-mono">{team.code}</span>}
      {team.group && <span className="mt-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Group {team.group}</span>}
    </div>
  );
}
TeamCard.propTypes = {
  team: PropTypes.shape({
    id:    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name:  PropTypes.string,
    code:  PropTypes.string,
    flag:  PropTypes.string,
    group: PropTypes.string,
  }).isRequired,
};

// ─── Winner helper (avoids nested ternaries) ────────────────────────────────
function winner(scoreA, scoreB) {
  if (scoreA > scoreB) return 'h';
  if (scoreA < scoreB) return 'a';
  return 'd';
}

// ─── Points result for a completed fixture card ───────────────────────────────
function calcResult(pred, finalScoreA, finalScoreB) {
  const pa = Number(pred.predicted_score_a);
  const pb = Number(pred.predicted_score_b);
  const sa = Number(finalScoreA);
  const sb = Number(finalScoreB);

  if (pa === sa && pb === sb) {
    return { label: '🎯 Exact score!',     pts: pred.points_awarded ?? 7, grad: 'from-green-50 to-emerald-50',  border: 'border-green-300' };
  }
  if (pa === sa || pb === sb) {
    return { label: '✓ One score correct', pts: pred.points_awarded ?? 5, grad: 'from-blue-50 to-indigo-50',    border: 'border-blue-300' };
  }
  if (winner(pa, pb) === winner(sa, sb)) {
    return { label: '↑ Correct winner',    pts: pred.points_awarded ?? 2, grad: 'from-purple-50 to-violet-50',  border: 'border-purple-300' };
  }
  return   { label: '✗ Wrong prediction',  pts: pred.points_awarded ?? 0, grad: 'from-red-50 to-rose-50',       border: 'border-red-200' };
}

// ─── Single fixture card (API data + optional DB match for predictions) ───────
function FixtureCard({ m, stageColor, stageShort, getPrediction, hasPrediction, canEditPrediction, getMatchStatus, getStatusColor, formatBhutanTime, handleMakePrediction, handleEditPrediction }) {
  const dbM         = m.dbMatch;
  const dbStatus    = dbM ? getMatchStatus(dbM) : m.status;
  const pred        = dbM ? getPrediction(dbM.id) : null;
  const hasPred     = dbM ? !!hasPrediction(dbM.id) : false;
  const canEdit     = dbM ? canEditPrediction(dbM) : false;
  const finalScoreA = dbM?.score_a ?? m.scoreA;
  const finalScoreB = dbM?.score_b ?? m.scoreB;
  const isCompleted = dbStatus === 'completed' || m.status === 'completed';
  const result      = (isCompleted && hasPred && pred && finalScoreA !== null && finalScoreB !== null)
    ? calcResult(pred, finalScoreA, finalScoreB)
    : null;

  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 transform hover:-translate-y-1">
      <div className="p-6">

        {/* Status + stage */}
        <div className="flex justify-between items-center mb-4">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getStatusColor(dbStatus)}`}>
            {dbStatus.toUpperCase()}
          </span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${stageColor} text-white`}>
            {stageShort}
          </span>
        </div>

        {/* Teams + flags — all from API */}
        <div className="flex justify-between items-center bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 mb-4">
          <div className="flex-1 flex flex-col items-end gap-1.5">
            <FlagBox code={m.homeCode} flag={m.homeFlag} name={m.homeName} />
            <p className="font-bold text-sm text-gray-900 text-right leading-tight">{m.homeName}</p>
            <p className="text-[11px] text-gray-400 font-mono">{m.homeCode}</p>
          </div>
          <div className="px-4 text-center shrink-0">
            {isCompleted && finalScoreA !== null ? (
              <>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {finalScoreA} - {finalScoreB}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wide">Final</div>
              </>
            ) : (
              <div className="text-gray-300 font-bold text-xl">VS</div>
            )}
          </div>
          <div className="flex-1 flex flex-col items-start gap-1.5">
            <FlagBox code={m.awayCode} flag={m.awayFlag} name={m.awayName} />
            <p className="font-bold text-sm text-gray-900 leading-tight">{m.awayName}</p>
            <p className="text-[11px] text-gray-400 font-mono">{m.awayCode}</p>
          </div>
        </div>

        {/* Date & venue — from API */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg text-xs text-gray-700">
            <Calendar className="h-3.5 w-3.5 mr-2 text-blue-500 shrink-0" />
            <span>{m.date ? formatBhutanTime(m.date) : '—'}</span>
          </div>
          {m.venue && (
            <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg text-xs text-gray-700">
              <Clock className="h-3.5 w-3.5 mr-2 text-green-500 shrink-0" />
              <span className="truncate">{m.venue}</span>
            </div>
          )}
        </div>

        {/* Prediction (upcoming) */}
        {!isCompleted && dbM && (
          <PredictionSlot
            match={dbM}
            prediction={pred}
            hasPred={hasPred}
            canEdit={canEdit}
            onMake={handleMakePrediction}
            onEdit={handleEditPrediction}
          />
        )}
        {!isCompleted && !dbM && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-600 font-medium">Prediction not available yet</p>
          </div>
        )}

        {/* Result (completed + predicted) */}
        {result && (
          <div className={`rounded-xl p-3 border-2 bg-gradient-to-r ${result.grad} ${result.border}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600">Your prediction</span>
              <span className={`text-sm font-black ${result.pts > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {result.pts > 0 ? `+${result.pts}` : '0'} pts
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 text-sm">
                {pred.predicted_score_a} – {pred.predicted_score_b}
              </span>
              <span className="text-xs font-semibold text-gray-600">{result.label}</span>
            </div>
          </div>
        )}
        {isCompleted && !hasPred && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">No prediction was made</p>
          </div>
        )}

      </div>
    </div>
  );
}
FixtureCard.propTypes = {
  m:                    PropTypes.object.isRequired,
  stageColor:           PropTypes.string.isRequired,
  stageShort:           PropTypes.string.isRequired,
  getPrediction:        PropTypes.func.isRequired,
  hasPrediction:        PropTypes.func.isRequired,
  canEditPrediction:    PropTypes.func.isRequired,
  getMatchStatus:       PropTypes.func.isRequired,
  getStatusColor:       PropTypes.func.isRequired,
  formatBhutanTime:     PropTypes.func.isRequired,
  handleMakePrediction: PropTypes.func.isRequired,
  handleEditPrediction: PropTypes.func.isRequired,
};

// ─── Prediction slot inside a match card ─────────────────────────────────────

function PredictionSlot({ match, prediction, hasPred, canEdit, onMake, onEdit }) {
  if (hasPred) {
    return (
      <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-green-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="text-sm font-bold">
              {prediction.predicted_score_a} - {prediction.predicted_score_b}
            </span>
            {prediction.used_two_star && (
              <div className="flex items-center ml-2 bg-yellow-100 px-2 py-1 rounded-full">
                <Star className="h-3 w-3 text-yellow-600 mr-1" />
                <span className="text-xs text-yellow-700 font-bold">2-Star</span>
              </div>
            )}
          </div>
          {canEdit ? (
            <button onClick={() => onEdit(match)} className="text-blue-600 hover:text-blue-700 text-sm font-bold">Edit</button>
          ) : (
            <span className="text-gray-500 text-xs font-medium">Locked</span>
          )}
        </div>
      </div>
    );
  }
  if (canEdit) {
    return (
      <div className="mt-4">
        <button
          onClick={() => onMake(match)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
        >
          Make Prediction
        </button>
      </div>
    );
  }
  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
      <p className="text-gray-500 text-sm text-center font-medium">Predictions Locked</p>
    </div>
  );
}
PredictionSlot.propTypes = {
  match:      PropTypes.object.isRequired,
  prediction: PropTypes.object,
  hasPred:    PropTypes.bool.isRequired,
  canEdit:    PropTypes.bool.isRequired,
  onMake:     PropTypes.func.isRequired,
  onEdit:     PropTypes.func.isRequired,
};
PredictionSlot.defaultProps = { prediction: null };

// ─── Recent Predictions (sidebar panel) ──────────────────────────────────────

const RecentPredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPredictions = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setLoading(false); return; }
        const response = await fetch('/api/predictions/my/', {
          headers: { 'Authorization': `Token ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPredictions(
            Array.isArray(data)
              ? data.toSorted((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
              : []
          );
        }
      } catch (err) {
        console.error('Error fetching recent predictions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentPredictions();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
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
              {prediction.used_two_star && <Star className="h-4 w-4 text-yellow-500 ml-2" />}
            </div>
            <div className="text-sm text-gray-700">
              {prediction.match_details?.team_a_name} vs {prediction.match_details?.team_b_name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{new Date(prediction.created_at).toLocaleDateString()}</div>
            {prediction.points_awarded !== null && (
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${prediction.points_awarded > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {prediction.points_awarded > 0 ? `+${prediction.points_awarded}` : '0'} pts
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Matches page ────────────────────────────────────────────────────────

export const Matches = () => {
  // Prediction state
  const [matches, setMatches]           = useState([]);
  const [flagMap, setFlagMap]           = useState({});
  const [filter, setFilter]             = useState('all');
  const [loading, setLoading]           = useState(true);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 6;
  const [predictions, setPredictions]   = useState({});
  const [userPredictions, setUserPredictions] = useState([]);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [predictionData, setPredictionData] = useState({ predicted_score_a: '', predicted_score_b: '', used_two_star: false });
  const [twoStarStatus, setTwoStarStatus] = useState(null);

  // WC state
  const [tab, setTab]             = useState('predictions');
  const [wcMatches, setWcMatches] = useState([]);
  const [wcTeams, setWcTeams]     = useState([]);
  const [wcStage, setWcStage]     = useState('group');
  const [wcSearch, setWcSearch]   = useState('');

  // ── Time helpers ────────────────────────────────────────────────────────────
  const formatBhutanTime = (timeString) => {
    if (!timeString) return '—';
    const d = new Date(timeString);
    if (Number.isNaN(d.getTime())) return '—';
    // toLocaleString with an explicit timeZone performs the UTC→Bhutan
    // conversion itself — no manual offset needed.
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Thimphu',
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Two-star helpers ────────────────────────────────────────────────────────
  const canUseTwoStarForMatch = (match) => {
    if (!match) return false;
    if (match.group) return true;
    const tournamentName = (match.tournament_name || '').toLowerCase();
    const matchName = (match.name || '').toLowerCase();
    return (
      tournamentName.includes('round of 32') || tournamentName.includes('round of 16') ||
      matchName.includes('round of 32')      || matchName.includes('round of 16')      ||
      tournamentName.includes('r32')         || tournamentName.includes('r16')         ||
      matchName.includes('r32')              || matchName.includes('r16')
    );
  };

  const canUseTwoStar = () => {
    if (!twoStarStatus?.enabled) return false;
    if (twoStarStatus.global_used >= twoStarStatus.max_per_user_global) return false;
    if (!canUseTwoStarForMatch(selectedMatch)) return false;
    const isEditing = selectedMatch && hasPrediction(selectedMatch.id);
    if (isEditing) {
      const existing = getPrediction(selectedMatch.id);
      if (existing?.used_two_star) return true;
      if (!existing?.used_two_star && predictionData.used_two_star)
        return twoStarStatus.global_used < twoStarStatus.max_per_user_global;
      return true;
    }
    return twoStarStatus.global_used < twoStarStatus.max_per_user_global;
  };

  const getTwoStarErrorMessage = () => {
    if (!twoStarStatus?.enabled) return '2-Star feature is disabled';
    if (predictionData.used_two_star) return '';
    if (!canUseTwoStarForMatch(selectedMatch))
      return '2-Star predictions are only available for Group Stage, Round of 32, and Round of 16 matches';
    if (twoStarStatus.global_used >= twoStarStatus.max_per_user_global)
      return `Maximum total stars reached (${twoStarStatus.max_per_user_global})`;
    return '2-Star not available for this match';
  };

  const getStarsRemaining = () =>
    twoStarStatus ? Math.max(0, twoStarStatus.max_per_user_global - twoStarStatus.global_used) : 0;

  // ── Data loading ────────────────────────────────────────────────────────────
  const authFetch = (path, token) =>
    fetch(`${path}`, { headers: { Authorization: `Token ${token}` } });

  const loadPredictions = async (token) => {
    const pr = await authFetch('/api/predictions/my/', token);
    if (!pr.ok) return;
    const userPreds = await pr.json();
    setUserPredictions(Array.isArray(userPreds) ? userPreds : []);
    const obj = {};
    (Array.isArray(userPreds) ? userPreds : []).forEach(p => {
      obj[p.match] = { id: p.id, predicted_score_a: p.predicted_a, predicted_score_b: p.predicted_b, used_two_star: p.used_two_star || false, points_awarded: p.points_awarded };
    });
    setPredictions(obj);
  };

  const loadWcTeams = async (token) => {
    const tr = await authFetch('/api/matches/worldcup/teams/', token);
    if (!tr.ok) return;
    const td = await tr.json();
    const teams = td.teams || td;
    setWcTeams(teams);
    const map = {};
    teams.forEach(t => { if (t.code && t.flag) map[t.code] = t.flag; });
    setFlagMap(map);
  };

  const loadWcFixtures = async (token) => {
    const mr = await authFetch('/api/matches/worldcup/matches/', token);
    if (!mr.ok) return;
    const md = await mr.json();
    const fixtures = md.matches || md;
    setWcMatches(fixtures);
    const first = STAGES.find(s => fixtures.some(mx => classifyStage(mx) === s.key));
    if (first) setWcStage(first.key);
  };

  useEffect(() => {
    const loadAll = async () => {
      const token = localStorage.getItem('authToken');
      try {
        if (!token) return;
        const r = await authFetch('/api/matches/', token);
        if (r.ok) { const d = await r.json(); setMatches(d); localStorage.setItem('matches', JSON.stringify(d)); }
        const ts = await authFetch('/api/predictions/two-star-status/', token);
        if (ts.ok) setTwoStarStatus(await ts.json());
        await loadPredictions(token);
        await loadWcTeams(token);
        await loadWcFixtures(token);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prediction match helpers ─────────────────────────────────────────────────
  const getMatchStatus = (match) => {
    if (match.status === 'completed') return 'completed';
    if (new Date() >= new Date(match.start_time)) return 'started';
    return 'upcoming';
  };

  const filteredMatches = matches
    .filter(m => filter === 'all' || getMatchStatus(m) === filter)
    .sort((a, b) => {
      const sa = getMatchStatus(a), sb = getMatchStatus(b);
      if (sa === 'completed' && sb !== 'completed') return 1;
      if (sa !== 'completed' && sb === 'completed') return -1;
      return new Date(a.start_time) - new Date(b.start_time);
    });

  const totalPages  = Math.ceil(filteredMatches.length / itemsPerPage);
  const paginatedMatches = filteredMatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filter]);

  const getStatusColor = (status) => {
    if (status === 'upcoming')  return 'from-blue-400 to-blue-600';
    if (status === 'started')   return 'from-red-400 to-red-600';
    return 'from-gray-400 to-gray-600';
  };

  const hasPrediction  = (matchId) => predictions[matchId];
  const getPrediction  = (matchId) => predictions[matchId];

  const canEditPrediction = (match) => {
    if (match.status !== 'upcoming') return false;
    return (new Date(match.start_time) - Date.now()) / 60000 > 5;
  };

  const handleMakePrediction = (match) => {
    setSelectedMatch(match);
    setPredictionData({ predicted_score_a: '', predicted_score_b: '', used_two_star: false });
    setShowPredictionModal(true);
  };

  const handleEditPrediction = (match) => {
    const p = getPrediction(match.id);
    setSelectedMatch(match);
    setPredictionData({ predicted_score_a: p.predicted_score_a.toString(), predicted_score_b: p.predicted_score_b.toString(), used_two_star: p.used_two_star || false });
    setShowPredictionModal(true);
  };

  const refreshPredictions = async (token) => {
    const pr = await authFetch('/api/predictions/my/', token);
    if (!pr.ok) return;
    const userPreds = await pr.json();
    setUserPredictions(Array.isArray(userPreds) ? userPreds : []);
    const obj = {};
    (Array.isArray(userPreds) ? userPreds : []).forEach(p => {
      obj[p.match] = { predicted_score_a: p.predicted_a, predicted_score_b: p.predicted_b, used_two_star: p.used_two_star || false, id: p.id };
    });
    setPredictions(obj);
  };

  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Please login to make predictions'); return; }
    try {
      const existing = Array.isArray(userPredictions) ? userPredictions.find(p => p.match === selectedMatch.id) : null;
      const payload  = { predicted_a: Number.parseInt(predictionData.predicted_score_a), predicted_b: Number.parseInt(predictionData.predicted_score_b), used_two_star: predictionData.used_two_star };
      const url      = existing
        ? `/api/predictions/${existing.id}/update/`
        : `/api/predictions/matches/${selectedMatch.id}/`;
      const method   = existing ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` }, body: JSON.stringify(payload) });
      if (!response.ok) return;
      await refreshPredictions(token);
      const ts = await authFetch('/api/predictions/two-star-status/', token);
      if (ts.ok) setTwoStarStatus(await ts.json());
      setShowPredictionModal(false);
      setSelectedMatch(null);
      setPredictionData({ predicted_score_a: '', predicted_score_b: '', used_two_star: false });
    } catch (err) {
      console.error('Error saving prediction:', err);
      alert('Failed to save prediction');
    }
  };

  // ── Fixtures tab helpers ──────────────────────────────────────────────────────
  // Link API matches → DB matches by team codes so predictions work
  const dbMatchLookup = matches.reduce((acc, m) => {
    if (m.team_a_code && m.team_b_code) {
      acc[`${m.team_a_code}|${m.team_b_code}`] = m;
      acc[`${m.team_b_code}|${m.team_a_code}`] = m;
    }
    return acc;
  }, {});

  // Normalize an external API match into a consistent display shape
  const normalizeWcMatch = (raw) => {
    const homeObj   = raw.home_team  || raw.team_a  || raw.homeTeam  || {};
    const awayObj   = raw.away_team  || raw.team_b  || raw.awayTeam  || {};
    const homeName  = typeof homeObj === 'string' ? homeObj : (homeObj.name || homeObj.shortName || '?');
    const awayName  = typeof awayObj === 'string' ? awayObj : (awayObj.name || awayObj.shortName || '?');
    const homeCode  = raw.home_team_code || raw.team_a_code || raw.home_code || (typeof homeObj === 'object' ? homeObj.code || homeObj.tla || '' : '') || homeName.slice(0, 3).toUpperCase();
    const awayCode  = raw.away_team_code || raw.team_b_code || raw.away_code || (typeof awayObj === 'object' ? awayObj.code || awayObj.tla || '' : '') || awayName.slice(0, 3).toUpperCase();
    const dbMatch   = dbMatchLookup[`${homeCode}|${awayCode}`] || null;
    const apiStatus = raw.status || '';
    const finished  = apiStatus === 'completed' || apiStatus === 'FINISHED' || apiStatus === 'FT';
    return {
      _key:      raw.id || `${homeCode}-${awayCode}`,
      homeName,
      awayName,
      homeCode,
      awayCode,
      homeFlag:  flagMap[homeCode] || '',
      awayFlag:  flagMap[awayCode] || '',
      date:      raw.kickoff_utc || raw.date || raw.start_time || raw.utcDate || raw.datetime || '',
      venue:     raw.venue || raw.stadium || raw.location || '',
      group:     raw.group || raw.stage || '',
      status:    finished ? 'completed' : (raw.status || 'upcoming'),
      scoreA:    raw.score_a ?? raw.score?.home ?? raw.homeScore ?? null,
      scoreB:    raw.score_b ?? raw.score?.away ?? raw.awayScore ?? null,
      dbMatch,
    };
  };

  const activeStages = STAGES.filter(s => wcMatches.some(m => classifyStage(m) === s.key));
  const currentStage = STAGES.find(s => s.key === wcStage);
  const stageMatches = wcMatches
    .filter(m => classifyStage(m) === wcStage)
    .filter(m => {
      const q = wcSearch.toLowerCase();
      if (!q) return true;
      const home = getTeamName(m.home_team || m.team_a || m.homeTeam).toLowerCase();
      const away = getTeamName(m.away_team || m.team_b || m.awayTeam).toLowerCase();
      return home.includes(q) || away.includes(q) || (m.venue || m.stadium || '').toLowerCase().includes(q);
    })
    .toSorted((a, b) => new Date(a.kickoff_utc || a.date || a.start_time || a.utcDate || 0) - new Date(b.kickoff_utc || b.date || b.start_time || b.utcDate || 0))
    .map(normalizeWcMatch);

  const isGroupStage = wcStage === 'group';
  const subGroups    = isGroupStage
    ? stageMatches.reduce((acc, m) => {
        const g = m.group || 'Fixtures';
        if (!acc[g]) { acc[g] = []; }
        acc[g].push(m);
        return acc;
      }, {})
    : { all: stageMatches };
  const subGroupKeys = Object.keys(subGroups).toSorted((a, b) => a.localeCompare(b));

  // ── WC teams helpers ─────────────────────────────────────────────────────────
  const filteredTeams  = wcTeams.filter(t => {
    const q = wcSearch.toLowerCase();
    return (t.name || '').toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q) || (t.group || '').toLowerCase().includes(q);
  });
  const groupedTeams   = filteredTeams.reduce((acc, t) => {
    const g = t.group || 'Teams';
    if (!acc[g]) { acc[g] = []; }
    acc[g].push(t);
    return acc;
  }, {});
  const teamGroupKeys  = Object.keys(groupedTeams).sort((a, b) => a.localeCompare(b));

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1"><Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Page header ────────────────────────────────────────────────── */}
          <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 shadow-xl">
            <div className="relative z-10">
              <h1 className="text-2xl font-bold text-white">World Cup 2026</h1>
              <p className="text-blue-100 text-sm mt-1">
                Predictions · Fixtures · Teams &nbsp;·&nbsp; Times in Bhutan Time (UTC+6)
              </p>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* ── Tab switcher ────────────────────────────────────────────────── */}
          <div className="mb-6 bg-white shadow-lg rounded-2xl p-4 border border-gray-100">
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'predictions', label: 'My Predictions', icon: Trophy },
                { key: 'fixtures',    label: 'WC Fixtures',    icon: Calendar },
                { key: 'teams',       label: 'Teams',          icon: Users },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); setWcSearch(''); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${
                    tab === key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
               TAB: MY PREDICTIONS
          ══════════════════════════════════════════════════════════════════ */}
          {tab === 'predictions' && (
            <>
              {/* Filter buttons */}
              <div className="mb-6 bg-white shadow-lg rounded-2xl p-4 border border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { key: 'all',       label: 'All Matches', icon: Trophy },
                    { key: 'upcoming',  label: 'Upcoming',    icon: Clock },
                    { key: 'started',   label: 'Started',     icon: Zap },
                    { key: 'completed', label: 'Completed',   icon: Calendar },
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
                      <Icon className="h-4 w-4 mr-2" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedMatches.map((match) => (
                  <div key={match.id} className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 transform hover:-translate-y-1">
                    <div className="p-6">
                      {/* Status badge */}
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
                          <Users className="h-4 w-4 mr-1" />{match.group}
                        </div>
                      )}

                      {/* Teams display with flags */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                          <div className="flex-1 flex flex-col items-end gap-1">
                            <FlagBox code={match.team_a_code} flag={flagMap[match.team_a_code]} name={match.team_a_name} />
                            <p className="font-bold text-sm text-gray-900 text-right">{match.team_a_name}</p>
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
                          <div className="flex-1 flex flex-col items-start gap-1">
                            <FlagBox code={match.team_b_code} flag={flagMap[match.team_b_code]} name={match.team_b_name} />
                            <p className="font-bold text-sm text-gray-900">{match.team_b_name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Match info */}
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

                      {/* Prediction (upcoming) */}
                      {match.status === 'upcoming' && (
                        <PredictionSlot
                          match={match}
                          prediction={getPrediction(match.id)}
                          hasPred={!!hasPrediction(match.id)}
                          canEdit={canEditPrediction(match)}
                          onMake={handleMakePrediction}
                          onEdit={handleEditPrediction}
                        />
                      )}

                      {/* Result check (completed) */}
                      {match.status === 'completed' && hasPrediction(match.id) && (() => {
                        const pred = getPrediction(match.id);
                        const correct = pred.predicted_score_a === match.score_a && pred.predicted_score_b === match.score_b;
                        const pts = pred.points_awarded;
                        return (
                          <div className={`mt-4 rounded-xl p-3 border-2 ${pts > 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-600">Your prediction</span>
                              {pts !== null && pts !== undefined && (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pts > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                                  {pts > 0 ? `+${pts} pts` : '0 pts'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-800">
                                {pred.predicted_score_a} - {pred.predicted_score_b}
                              </span>
                              <span className={`text-xs font-bold ${correct ? 'text-green-600' : 'text-red-500'}`}>
                                {correct ? '✓ Exact score!' : `Actual: ${match.score_a} - ${match.score_b}`}
                              </span>
                            </div>
                            {pred.used_two_star && (
                              <div className="mt-1 flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs text-yellow-600 font-semibold">2-Star used</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* No prediction on completed match */}
                      {match.status === 'completed' && !hasPrediction(match.id) && (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-400">No prediction was made</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mb-6">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">
                    {currentPage} / {totalPages}
                  </div>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
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

              {/* Recent Predictions */}
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Recent Predictions</h3>
                </div>
                <div className="p-6"><RecentPredictions /></div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
               TAB: FIXTURES (DB matches grouped by stage, with predictions)
          ══════════════════════════════════════════════════════════════════ */}
          {tab === 'fixtures' && (
            <>
              {/* Stage navigator */}
              {activeStages.length > 0 && (
                <div className="mb-6 bg-white rounded-2xl shadow border border-gray-100 p-3">
                  <div className="flex flex-wrap gap-2">
                    {activeStages.map(s => (
                      <button
                        key={s.key}
                        onClick={() => { setWcStage(s.key); setWcSearch(''); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
                          wcStage === s.key
                            ? `bg-gradient-to-r ${s.color} text-white shadow-lg`
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

              {/* Search */}
              <div className="mb-4 bg-white rounded-xl border border-gray-200 shadow p-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search team or venue…"
                  value={wcSearch}
                  onChange={e => setWcSearch(e.target.value)}
                  className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                {wcSearch && <button onClick={() => setWcSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
              </div>

              {stageMatches.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No matches for this stage yet</p>
                </div>
              )}

              {/* Points rules */}
              <div className="mb-5 bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-2.5 flex items-center gap-2">
                  <Star className="h-4 w-4 text-white" />
                  <span className="font-bold text-white text-sm">How Points Work</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
                  {[
                    { pts: '7', label: 'Exact score', color: 'text-green-600', bg: 'bg-green-50' },
                    { pts: '5', label: 'One score correct', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { pts: '2', label: 'Correct winner', color: 'text-purple-600', bg: 'bg-purple-50' },
                    { pts: '0', label: 'Wrong prediction', color: 'text-gray-400', bg: 'bg-gray-50' },
                  ].map(({ pts, label, color, bg }) => (
                    <div key={pts} className={`${bg} flex flex-col items-center py-3 px-2`}>
                      <span className={`text-2xl font-black ${color}`}>{pts}</span>
                      <span className="text-[10px] text-gray-500 text-center mt-0.5 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {subGroupKeys.map(gKey => (
                <div key={gKey} className="mb-6">
                  {isGroupStage && gKey !== 'Fixtures' && (
                    <div className="mb-3 px-4 py-2 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow text-sm font-bold">
                      <Users className="h-4 w-4" />{gKey}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subGroups[gKey].map(m => (
                      <FixtureCard
                        key={m._key}
                        m={m}
                        stageColor={currentStage?.color || 'from-blue-500 to-purple-600'}
                        stageShort={currentStage?.short || ''}
                        getPrediction={getPrediction}
                        hasPrediction={hasPrediction}
                        canEditPrediction={canEditPrediction}
                        getMatchStatus={getMatchStatus}
                        getStatusColor={getStatusColor}
                        formatBhutanTime={formatBhutanTime}
                        handleMakePrediction={handleMakePrediction}
                        handleEditPrediction={handleEditPrediction}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
               TAB: TEAMS
          ══════════════════════════════════════════════════════════════════ */}
          {tab === 'teams' && (
            <>
              {/* Stats bar */}
              <div className="mb-6 bg-white shadow-lg rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">{wcTeams.length}</span>
                  <span className="text-gray-500 text-sm">teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">{wcMatches.length}</span>
                  <span className="text-gray-500 text-sm">fixtures</span>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6 bg-white rounded-2xl shadow p-3 flex items-center gap-3 border border-gray-100">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search team name, code or group…"
                  value={wcSearch}
                  onChange={e => setWcSearch(e.target.value)}
                  className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                {wcSearch && <button onClick={() => setWcSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
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
                    <div className={`mb-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow inline-flex items-center gap-2`}>
                      <Flag className="h-4 w-4" />
                      <span className="font-bold text-sm">Group {group}</span>
                    </div>
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

      {/* ── Prediction Modal ─────────────────────────────────────────────── */}
      {showPredictionModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-sm opacity-50" />
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Make Prediction</h3>
                <p className="text-sm text-blue-100">{selectedMatch.team_a_name} vs {selectedMatch.team_b_name}</p>
              </div>
              <form onSubmit={handleSubmitPrediction} className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { key: 'predicted_score_a', label: selectedMatch.team_a_name },
                    { key: 'predicted_score_b', label: selectedMatch.team_b_name },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
                      <input
                        type="number" min="0" max="20"
                        value={predictionData[key]}
                        onChange={(e) => setPredictionData(prev => ({ ...prev, [key]: e.target.value }))}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-bold"
                      />
                    </div>
                  ))}
                </div>

                {twoStarStatus?.enabled && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="font-bold text-gray-900">Use 2-Star?</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <span className="sr-only">Use 2-Star prediction</span>
                        <input
                          type="checkbox"
                          checked={predictionData.used_two_star}
                          onChange={(e) => setPredictionData(prev => ({ ...prev, used_two_star: e.target.checked }))}
                          className="sr-only peer"
                          disabled={!canUseTwoStar()}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50" />
                      </label>
                    </div>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Stars Remaining:</span>
                        <span className="text-yellow-700">{getStarsRemaining()}/{twoStarStatus.max_per_user_global}</span>
                      </div>
                      {!canUseTwoStar() && (
                        <div className="text-red-600 text-xs mt-2 font-medium">{getTwoStarErrorMessage()}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPredictionModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
