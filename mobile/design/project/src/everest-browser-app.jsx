// Everest Flow — Browser-First Desktop App
const { useState, useEffect, useRef, useCallback } = React;

// ─── TOKENS ──────────────────────────────────────────────────
const THEMES = {
  signal: {
    accent: '#3B82F6', accentRgb: '59,130,246',
    accentSoft: 'rgba(59,130,246,0.12)', accentGlow: '0 0 20px rgba(59,130,246,0.3)',
    font: "'DM Sans', sans-serif",
  },
  aura: {
    accent: '#8B5CF6', accentRgb: '139,92,246',
    accentSoft: 'rgba(139,92,246,0.12)', accentGlow: '0 0 20px rgba(139,92,246,0.35)',
    font: "'Syne', sans-serif",
  },
};
const B = {
  bg: '#0B0B0F', chrome: '#111116', sidebar: '#0A0A0E',
  surface: '#141418', surface2: '#1C1C24', surface3: '#252530',
  text: '#FFFFFF', text2: '#9CA3AF', text3: '#6B7280',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  green: '#10B981', red: '#EF4444', amber: '#F59E0B',
};

// ─── DATA ────────────────────────────────────────────────────
const VIDEOS = [
  { id:1, title:'The Art of Learning', channel:'TED Talks', duration:'18:32', platform:'YouTube', progress:0.45, hue:220, url:'youtube.com/watch?v=abc1' },
  { id:2, title:'Deep Work: Focused Success in a Distracted World', channel:'Cal Newport', duration:'1:02:14', platform:'YouTube', progress:0, hue:260, url:'youtube.com/watch?v=abc2' },
  { id:3, title:'Design Systems at Scale', channel:'Config 2024', duration:'34:20', platform:'Vimeo', progress:0.2, hue:160, url:'vimeo.com/123456' },
  { id:4, title:'The Future of AI — Full Interview', channel:'Lex Fridman', duration:'2:14:08', platform:'YouTube', progress:0.7, hue:30, url:'youtube.com/watch?v=abc4' },
  { id:5, title:'Atomic Habits — Complete Summary', channel:'James Clear', duration:'45:12', platform:'YouTube', progress:0, hue:190, url:'youtube.com/watch?v=abc5' },
  { id:6, title:'Typography & Visual Hierarchy', channel:'Pieter Levels', duration:'22:05', platform:'Vimeo', progress:0, hue:290, url:'vimeo.com/654321' },
  { id:7, title:'Building in Public — Lessons Learned', channel:'Levels.io', duration:'28:40', platform:'YouTube', progress:0, hue:10, url:'youtube.com/watch?v=abc7' },
];
const PLAYLISTS = [
  { id:1, name:'Morning Learning', count:8, hue:220, videos:[1,2,5] },
  { id:2, name:'Design Inspiration', count:12, hue:260, videos:[3,6] },
  { id:3, name:'Long Watches', count:5, hue:160, videos:[4] },
  { id:4, name:'Tech & AI', count:16, hue:35, videos:[2,4,7] },
];
const SITES = [
  { id:'newtab', url:'everest://newtab', title:'New Tab', favicon:'⛰' },
  { id:'yt1', url:'youtube.com/watch?v=dQw4w9WgXcQ', title:'The Art of Learning — TED', favicon:'▶', video: VIDEOS[0] },
  { id:'yt2', url:'youtube.com/watch?v=gSBkPBqDMbI', title:'Deep Work — Cal Newport', favicon:'▶', video: VIDEOS[1] },
  { id:'vimeo1', url:'vimeo.com/123456789', title:'Design Systems at Scale — Config', favicon:'◈', video: VIDEOS[2] },
  { id:'ted1', url:'ted.com/talks/lex_fridman_future_of_ai', title:'The Future of AI — Lex Fridman', favicon:'★', video: VIDEOS[3] },
];
const BOOKMARKS = [
  { label:'YouTube', url:'youtube.com', icon:'▶', color:'#FF0000' },
  { label:'Vimeo', url:'vimeo.com', icon:'◈', color:'#1AB7EA' },
  { label:'TED', url:'ted.com', icon:'★', color:'#E62B1E' },
  { label:'Coursera', url:'coursera.org', icon:'◉', color:'#0056D2' },
  { label:'Skillshare', url:'skillshare.com', icon:'◆', color:'#00C1A2' },
];

