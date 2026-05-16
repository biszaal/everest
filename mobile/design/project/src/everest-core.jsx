// Everest Flow — Core tokens, icons, shared components, sample data
// Per design spec: Signal palette, dark-only, iPhone-first, privacy-first

const { useState, useEffect, useRef, useCallback } = React;

// ═════════════════════════════════════════════════════════════
// SIGNAL PALETTE TOKENS
// ═════════════════════════════════════════════════════════════
const SP = {
  // Surfaces
  bg: '#0B0B0F',
  chrome: '#111116',
  surface: '#141418',
  surface2: '#1C1C24',
  surface3: '#252530',
  // Accent
  brand: '#3B82F6',
  brandSoft: 'rgba(59,130,246,0.13)',
  brandMuted: '#2563EB',
  success: '#10B981',
  danger: '#EF4444',
  amber: '#F59E0B',
  // Text
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  textFaint: '#6B7280',
  // Lines
  line: 'rgba(255,255,255,0.07)',
  lineStrong: 'rgba(255,255,255,0.13)',
  // Radii
  pill: 100,
  card: 16,
  tight: 12,
};

// ═════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════
// Deterministic hue from id — same folder always same colors
const hueFor = (id) => ((id * 137.508) % 360 + 360) % 360;

// Folder gradient (moody, saturated — never rainbow/candy)
const folderGradient = (id, brighter=false) => {
  const h = hueFor(id);
  const l1 = brighter ? 35 : 30;
  return `linear-gradient(135deg, hsl(${h}, 50%, ${l1}%) 0%, hsl(${h+40}, 45%, 18%) 100%)`;
};

// Video thumb gradient
const videoGradient = (hue) =>
  `linear-gradient(135deg, hsl(${hue}, 45%, 10%) 0%, hsl(${hue+30}, 35%, 17%) 100%)`;

// Format helpers
const relativeTime = (saved) => saved; // already strings in sample data
const fmtSecs = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const fmtMinusSecs = (s) => `-${fmtSecs(s)}`;

// ═════════════════════════════════════════════════════════════
// SAMPLE DATA
// ═════════════════════════════════════════════════════════════
const FOLDERS = [
  { id:1, name:'Nepal Election 2026', description:'Coverage, analysis, debates', count:8 },
  { id:2, name:'Design Systems',      description:'Talks and walkthroughs',     count:12 },
  { id:3, name:'Long Interviews',     description:'',                            count:5 },
  { id:4, name:'AI Research',         description:'Papers, talks, podcasts',     count:16 },
  { id:5, name:'Cooking',             description:'',                            count:3 },
];

const VIDEOS = [
  { id:1, title:'How Nepal\'s Coalition Is Reshaping Foreign Policy',
    channel:'Kantipur TV', host:'archive.org', duration:'18:32', durSec:1112,
    platform:'archive', progress:0.45, savedAt:'2 days ago', folderId:1, hue:220, downloaded:false },
  { id:2, title:'Deep Work — Cal Newport at Google Talks',
    channel:'Talks at Google', host:'archive.org', duration:'1:02:14', durSec:3734,
    platform:'archive', progress:0, savedAt:'Yesterday', folderId:null, hue:260, downloaded:true },
  { id:3, title:'Design Systems at Scale — Config 2024',
    channel:'Figma', host:'vimeo.com', duration:'34:20', durSec:2060,
    platform:'vimeo', progress:0.2, savedAt:'4 hours ago', folderId:2, hue:160, downloaded:false },
  { id:4, title:'Lex Fridman & Dario Amodei — Full Interview',
    channel:'Lex Fridman', host:'archive.org', duration:'2:14:08', durSec:8048,
    platform:'archive', progress:0.7, savedAt:'5 days ago', folderId:3, hue:30, downloaded:false },
  { id:5, title:'Atomic Habits — Complete Audio Summary',
    channel:'Self', host:'commons.wikimedia.org', duration:'45:12', durSec:2712,
    platform:'direct', progress:0, savedAt:'1 week ago', folderId:null, hue:190, downloaded:true },
  { id:6, title:'Typography & Visual Hierarchy — UX London',
    channel:'UX London', host:'vimeo.com', duration:'22:05', durSec:1325,
    platform:'vimeo', progress:0, savedAt:'2 weeks ago', folderId:2, hue:290, downloaded:false },
  { id:7, title:'Building in Public — A Practical Guide',
    channel:'Pieter Levels', host:'youtube.com', duration:'28:40', durSec:1720,
    platform:'youtube', progress:0, savedAt:'3 days ago', folderId:null, hue:10, downloaded:false },
  { id:8, title:'The Math of Recurrent Neural Networks',
    channel:'3Blue1Brown', host:'archive.org', duration:'52:18', durSec:3138,
    platform:'archive', progress:0.95, savedAt:'6 hours ago', folderId:4, hue:215, downloaded:false },
];

