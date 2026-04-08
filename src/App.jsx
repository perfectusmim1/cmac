import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, Timer, Trophy, RefreshCw, Radio, X, Search, ChevronRight, AlertCircle, Pause, Maximize, Volume2, VolumeX, ArrowLeft, BarChart3, Users, TableProperties } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api/matches';
const SOFA_API = '/api/sofascore';

// ═══ Navbar ═══
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">
            <Trophy size={20} className="icon-dark" />
          </div>
          <span className="logo-text">CMAC<span className="text-gradient">SPORTS</span></span>
        </Link>
      </div>
    </nav>
  );
}

// ═══ Home Page ═══
function HomePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Yayınlar çekilemedi.');
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError('Veriler alınırken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, []);

  const filteredMatches = Array.isArray(matches)
    ? matches.filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <>
      <section className="hero">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-inner">
          <div className="hero-text">
            <h1 className="hero-title">Canlı <span className="text-gradient">Yayınlar</span></h1>
            <p className="hero-subtitle">Güncel en yüksek kalite futbol yayınları anlık olarak sizinle.</p>
          </div>
          <div className="status-badge">
            <div className="status-dot"></div>
            <span>{filteredMatches.length} Maç Aktif</span>
          </div>
        </motion.div>
      </section>

      <div className="home-actions">
        <div className="search-bar">
          <Search className="search-icon" size={16} />
          <input type="text" placeholder="Maç ara..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={fetchMatches} className="refresh-btn">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Yenile</span>
        </button>
      </div>

      <section className="matches-grid-section">
        {loading ? (
          <div className="matches-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="match-card skeleton"></div>)}
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} />
            <h3>Bağlantı Hatası</h3>
            <p>{error}</p>
            <button onClick={fetchMatches} className="btn-primary">Tekrar Dene</button>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="empty-state">
            <Search size={48} className="empty-icon" />
            <p>Yayın bulunamadı.</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="matches-grid">
            {filteredMatches.map((match, idx) => (
              <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <Link to={`/match/${encodeURIComponent(match.slug || match.name)}`} state={{ match }} className="match-card-link">
                  <div className="match-card">
                    <div className="match-card-header">
                      <div className="play-icon-wrapper"><PlayCircle size={28} className="text-accent" /></div>
                      <div className="time-badge"><Timer size={14} /><span>{match.time || 'Canlı'}</span></div>
                    </div>
                    <h3 className="match-title">{match.name}</h3>
                    <div className="match-card-footer">
                      <span className="live-text">CANLI YAYIN</span>
                      <div className="watch-now"><span>Hemen İzle</span><ChevronRight size={16} /></div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </>
  );
}

// ═══ Match Page ═══
function MatchPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = window.history.state?.usr;

  const [match, setMatch] = useState(location?.match || null);
  const [activeTab, setActiveTab] = useState('live');
  const [sofaData, setSofaData] = useState(null);
  const [sofaLoading, setSofaLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [lineups, setLineups] = useState(null);
  const [standings, setStandings] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // If no match from navigation state, fetch it
  useEffect(() => {
    if (!match) {
      fetch(API_URL).then(r => r.json()).then(matches => {
        const found = matches.find(m => (m.slug || m.name) === decodeURIComponent(slug));
        if (found) setMatch(found);
      }).catch(console.error);
    }
  }, [slug, match]);

  // Find Sofascore event
  useEffect(() => {
    if (!match) return;
    setSofaLoading(true);
    fetch(`${SOFA_API}/search?q=${encodeURIComponent(match.name)}`)
      .then(r => r.json())
      .then(data => {
        setSofaData(data);
        setSofaLoading(false);
      })
      .catch(() => setSofaLoading(false));
  }, [match]);

  const getProxyUrl = (matchUrl) => {
    // URL nesnesi ile parametreleri ayrıştırıyoruz
    const urlObj = new URL(matchUrl, 'https://main.uxsyplayer0e0c6aba22.click');
    const matchId = urlObj.searchParams.get('id'); // örn: selcuktabiispor2
    const fullSourceUrl = urlObj.toString();
    
    // Proxy URL'e 'id' parametresini en tepeye ekliyoruz ki iframe URL'inde gözüksün
    return `/api/player/proxy?id=${matchId}&targetUrl=${encodeURIComponent(fullSourceUrl)}`;
  };

  const sendToPlayer = (msg) => {
    if (iframeRef.current) iframeRef.current.contentWindow.postMessage(msg, '*');
  };

  const handlePlayPause = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    sendToPlayer({ action: next ? 'play' : 'pause' });
  };

  const handleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sendToPlayer({ action: next ? 'mute' : 'unmute' });
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  };

  if (!match) {
    return <div className="loading-page"><div className="spinner"></div><p>Maç yükleniyor...</p></div>;
  }

  return (
    <div className="match-page">
      <div className="match-page-header">
        <button onClick={() => navigate('/')} className="back-btn">
          <ArrowLeft size={20} />
          <span>Geri Dön</span>
        </button>
        <div className="match-page-title">
          <Radio size={16} className="pulse text-red" />
          <h2>{match.name}</h2>
          {sofaData?.status?.type === 'inprogress' && <span className="live-tag">CANLI</span>}
        </div>
      </div>

      <div className="match-tabs">
        {[
          { key: 'live', label: 'Canlı İzle', icon: <Radio size={16} /> },
          { key: 'stats', label: 'İstatistikler', icon: <BarChart3 size={16} /> },
          { key: 'lineups', label: 'Kadrolar', icon: <Users size={16} /> },
          { key: 'standings', label: 'Puan Durumu', icon: <TableProperties size={16} /> },
        ].map(tab => (
          <button key={tab.key} className={`match-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="match-content">
        {activeTab === 'live' && (
          <div ref={containerRef} className="player-container">
            <iframe
              ref={iframeRef}
              src={getProxyUrl(match.url)}
              className="player-iframe"
              allowFullScreen
              title="Player"
              allow="autoplay; fullscreen"
            />
            <div className="player-controls">
              <div className="controls-left">
                <button onClick={handlePlayPause} className="ctrl-btn">
                  {isPlaying ? <Pause size={22} /> : <PlayCircle size={22} />}
                </button>
                <button onClick={handleMute} className="ctrl-btn">
                  {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                <div className="live-indicator-badge">
                  <div className="live-dot"></div>
                  LIVE
                </div>
              </div>
              <div className="controls-right">
                <button onClick={handleFullscreen} className="ctrl-btn">
                  <Maximize size={22} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="sofa-section">
            {sofaLoading ? <LoadingSpinner /> : !sofaData?.id ? <NoData /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 <AttackMomentum matchId={sofaData.id} />
                 <CustomStats matchId={sofaData.id} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'lineups' && (
          <div className="sofa-section">
            {sofaLoading ? <LoadingSpinner /> : !sofaData?.id ? <NoData /> : (
              <CustomLineups matchId={sofaData.id} />
            )}
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="sofa-section">
            {sofaLoading ? <LoadingSpinner /> : !sofaData?.id ? <NoData /> : (
              <CustomStandings matchId={sofaData.id} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ Sofascore Data Components ═══
function LoadingSpinner() {
  return <div className="sofa-loading"><div className="spinner"></div><p>Veriler yükleniyor...</p></div>;
}

function NoData() {
  return <div className="sofa-nodata"><AlertCircle size={32} /><p>Bu maç için veri bulunamadı.</p></div>;
}

// ─── Turkish Stats Dictionary ───
const statsTR = {
  'Ball possession': 'Topla Oynama',
  'Total shots': 'Toplam Şut',
  'Shots on target': 'İsabetli Şut',
  'Shots off target': 'İsabetsiz Şut',
  'Blocked shots': 'Engellenen Şut',
  'Corner kicks': 'Köşe Vuruşu',
  'Offsides': 'Ofsayt',
  'Fouls': 'Faul',
  'Yellow cards': 'Sarı Kart',
  'Red cards': 'Kırmızı Kart',
  'Free kicks': 'Serbest Vuruş',
  'Throw-ins': 'Taç Atışı',
  'Goal kicks': 'Kale Vuruşu',
  'Saves': 'Kurtarışlar',
  'Passes': 'Pas',
  'Accurate passes': 'İsabetli Pas',
  'Long balls': 'Uzun Top',
  'Crosses': 'Orta',
  'Dribbles': 'Dripling',
  'Possession lost': 'Top Kaybı',
  'Duels won': 'İkili Mücadele',
  'Aerials won': 'Hava Topu',
  'Tackles': 'Müdahale',
  'Interceptions': 'Top Çalma',
  'Clearances': 'Uzaklaştırma',
  'Big chances created': 'Büyük Şans',
  'Big chances missed': 'Kaçan Şans',
  'Hit woodwork': 'Direkten Dönme',
  'Shots inside box': 'Ceza Sahası İçinden Şut',
  'Shots outside box': 'Ceza Sahası Dışından Şut'
};

// ─── Custom UI Components ───
const AttackMomentum = ({ matchId }) => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SOFA_API}/event/${matchId}/graph`)
      .then(r => r.json())
      .then(data => {
        setGraphData(data.graphPoints);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className="spinner"></div>;
  if (!graphData || graphData.length === 0) return <p>Momentum verisi yok.</p>;

  // Simple clean SVG chart
  const maxVal = Math.max(...graphData.map(p => Math.abs(p.value))) || 100;
  const width = 800;
  const height = 150;
  const step = width / graphData.length;

  return (
    <div className="widget-wrapper-column">
      <h3 className="widget-title">Atak Momentumu</h3>
      <div style={{ width: '100%', height: '180px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center' }}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {/* Baseline */}
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {graphData.map((p, i) => {
            const h = (Math.abs(p.value) / maxVal) * (height / 2);
            const isHome = p.value > 0;
            return (
              <rect
                key={i}
                x={i * step}
                y={isHome ? (height / 2) - h : height / 2}
                width={step * 0.8}
                height={h}
                fill={isHome ? 'var(--accent-color)' : 'var(--secondary-accent)'}
                opacity="0.8"
              />
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', color: 'var(--text-secondary)' }}>
        <span>0'</span>
        <span>45'</span>
        <span>90'</span>
      </div>
    </div>
  );
};

const CustomStats = ({ matchId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SOFA_API}/event/${matchId}/statistics`)
      .then(r => r.json())
      .then(data => {
        setStats(data.statistics?.[0]?.groups || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className="spinner"></div>;
  if (!stats) return <NoData />;

  return (
    <div className="stats-container">
      {stats.map((group, gi) => (
        <div key={gi} className="stats-period">
          <h4 className="period-title">{group.groupName === 'General' ? 'Genel' : group.groupName}</h4>
          <div className="stats-list">
            {group.statisticsItems.map((item, ii) => {
              const home = parseInt(item.home);
              const away = parseInt(item.away);
              const total = home + away;
              const homePerc = total === 0 ? 50 : (home / total) * 100;
              return (
                <div key={ii} className="stat-row">
                  <div className="stat-home">{item.home}</div>
                  <div className="stat-bar-container">
                    <span className="stat-name">{statsTR[item.name] || item.name}</span>
                    <div className="stat-bar">
                      <div className="stat-bar-home" style={{ width: `${homePerc}%` }}></div>
                    </div>
                  </div>
                  <div className="stat-away">{item.away}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const CustomLineups = ({ matchId }) => {
  const [lineups, setLineups] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SOFA_API}/event/${matchId}/lineups`)
      .then(r => r.json())
      .then(data => {
        setLineups(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className="spinner"></div>;
  if (!lineups || lineups.error) return <NoData />;

  const renderTeam = (team, name) => (
    <div className="lineup-team">
      <h3 className="lineup-team-name">{name}</h3>
      <div className="formation-badge">{team.formation}</div>
      <div className="lineup-players">
        {team.players.map((p, i) => (
          <div key={i} className={`lineup-player ${p.substitute ? 'substitute' : ''}`}>
            <div className="player-number">{p.player.jerseyNumber}</div>
            <div className="player-name">{p.player.name}</div>
            {p.statistics?.rating && <div className="player-rating">{p.statistics.rating}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="lineups-container">
      {renderTeam(lineups.home, lineups.homeTeam?.name || 'Ev Sahibi')}
      {renderTeam(lineups.away, lineups.awayTeam?.name || 'Deplasman')}
    </div>
  );
};

const CustomStandings = ({ matchId }) => {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SOFA_API}/event/${matchId}/standings`)
      .then(r => r.json())
      .then(data => {
        setRows(data.standings?.[0]?.rows || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className="spinner"></div>;
  if (!rows || rows.length === 0) return <NoData />;

  return (
    <div className="standings-container">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Takım</th>
            <th>O</th>
            <th>G</th>
            <th>B</th>
            <th>M</th>
            <th>AV</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="pos">{row.position}</td>
              <td className="team-name">{row.team.name}</td>
              <td>{row.matches}</td>
              <td>{row.wins}</td>
              <td>{row.draws}</td>
              <td>{row.losses}</td>
              <td>{row.scoresFor - row.scoresAgainst}</td>
              <td className="points">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ═══ App Router ═══
function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/match/:slug" element={<MatchPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