// ─── ICONS ───────────────────────────────────────────────────
function Icon({ name, size=16, color='currentColor', style={} }) {
  const s = { width:size, height:size, display:'block', flexShrink:0, ...style };
  const p = {
    back: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
    forward: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
    refresh: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
    download: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
    bookmark: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
    'bookmark-fill': <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
    library: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    'library-fill': <svg viewBox="0 0 24 24" fill={color} style={s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    queue: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M4 6h16M4 10h16M4 14h10M4 18h10"/><circle cx="19" cy="16" r="3"/></svg>,
    'queue-fill': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={s}><path d="M4 6h16M4 10h16M4 14h10M4 18h10"/><circle cx="19.5" cy="16.5" r="3"/></svg>,
    playlist: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M19 9H5M19 12H5M14 15H5M17 15l2.5 2L22 15"/></svg>,
    settings: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    play: <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M6 4.5l14 7.5-14 7.5V4.5z"/></svg>,
    pause: <svg viewBox="0 0 24 24" fill={color} style={s}><rect x="5" y="4" width="4.5" height="16" rx="1.5"/><rect x="14.5" y="4" width="4.5" height="16" rx="1.5"/></svg>,
    skip: <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M5 5l10 7-10 7V5z"/><rect x="17" y="5" width="2.5" height="14" rx="1"/></svg>,
    prev: <svg viewBox="0 0 24 24" fill={color} style={s}><path d="M19 5l-10 7 10 7V5z"/><rect x="4.5" y="5" width="2.5" height="14" rx="1"/></svg>,
    volume: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>,
    maximize: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M3 16v3a2 2 0 002 2h3"/></svg>,
    minimize: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M8 3v3a2 2 0 01-2 2H3M16 3v3a2 2 0 002 2h3M21 16h-3a2 2 0 00-2 2v3M3 16h3a2 2 0 012 2v3"/></svg>,
    x: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 6L9 17l-5-5"/></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" style={s}><path d="M12 5v14M5 12h14"/></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    lock: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    shuffle: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M16 3h5v5M4 20l16-16M16 20h5v-5M4 4l7 7"/></svg>,
    heart: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    more: <svg viewBox="0 0 24 24" fill={color} style={s}><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>,
    drag: <svg viewBox="0 0 24 24" fill={color} style={s}><circle cx="9" cy="7" r="1.5"/><circle cx="15" cy="7" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/></svg>,
    trash: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    tab: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20"/><path d="M8 4v5"/></svg>,
    'chevron-down': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M6 9l6 6 6-6"/></svg>,
    'chevron-right': <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={s}><path d="M9 18l6-6-6-6"/></svg>,
  };
  return p[name] || <svg viewBox="0 0 24 24" style={s}/>;
}

// ─── THUMBNAIL ───────────────────────────────────────────────
function Thumb({ video, width=120, height=68, radius=8, showProgress=false, theme }) {
  return (
    <div style={{
      width, height, borderRadius:radius, overflow:'hidden', position:'relative', flexShrink:0,
      background:`linear-gradient(135deg, hsl(${video.hue},45%,12%) 0%, hsl(${video.hue+30},35%,18%) 100%)`,
    }}>
      <div style={{position:'absolute',top:5,right:5,background:'rgba(0,0,0,0.55)',borderRadius:3,padding:'1px 5px',fontSize:9,color:'rgba(255,255,255,0.7)',fontWeight:700,letterSpacing:0.4}}>{video.platform.slice(0,2).toUpperCase()}</div>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:28,height:28,borderRadius:14,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,0.2)'}}>
          <Icon name="play" size={11} color="white" style={{marginLeft:2}}/>
        </div>
      </div>
      <svg style={{position:'absolute',bottom:0,right:0,opacity:0.1}} width="60" height="60" viewBox="0 0 60 60"><circle cx="50" cy="50" r="40" fill="white"/></svg>
      {showProgress && video.progress > 0 && (
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(255,255,255,0.1)'}}>
          <div style={{height:'100%',width:`${video.progress*100}%`,background:theme.accent}}/>
        </div>
      )}
    </div>
  );
}