// Curated bookmarks (Browse home)
const BOOKMARKS = [
  { id:'archive', name:'Archive',    host:'archive.org',        hue:48,  icon:'◉', note:'' },
  { id:'vimeo',   name:'Vimeo',      host:'vimeo.com',          hue:195, icon:'◈', note:'' },
  { id:'peertube',name:'PeerTube',   host:'sepia.search',       hue:18,  icon:'◆', note:'' },
  { id:'mediaccc',name:'Media CCC',  host:'media.ccc.de',       hue:340, icon:'▢', note:'' },
  { id:'commons', name:'Commons',    host:'commons.wikimedia.org', hue:230, icon:'★', note:'' },
  { id:'youtube', name:'YouTube',    host:'youtube.com',        hue:0,   icon:'▶', note:'stream only' },
];

// Mock destination pages (rendered as fake WebView content)
const MOCK_PAGES = {
  'archive.org/details/nepal-coalition': { videoId:1, host:'archive.org', title:'Archive · Nepal Coalition Reshaping Policy' },
  'archive.org/details/deep-work-cal':    { videoId:2, host:'archive.org', title:'Archive · Deep Work — Cal Newport' },
  'vimeo.com/887654321':                  { videoId:3, host:'vimeo.com',  title:'Vimeo · Design Systems at Scale' },
  'archive.org/details/lex-dario':        { videoId:4, host:'archive.org', title:'Archive · Lex & Dario' },
  'commons.wikimedia.org/wiki/Atomic_Habits_Audio': { videoId:5, host:'commons.wikimedia.org', title:'Commons · Atomic Habits' },
  'vimeo.com/445566778':                  { videoId:6, host:'vimeo.com',  title:'Vimeo · Typography' },
  'youtube.com/watch?v=building-public':  { videoId:7, host:'youtube.com', title:'YouTube · Building in Public' },
};

