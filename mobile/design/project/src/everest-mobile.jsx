// Everest Flow — Root app: 2-tab bar, modal stack, player state, animations
const { useState, useEffect, useRef, useCallback } = React;

// ═════════════════════════════════════════════════════════════
// TAB BAR — 2 tabs only (Browse, Library), per spec section 8
// ═════════════════════════════════════════════════════════════
function TabBar({ tab, onChangeTab, container }) {
  const tabs = [
    { id:'browse',  icon:'globe-outline',  iconActive:'globe',   label:'Browse'  },
    { id:'library', icon:'library-outline', iconActive:'library', label:'Library' },
  ];
  return (
    <div style={{
      flexShrink:0, background:SP.chrome,
      borderTop:`1px solid ${SP.lineStrong}`,
      paddingBottom:4,
      display:'flex',
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <div
            key={t.id}
            onClick={()=>onChangeTab(t.id)}
            style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              paddingTop:8, paddingBottom:4, cursor:'pointer', position:'relative',
              transition:'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            {/* Indicator pill */}
            <div style={{
              width:24, height:3, borderRadius:2,
              background:SP.brand,
              marginBottom:5,
              transform: active ? 'scaleX(1) scaleY(1)' : 'scaleX(0.4) scaleY(0.5)',
              opacity: active ? 1 : 0,
              transition:'transform 240ms cubic-bezier(0.34, 1.5, 0.64, 1), opacity 200ms',
            }}/>
            <div style={{
              transform: active ? 'translateY(-1px)' : 'translateY(0)',
              transition:'transform 240ms cubic-bezier(0.34, 1.5, 0.64, 1)',
            }}>
              <Icon
                name={active ? t.iconActive : t.icon}
                size={24}
                color={active ? SP.brand : SP.textFaint}
              />
            </div>
            <span style={{
              fontSize:11, marginTop:3,
              color: active ? SP.brand : SP.textFaint,
              fontWeight: active ? 700 : 500,
              letterSpacing:-0.1,
              transition:'color 150ms',
            }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ROOT APP
// ═════════════════════════════════════════════════════════════
function EverestFlowApp() {
  // ─── State ────────────────────────────────────────────────
  const [tab, setTab] = useState('browse');
  const [folders, setFolders] = useState(FOLDERS);
  const [savedVideos, setSavedVideos] = useState(VIDEOS);
  const [modalStack, setModalStack] = useState([]); // { type, data }
  const [longPressTarget, setLongPressTarget] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Player state
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [playerMode, setPlayerMode] = useState('hidden'); // hidden | pip | expanded
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef(null);

  // ─── Modal stack helpers ─────────────────────────────────
  const pushModal = (m) => setModalStack(s => [...s, m]);
  const popModal  = () => setModalStack(s => s.slice(0, -1));
  const clearModals = () => setModalStack([]);
  const topModal = modalStack[modalStack.length - 1];

  // ─── Library actions ─────────────────────────────────────
  const handleSaveVideo = (video) => {
    setSavedVideos(prev => prev.find(v => v.id === video.id) ? prev : [video, ...prev]);
  };

  const openFolder = (folder) => pushModal({ type:'folder', folderId:folder.id });

  const createFolder = ({name, description}) => {
    const id = Math.max(0, ...folders.map(f=>f.id)) + 1;
    const newFolder = { id, name, description, count:0 };
    setFolders(f => [newFolder, ...f]);
    // Replace any 'create-folder' modal with the new folder view
    setModalStack(s => {
      const filtered = s.filter(m => m.type !== 'create-folder');
      return [...filtered, { type:'folder', folderId:id }];
    });
  };

  const renameFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    pushModal({ type:'rename-folder', folderId, currentName: folder.name });
  };

  const deleteFolder = (folderId, keepVideos) => {
    setFolders(f => f.filter(x => x.id !== folderId));
    if (keepVideos) {
      setSavedVideos(vs => vs.map(v => v.folderId === folderId ? {...v, folderId:null} : v));
    } else {
      setSavedVideos(vs => vs.filter(v => v.folderId !== folderId));
    }
    popModal();
  };

  const moveVideo = (videoId, folderId) => {
    setSavedVideos(vs => vs.map(v => v.id === videoId ? {...v, folderId} : v));
    // Update folder counts
    setFolders(fs => fs.map(f => ({
      ...f, count: savedVideos.filter(v => v.id !== videoId ? v.folderId === f.id : folderId === f.id).length
    })));
    popModal();
  };

  const deleteVideo = (videoId) => {
    setSavedVideos(vs => vs.filter(v => v.id !== videoId));
    setLongPressTarget(null);
  };

  // ─── Player actions ───────────────────────────────────────
  const playVideo = (video, contextQueue) => {
    const q = contextQueue || [video];
    const idx = q.findIndex(v => v.id === video.id);
    setQueue(q);
    setQueueIdx(idx);
    setProgress(video.progress || 0);
    setPlaying(true);
    setPlayerMode('expanded');
  };

  const playerOnPrev = () => {
    setQueueIdx(i => {
      const ni = Math.max(0, i - 1);
      setProgress(queue[ni]?.progress || 0);
      return ni;
    });
  };
  const playerOnNext = () => {
    setQueueIdx(i => {
      if (i >= queue.length - 1) return i;
      const ni = i + 1;
      setProgress(queue[ni]?.progress || 0);
      return ni;
    });
  };
  const playerOnJumpTo = (idx) => {
    setQueueIdx(idx);
    setProgress(queue[idx]?.progress || 0);
  };
  const playerOnClose = () => { setPlayerMode('hidden'); setPlaying(false); };
  const playerOnRemoveFromQueue = (idx) => setQueue(q => q.filter((_,i) => i !== idx));

  const playerOnMove = () => {
    const v = queue[queueIdx];
    if (v) pushModal({ type:'move-video', videoId: v.id });
  };

  // ─── Folder detail data ───────────────────────────────────
  const getFolderById = (id) => folders.find(f => f.id === id);
  const getFolderVideos = (folderId) =>
    savedVideos.filter(v => v.folderId === folderId);

  // ─── Render ───────────────────────────────────────────────
  const playerActive = playerMode !== 'hidden' && queue.length > 0;
  const modalActive = modalStack.length > 0;

  return (
    <div ref={containerRef} style={{
      width:'100%', height:'100%',
      display:'flex', flexDirection:'column',
      background:SP.bg, position:'relative', overflow:'hidden',
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display:none; }
        input::placeholder, textarea::placeholder { color:${SP.textFaint}; }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes slideDownBanner { from { transform:translateY(-12px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes browserLoading { 0% { left:-40%; } 100% { left:100%; } }
        @keyframes fpwave { from { height:5px; } to { height:18px; } }
        @keyframes fpExpand { from { opacity:0.4; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes modalIn { from { transform:translateY(100%); } to { transform:translateY(0); } }
      `}</style>

      {/* Tab content */}
      <div style={{flex:1, position:'relative', overflow:'hidden'}}>
        {tab === 'browse' && (
          <BrowseScreen
            savedVideos={savedVideos}
            onSaveVideo={handleSaveVideo}
            onPlay={playVideo}
            onOpenLibrary={()=>setTab('library')}
          />
        )}
        {tab === 'library' && (
          <LibraryScreen
            folders={folders}
            savedVideos={savedVideos}
            onOpenFolder={openFolder}
            onCreateFolder={()=>pushModal({ type:'create-folder' })}
            onLongPressVideo={(v)=>setLongPressTarget({ video:v, context:'library' })}
            onPlay={(v) => playVideo(v, savedVideos)}
          />
        )}
      </div>

      {/* Bottom tab bar (hidden when modal stack is non-empty per spec) */}
      {!modalActive && (
        <TabBar tab={tab} onChangeTab={setTab} container={containerRef}/>
      )}

      {/* MODAL STACK — overlay above tab bar, takes over full screen */}
      {modalStack.map((m, i) => {
        const isTop = i === modalStack.length - 1;
        return (
          <div key={i} style={{
            position:'absolute', inset:0, zIndex:300 + i,
            background:SP.bg, display: isTop ? 'flex':'none', flexDirection:'column',
            animation:'modalIn 240ms ease-out',
          }}>
            {m.type === 'folder' && (() => {
              const folder = getFolderById(m.folderId);
              if (!folder) { popModal(); return null; }
              const vids = getFolderVideos(m.folderId);
              return (
                <FolderDetailScreen
                  folder={folder} videos={vids}
                  onBack={popModal}
                  onPlay={(v, ctx)=>{ playVideo(v, ctx || vids); }}
                  onLongPressVideo={(v)=>setLongPressTarget({ video:v, context:'folder' })}
                  onRename={()=>renameFolder(folder.id)}
                  onDelete={()=>setConfirmDialog({
                    title:`Delete "${folder.name}"?`,
                    subtitle:'Choose how to handle the videos inside.',
                    actions:[
                      { label:`Keep videos (move to root)`, action:()=>deleteFolder(folder.id, true) },
                      { label:'Delete videos too', destructive:true, action:()=>deleteFolder(folder.id, false) },
                    ],
                  })}
                  onOpenBrowse={()=>{ clearModals(); setTab('browse'); }}
                />
              );
            })()}
            {m.type === 'create-folder' && (
              <CreateFolderScreen
                onBack={popModal}
                onCreate={createFolder}
              />
            )}
            {m.type === 'rename-folder' && (() => {
              return (
                <CreateFolderScreen
                  onBack={popModal}
                  onCreate={({name, description})=>{
                    setFolders(fs => fs.map(f => f.id === m.folderId ? {...f, name, description: description || f.description} : f));
                    popModal();
                  }}
                />
              );
            })()}
            {m.type === 'move-video' && (() => {
              const v = savedVideos.find(x => x.id === m.videoId);
              if (!v) { popModal(); return null; }
              return (
                <MoveVideoScreen
                  video={v} folders={folders}
                  onClose={popModal}
                  onMove={(folderId)=>moveVideo(v.id, folderId)}
                  onNewFolder={()=>pushModal({ type:'create-folder' })}
                />
              );
            })()}
          </div>
        );
      })}

      {/* Long-press action sheet */}
      {longPressTarget && (
        <ActionSheet
          title={longPressTarget.video.title}
          subtitle={longPressTarget.video.channel}
          actions={
            longPressTarget.context === 'folder' ? [
              { label:'Move to another folder', icon:'move', action:()=>{
                pushModal({ type:'move-video', videoId: longPressTarget.video.id });
                setLongPressTarget(null);
              }},
              { label:'Move out of folder',     icon:'home', action:()=>{
                moveVideo(longPressTarget.video.id, null);
                setLongPressTarget(null);
              }},
              { label:'Delete',                  icon:'trash', destructive:true, action:()=>{
                setConfirmDialog({
                  title:`Delete "${longPressTarget.video.title}"?`,
                  subtitle:'This removes it from your library.',
                  actions:[
                    { label:'Delete', destructive:true, action:()=>deleteVideo(longPressTarget.video.id) },
                  ],
                });
                setLongPressTarget(null);
              }},
            ] : [
              { label:'Move to folder…',  icon:'move', action:()=>{
                pushModal({ type:'move-video', videoId: longPressTarget.video.id });
                setLongPressTarget(null);
              }},
              { label:'Delete', icon:'trash', destructive:true, action:()=>{
                setConfirmDialog({
                  title:`Delete "${longPressTarget.video.title}"?`,
                  subtitle:'This removes it from your library.',
                  actions:[
                    { label:'Delete', destructive:true, action:()=>deleteVideo(longPressTarget.video.id) },
                  ],
                });
                setLongPressTarget(null);
              }},
            ]
          }
          onClose={()=>setLongPressTarget(null)}
        />
      )}

      {/* Confirm dialog (destructive alerts) */}
      {confirmDialog && (
        <ActionSheet
          title={confirmDialog.title}
          subtitle={confirmDialog.subtitle}
          actions={confirmDialog.actions}
          onClose={()=>setConfirmDialog(null)}
        />
      )}

      {/* FloatingPlayer (PIP card or Expanded fullscreen) */}
      {playerActive && (
        <FloatingPlayer
          playerState={{
            queue, queueIdx, mode: playerMode, playing, progress,
            setPlaying, setProgress, setMode: setPlayerMode,
            onClose: playerOnClose, onPrev: playerOnPrev, onNext: playerOnNext,
            onJumpTo: playerOnJumpTo, onRemoveFromQueue: playerOnRemoveFromQueue,
          }}
          container={containerRef}
          onMove={playerOnMove}
        />
      )}
    </div>
  );
}

Object.assign(window, { EverestFlowApp });
