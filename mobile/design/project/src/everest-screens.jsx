// Everest Flow — Screens: Browse, Library, FolderDetail, CreateFolder, MoveVideo
const { useState, useEffect, useRef, useCallback } = React;

// ═════════════════════════════════════════════════════════════
// BROWSE SCREEN
// ═════════════════════════════════════════════════════════════
function BrowseScreen({ savedVideos, onSaveVideo, onPlay, onOpenLibrary }) {
  // Browser state: currentUrl null = home; otherwise an entry in MOCK_PAGES (or unknown)
  const [history, setHistory] = useState([null]); // null = home
  const [histIdx, setHistIdx] = useState(0);
  const currentUrl = history[histIdx];
  const currentPage = currentUrl ? MOCK_PAGES[currentUrl] : null;

  const [urlFocused, setUrlFocused] = useState(false);
  const [urlText, setUrlText] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedThisVisit, setSavedThisVisit] = useState({});
  const inputRef = useRef(null);

  // Navigation
  const navigateTo = (url) => {
    const newHist = [...history.slice(0, histIdx+1), url];
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setLoading(!!url);
    setUrlFocused(false);
    setUrlText('');
    if (url) setTimeout(()=>setLoading(false), 700);
  };
  const goBack = () => { if (histIdx > 0) { setHistIdx(i=>i-1); setUrlFocused(false); } };
  const goFwd  = () => { if (histIdx < history.length-1) { setHistIdx(i=>i+1); setUrlFocused(false); } };
  const refresh = () => { setLoading(true); setTimeout(()=>setLoading(false), 500); };

  const canBack = histIdx > 0;
  const canFwd  = histIdx < history.length - 1;

  // Autosuggest: filter saved videos by title/host, bookmarks by name/host
  const suggestVideos = urlText.trim().length > 0
    ? savedVideos.filter(v =>
        v.title.toLowerCase().includes(urlText.toLowerCase()) ||
        v.host.toLowerCase().includes(urlText.toLowerCase())
      ).slice(0, 4)
    : [];
  const suggestBookmarks = urlText.trim().length > 0
    ? BOOKMARKS.filter(b =>
        b.name.toLowerCase().includes(urlText.toLowerCase()) ||
        b.host.toLowerCase().includes(urlText.toLowerCase())
      )
    : BOOKMARKS;
  const looksLikeUrl = /^[\w-]+(\.[\w-]+)+/i.test(urlText.trim()) || urlText.trim().startsWith('http');

  // Site detected — current page has a video
  const detectedVideo = currentPage ? VIDEOS.find(v => v.id === currentPage.videoId) : null;
  const alreadySaved = detectedVideo ? savedVideos.find(v => v.id === detectedVideo.id) : false;
  const isSavedNow = savedThisVisit[currentUrl] || alreadySaved;

  const handleSave = () => {
    if (!detectedVideo) return;
    onSaveVideo(detectedVideo);
    setSavedThisVisit(s => ({...s, [currentUrl]: true}));
  };

  const navigateBookmark = (bm) => {
    // Find a mock page for this bookmark (use bm.host match)
    const targetEntry = Object.entries(MOCK_PAGES).find(([url]) => url.startsWith(bm.host)) ||
                        Object.entries(MOCK_PAGES)[0];
    navigateTo(targetEntry[0]);
  };

  const navigateSavedVideo = (v) => {
    const targetEntry = Object.entries(MOCK_PAGES).find(([url, p]) => p.videoId === v.id);
    if (targetEntry) navigateTo(targetEntry[0]);
  };

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', background:SP.bg}}>

      {/* URL ROW */}
      <div style={{
        flexShrink:0, height:56, background:SP.chrome,
        borderBottom:`1px solid ${SP.line}`,
        display:'flex', alignItems:'center', gap:4, padding:'0 8px',
      }}>
        <div onClick={goBack} style={{
          width:36, height:36, borderRadius:18,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor: canBack ? 'pointer' : 'default', opacity: canBack ? 1 : 0.3,
        }}><Icon name="chevron-back" size={20} color={SP.text}/></div>
        <div onClick={goFwd} style={{
          width:36, height:36, borderRadius:18,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor: canFwd ? 'pointer' : 'default', opacity: canFwd ? 1 : 0.3,
        }}><Icon name="chevron-forward" size={20} color={SP.text}/></div>

        {/* URL input */}
        <div style={{
          flex:1, height:38, borderRadius:SP.pill,
          background:SP.surface2,
          border:`1px solid ${urlFocused ? SP.brand : SP.line}`,
          display:'flex', alignItems:'center', gap:6, padding:'0 12px',
          cursor:'text', transition:'border-color 150ms',
        }} onClick={()=>inputRef.current?.focus()}>
          {currentPage && !urlFocused && <Icon name="lock-closed" size={11} color={SP.textFaint}/>}
          <input
            ref={inputRef}
            value={urlFocused ? urlText : (currentUrl || '')}
            onChange={e=>setUrlText(e.target.value)}
            onFocus={()=>{ setUrlFocused(true); setUrlText(currentUrl||''); setTimeout(()=>inputRef.current?.select(),0); }}
            onBlur={()=>setTimeout(()=>setUrlFocused(false),120)}
            onKeyDown={e=>{
              if (e.key === 'Enter') {
                const text = urlText.trim();
                // Try exact match in MOCK_PAGES
                const match = Object.keys(MOCK_PAGES).find(u => u===text || u.startsWith(text));
                navigateTo(match || (text ? text : null));
                e.target.blur();
              }
              if (e.key === 'Escape') { setUrlFocused(false); e.target.blur(); }
            }}
            placeholder="Search or type URL"
            style={{
              flex:1, background:'transparent', border:'none', outline:'none',
              fontSize:14, color: urlFocused ? SP.text : SP.textMuted,
              fontFamily:'inherit', minWidth:0,
            }}
          />
          {urlFocused && urlText && (
            <div onClick={e=>{ e.stopPropagation(); setUrlText(''); inputRef.current?.focus(); }} style={{cursor:'pointer', display:'flex'}}>
              <Icon name="close-circle" size={16} color={SP.textFaint}/>
            </div>
          )}
        </div>

        <div onClick={refresh} style={{
          width:36, height:36, borderRadius:18,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}><Icon name="refresh" size={17} color={SP.textMuted}/></div>
      </div>

      {/* Loading bar */}
      {loading && (
        <div style={{
          height:2, background:'transparent', flexShrink:0, position:'relative', overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', top:0, left:0, height:'100%', width:'40%',
            background:SP.brand,
            animation:'browserLoading 1.2s ease-in-out infinite',
          }}/>
        </div>
      )}

      {/* Video detected banner */}
      {detectedVideo && !loading && (
        <div style={{
          flexShrink:0, height:44,
          background:SP.brandSoft,
          borderTop:`1px solid ${SP.brand}`, borderBottom:`1px solid ${SP.brand}`,
          display:'flex', alignItems:'center', padding:'0 14px', gap:10,
          animation:'slideDownBanner 200ms ease-out',
        }}>
          <Icon name="sparkles" size={16} color={SP.brand}/>
          <span style={{fontSize:13, color:SP.brand, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>1 video detected on this page</span>
        </div>
      )}

      {/* Content area */}
      <div style={{flex:1, overflow:'hidden', position:'relative'}}>
        {urlFocused ? (
          <AutosuggestSheet
            urlText={urlText} looksLikeUrl={looksLikeUrl}
            videos={suggestVideos} bookmarks={suggestBookmarks}
            onSelectUrl={navigateTo}
            onSelectBookmark={navigateBookmark}
            onSelectVideo={navigateSavedVideo}
          />
        ) : currentUrl ? (
          <MockWebPage page={currentPage} video={detectedVideo} url={currentUrl}/>
        ) : (
          <BrowseHome
            savedVideos={savedVideos}
            onNavigate={navigateTo}
            onOpenBookmark={navigateBookmark}
            onOpenSaved={navigateSavedVideo}
          />
        )}
      </div>

      {/* SAVE button (bottom, only when video detected and not yet saved) */}
      {detectedVideo && !urlFocused && (
        <div style={{
          position:'absolute', bottom:16, left:16, right:16, zIndex:50,
        }}>
          <button onClick={handleSave} disabled={isSavedNow} style={{
            width:'100%', height:48, borderRadius:SP.pill,
            background: isSavedNow ? SP.success : SP.brand, border:'none',
            color:'white', fontSize:14, fontWeight:700, cursor: isSavedNow ? 'default' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow:'0 6px 16px rgba(0,0,0,0.4)',
            transition:'background 200ms',
          }}>
            {isSavedNow ? <><Icon name="checkmark" size={16} color="white"/>Saved to library</> :
              <><Icon name="add" size={16} color="white"/>Save video</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AUTOSUGGEST SHEET ────────────────────────────────────────
function AutosuggestSheet({ urlText, looksLikeUrl, videos, bookmarks, onSelectUrl, onSelectBookmark, onSelectVideo }) {
  const showLibrarySection = videos.length > 0;
  return (
    <div style={{position:'absolute', inset:0, background:SP.bg, overflowY:'auto'}}>
      {/* Go to typed URL row */}
      {urlText.trim() && looksLikeUrl && (
        <div onClick={()=>onSelectUrl(urlText.trim())} style={{
          display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
          borderBottom:`1px solid ${SP.line}`, cursor:'pointer',
        }}>
          <div style={{width:36, height:36, borderRadius:8, background:SP.brandSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
            <Icon name="arrow-up-right" size={16} color={SP.brand}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:700, color:SP.text}}>Go to {urlText.trim()}</div>
            <div style={{fontSize:11, color:SP.textFaint}}>Open this address</div>
          </div>
        </div>
      )}

      {/* From your library */}
      {showLibrarySection && (
        <div style={{padding:'14px 16px 8px'}}>
          <div style={{fontSize:11, fontWeight:700, color:SP.textFaint, letterSpacing:1.2, textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6}}>
            <Icon name="shield-checkmark" size={12} color={SP.textFaint}/>
            From your library
          </div>
          {videos.map(v => (
            <div key={v.id} onClick={()=>onSelectVideo(v)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 0',
              borderBottom:`1px solid ${SP.line}`, cursor:'pointer',
            }}>
              <div style={{width:44, height:26, borderRadius:4, background:videoGradient(v.hue), flexShrink:0}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:600, color:SP.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{v.title}</div>
                <div style={{fontSize:11, color:SP.textFaint}}>{v.host}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shortcuts */}
      <div style={{padding:'16px 16px 24px'}}>
        <div style={{fontSize:11, fontWeight:700, color:SP.textFaint, letterSpacing:1.2, textTransform:'uppercase', marginBottom:10}}>Shortcuts</div>
        {bookmarks.map(bm => (
          <div key={bm.id} onClick={()=>onSelectBookmark(bm)} style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 0',
            borderBottom:`1px solid ${SP.line}`, cursor:'pointer',
          }}>
            <div style={{
              width:36, height:36, borderRadius:9,
              background:`hsla(${bm.hue},60%,40%,0.18)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, color:`hsl(${bm.hue},80%,60%)`,
            }}>{bm.icon}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:600, color:SP.text}}>{bm.name}</div>
              <div style={{fontSize:11, color:SP.textFaint}}>{bm.host}</div>
            </div>
          </div>
        ))}
        <div style={{
          display:'flex', alignItems:'center', gap:6, marginTop:14, padding:10,
          background:SP.surface2, borderRadius:10,
        }}>
          <Icon name="shield-checkmark" size={14} color={SP.success}/>
          <span style={{fontSize:11, color:SP.textMuted, lineHeight:'15px'}}>
            Suggestions come only from your device. Nothing is sent over the network.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── BROWSE HOME (no URL loaded) ──────────────────────────────
function BrowseHome({ savedVideos, onNavigate, onOpenBookmark, onOpenSaved }) {
  const continuing = savedVideos.filter(v => v.progress > 0 && v.progress < 0.95).slice(0, 6);
  const recent = savedVideos.slice(0, 4);

  return (
    <div style={{height:'100%', overflowY:'auto', padding:'20px 16px 80px'}}>
      {/* Title */}
      <div style={{marginBottom:6, fontSize:26, fontWeight:800, color:SP.text, letterSpacing:-0.5}}>
        Browse the web
      </div>
      <div style={{fontSize:13, color:SP.textMuted, marginBottom:24}}>
        Save any direct video to your library.
      </div>

      {/* Bookmark grid 2×3 */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:28}}>
        {BOOKMARKS.map(bm => (
          <div key={bm.id} onClick={()=>onOpenBookmark(bm)} style={{
            aspectRatio:'1', borderRadius:16, padding:14, cursor:'pointer',
            background:SP.surface, border:`1px solid ${SP.line}`,
            display:'flex', flexDirection:'column', justifyContent:'space-between',
          }}>
            <div style={{
              width:42, height:42, borderRadius:11,
              background:`hsla(${bm.hue},60%,40%,0.16)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, color:`hsl(${bm.hue},80%,60%)`,
            }}>{bm.icon}</div>
            <div>
              <div style={{fontSize:13, fontWeight:700, color:SP.text}}>{bm.name}</div>
              {bm.note && <div style={{fontSize:10, color:SP.textFaint, marginTop:1}}>{bm.note}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Continue watching */}
      {continuing.length > 0 && (
        <div style={{marginBottom:24}}>
          <SectionHeader title="Continue watching" caps/>
          <div style={{display:'flex', gap:10, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4}}>
            {continuing.map(v => (
              <div key={v.id} onClick={()=>onOpenSaved(v)} style={{
                flexShrink:0, width:160, cursor:'pointer',
              }}>
                <div style={{width:160, height:90, borderRadius:10, overflow:'hidden', background:videoGradient(v.hue), position:'relative'}}>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(255,255,255,0.15)'}}>
                    <div style={{height:'100%', width:`${v.progress*100}%`, background:SP.brand}}/>
                  </div>
                </div>
                <div style={{fontSize:12, fontWeight:600, color:SP.text, marginTop:6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', lineHeight:'15px'}}>{v.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently saved */}
      {recent.length > 0 && (
        <div>
          <SectionHeader title="Recently saved" caps/>
          <div>
            {recent.map((v,i) => (
              <div key={v.id} onClick={()=>onOpenSaved(v)} style={{borderBottom:i<recent.length-1?`1px solid ${SP.line}`:'none'}}>
                <VideoCard video={v}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MOCK WEB PAGE (browsing state) ───────────────────────────
function MockWebPage({ page, video, url }) {
  if (!page) {
    // Unknown URL → "couldn't load" toast-like
    return (
      <div style={{padding:'40px 24px', textAlign:'center', color:SP.textMuted}}>
        <Icon name="alert" size={32} color={SP.textFaint} style={{margin:'0 auto 12px'}}/>
        <div style={{fontSize:15, fontWeight:600, color:SP.text2, marginBottom:6}}>Couldn't load that page</div>
        <div style={{fontSize:12, color:SP.textFaint}}>{url}</div>
      </div>
    );
  }
  if (!video) return null;

  return (
    <div style={{height:'100%', overflowY:'auto'}}>
      {/* Fake site header */}
      <div style={{
        height:38, background:SP.surface, borderBottom:`1px solid ${SP.line}`,
        display:'flex', alignItems:'center', padding:'0 14px', gap:8,
        fontSize:12, color:SP.textMuted,
      }}>
        <Icon name="globe-outline" size={13} color={SP.textFaint}/>
        <span style={{fontWeight:600}}>{page.host}</span>
      </div>

      {/* Video frame */}
      <div style={{width:'100%', aspectRatio:'16/9', background:videoGradient(video.hue), position:'relative'}}>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{
            width:56, height:56, borderRadius:28,
            background:'rgba(255,255,255,0.13)', border:'1px solid rgba(255,255,255,0.22)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon name="play" size={22} color="white" style={{marginLeft:3}}/>
          </div>
        </div>
        <div style={{position:'absolute', bottom:6, right:8, background:'rgba(0,0,0,0.7)', borderRadius:3, padding:'1px 5px', fontSize:11, fontWeight:700, color:'white'}}>{video.duration}</div>
      </div>

      {/* Page content */}
      <div style={{padding:'14px 16px'}}>
        <h2 style={{fontSize:16, fontWeight:700, color:SP.text, lineHeight:'21px', marginBottom:8}}>{video.title}</h2>
        <div style={{fontSize:12, color:SP.textMuted, marginBottom:12}}>{video.channel} · {page.host}</div>
        <div style={{fontSize:12, color:SP.textMuted, lineHeight:'18px', marginBottom:20}}>
          This is a simulated page on {page.host}. In the real app, this area is a full WebView rendering the actual content of the URL. When Everest detects a playable video on the page, the banner at the top appears and the <strong style={{color:SP.text}}>Save video</strong> button at the bottom becomes active.
        </div>

        {/* More videos on this site */}
        <SectionHeader title="More on this site" caps/>
        <div>
          {VIDEOS.filter(v => v.host === page.host && v.id !== video.id).slice(0, 3).map((v,i,arr)=>(
            <div key={v.id} style={{
              display:'flex', gap:10, alignItems:'center',
              padding:'10px 0', borderBottom: i<arr.length-1 ? `1px solid ${SP.line}` : 'none',
            }}>
              <Thumb video={v} width={100} height={56} radius={8}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12, fontWeight:600, color:SP.text, lineHeight:'15px', marginBottom:2, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>{v.title}</div>
                <div style={{fontSize:11, color:SP.textFaint}}>{v.channel} · {v.duration}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{height:60}}/>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// LIBRARY SCREEN
// ═════════════════════════════════════════════════════════════
function LibraryScreen({ folders, savedVideos, onOpenFolder, onCreateFolder, onLongPressVideo, onPlay }) {
  const [filter, setFilter] = useState('all');

  // Filters
  const filters = [
    { id:'all',        label:'All',        count: undefined },
    { id:'youtube',    label:'YouTube',    count: savedVideos.filter(v=>v.platform==='youtube').length },
    { id:'vimeo',      label:'Vimeo',      count: savedVideos.filter(v=>v.platform==='vimeo').length },
    { id:'direct',     label:'Direct',     count: savedVideos.filter(v=>v.platform==='direct').length },
    { id:'archive',    label:'Archive',    count: savedVideos.filter(v=>v.platform==='archive').length },
    { id:'downloaded', label:'Downloaded', count: savedVideos.filter(v=>v.downloaded).length },
    { id:'started',    label:'Started',    count: savedVideos.filter(v=>v.progress > 0 && v.progress < 0.95).length },
  ];
  const filtered = savedVideos.filter(v=>{
    if (filter === 'all') return true;
    if (filter === 'downloaded') return v.downloaded;
    if (filter === 'started') return v.progress > 0 && v.progress < 0.95;
    return v.platform === filter;
  });

  const hasFolders = folders.length > 0;
  const totallyEmpty = savedVideos.length === 0 && !hasFolders;

  if (totallyEmpty) {
    return (
      <div style={{flex:1, overflowY:'auto', background:SP.bg, padding:'18px 16px 80px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24}}>
          <div>
            <div style={{fontSize:24, fontWeight:800, color:SP.text, letterSpacing:-0.5}}>Library</div>
            <div style={{fontSize:13, color:SP.textFaint, marginTop:1}}>0 saved · 0 folders</div>
          </div>
          <div onClick={onCreateFolder} style={{width:36, height:36, borderRadius:10, background:SP.brand, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
            <Icon name="add" size={20} color="white"/>
          </div>
        </div>
        <EmptyState
          emoji="📂"
          title="Nothing here yet"
          subtitle="Browse the web and save any video link to your library."
        />
      </div>
    );
  }

  return (
    <div style={{flex:1, overflowY:'auto', background:SP.bg, paddingBottom:80}}>
      <div style={{padding:'18px 16px 0'}}>
        {/* Header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20}}>
          <div>
            <div style={{fontSize:24, fontWeight:800, color:SP.text, letterSpacing:-0.5}}>Library</div>
            <div style={{fontSize:13, color:SP.textFaint, marginTop:1}}>
              {savedVideos.length} saved · {folders.length} folder{folders.length===1?'':'s'}
            </div>
          </div>
          <div onClick={onCreateFolder} style={{width:36, height:36, borderRadius:10, background:SP.brand, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
            <Icon name="add" size={20} color="white"/>
          </div>
        </div>

        {/* Folders rail */}
        {hasFolders && (
          <div style={{marginBottom:24}}>
            <SectionHeader title="Folders" caps/>
            <div style={{display:'flex', gap:10, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4, paddingRight:8}}>
              {folders.map(f => <FolderTile key={f.id} folder={f} onPress={onOpenFolder}/>)}
              <NewFolderTile onPress={onCreateFolder}/>
            </div>
          </div>
        )}

        {/* All videos */}
        <SectionHeader title="All videos" caps style={{marginBottom:10}}/>
        <div style={{display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', marginBottom:14, paddingBottom:2}}>
          {filters.map(f => (
            <Pill key={f.id} label={f.label} count={f.count} active={filter===f.id} onClick={()=>setFilter(f.id)}/>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title={`No ${filters.find(f=>f.id===filter)?.label || ''} videos`}
            subtitle="Try a different filter or save more from Browse."
          />
        ) : (
          <div>
            {filtered.map((v, i, arr) => (
              <div key={v.id} style={{borderBottom: i<arr.length-1 ? `1px solid ${SP.line}` : 'none'}}>
                <VideoCard video={v} onPress={onPlay} onLongPress={onLongPressVideo}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// FOLDER DETAIL SCREEN (modal stack — covers tabs)
// ═════════════════════════════════════════════════════════════
function FolderDetailScreen({ folder, videos, onBack, onPlay, onLongPressVideo, onRename, onDelete, onOpenBrowse }) {
  return (
    <div style={{flex:1, overflowY:'auto', background:SP.bg, paddingBottom:90}}>
      {/* Nav row */}
      <div style={{display:'flex', alignItems:'center', padding:'8px 8px 12px'}}>
        <div onClick={onBack} style={{width:36, height:36, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
          <Icon name="chevron-back" size={20} color={SP.textMuted}/>
        </div>
        <div style={{flex:1}}/>
        <div onClick={onRename} style={{padding:'4px 10px', fontSize:13, color:SP.textMuted, cursor:'pointer'}}>Rename</div>
        <div onClick={onDelete} style={{padding:'4px 10px', fontSize:13, color:SP.danger, cursor:'pointer'}}>Delete</div>
      </div>

      <div style={{padding:'0 16px'}}>
        {/* Folder hero */}
        <div style={{
          width:'100%', borderRadius:20, padding:20, marginBottom:20,
          background: folderGradient(folder.id, true),
        }}>
          <Icon name="folder" size={26} color="rgba(255,255,255,0.8)" style={{marginBottom:14}}/>
          <div style={{fontSize:26, fontWeight:800, color:'white', letterSpacing:-0.5, lineHeight:'30px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:folder.description?6:8}}>{folder.name}</div>
          {folder.description && (
            <div style={{fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:'18px', marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>{folder.description}</div>
          )}
          <div style={{fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:14}}>{videos.length} video{videos.length===1?'':'s'}</div>
          <div style={{display:'flex', gap:8}}>
            <button
              onClick={()=>videos[0] && onPlay(videos[0], videos)}
              disabled={videos.length===0}
              style={{
                flex:1, height:44, borderRadius:12,
                background:'white', border:'none',
                color:'black', fontSize:14, fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                opacity: videos.length===0 ? 0.5 : 1,
              }}
            >
              <Icon name="play" size={14} color="black"/>Play all
            </button>
            <button onClick={onOpenBrowse} style={{
              height:44, padding:'0 18px', borderRadius:12,
              background:'rgba(255,255,255,0.18)', border:'none',
              color:'white', fontSize:13, fontWeight:600, cursor:'pointer',
            }}>Browse</button>
          </div>
        </div>

        {/* Videos */}
        {videos.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="Empty folder"
            subtitle="Long-press a video in the Library and choose Move to drop it in here."
          />
        ) : (
          <div>
            {videos.map((v, i, arr) => (
              <div key={v.id} style={{borderBottom: i<arr.length-1 ? `1px solid ${SP.line}` : 'none'}}>
                <VideoCard video={v} onPress={(vid)=>onPlay(vid, videos)} onLongPress={onLongPressVideo}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// CREATE FOLDER MODAL
// ═════════════════════════════════════════════════════════════
function CreateFolderScreen({ onBack, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const canSubmit = name.trim().length > 0;

  return (
    <div style={{flex:1, overflowY:'auto', background:SP.bg}}>
      {/* Grabber + header */}
      <div style={{width:36, height:5, background:SP.lineStrong, borderRadius:3, margin:'8px auto 4px'}}/>
      <div style={{display:'flex', alignItems:'center', padding:'8px 12px 20px'}}>
        <div onClick={onBack} style={{width:36, height:36, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
          <Icon name="chevron-back" size={20} color={SP.textMuted}/>
        </div>
        <div style={{flex:1, textAlign:'center', fontSize:16, fontWeight:700, color:SP.text, marginRight:36}}>New folder</div>
      </div>

      <div style={{padding:'0 20px'}}>
        <div style={{fontSize:13, color:SP.textMuted, marginBottom:24}}>Group related videos together.</div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:12, color:SP.textMuted, marginBottom:6, fontWeight:600}}>Name</div>
          <input
            autoFocus value={name} onChange={e=>setName(e.target.value)}
            placeholder="Nepal Election 2026"
            style={{
              width:'100%', height:48, borderRadius:12,
              background:SP.surface, border:`1px solid ${name?SP.brand:SP.line}`,
              color:SP.text, fontSize:14, padding:'0 14px',
              boxSizing:'border-box', outline:'none', fontFamily:'inherit',
              transition:'border-color 150ms',
            }}
          />
        </div>

        <div style={{marginBottom:24}}>
          <div style={{fontSize:12, color:SP.textMuted, marginBottom:6, fontWeight:600}}>Description (optional)</div>
          <textarea
            value={desc} onChange={e=>setDesc(e.target.value)}
            rows={3} placeholder="Notes, context, anything"
            style={{
              width:'100%', borderRadius:12,
              background:SP.surface, border:`1px solid ${desc?SP.brand:SP.line}`,
              color:SP.text, fontSize:14, padding:'12px 14px',
              boxSizing:'border-box', outline:'none', fontFamily:'inherit', resize:'vertical',
              transition:'border-color 150ms',
            }}
          />
        </div>

        <button
          onClick={()=>canSubmit && onCreate({name:name.trim(), description:desc.trim()})}
          style={{
            width:'100%', height:48, borderRadius:12,
            background: canSubmit ? SP.brand : SP.surface2,
            border:'none', cursor: canSubmit ? 'pointer' : 'default',
            fontSize:15, fontWeight:700, color:'white',
            opacity: canSubmit ? 1 : 0.5,
          }}
        >Create</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MOVE VIDEO MODAL
// ═════════════════════════════════════════════════════════════
function MoveVideoScreen({ video, folders, onClose, onMove, onNewFolder }) {
  return (
    <div style={{flex:1, overflowY:'auto', background:SP.bg}}>
      {/* Grabber */}
      <div style={{width:36, height:5, background:SP.lineStrong, borderRadius:3, margin:'8px auto 4px'}}/>
      {/* Header */}
      <div style={{display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px 20px'}}>
        <div onClick={onClose} style={{width:36, height:36, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0}}>
          <Icon name="close" size={20} color={SP.textMuted}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:20, fontWeight:800, color:SP.text, letterSpacing:-0.3}}>Move to…</div>
          <div style={{fontSize:12, color:SP.textFaint, marginTop:2}}>Choose where this video belongs.</div>
        </div>
      </div>

      <div style={{padding:'0 16px'}}>
        {/* Library root */}
        <div onClick={()=>onMove(null)} style={{
          display:'flex', alignItems:'center', gap:12, padding:14, borderRadius:14,
          background:SP.surface, border:`1px solid ${SP.line}`, cursor:'pointer', marginBottom:8,
        }}>
          <div style={{width:44, height:44, borderRadius:10, background:SP.surface2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
            <Icon name="home" size={20} color={SP.textMuted}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:14, fontWeight:700, color:SP.text}}>Library root</div>
            <div style={{fontSize:12, color:SP.textFaint}}>Remove from any folder</div>
          </div>
          <Icon name="chevron-forward" size={16} color={SP.textFaint}/>
        </div>

        {/* New folder */}
        <div onClick={onNewFolder} style={{
          display:'flex', alignItems:'center', gap:12, padding:14, borderRadius:14,
          background:SP.brandSoft, border:`1px solid ${SP.brand}`, cursor:'pointer', marginBottom:20,
        }}>
          <div style={{width:44, height:44, borderRadius:10, background:SP.brand, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
            <Icon name="add" size={22} color="white"/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:14, fontWeight:700, color:SP.brand}}>New folder…</div>
            <div style={{fontSize:12, color:SP.textMuted}}>Create one and move here</div>
          </div>
        </div>

        {/* Existing folders */}
        {folders.length > 0 ? (
          <>
            <SectionHeader title="Existing folders" caps style={{marginBottom:8, marginTop:10}}/>
            {folders.map(f => (
              <div key={f.id} onClick={()=>onMove(f.id)} style={{
                display:'flex', alignItems:'center', gap:12, padding:14, borderRadius:14,
                background:SP.surface, border:`1px solid ${SP.line}`, cursor:'pointer', marginBottom:8,
              }}>
                <div style={{width:44, height:44, borderRadius:10, background:folderGradient(f.id), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <Icon name="folder" size={18} color="rgba(255,255,255,0.85)"/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:700, color:SP.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{f.name}</div>
                  {f.description && <div style={{fontSize:12, color:SP.textFaint, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{f.description}</div>}
                </div>
                <Icon name="chevron-forward" size={16} color={SP.textFaint}/>
              </div>
            ))}
          </>
        ) : (
          <EmptyState
            emoji="📁"
            title="No folders yet"
            subtitle="Create one above to drop this video into it."
          />
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  BrowseScreen, LibraryScreen, FolderDetailScreen, CreateFolderScreen, MoveVideoScreen,
});