// ═════════════════════════════════════════════════════════════
// ICONS (Ionicons-inspired, outline + filled variants)
// ═════════════════════════════════════════════════════════════
function Icon({ name, size=22, color='currentColor', style={} }) {
  const s = { width:size, height:size, display:'block', flexShrink:0, ...style };
  const I = {
    'arrow-back':    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
    'arrow-forward':<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
    'chevron-back':  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M15 18l-6-6 6-6"/></svg>,
    'chevron-forward':<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M9 18l6-6-6-6"/></svg>,
    'chevron-down':  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M6 9l6 6 6-6"/></svg>,
    'chevron-up':    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M6 15l6-6 6 6"/></svg>,
    'refresh':       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
    'lock-closed':   <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    'close':         <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    'close-circle':  <svg viewBox="0 0 24 24" fill={color} style={s}><circle cx="12" cy="12" r="11"/><path d="M16 8l-8 8M8 8l8 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
    'add':           <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" style={s}><path d="M12 5v14M5 12h14"/></svg>,
    'checkmark':     <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 6L9 17l-5-5"/></svg>,
    'home':          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M3 12L12 3l9 9"/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/></svg>,
    'open-outline':  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M15 3h6v6M14 10l7-7M9 3H6a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3v-3"/></svg>,
    'globe-outline': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z"/></svg>,
    'globe':         <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" style={s}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z"/></svg>,
    'library-outline': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" style={s}><path d="M4 19V6.5a1 1 0 011-1h2a1 1 0 011 1V19M11 19V4a1 1 0 011-1h2a1 1 0 011 1v15M18 19V9a1 1 0 011-1h2"/></svg>,
    'library':       <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M4 19V6.5a1.5 1.5 0 013 0V19H4zM10.5 19V4a1.5 1.5 0 013 0v15h-3zM17 19V9a1.5 1.5 0 013 0v10h-3z"/></svg>,
    'folder':        <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
    'play':          <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M6 4.5l14 7.5-14 7.5V4.5z"/></svg>,
    'pause':         <svg viewBox="0 0 24 24" fill={color} style={s}><rect x="5" y="4" width="4.5" height="16" rx="1.5"/><rect x="14.5" y="4" width="4.5" height="16" rx="1.5"/></svg>,
    'play-skip-forward': <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M5 5l10 7-10 7V5z"/><rect x="17" y="5" width="2.5" height="14" rx="1"/></svg>,
    'play-skip-back': <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M19 5l-10 7 10 7V5z"/><rect x="4.5" y="5" width="2.5" height="14" rx="1"/></svg>,
    'play-back':     <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M11 5l-7 7 7 7V5zM20 5l-7 7 7 7V5z"/></svg>,
    'play-forward':  <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M13 5l7 7-7 7V5zM4 5l7 7-7 7V5z"/></svg>,
    'download':      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
    'cloud-done':    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/><path d="M8 14l3 3 5-6"/></svg>,
    'trash':         <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    'pencil':        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    'move':          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
    'shield-checkmark': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
    'arrow-up-right': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
    'tablet-portrait': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill={color}/></svg>,
    'sun':           <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
    'volume-high':   <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>,
    'sparkles':      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/></svg>,
    'ellipsis':      <svg viewBox="0 0 24 24" fill={color} style={s}><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>,
    'alert':         <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16v.5"/></svg>,
  };
  return I[name] || <svg viewBox="0 0 24 24" style={s}/>;
}

// ═════════════════════════════════════════════════════════════
// COMPONENTS — Thumb, VideoCard, FolderTile, Pill, Section, EmptyState
// ═════════════════════════════════════════════════════════════

function Thumb({ video, width=110, height=66, radius=10, showProgress=false, downloaded=false }) {
  return (
    <div style={{
      width, height, borderRadius:radius, overflow:'hidden', flexShrink:0, position:'relative',
      background: videoGradient(video.hue),
    }}>
      {/* Platform tag */}
      <div style={{
        position:'absolute', top:5, left:5,
        background:'rgba(0,0,0,0.55)', borderRadius:3, padding:'1px 5px',
        fontSize:8, color:'rgba(255,255,255,0.78)', fontWeight:700, letterSpacing:0.4,
        textTransform:'uppercase',
      }}>{video.platform}</div>
      {/* Center play icon */}
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{
          width:26, height:26, borderRadius:13,
          background:'rgba(255,255,255,0.13)',
          display:'flex', alignItems:'center', justifyContent:'center',
          border:'1px solid rgba(255,255,255,0.2)',
        }}>
          <Icon name="play" size={10} color="white" style={{marginLeft:2}}/>
        </div>
      </div>
      {/* Decorative shape */}
      <svg style={{position:'absolute',bottom:0,right:0,opacity:0.08}} width="56" height="56" viewBox="0 0 56 56">
        <circle cx="48" cy="48" r="38" fill="white"/>
      </svg>
      {/* Downloaded indicator */}
      {downloaded && (
        <div style={{position:'absolute',top:5,right:5,width:14,height:14,borderRadius:7,background:SP.brand,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon name="checkmark" size={9} color="white"/>
        </div>
      )}
      {/* Progress bar */}
      {showProgress && video.progress > 0 && (
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(255,255,255,0.1)'}}>
          <div style={{height:'100%', width:`${video.progress*100}%`, background:SP.brand}}/>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, onPress, onLongPress, compact=false }) {
  const [pressed, setPressed] = useState(false);
  const pressTimer = useRef(null);

  const handleDown = () => {
    setPressed(true);
    if(onLongPress) pressTimer.current = setTimeout(() => { onLongPress(video); pressTimer.current = 'fired'; }, 550);
  };
  const handleUp = () => {
    setPressed(false);
    if(pressTimer.current && pressTimer.current !== 'fired') {
      clearTimeout(pressTimer.current);
      onPress && onPress(video);
    }
    pressTimer.current = null;
  };
  const handleLeave = () => {
    setPressed(false);
    if(pressTimer.current && pressTimer.current !== 'fired') clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <div
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleLeave}
      style={{
        display:'flex', gap:12, alignItems:'flex-start',
        padding:'12px 0', cursor:'pointer', userSelect:'none',
        opacity: pressed ? 0.7 : 1,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition:'all 100ms',
      }}
    >
      <Thumb video={video} width={compact?96:110} height={compact?58:66} showProgress downloaded={video.downloaded}/>
      <div style={{flex:1, minWidth:0, paddingTop:2}}>
        <div style={{
          fontSize:13, fontWeight:600, color:SP.text, lineHeight:'17px',
          marginBottom:3, overflow:'hidden', display:'-webkit-box',
          WebkitLineClamp:2, WebkitBoxOrient:'vertical',
        }}>{video.title}</div>
        <div style={{fontSize:12, color:SP.textMuted, marginBottom:2}}>{video.channel}</div>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:SP.textFaint}}>
          <span>{video.duration}</span>
          <span>·</span>
          <span>{video.savedAt}</span>
          {video.progress>0 && video.progress<0.95 && <>
            <span>·</span>
            <span style={{color:SP.brand,fontWeight:600}}>{Math.round(video.progress*100)}%</span>
          </>}
          {video.progress >= 0.95 && <>
            <span>·</span>
            <span style={{color:SP.success,fontWeight:600}}>Watched</span>
          </>}
        </div>
      </div>
    </div>
  );
}