// ─── BROWSER CHROME ──────────────────────────────────────────
function BrowserChrome({ tabs, activeTab, setActiveTab, currentSite, url, setUrl, onNavigate, onNewTab, onCloseTab, videoDetected, onSaveLink, onDownload, rightPanel, setRightPanel, theme }) {
  const [urlFocused, setUrlFocused] = useState(false);
  const [urlDraft, setUrlDraft] = useState(url);

  useEffect(() => { setUrlDraft(url); }, [url]);

  const handleNav = (e) => {
    if (e.key === 'Enter') {
      onNavigate(urlDraft);
      e.target.blur();
    }
  };

  return (
    <div style={{
      height:52, background:B.chrome, borderBottom:`1px solid ${B.border}`,
      display:'flex', alignItems:'center', gap:6, padding:'0 12px', flexShrink:0, userSelect:'none',
    }}>
      {/* Nav buttons */}
      <div style={{display:'flex', gap:2}}>
        {['back','forward','refresh'].map(n => (
          <div key={n} onClick={()=>n==='back'&&onNavigate('newtab')} style={{
            width:32, height:32, borderRadius:8, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:B.text3, transition:'background 0.15s',
          }}
          onMouseEnter={e=>e.currentTarget.style.background=B.surface2}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <Icon name={n} size={16} color={B.text2}/>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', alignItems:'center', gap:2, flex:'0 0 auto', maxWidth:480, overflowX:'auto', scrollbarWidth:'none'}}>
        {tabs.map((tab, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:6, padding:'6px 10px',
            borderRadius:8, cursor:'pointer', flexShrink:0, maxWidth:180,
            background: activeTab===i ? B.surface2 : 'transparent',
            border: `1px solid ${activeTab===i ? B.border2 : 'transparent'}`,
            transition:'all 0.15s',
          }} onClick={()=>setActiveTab(i)}>
            <span style={{fontSize:12}}>{tab.favicon}</span>
            <span style={{
              fontSize:12, color:activeTab===i ? B.text : B.text3,
              fontWeight:activeTab===i?600:400,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100,
            }}>{tab.title}</span>
            {tabs.length > 1 && (
              <div onClick={e=>{e.stopPropagation();onCloseTab(i);}} style={{
                width:16,height:16,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
                color:B.text3,flexShrink:0,
              }}
              onMouseEnter={e=>e.currentTarget.style.background=B.surface3}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              ><Icon name="x" size={10} color={B.text3}/></div>
            )}
          </div>
        ))}
        <div
          onClick={onNewTab}
          style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,color:B.text3}}
          onMouseEnter={e=>e.currentTarget.style.background=B.surface2}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <Icon name="plus" size={14} color={B.text3}/>
        </div>
      </div>

      {/* URL Bar */}
      <div style={{
        flex:1, height:34, borderRadius:9, border:`1px solid ${urlFocused ? theme.accent+'80' : B.border2}`,
        background: urlFocused ? B.surface : B.surface,
        display:'flex', alignItems:'center', gap:6, padding:'0 10px',
        transition:'border-color 0.2s', cursor:'text', minWidth:0,
      }} onClick={e=>e.currentTarget.querySelector('input').focus()}>
        <Icon name="lock" size={12} color={B.text3}/>
        <input
          value={urlDraft}
          onChange={e=>setUrlDraft(e.target.value)}
          onKeyDown={handleNav}
          onFocus={()=>setUrlFocused(true)}
          onBlur={()=>setUrlFocused(false)}
          style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            fontSize:13, color:urlFocused ? B.text : B.text2,
            fontFamily:'inherit', minWidth:0,
          }}
        />
      </div>

      {/* Video action buttons */}
      {videoDetected && (
        <div style={{display:'flex', gap:4, animation:'slideIn 0.3s ease'}}>
          <button onClick={onSaveLink} style={{
            height:32, padding:'0 12px', borderRadius:8,
            background:theme.accentSoft, border:`1px solid ${theme.accent}50`,
            fontSize:12, fontWeight:700, color:theme.accent, cursor:'pointer',
            display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
          }}>
            <Icon name="bookmark" size={13} color={theme.accent}/>
            Save Link
          </button>
          <button onClick={onDownload} style={{
            height:32, padding:'0 12px', borderRadius:8,
            background:B.surface2, border:`1px solid ${B.border2}`,
            fontSize:12, fontWeight:700, color:B.text2, cursor:'pointer',
            display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
          }}>
            <Icon name="download" size={13} color={B.text2}/>
            Download
          </button>
        </div>
      )}

      {/* Right panel toggles */}
      <div style={{display:'flex', gap:2}}>
        {[
          {id:'library', icon:'library', label:'Library'},
          {id:'queue', icon:'queue', label:'Queue'},
          {id:'playlists', icon:'playlist', label:'Playlists'},
        ].map(btn => {
          const active = rightPanel === btn.id;
          return (
            <div key={btn.id} onClick={()=>setRightPanel(active ? null : btn.id)} style={{
              width:32,height:32,borderRadius:8,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              background: active ? theme.accentSoft : 'transparent',
              border: `1px solid ${active ? theme.accent+'40' : 'transparent'}`,
              transition:'all 0.2s',
            }}
            title={btn.label}
            onMouseEnter={e=>!active&&(e.currentTarget.style.background=B.surface2)}
            onMouseLeave={e=>!active&&(e.currentTarget.style.background='transparent')}
            >
              <Icon name={btn.icon} size={16} color={active ? theme.accent : B.text2}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
function Sidebar({ theme }) {
  const [hovered, setHovered] = useState(null);
  const items = [
    { id:'home', icon:'tab', label:'Browser' },
    { id:'library', icon:'library', label:'Library' },
    { id:'queue', icon:'queue', label:'Queue' },
    { id:'playlists', icon:'playlist', label:'Playlists' },
  ];
  return (
    <div style={{
      width:52, background:B.sidebar, borderRight:`1px solid ${B.border}`,
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'12px 0', gap:4, flexShrink:0, zIndex:10,
    }}>
      {/* Logo */}
      <div style={{
        width:34,height:34,borderRadius:10,
        background:`linear-gradient(135deg, ${theme.accent}, ${theme.accent}99)`,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:16, marginBottom:12, boxShadow:theme.accentGlow,
      }}>⛰</div>
      {items.map(item => (
        <div key={item.id} style={{position:'relative'}}>
          <div
            style={{
              width:36,height:36,borderRadius:10,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              background: hovered===item.id ? B.surface2 : 'transparent',
              transition:'background 0.15s',
            }}
            onMouseEnter={()=>setHovered(item.id)}
            onMouseLeave={()=>setHovered(null)}
          >
            <Icon name={item.icon} size={18} color={hovered===item.id ? B.text : B.text3}/>
          </div>
          {hovered===item.id && (
            <div style={{
              position:'absolute', left:44, top:'50%', transform:'translateY(-50%)',
              background:B.surface2, border:`1px solid ${B.border2}`,
              borderRadius:6, padding:'4px 8px', whiteSpace:'nowrap',
              fontSize:12, fontWeight:600, color:B.text,
              pointerEvents:'none', zIndex:100,
              boxShadow:'0 4px 12px rgba(0,0,0,0.4)',
            }}>{item.label}</div>
          )}
        </div>
      ))}
      {/* Settings at bottom */}
      <div style={{flex:1}}/>
      <div
        style={{width:36,height:36,borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
        onMouseEnter={e=>e.currentTarget.style.background=B.surface2}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
      >
        <Icon name="settings" size={18} color={B.text3}/>
      </div>
    </div>
  );
}

// ─── NEW TAB PAGE ─────────────────────────────────────────────
function NewTabPage({ onNavigate, savedVideos, theme }) {
  return (
    <div style={{flex:1, overflowY:'auto', padding:'40px 60px', background:B.bg}}>
      {/* Search bar */}
      <div style={{maxWidth:600, margin:'0 auto 48px'}}>
        <div style={{textAlign:'center', marginBottom:32}}>
          <div style={{fontSize:42, marginBottom:8}}>⛰</div>
          <div style={{fontSize:24, fontWeight:800, color:B.text, letterSpacing:-0.5}}>Everest Flow</div>
          <div style={{fontSize:14, color:B.text2, marginTop:4}}>Your video universe, organised.</div>
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background:B.surface, border:`1px solid ${B.border2}`,
          borderRadius:14, padding:'0 16px', height:52,
        }}>
          <Icon name="search" size={18} color={B.text3}/>
          <input placeholder="Search the web or paste a video link..." style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            fontSize:15, color:B.text, fontFamily:'inherit',
          }}/>
        </div>
      </div>

      {/* Bookmarks */}
      <div style={{maxWidth:800, margin:'0 auto 48px'}}>
        <div style={{fontSize:12, fontWeight:700, color:B.text3, letterSpacing:0.5, textTransform:'uppercase', marginBottom:14}}>Quick Links</div>
        <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          {BOOKMARKS.map(bm => (
            <div key={bm.label} onClick={()=>onNavigate(bm.url)} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              padding:'16px 20px', borderRadius:14,
              background:B.surface, border:`1px solid ${B.border}`,
              cursor:'pointer', minWidth:80, transition:'all 0.15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=B.border2;e.currentTarget.style.background=B.surface2;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=B.border;e.currentTarget.style.background=B.surface;}}
            >
              <div style={{
                width:40,height:40,borderRadius:12,
                background:`${bm.color}22`, border:`1px solid ${bm.color}33`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:18, color:bm.color,
              }}>{bm.icon}</div>
              <span style={{fontSize:12, fontWeight:600, color:B.text2}}>{bm.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Watching */}
      {savedVideos.filter(v=>v.progress>0).length > 0 && (
        <div style={{maxWidth:800, margin:'0 auto 40px'}}>
          <div style={{fontSize:12, fontWeight:700, color:B.text3, letterSpacing:0.5, textTransform:'uppercase', marginBottom:14}}>Continue Watching</div>
          <div style={{display:'flex', gap:12, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4}}>
            {savedVideos.filter(v=>v.progress>0).map(v=>(
              <div key={v.id} onClick={()=>onNavigate(v.url)} style={{
                flexShrink:0, width:200, background:B.surface, borderRadius:12,
                border:`1px solid ${B.border}`, overflow:'hidden', cursor:'pointer',
                transition:'border-color 0.15s',
              }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=B.border2}
              onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}
              >
                <Thumb video={v} width={200} height={110} radius={0} showProgress theme={theme}/>
                <div style={{padding:'10px 12px'}}>
                  <div style={{fontSize:12,fontWeight:600,color:B.text,lineHeight:'16px',marginBottom:3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{v.title}</div>
                  <div style={{fontSize:11,color:B.text3}}>{v.channel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent saves */}
      <div style={{maxWidth:800, margin:'0 auto'}}>
        <div style={{fontSize:12, fontWeight:700, color:B.text3, letterSpacing:0.5, textTransform:'uppercase', marginBottom:14}}>Recently Saved</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12}}>
          {savedVideos.slice(0,4).map(v=>(
            <div key={v.id} onClick={()=>onNavigate(v.url)} style={{
              display:'flex', gap:10, padding:10, borderRadius:10,
              background:B.surface, border:`1px solid ${B.border}`,
              cursor:'pointer', transition:'all 0.15s', alignItems:'flex-start',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=B.border2;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=B.border;}}
            >
              <Thumb video={v} width={80} height={48} radius={6} theme={theme}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:B.text,lineHeight:'15px',marginBottom:3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{v.title}</div>
                <div style={{fontSize:11,color:B.text3}}>{v.channel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIMULATED VIDEO PAGE ─────────────────────────────────────
function SimulatedVideoPage({ site, theme, onPlay }) {
  const v = site.video;
  if (!v) return null;

  const isYT = v.platform === 'YouTube';
  const isTED = site.url.includes('ted.com');

  return (
    <div style={{flex:1, overflowY:'auto', background: isYT ? '#0f0f0f' : isTED ? '#1a1a1a' : '#1a1a2e'}}>
      {/* Fake site header */}
      <div style={{
        height:56, background: isYT ? '#212121' : isTED ? '#CC0000' : '#1A2035',
        display:'flex', alignItems:'center', padding:'0 24px', gap:16,
        borderBottom:'1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{fontSize:16, fontWeight:800, color:'white'}}>
          {isYT ? '▶ YouTube' : isTED ? '★ TED' : '◈ Vimeo'}
        </div>
        <div style={{
          flex:1, maxWidth:480, height:36, borderRadius:18,
          background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center',
          padding:'0 14px', gap:8,
        }}>
          <Icon name="search" size={14} color="rgba(255,255,255,0.4)"/>
          <span style={{fontSize:13, color:'rgba(255,255,255,0.4)'}}>Search...</span>
        </div>
      </div>

      <div style={{display:'flex', gap:0, maxWidth:1200, margin:'0 auto', padding:'24px'}}>
        {/* Main video column */}
        <div style={{flex:1, minWidth:0, marginRight:24}}>
          {/* Video player mock */}
          <div style={{
            width:'100%', aspectRatio:'16/9', borderRadius:12, overflow:'hidden',
            background:`linear-gradient(135deg, hsl(${v.hue},50%,8%), hsl(${v.hue+40},35%,14%))`,
            position:'relative', cursor:'pointer', marginBottom:16,
            boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
          }} onClick={onPlay}>
            <div style={{
              position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:16,
            }}>
              <div style={{
                width:72, height:72, borderRadius:36,
                background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid rgba(255,255,255,0.3)',
                boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
              }}>
                <Icon name="play" size={28} color="white" style={{marginLeft:4}}/>
              </div>
              <div style={{
                padding:'6px 14px', borderRadius:100,
                background:theme.accentSoft, border:`1px solid ${theme.accent}50`,
                fontSize:13, color:theme.accent, fontWeight:600,
              }}>▶ Play in Everest</div>
            </div>
            {/* Duration badge */}
            <div style={{
              position:'absolute', bottom:10, right:12,
              background:'rgba(0,0,0,0.8)', borderRadius:4, padding:'2px 6px',
              fontSize:12, fontWeight:700, color:'white',
            }}>{v.duration}</div>
            {/* Decorative */}
            <svg style={{position:'absolute',top:0,right:0,opacity:0.06}} width="300" height="200" viewBox="0 0 300 200">
              <circle cx="250" cy="-20" r="180" fill="white"/>
            </svg>
          </div>

          {/* Title & meta */}
          <div style={{marginBottom:16}}>
            <h1 style={{fontSize:18, fontWeight:700, color:'white', lineHeight:'26px', marginBottom:8}}>{v.title}</h1>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8}}>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{
                  width:36,height:36,borderRadius:18,
                  background:`linear-gradient(135deg,hsl(${v.hue},50%,30%),hsl(${v.hue+30},40%,20%))`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:14, fontWeight:700, color:'white',
                }}>{v.channel[0]}</div>
                <div>
                  <div style={{fontSize:14, fontWeight:700, color:'white'}}>{v.channel}</div>
                  <div style={{fontSize:12, color:'rgba(255,255,255,0.5)'}}>128K subscribers</div>
                </div>
              </div>
              <div style={{display:'flex', gap:8}}>
                {['👍 24K', '👎', '📤 Share'].map(btn=>(
                  <div key={btn} style={{
                    padding:'8px 14px', borderRadius:100,
                    background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
                    fontSize:13, color:'white', cursor:'pointer', fontWeight:600,
                  }}>{btn}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{
            padding:14, borderRadius:10, background:'rgba(255,255,255,0.05)',
            fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:'20px',
          }}>
            <strong style={{color:'rgba(255,255,255,0.8)'}}>Description</strong><br/>
            This is a mock description for "{v.title}". In the full Everest browser, this would show the actual video page content loaded from the real URL. Click the thumbnail above to play this video inside Everest's seamless player.
          </div>
        </div>

        {/* Sidebar - related */}
        <div style={{width:280, flexShrink:0}}>
          <div style={{fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:12}}>Up next</div>
          {VIDEOS.filter(vid=>vid.id!==v.id).slice(0,4).map(vid=>(
            <div key={vid.id} style={{
              display:'flex', gap:8, marginBottom:12, cursor:'pointer',
            }}>
              <Thumb video={vid} width={120} height={68} radius={6} theme={theme}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'white',lineHeight:'16px',marginBottom:4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{vid.title}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{vid.channel}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{vid.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RIGHT PANEL ─────────────────────────────────────────────
function LibraryPanel({ savedVideos, onPlay, onRemove, theme }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All','YouTube','Vimeo','Watched'];
  const filtered = savedVideos.filter(v=>{
    if(filter==='All') return true;
    if(filter==='Watched') return v.progress>0;
    return v.platform===filter;
  });
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'16px 16px 12px', borderBottom:`1px solid ${B.border}`}}>
        <div style={{fontSize:16,fontWeight:800,color:B.text,letterSpacing:-0.3,marginBottom:12}}>Library</div>
        <div style={{display:'flex',gap:6,overflowX:'auto',scrollbarWidth:'none'}}>
          {filters.map(f=>(
            <div key={f} onClick={()=>setFilter(f)} style={{
              padding:'4px 10px',borderRadius:100,flexShrink:0,
              background:filter===f?theme.accent:B.surface2,
              border:`1px solid ${filter===f?theme.accent:B.border}`,
              fontSize:11,fontWeight:700,color:filter===f?'white':B.text3,cursor:'pointer',
            }}>{f}</div>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 16px'}}>
        {filtered.length===0 && <div style={{textAlign:'center',color:B.text3,fontSize:13,paddingTop:40}}>No videos yet.<br/>Save links as you browse!</div>}
        {filtered.map((v,i)=>(
          <div key={v.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${B.border}`,alignItems:'center'}}>
            <Thumb video={v} width={80} height={48} radius={6} showProgress theme={theme}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:B.text,lineHeight:'15px',marginBottom:2,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{v.title}</div>
              <div style={{fontSize:11,color:B.text3}}>{v.channel} · {v.duration}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <div onClick={()=>onPlay(v)} style={{width:28,height:28,borderRadius:8,background:theme.accentSoft,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <Icon name="play" size={12} color={theme.accent}/>
              </div>
              <div onClick={()=>onRemove(v.id)} style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <Icon name="trash" size={12} color={B.text3}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueuePanel({ queue, onPlay, onRemove, onClear, theme }) {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'16px 16px 12px',borderBottom:`1px solid ${B.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:16,fontWeight:800,color:B.text,letterSpacing:-0.3}}>Queue</div>
        {queue.length>0 && <span onClick={onClear} style={{fontSize:12,color:B.red,fontWeight:600,cursor:'pointer'}}>Clear</span>}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 16px'}}>
        {queue.length===0 && <div style={{textAlign:'center',color:B.text3,fontSize:13,paddingTop:40}}>Your queue is empty.<br/>Add videos from the Library.</div>}
        {queue.map((v,i)=>(
          <div key={v.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${B.border}`,alignItems:'center'}}>
            <div style={{color:B.text3,fontSize:13,width:18,textAlign:'center',fontWeight:600,flexShrink:0}}>{i+1}</div>
            <Thumb video={v} width={80} height={48} radius={6} theme={theme}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:B.text,lineHeight:'15px',marginBottom:2,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{v.title}</div>
              <div style={{fontSize:11,color:B.text3}}>{v.duration}</div>
            </div>
            <div onClick={()=>onRemove(v.id)} style={{cursor:'pointer',padding:4}}>
              <Icon name="x" size={16} color={B.text3}/>
            </div>
          </div>
        ))}
      </div>
      {queue.length>0 && (
        <div style={{padding:12,borderTop:`1px solid ${B.border}`}}>
          <button onClick={()=>onPlay(queue[0])} style={{
            width:'100%',height:40,borderRadius:10,
            background:theme.accent,border:'none',
            fontSize:13,fontWeight:700,color:'white',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          }}>
            <Icon name="play" size={14} color="white"/>
            Play All ({queue.length})
          </button>
        </div>
      )}
    </div>
  );
}

function PlaylistsPanel({ onPlay, theme }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'16px 16px 12px',borderBottom:`1px solid ${B.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:16,fontWeight:800,color:B.text,letterSpacing:-0.3}}>{selected ? selected.name : 'Playlists'}</div>
        {selected
          ? <span onClick={()=>setSelected(null)} style={{fontSize:12,color:theme.accent,fontWeight:600,cursor:'pointer'}}>← Back</span>
          : <span style={{fontSize:12,color:theme.accent,fontWeight:700,cursor:'pointer'}}>+ New</span>
        }
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 16px'}}>
        {!selected ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:8}}>
            {PLAYLISTS.map(p=>{
              const vids=p.videos.map(id=>VIDEOS.find(v=>v.id===id)).filter(Boolean);
              return (
                <div key={p.id} onClick={()=>setSelected(p)} style={{
                  borderRadius:12,overflow:'hidden',border:`1px solid ${B.border}`,
                  background:B.surface,cursor:'pointer',
                }}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',height:60}}>
                    {[0,1,2,3].map(i=>{
                      const v=vids[i];
                      return <div key={i} style={{background:v?`linear-gradient(135deg,hsl(${v.hue},45%,12%),hsl(${v.hue+30},35%,18%))`:B.surface2,borderRight:i%2===0?`1px solid ${B.border}`:'none',borderBottom:i<2?`1px solid ${B.border}`:'none'}}/>;
                    })}
                  </div>
                  <div style={{padding:'8px 10px'}}>
                    <div style={{fontSize:12,fontWeight:700,color:B.text}}>{p.name}</div>
                    <div style={{fontSize:11,color:B.text3}}>{p.count} videos</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div style={{display:'flex',gap:8,marginBottom:14,paddingTop:8}}>
              <button onClick={()=>onPlay(VIDEOS.find(v=>selected.videos.includes(v.id)))} style={{
                flex:1,height:36,borderRadius:8,background:theme.accent,border:'none',
                fontSize:12,fontWeight:700,color:'white',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              }}><Icon name="play" size={12} color="white"/>Play All</button>
              <button style={{
                flex:1,height:36,borderRadius:8,background:B.surface2,border:`1px solid ${B.border}`,
                fontSize:12,fontWeight:700,color:B.text2,cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              }}><Icon name="shuffle" size={12} color={B.text2}/>Shuffle</button>
            </div>
            {selected.videos.map(id=>{
              const v=VIDEOS.find(v=>v.id===id);
              if(!v) return null;
              return (
                <div key={v.id} onClick={()=>onPlay(v)} style={{
                  display:'flex',gap:10,padding:'10px 0',
                  borderBottom:`1px solid ${B.border}`,cursor:'pointer',alignItems:'center',
                }}>
                  <Thumb video={v} width={80} height={48} radius={6} theme={theme}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:B.text,lineHeight:'15px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{v.title}</div>
                    <div style={{fontSize:11,color:B.text3,marginTop:2}}>{v.channel} · {v.duration}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PLAYER OVERLAY ───────────────────────────────────────────
function PlayerOverlay({ video, onClose, onMinimize, theme }) {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(video.progress || 0.1);
  const [liked, setLiked] = useState(false);
  useEffect(()=>{
    if(!playing) return;
    const t=setInterval(()=>setProgress(p=>Math.min(p+0.001,1)),300);
    return ()=>clearInterval(t);
  },[playing]);
  const elapsed = Math.floor(progress*60*60);
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  return (
    <div style={{
      position:'absolute',inset:0,zIndex:200,
      background:`linear-gradient(135deg, hsl(${video.hue},50%,4%), hsl(${video.hue+40},35%,8%))`,
      display:'flex',flexDirection:'column',
    }}>
      {/* Top bar */}
      <div style={{
        display:'flex',justifyContent:'space-between',alignItems:'center',
        padding:'16px 24px',
        background:'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
      }}>
        <div onClick={onMinimize} style={{
          display:'flex',alignItems:'center',gap:8,cursor:'pointer',
          padding:'8px 14px',borderRadius:100,
          background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',
        }}>
          <Icon name="minimize" size={14} color={B.text2}/>
          <span style={{fontSize:12,fontWeight:600,color:B.text2}}>Minimize</span>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:2}}>Now Playing</div>
          <div style={{fontSize:14,fontWeight:700,color:'white'}}>{video.channel}</div>
        </div>
        <div onClick={onClose} style={{
          width:36,height:36,borderRadius:18,
          background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
        }}>
          <Icon name="x" size={18} color={B.text2}/>
        </div>
      </div>

      {/* Video area */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
        <div style={{
          width:'min(70%, 900px)', aspectRatio:'16/9', borderRadius:16, overflow:'hidden',
          background:`linear-gradient(135deg, hsl(${video.hue},50%,10%), hsl(${video.hue+40},35%,15%))`,
          boxShadow:`0 32px 80px rgba(0,0,0,0.6), ${theme.accentGlow}`,
          position:'relative',cursor:'pointer',
        }} onClick={()=>setPlaying(p=>!p)}>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{
              width:80,height:80,borderRadius:40,
              background:'rgba(255,255,255,0.1)',backdropFilter:'blur(10px)',
              display:'flex',alignItems:'center',justifyContent:'center',
              border:'1px solid rgba(255,255,255,0.2)',
              transition:'all 0.2s',
            }}>
              <Icon name={playing?'pause':'play'} size={32} color="white" style={{marginLeft:playing?0:4}}/>
            </div>
          </div>
          <svg style={{position:'absolute',inset:0,opacity:0.05}} width="100%" height="100%"><defs><radialGradient id="rg"><stop offset="0%" stopColor="white"/><stop offset="100%" stopColor="transparent"/></radialGradient></defs><ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="url(#rg)"/></svg>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        padding:'0 60px 40px',
        background:'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      }}>
        <div style={{maxWidth:700,margin:'0 auto'}}>
          {/* Title */}
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:20,fontWeight:800,color:'white',letterSpacing:-0.4,marginBottom:4}}>{video.title}</div>
            <div style={{fontSize:14,color:'rgba(255,255,255,0.5)'}}>{video.channel}</div>
          </div>
          {/* Actions */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div onClick={()=>setLiked(l=>!l)} style={{cursor:'pointer'}}>
              <Icon name="heart" size={22} color={liked?B.red:'rgba(255,255,255,0.5)'} style={liked?{fill:B.red}:{}}/>
            </div>
            <div style={{padding:'4px 12px',borderRadius:8,background:'rgba(255,255,255,0.1)',fontSize:12,fontWeight:700,color:'white',cursor:'pointer'}}>1×</div>
            <Icon name="download" size={22} color="rgba(255,255,255,0.5)"/>
            <Icon name="more" size={22} color="rgba(255,255,255,0.5)"/>
          </div>
          {/* Scrubber */}
          <div style={{marginBottom:24}}>
            <div style={{height:4,background:'rgba(255,255,255,0.15)',borderRadius:2,cursor:'pointer',position:'relative'}}
              onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setProgress((e.clientX-r.left)/r.width);}}>
              <div style={{height:'100%',width:`${progress*100}%`,background:theme.accent,borderRadius:2,position:'relative'}}>
                <div style={{position:'absolute',right:-6,top:-4,width:12,height:12,borderRadius:6,background:theme.accent,border:'2px solid white'}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>{fmt(elapsed)}</span>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>{video.duration}</span>
            </div>
          </div>
          {/* Controls */}
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:32}}>
            <Icon name="shuffle" size={22} color="rgba(255,255,255,0.4)"/>
            <Icon name="prev" size={36} color="rgba(255,255,255,0.8)" style={{cursor:'pointer'}}/>
            <div onClick={()=>setPlaying(p=>!p)} style={{
              width:72,height:72,borderRadius:36,background:theme.accent,
              boxShadow:theme.accentGlow,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
            }}>
              <Icon name={playing?'pause':'play'} size={30} color="white" style={{marginLeft:playing?0:4}}/>
            </div>
            <Icon name="skip" size={36} color="rgba(255,255,255,0.8)" style={{cursor:'pointer'}}/>
            <Icon name="volume" size={22} color="rgba(255,255,255,0.4)"/>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── MINI PLAYER ─────────────────────────────────────────────
function MiniPlayer({ video, playing, setPlaying, onExpand, onClose, theme }) {
  return (
    <div style={{
      position:'absolute', bottom:0, left:52, right:0, zIndex:100,
      height:68, background:B.chrome, borderTop:`1px solid ${B.border}`,
      display:'flex', alignItems:'center', padding:'0 16px', gap:12,
      backdropFilter:'blur(20px)',
    }}>
      <Thumb video={video} width={80} height={48} radius={6} theme={theme}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:B.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{video.title}</div>
        <div style={{fontSize:11,color:B.text3}}>{video.channel}</div>
      </div>
      {/* Mini progress */}
      <div style={{width:120,height:3,background:B.surface3,borderRadius:2}}>
        <div style={{height:'100%',width:`${(video.progress||0.3)*100}%`,background:theme.accent,borderRadius:2}}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div onClick={()=>setPlaying(p=>!p)} style={{
          width:36,height:36,borderRadius:18,background:theme.accentSoft,
          display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
        }}>
          <Icon name={playing?'pause':'play'} size={16} color={theme.accent} style={{marginLeft:playing?0:2}}/>
        </div>
        <Icon name="skip" size={22} color={B.text2} style={{cursor:'pointer'}}/>
        <Icon name="maximize" size={18} color={B.text2} style={{cursor:'pointer'}} onClick={onExpand}/>
        <Icon name="x" size={18} color={B.text3} style={{cursor:'pointer'}} onClick={onClose}/>
      </div>
    </div>
  );
}

// ─── SAVE DIALOG ─────────────────────────────────────────────
function SaveDialog({ video, onSave, onClose, theme }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{
      position:'absolute',inset:0,zIndex:300,
      background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',
      display:'flex',alignItems:'center',justifyContent:'center',
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:420, background:B.surface, borderRadius:20,
        border:`1px solid ${B.border2}`, padding:24,
        boxShadow:'0 32px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{fontSize:18,fontWeight:800,color:B.text,letterSpacing:-0.3,marginBottom:4}}>Save to Library</div>
        <div style={{fontSize:14,color:B.text2,marginBottom:20}}>Add this video to your Everest library</div>
        <div style={{
          display:'flex',gap:10,padding:'12px',borderRadius:12,
          background:B.surface2,border:`1px solid ${B.border}`,marginBottom:20,
        }}>
          <Thumb video={video} width={100} height={60} radius={8} theme={theme}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:B.text,lineHeight:'17px',marginBottom:4}}>{video.title}</div>
            <div style={{fontSize:12,color:B.text2}}>{video.channel}</div>
            <div style={{display:'flex',gap:6,marginTop:4}}>
              <span style={{fontSize:11,color:B.text3}}>{video.duration}</span>
              <span style={{fontSize:11,color:theme.accent,fontWeight:600,background:theme.accentSoft,padding:'1px 6px',borderRadius:4}}>{video.platform}</span>
            </div>
          </div>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:B.text2,marginBottom:10}}>Add to playlist (optional)</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24}}>
          {PLAYLISTS.map(p=>(
            <div key={p.id} onClick={()=>setSelected(selected===p.id?null:p.id)} style={{
              padding:'6px 12px',borderRadius:100,
              background:selected===p.id?theme.accent:B.surface2,
              border:`1px solid ${selected===p.id?theme.accent:B.border}`,
              fontSize:12,fontWeight:700,color:selected===p.id?'white':B.text2,
              cursor:'pointer',transition:'all 0.15s',
              display:'flex',alignItems:'center',gap:5,
            }}>
              {selected===p.id&&<Icon name="check" size={12} color="white"/>}
              {p.name}
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{
            flex:1,height:44,borderRadius:10,background:'transparent',
            border:`1px solid ${B.border2}`,fontSize:14,fontWeight:600,color:B.text2,cursor:'pointer',
          }}>Cancel</button>
          <button onClick={()=>onSave(video)} style={{
            flex:2,height:44,borderRadius:10,background:theme.accent,border:'none',
            fontSize:14,fontWeight:700,color:'white',cursor:'pointer',
          }}>Save to Library</button>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────
function Toast({ message, accent, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,2800); return()=>clearTimeout(t); },[]);
  return (
    <div style={{
      position:'absolute',bottom:84,left:'50%',transform:'translateX(-50%)',
      background:B.surface,border:`1px solid ${accent}50`,
      borderRadius:100,padding:'10px 20px',
      display:'flex',alignItems:'center',gap:8,
      zIndex:500,boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
      animation:'slideUp 0.3s ease',whiteSpace:'nowrap',
    }}>
      <div style={{width:20,height:20,borderRadius:10,background:accent,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon name="check" size={12} color="white"/>
      </div>
      <span style={{fontSize:13,fontWeight:600,color:B.text}}>{message}</span>
    </div>
  );
}

// ─── DOWNLOAD TOAST ──────────────────────────────────────────
function DownloadItem({ video, onDone, theme }) {
  const [prog, setProg] = useState(0);
  useEffect(()=>{
    const t = setInterval(()=>setProg(p=>{ if(p>=1){clearInterval(t);setTimeout(onDone,600);return 1;} return p+0.08;}),120);
    return()=>clearInterval(t);
  },[]);
  return (
    <div style={{
      display:'flex',alignItems:'center',gap:10,
      padding:'10px 14px',borderRadius:12,
      background:B.surface,border:`1px solid ${B.border2}`,
      boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
      minWidth:280,maxWidth:320,
    }}>
      <Thumb video={video} width={52} height={32} radius={4} theme={theme}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:600,color:B.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5}}>{video.title}</div>
        <div style={{height:3,background:B.surface3,borderRadius:2}}>
          <div style={{height:'100%',width:`${prog*100}%`,background:prog===1?B.green:theme.accent,borderRadius:2,transition:'width 0.1s linear'}}/>
        </div>
        <div style={{fontSize:11,color:B.text3,marginTop:3}}>
          {prog<1?`Downloading… ${Math.round(prog*100)}%`:'✓ Downloaded'}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────
function EverestBrowserApp({ themeName, setThemeName }) {
  const theme = THEMES[themeName] || THEMES.signal;
  const [tabs, setTabs] = useState([SITES[0]]);
  const [activeTab, setActiveTab] = useState(0);
  const [rightPanel, setRightPanel] = useState(null);
  const [playerVideo, setPlayerVideo] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [savedVideos, setSavedVideos] = useState(VIDEOS.slice(0,3));
  const [queue, setQueue] = useState(VIDEOS.slice(1,4));
  const [saveDialog, setSaveDialog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [downloads, setDownloads] = useState([]);

  const currentSite = tabs[activeTab] || SITES[0];
  const url = currentSite.url;
  const videoDetected = !!currentSite.video;

  const addToast = (msg) => {
    const id = Date.now();
    setToasts(t=>[...t, {id, msg}]);
  };

  const navigate = useCallback((dest) => {
    let site = dest === 'newtab' ? SITES[0] : SITES.find(s=>s.url===dest||s.url.includes(dest));
    if (!site) site = { id:'custom', url:dest, title:dest, favicon:'🌐', video:null };
    setTabs(t=>t.map((tab,i)=>i===activeTab?site:tab));
  }, [activeTab]);

  const handleSaveLink = () => {
    if (currentSite.video) setSaveDialog(currentSite.video);
  };

  const handleSaveConfirm = (video) => {
    setSavedVideos(prev => prev.find(v=>v.id===video.id) ? prev : [video, ...prev]);
    setSaveDialog(null);
    addToast(`"${video.title.slice(0,30)}…" saved to library`);
  };

  const handleDownload = () => {
    if (!currentSite.video) return;
    const v = currentSite.video;
    setDownloads(d=>[...d, {id:Date.now(), video:v}]);
    // Auto-save to library too
    setSavedVideos(prev => prev.find(p=>p.id===v.id) ? prev : [v, ...prev]);
  };

  const handlePlay = (video) => {
    setPlayerVideo(video);
    setPlayerOpen(true);
    setMiniPlayer(false);
    setPlaying(true);
  };

  const handleMinimize = () => { setPlayerOpen(false); setMiniPlayer(true); };
  const handleClosePlayer = () => { setPlayerOpen(false); setMiniPlayer(false); setPlayerVideo(null); };

  const removeFromLibrary = (id) => setSavedVideos(v=>v.filter(x=>x.id!==id));
  const removeFromQueue = (id) => setQueue(q=>q.filter(x=>x.id!==id));

  const contentPaddingBottom = (miniPlayer && playerVideo) ? 68 : 0;

  return (
    <div style={{
      width:'100%', height:'100%', display:'flex', flexDirection:'column',
      fontFamily:theme.font, background:B.bg, position:'relative', overflow:'hidden',
    }}>
      <style>{`
        * { -webkit tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${B.surface3}; border-radius:3px; }
        input::placeholder { color:${B.text3}; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <BrowserChrome
        tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}
        currentSite={currentSite} url={url}
        setUrl={()=>{}}
        onNavigate={navigate}
        onNewTab={()=>{ setTabs(t=>[...t,SITES[0]]); setActiveTab(tabs.length); }}
        onCloseTab={i=>{ if(tabs.length===1) return; setTabs(t=>t.filter((_,idx)=>idx!==i)); setActiveTab(Math.max(0,activeTab-1)); }}
        videoDetected={videoDetected}
        onSaveLink={handleSaveLink} onDownload={handleDownload}
        rightPanel={rightPanel} setRightPanel={setRightPanel}
        theme={theme}
      />

      <div style={{display:'flex', flex:1, overflow:'hidden', position:'relative'}}>
        <Sidebar theme={theme}/>

        {/* Main browser content */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column', overflow:'hidden',
          paddingBottom: contentPaddingBottom,
        }}>
          {currentSite.id === 'newtab' || !currentSite.video ? (
            <NewTabPage onNavigate={navigate} savedVideos={savedVideos} theme={theme}/>
          ) : (
            <SimulatedVideoPage site={currentSite} theme={theme} onPlay={()=>handlePlay(currentSite.video)}/>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          width: rightPanel ? 320 : 0, background:B.surface, borderLeft:`1px solid ${B.border}`,
          overflow:'hidden', flexShrink:0, transition:'width 0.25s ease',
          display:'flex', flexDirection:'column',
        }}>
          {rightPanel === 'library' && <LibraryPanel savedVideos={savedVideos} onPlay={handlePlay} onRemove={removeFromLibrary} theme={theme}/>}
          {rightPanel === 'queue' && <QueuePanel queue={queue} onPlay={handlePlay} onRemove={removeFromQueue} onClear={()=>setQueue([])} theme={theme}/>}
          {rightPanel === 'playlists' && <PlaylistsPanel onPlay={handlePlay} theme={theme}/>}
        </div>
      </div>

      {/* Mini player */}
      {miniPlayer && playerVideo && (
        <MiniPlayer video={playerVideo} playing={playing} setPlaying={setPlaying}
          onExpand={()=>{setPlayerOpen(true);setMiniPlayer(false);}}
          onClose={handleClosePlayer}
          theme={theme}
        />
      )}

      {/* Player overlay */}
      {playerOpen && playerVideo && (
        <PlayerOverlay video={playerVideo} onClose={handleClosePlayer} onMinimize={handleMinimize} theme={theme}/>
      )}

      {/* Save dialog */}
      {saveDialog && (
        <SaveDialog video={saveDialog} onSave={handleSaveConfirm} onClose={()=>setSaveDialog(null)} theme={theme}/>
      )}

      {/* Toasts */}
      {toasts.slice(-1).map(t=>(
        <Toast key={t.id} message={t.msg} accent={theme.accent} onDone={()=>setToasts(prev=>prev.filter(x=>x.id!==t.id))}/>
      ))}

      {/* Downloads */}
      {downloads.length > 0 && (
        <div style={{position:'absolute',bottom:miniPlayer&&playerVideo?78:10,left:64,display:'flex',flexDirection:'column',gap:8,zIndex:400}}>
          {downloads.map(d=>(
            <DownloadItem key={d.id} video={d.video} theme={theme} onDone={()=>setDownloads(p=>p.filter(x=>x.id!==d.id))}/>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { EverestBrowserApp });
