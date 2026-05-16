// Everest Flow — FloatingPlayer (PIP card + Expanded fullscreen)
const { useState, useEffect, useRef } = React;

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

// ═════════════════════════════════════════════════════════════
// VIDEO STAGE — the actual video frame (mocked with gradient)
// ═════════════════════════════════════════════════════════════
function VideoStage({ video, playing, fill='cover', showWave=true }) {
  if (!video) return null;
  return (
    <div style={{
      width:'100%', height:'100%', position:'relative', overflow:'hidden',
      background: videoGradient(video.hue),
    }}>
      {/* Decorative — simulates actual video content */}
      <svg style={{position:'absolute',inset:0,opacity:0.18}} width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`rg-${video.id}`}>
            <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="60" fill={`url(#rg-${video.id})`}/>
        <circle cx="170" cy="90" r="45" fill={`url(#rg-${video.id})`}/>
      </svg>
      {/* Center pause indicator (only when paused) */}
      {!playing && (
        <div style={{
          position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            width:48, height:48, borderRadius:24,
            background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'1px solid rgba(255,255,255,0.2)',
          }}>
            <Icon name="play" size={20} color="white" style={{marginLeft:3}}/>
          </div>
        </div>
      )}
      {/* Playing wave indicator */}
      {playing && showWave && (
        <div style={{position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'flex-end', gap:3}}>
          {[0,1,2,3,4].map(i=>(
            <div key={i} style={{
              width:3, borderRadius:2, background:SP.brand, opacity:0.7,
              animation:`fpwave 0.9s ${i*0.12}s ease-in-out infinite alternate`,
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PIP CARD — 220×124, draggable, bottom-right default
// ═════════════════════════════════════════════════════════════
function FloatingPIP({ video, playing, position, setPosition, progress, onExpand, onTogglePlay, onClose, container }) {
  const cardRef = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const onDown = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startPos = position;
    let moved = false;
    dragRef.current = { startX, startY, startPos };

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 4) {
        moved = true;
        setDragging(true);
      }
      if (moved) {
        // Clamp inside container
        const c = container.current?.getBoundingClientRect();
        if (!c) return;
        const cardW = 220, cardH = 124;
        const newX = Math.max(8, Math.min(c.width - cardW - 8, startPos.x + dx));
        const newY = Math.max(8, Math.min(c.height - cardH - 8, startPos.y + dy));
        setPosition({ x:newX, y:newY });
      }
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // If no drag → treat as tap → expand
      if (!moved) onExpand();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={onDown}
      style={{
        position:'absolute',
        left: position.x, top: position.y,
        width:220, height:124,
        background:SP.surface,
        border:`1px solid ${SP.lineStrong}`,
        borderRadius:16, overflow:'hidden',
        boxShadow: dragging
          ? '0 16px 28px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.5)'
          : '0 8px 14px rgba(0,0,0,0.6)',
        zIndex:500, userSelect:'none', touchAction:'none',
        transition: dragging ? 'none' : 'box-shadow 200ms ease',
        cursor: dragging ? 'grabbing' : 'pointer',
      }}
    >
      {/* Video frame fills the card */}
      <VideoStage video={video} playing={playing} showWave={false}/>

      {/* Close button (top-right) */}
      <div onPointerDown={e=>{ e.stopPropagation(); onClose(); }} style={{
        position:'absolute', top:6, right:6, zIndex:2,
        width:24, height:24, borderRadius:12, background:'rgba(0,0,0,0.6)',
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
      }}>
        <Icon name="close" size={12} color="white"/>
      </div>

      {/* Bottom info strip */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, zIndex:2,
        background:'rgba(0,0,0,0.7)',
        padding:'7px 10px',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontSize:11, fontWeight:700, color:'white',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{video.title}</div>
          <div style={{
            fontSize:9, color:'rgba(255,255,255,0.55)',
            textTransform:'capitalize', marginTop:1,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{video.platform}</div>
        </div>
        <div onPointerDown={e=>{ e.stopPropagation(); onTogglePlay(); }} style={{
          width:30, height:30, borderRadius:15,
          background:SP.brandSoft, border:`1px solid ${SP.brand}`,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
        }}>
          <Icon name={playing?'pause':'play'} size={11} color={SP.brand} style={{marginLeft:playing?0:1}}/>
        </div>
      </div>

      {/* Progress hairline */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:3,
        background:'rgba(255,255,255,0.08)', zIndex:3,
      }}>
        <div style={{height:'100%', width:`${progress*100}%`, background:SP.brand}}/>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// EXPANDED PLAYER — fullscreen with full chrome
// ═════════════════════════════════════════════════════════════
function FloatingExpanded({ video, playing, progress, setProgress, queue, queueIdx, onCollapse, onClose, onTogglePlay, onPrev, onNext, onJumpTo, onRemoveFromQueue, onMove }) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [downloadState, setDownloadState] = useState(video.downloaded ? 'done' : 'idle'); // idle | downloading | done
  const [downloadPct, setDownloadPct] = useState(0);
  const [gestureHud, setGestureHud] = useState(null); // { kind, value }
  const hideTimer = useRef(null);

  // Auto-hide chrome after 3.5s
  const resetHide = () => {
    setChromeVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(()=>setChromeVisible(false), 3500);
  };
  useEffect(()=>{ resetHide(); return ()=>clearTimeout(hideTimer.current); }, []);

  const handleDownload = () => {
    if (downloadState !== 'idle') return;
    setDownloadState('downloading');
    setDownloadPct(0);
    const t = setInterval(()=>{
      setDownloadPct(p=>{
        if (p >= 100) { clearInterval(t); setDownloadState('done'); return 100; }
        return p + 4;
      });
    }, 80);
  };

  const cancelDownload = () => { setDownloadState('idle'); setDownloadPct(0); };

  const isEmbed = video.platform === 'youtube';
  const elapsedSec = progress * video.durSec;
  const remainSec  = video.durSec - elapsedSec;

  const seekDelta = (d) => setProgress(p => Math.max(0, Math.min(1, p + d / video.durSec)));

  // Gesture: vertical drag on left half = brightness, right half = volume
  const stageRef = useRef(null);
  const gestureRef = useRef(null);
  const onStageDown = (e) => {
    const rect = stageRef.current.getBoundingClientRect();
    const startY = e.clientY;
    const startX = e.clientX;
    const isRight = (startX - rect.left) > rect.width/2;
    const start = isRight ? 0.7 : 0.6;
    let val = start;
    let moved = false;
    let hudTimer = null;
    gestureRef.current = { isRight, start, startY };

    const onMove = (ev) => {
      const dy = startY - ev.clientY;
      if (!moved && Math.abs(dy) > 8) moved = true;
      if (moved) {
        ev.preventDefault();
        val = Math.max(0, Math.min(1, start + dy / rect.height));
        setGestureHud({ kind: isRight ? 'volume' : 'brightness', value: val });
        clearTimeout(hudTimer);
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (moved) {
        hudTimer = setTimeout(()=>setGestureHud(null), 800);
      } else {
        // Tap → toggle chrome
        setChromeVisible(v => !v);
        if (!chromeVisible) resetHide();
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Action pills
  const actionPills = [];
  actionPills.push({
    key:'speed',
    label:`${speed}× Speed`,
    active: showSpeed,
    onClick: ()=>{ setShowSpeed(s=>!s); resetHide(); },
  });
  if (!isEmbed) {
    if (downloadState === 'idle') actionPills.push({ key:'dl', label:'↓ Download', onClick:()=>{ handleDownload(); resetHide(); } });
    else if (downloadState === 'downloading') actionPills.push({ key:'dl', label:`${downloadPct}% · cancel`, amber:true, onClick:()=>{ cancelDownload(); resetHide(); } });
    else actionPills.push({ key:'dl', label:'✓ Saved offline', brand:true, onClick:()=>{ resetHide(); } });
  }
  actionPills.push({ key:'pip', label:'⛶ PIP', onClick:onCollapse });
  actionPills.push({ key:'move', label:'📁 Move', solidBrand:true, onClick:onMove });

  return (
    <div style={{
      position:'absolute', inset:0, zIndex:600,
      background:'#000',
      display:'flex', flexDirection:'column',
      animation:'fpExpand 240ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    }}>
      {/* Video stage fills screen behind chrome */}
      <div ref={stageRef} onPointerDown={onStageDown} style={{position:'absolute', inset:0, cursor:'pointer'}}>
        <VideoStage video={video} playing={playing} showWave/>
      </div>

      {/* Gesture HUD (centered) */}
      {gestureHud && (
        <div style={{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:140, padding:'12px 14px', borderRadius:12,
          background:'rgba(0,0,0,0.7)', zIndex:10,
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <Icon name={gestureHud.kind==='volume'?'volume-high':'sun'} size={18} color="white"/>
            <span style={{fontSize:13,color:'white',fontWeight:600}}>{Math.round(gestureHud.value*100)}%</span>
          </div>
          <div style={{height:4, background:'rgba(255,255,255,0.2)', borderRadius:2}}>
            <div style={{height:'100%', width:`${gestureHud.value*100}%`, background:'white', borderRadius:2}}/>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:5,
        padding:'12px 12px', display:'flex', alignItems:'center', gap:8,
        background:'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        opacity: chromeVisible ? 1 : 0, transition:'opacity 200ms',
        pointerEvents: chromeVisible ? 'auto' : 'none',
      }}>
        <div onClick={onCollapse} style={{
          width:36, height:36, borderRadius:18, background:'rgba(0,0,0,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <Icon name="chevron-down" size={20} color="white"/>
        </div>
        <div style={{flex:1, minWidth:0, fontSize:13, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center'}}>
          {video.title}
        </div>
        <div onClick={onClose} style={{
          width:36, height:36, borderRadius:18, background:'rgba(0,0,0,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <Icon name="close" size={18} color="white"/>
        </div>
      </div>

      {/* CENTER CONTROLS */}
      {!isEmbed && (
        <div style={{
          position:'absolute', top:'50%', left:0, right:0,
          transform:'translateY(-50%)', zIndex:4,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          opacity: chromeVisible ? 1 : 0, transition:'opacity 200ms',
          pointerEvents: chromeVisible ? 'auto' : 'none',
        }}>
          <div onClick={onPrev} style={{
            width:48, height:48, borderRadius:24, background:'rgba(0,0,0,0.45)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            opacity: queueIdx > 0 ? 1 : 0.3,
          }}>
            <Icon name="play-skip-back" size={18} color="white"/>
          </div>
          <div onClick={()=>{ seekDelta(-10); resetHide(); }} style={{
            width:48, height:48, borderRadius:24, background:'rgba(0,0,0,0.45)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            color:'white', fontSize:12, fontWeight:700,
          }}>−10</div>
          <div onClick={()=>{ onTogglePlay(); resetHide(); }} style={{
            width:72, height:72, borderRadius:36, background:'rgba(255,255,255,0.95)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            margin:'0 4px',
          }}>
            <Icon name={playing?'pause':'play'} size={26} color="black" style={{marginLeft:playing?0:3}}/>
          </div>
          <div onClick={()=>{ seekDelta(10); resetHide(); }} style={{
            width:48, height:48, borderRadius:24, background:'rgba(0,0,0,0.45)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            color:'white', fontSize:12, fontWeight:700,
          }}>+10</div>
          <div onClick={onNext} style={{
            width:48, height:48, borderRadius:24, background:'rgba(0,0,0,0.45)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            opacity: queueIdx < queue.length - 1 ? 1 : 0.3,
          }}>
            <Icon name="play-skip-forward" size={18} color="white"/>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET (always anchored) */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:5,
        background:'rgba(0,0,0,0.55)', padding:'12px 16px 22px',
      }}>
        {/* Speed picker (above pills when open) */}
        {showSpeed && (
          <div style={{
            display:'flex', gap:6, padding:8, borderRadius:12,
            background:'rgba(0,0,0,0.55)', border:'1px solid rgba(255,255,255,0.1)',
            marginBottom:10, animation:'fadeIn 180ms',
          }}>
            {SPEEDS.map(sp => {
              const sel = speed === sp;
              return (
                <div key={sp} onClick={()=>setSpeed(sp)} style={{
                  padding:'6px 10px', borderRadius:SP.pill,
                  background: sel ? SP.brandSoft : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${sel ? SP.brand : 'rgba(255,255,255,0.08)'}`,
                  fontSize:12, fontWeight:700,
                  color: sel ? SP.brand : 'white',
                  cursor:'pointer',
                }}>{sp}×</div>
              );
            })}
          </div>
        )}

        {/* Seek bar OR embed controls */}
        {!isEmbed ? (
          <>
            <div onClick={e=>{ const r=e.currentTarget.getBoundingClientRect(); setProgress((e.clientX-r.left)/r.width); resetHide(); }} style={{
              height:4, background:'rgba(255,255,255,0.25)', borderRadius:2, cursor:'pointer', position:'relative',
              marginBottom:6,
            }}>
              <div style={{height:'100%', width:`${progress*100}%`, background:SP.brand, borderRadius:2, position:'relative'}}>
                <div style={{position:'absolute', right:-6, top:-4, width:12, height:12, borderRadius:6, background:SP.brand, border:'2px solid white'}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between', marginBottom:12, fontSize:11, color:'rgba(255,255,255,0.8)'}}>
              <span>{fmtSecs(elapsedSec)}</span>
              <span>{fmtMinusSecs(remainSec)}</span>
            </div>
          </>
        ) : (
          <div style={{display:'flex', gap:8, marginBottom:12}}>
            <div onClick={onPrev} style={{flex:1, height:36, borderRadius:SP.pill, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
              <Icon name="play-skip-back" size={14} color="white"/>
            </div>
            <div style={{flex:2, height:36, borderRadius:SP.pill, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', color:'white', fontSize:12, fontWeight:600}}>
              <span>Open in {video.platform}</span>
              <Icon name="arrow-up-right" size={12} color="white"/>
            </div>
            <div onClick={onNext} style={{flex:1, height:36, borderRadius:SP.pill, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
              <Icon name="play-skip-forward" size={14} color="white"/>
            </div>
          </div>
        )}

        {/* Action pills */}
        <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:10}}>
          {actionPills.map(p => {
            const bg = p.solidBrand ? SP.brand : p.brand ? SP.brandSoft : p.amber ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.08)';
            const border = p.solidBrand ? SP.brand : p.brand ? SP.brand : p.amber ? SP.amber : 'rgba(255,255,255,0.12)';
            const color = p.solidBrand ? 'white' : p.brand ? SP.brand : p.amber ? SP.amber : 'white';
            return (
              <div key={p.key} onClick={p.onClick} style={{
                padding:'7px 12px', borderRadius:SP.pill,
                background: p.active ? SP.brand : bg,
                border:`1px solid ${p.active ? SP.brand : border}`,
                fontSize:12, fontWeight:700,
                color: p.active ? 'white' : color,
                cursor:'pointer',
              }}>{p.label}</div>
            );
          })}
        </div>

        {/* Autoplay next */}
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:queue.length > queueIdx + 1 ? 12 : 0}}>
          <div onClick={()=>setAutoplayNext(a=>!a)} style={{
            width:42, height:24, borderRadius:12, position:'relative', cursor:'pointer',
            background: autoplayNext ? SP.brand : 'rgba(255,255,255,0.18)',
            transition:'background 200ms',
          }}>
            <div style={{
              position:'absolute', top:2, left: autoplayNext ? 20 : 2,
              width:20, height:20, borderRadius:10, background:'white',
              transition:'left 200ms',
              boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
            }}/>
          </div>
          <span style={{fontSize:12, color:'#ccc'}}>Autoplay next</span>
        </div>

        {/* Up next list */}
        {queue.length > queueIdx + 1 && (
          <div>
            <div style={{fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:0.6, textTransform:'uppercase', marginBottom:6}}>
              Up next · {queue.length - queueIdx - 1}
            </div>
            <div style={{maxHeight:180, overflowY:'auto'}}>
              {queue.slice(queueIdx+1).map((v, i) => (
                <div key={v.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:6, borderRadius:8, marginBottom:6,
                  background:'rgba(255,255,255,0.05)',
                }}>
                  <div onClick={()=>onJumpTo(queueIdx + 1 + i)} style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0,cursor:'pointer'}}>
                    <div style={{width:56,height:32,borderRadius:4,background:videoGradient(v.hue),flexShrink:0}}/>
                    <div style={{
                      flex:1, minWidth:0, fontSize:12, color:'white',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>{v.title}</div>
                  </div>
                  <div onClick={()=>onRemoveFromQueue(queueIdx + 1 + i)} style={{
                    width:28, height:28, borderRadius:14, display:'flex',
                    alignItems:'center', justifyContent:'center', cursor:'pointer',
                  }}>
                    <Icon name="close" size={14} color="rgba(255,255,255,0.6)"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ROOT — manages PIP <-> Expanded transition
// ═════════════════════════════════════════════════════════════
function FloatingPlayer({ playerState, container, onMove }) {
  const {
    queue, queueIdx, mode, playing, progress,
    setPlaying, setProgress, setMode,
    onClose, onPrev, onNext, onJumpTo, onRemoveFromQueue,
  } = playerState;

  const [pipPos, setPipPos] = useState(null);

  // Compute default PIP position once container is available (bottom-right, above tab bar)
  useEffect(() => {
    if (pipPos || !container.current) return;
    const c = container.current.getBoundingClientRect();
    const TAB_BAR = 88; // approximate, also accounts for safe area
    setPipPos({ x: c.width - 220 - 12, y: c.height - 124 - TAB_BAR - 12 });
  }, [container, pipPos]);

  // Auto-advance progress when playing
  useEffect(() => {
    if (!playing || !queue[queueIdx]) return;
    const t = setInterval(() => {
      setProgress(p => {
        const nx = p + 0.5 / queue[queueIdx].durSec;
        if (nx >= 1) { onNext(); return 0; }
        return nx;
      });
    }, 500);
    return () => clearInterval(t);
  }, [playing, queueIdx, queue]);

  if (!queue[queueIdx] || mode === 'hidden') return null;
  const video = queue[queueIdx];

  if (mode === 'pip' && pipPos) {
    return (
      <FloatingPIP
        video={video} playing={playing} progress={progress}
        position={pipPos} setPosition={setPipPos}
        container={container}
        onExpand={()=>setMode('expanded')}
        onTogglePlay={()=>setPlaying(p=>!p)}
        onClose={onClose}
      />
    );
  }
  if (mode === 'expanded') {
    return (
      <FloatingExpanded
        video={video} playing={playing}
        progress={progress} setProgress={setProgress}
        queue={queue} queueIdx={queueIdx}
        onCollapse={()=>setMode('pip')}
        onClose={onClose}
        onTogglePlay={()=>setPlaying(p=>!p)}
        onPrev={onPrev} onNext={onNext}
        onJumpTo={onJumpTo}
        onRemoveFromQueue={onRemoveFromQueue}
        onMove={onMove}
      />
    );
  }
  return null;
}

Object.assign(window, { FloatingPlayer });