function FolderTile({ folder, onPress, size=140 }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onPointerDown={()=>setPressed(true)}
      onPointerUp={()=>{ setPressed(false); onPress && onPress(folder); }}
      onPointerLeave={()=>setPressed(false)}
      style={{
        width:size, height:size, borderRadius:16, padding:14, flexShrink:0,
        background: folderGradient(folder.id),
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        cursor:'pointer', userSelect:'none', position:'relative', overflow:'hidden',
        opacity: pressed ? 0.7 : 1,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition:'all 100ms',
      }}
    >
      <Icon name="folder" size={22} color="rgba(255,255,255,0.85)"/>
      <div>
        <div style={{
          fontSize:15, fontWeight:700, color:'white', lineHeight:'19px',
          overflow:'hidden', display:'-webkit-box',
          WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:3,
        }}>{folder.name}</div>
        <div style={{fontSize:11, color:'rgba(255,255,255,0.7)'}}>{folder.count} video{folder.count===1?'':'s'}</div>
      </div>
    </div>
  );
}

function NewFolderTile({ onPress, size=140 }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onPointerDown={()=>setPressed(true)}
      onPointerUp={()=>{ setPressed(false); onPress && onPress(); }}
      onPointerLeave={()=>setPressed(false)}
      style={{
        width:size, height:size, borderRadius:16, flexShrink:0,
        background:'transparent', border:`1px dashed ${SP.lineStrong}`,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
        cursor:'pointer', userSelect:'none',
        opacity: pressed ? 0.7 : 1,
        transition:'opacity 100ms',
      }}
    >
      <Icon name="add" size={24} color={SP.textMuted}/>
      <span style={{fontSize:12, fontWeight:600, color:SP.textMuted}}>New folder</span>
    </div>
  );
}

function Pill({ label, count, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      height:30, padding:'0 12px', borderRadius:SP.pill, flexShrink:0,
      display:'flex', alignItems:'center', gap:4,
      background: active ? SP.brandSoft : SP.surface,
      border:`1px solid ${active ? SP.brand : SP.line}`,
      fontSize:12, fontWeight:600,
      color: active ? SP.brand : SP.textMuted,
      cursor:'pointer', userSelect:'none', whiteSpace:'nowrap',
      transition:'all 100ms',
    }}>
      <span>{label}</span>
      {count !== undefined && count > 0 && <span style={{opacity:0.7}}>· {count}</span>}
    </div>
  );
}

function SectionHeader({ title, caps=false, action, onAction, style={} }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,...style}}>
      {caps ? (
        <span style={{fontSize:11, fontWeight:700, color:SP.textFaint, letterSpacing:1.2, textTransform:'uppercase'}}>{title}</span>
      ) : (
        <span style={{fontSize:18, fontWeight:700, color:SP.text, letterSpacing:-0.3}}>{title}</span>
      )}
      {action && <span onClick={onAction} style={{fontSize:13, color:SP.brand, fontWeight:600, cursor:'pointer'}}>{action}</span>}
    </div>
  );
}

function EmptyState({ emoji='📂', title, subtitle, ctaLabel, onCta }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
      padding:'48px 32px', gap:0,
    }}>
      <div style={{fontSize:56, marginBottom:14, opacity:0.55}}>{emoji}</div>
      <div style={{fontSize:18, fontWeight:700, color:SP.text, marginBottom:8}}>{title}</div>
      {subtitle && <div style={{fontSize:13, color:SP.textMuted, lineHeight:'19px', maxWidth:280}}>{subtitle}</div>}
      {ctaLabel && (
        <button onClick={onCta} style={{
          marginTop:20, height:44, padding:'0 20px', borderRadius:SP.pill,
          background:SP.brand, border:'none',
          fontSize:14, fontWeight:700, color:'white', cursor:'pointer',
        }}>{ctaLabel}</button>
      )}
    </div>
  );
}

function LoadingView() {
  return (
    <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:SP.bg}}>
      <div style={{
        width:36, height:36, borderRadius:18,
        border:`3px solid ${SP.lineStrong}`, borderTopColor:'white',
        animation:'spin 0.8s linear infinite',
      }}/>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ACTION SHEET (bottom modal for long-press menus, sheets)
// ═════════════════════════════════════════════════════════════
function ActionSheet({ title, subtitle, actions, onClose, children }) {
  return (
    <div style={{
      position:'absolute',inset:0,zIndex:400,
      background:'rgba(0,0,0,0.65)',
      display:'flex',flexDirection:'column',justifyContent:'flex-end',
      animation:'fadeIn 200ms ease-out',
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:SP.surface, borderRadius:'20px 20px 0 0',
        padding:'8px 0 36px',
        animation:'slideUp 240ms ease-out',
      }}>
        <div style={{width:36,height:5,background:SP.surface3,borderRadius:3,margin:'8px auto 12px'}}/>
        {(title || subtitle) && (
          <div style={{padding:'8px 20px 16px', textAlign:'center', borderBottom: actions ? `1px solid ${SP.line}` : 'none'}}>
            {title && <div style={{fontSize:13, fontWeight:700, color:SP.text}}>{title}</div>}
            {subtitle && <div style={{fontSize:11, color:SP.textFaint, marginTop:2}}>{subtitle}</div>}
          </div>
        )}
        {actions && actions.map((a,i)=>(
          <div key={i} onClick={()=>{ a.action(); onClose(); }} style={{
            padding:'14px 20px',
            borderBottom: i<actions.length-1 ? `1px solid ${SP.line}` : 'none',
            cursor:'pointer',
            display:'flex', alignItems:'center', gap:12,
          }}>
            {a.icon && <Icon name={a.icon} size={20} color={a.destructive ? SP.danger : SP.textMuted}/>}
            <span style={{
              fontSize:15, fontWeight: a.bold ? 700 : 500,
              color: a.destructive ? SP.danger : SP.text,
              flex:1,
            }}>{a.label}</span>
          </div>
        ))}
        {children}
        <div onClick={onClose} style={{
          margin:'12px 12px 0', padding:'14px', textAlign:'center',
          background:SP.surface2, borderRadius:14,
          fontSize:15, fontWeight:600, color:SP.text, cursor:'pointer',
        }}>Cancel</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// EXPORT
// ═════════════════════════════════════════════════════════════
Object.assign(window, {
  SP, hueFor, folderGradient, videoGradient, fmtSecs, fmtMinusSecs,
  FOLDERS, VIDEOS, BOOKMARKS, MOCK_PAGES,
  Icon, Thumb, VideoCard, FolderTile, NewFolderTile, Pill,
  SectionHeader, EmptyState, LoadingView, ActionSheet,
});
