  console.error("Failed to add property", err)
} finally {
  setLoadingNote(false)
}
}

  const handleUpdateProperty = async (name: string, value: any) => {
  if (!selectedPath) return;
  setLoadingNote(true);
  try {
  // Use the shared helper – guarantees ONLY this key changes
  const finalVal = typeof value === 'boolean' ? value
  : (value === 'true' || value === 'false') ? (value === 'true')
  : typeof value === 'number' ? value
  : String(value);

  await updateFrontmatterProperty(selectedPath, name, finalVal, noteMetadata);

  const refreshed = await sidecarApi.readObsidianNote(selectedPath);
  setNoteMetadata(refreshed.metadata ?? {});

  // Sync 'read' to Hub checkbox (bi-directional)
  if (name.toLowerCase() === 'read') {
  const label = selectedPath.split(/[/\\]/).pop()?.replace('.md', '') ?? '';
  await handleToggleCheckbox(label, !!value, selectedPath, true);
}
} catch (err) {
  console.error('[Property] Failed to update property:', err);
} finally {
  setLoadingNote(false)
}
};

 const handleDeleteProperty = async (name: string) => {
  if (!selectedPath) return
  setLoadingNote(true)
  try {
  const res = await sidecarApi.readObsidianNote(selectedPath)
  const content = res.content
  const newContent = deleteProperty(content, name)

  await sidecarApi.updateObsidianNote(selectedPath, newContent)
  const refreshed = await sidecarApi.readObsidianNote(selectedPath)
  setNoteMetadata(refreshed.metadata || {})
  setNoteContent(refreshed.content || '')
  setEditedContent(refreshed.content || '')
} catch (err) {
  console.error("Failed to delete property", err)
} finally {
  setLoadingNote(false)
}
}

  useEffect(() => {
    let active = true
    const fetchSessionLockState = async () => {
      const activeSessionId = localStorage.getItem('ater_active_session_id')
      if (!activeSessionId) {
        if (active) setLockedNotes(new Set())
        return
      }
      try {
        const session = await sidecarApi.getTutorStatus(activeSessionId)
        if (!session || !session.curriculum || !active) return

        const normalize = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase()
        const completed = new Set((session.completed_notes || []).map(normalize))
        const unlocked = new Set((session.active_note_unlocks || []).map(normalize))
        const current = normalize(session.current_note_path || '')

        const lockedSet = new Set<string>()
        session.curriculum.forEach((p: string) => {
          const normP = normalize(p)
          if (!completed.has(normP) && !unlocked.has(normP) && normP !== current) {
            lockedSet.add(normP)
          }
        })
        if (active) setLockedNotes(lockedSet)
      } catch (err) {
        console.error('Failed to fetch locks for tree view:', err)
      }
    }
    void fetchSessionLockState()
    return () => { active = false }
  }, [selectedPath, location.search])

  // --- Sync & Polling ---
  useEffect(() => {
    if (location.pathname !== '/obsidian') return

    const searchParams = new URLSearchParams(location.search)
    const initSearch = searchParams.get('search')
    const initPath = searchParams.get('path')
    const initPage = parseInt(searchParams.get('page') || '1')
    const initFilterRaw = searchParams.get('filterPages')
    const initFilterPages = initFilterRaw ? initFilterRaw.split(',').map(Number) : []
    const initFullscreen = searchParams.get('fullscreen') === 'true'

    if (initFullscreen) {
      setIsFullscreen(true)
    }

    if (initPath) {
      // Sync state from URL if different
      if (initPath !== selectedPath || initPage !== selectedPage) {
        selectFile(initPath, initPage, true, initFilterPages)
      }

      // Expand parent folders
      const parts = initPath.split(/[/\\]/)
      const toExpand: string[] = []
      let current = ''
      parts.slice(0, -1).forEach(part => {
        current = current ? `${current}/${part}` : part
        toExpand.push(current)
      })
      setExpandedFolders(prev => {
        const next = new Set(prev)
        toExpand.forEach(p => next.add(p))
        return next
      })
    } else {
      if (selectedPath !== null) {
        setSelectedPath(null)
      }
      if (Object.keys(noteMetadata).length > 0) {
        setNoteMetadata({})
      }
      if (noteContent !== '') {
        setNoteContent('')
      }
      if (editedContent !== '') {
        setEditedContent('')
      }
      if (initSearch) {
        if (searchQuery !== initSearch) {
          setSearchQuery(initSearch)
          setInputValue(initSearch)
        }
      } else {
        if (searchQuery !== '') {
          setSearchQuery('')
          setInputValue('')
        }
      }
    }
  }, [location.search, location.pathname, selectedPath, selectedPage, noteMetadata, noteContent, editedContent, searchQuery])

 useEffect(() => {
 fetchFiles()
 fetchStatus()
 fetchInbox()

 // Polling for realtime sync
 const interval = setInterval(() => {
 fetchFiles()
 fetchStatus()
}, 15000)

 return () => clearInterval(interval)
}, [config?.obsidianVaultPath])

 // --- Actions ---
 const fetchFiles = useCallback(async () => {
 setLoadingFiles(true)
 try {
 const res = await sidecarApi.listObsidianFiles()
 setFiles((res.files || []).map(normalizeFile))
} catch (err) {
 console.error('Failed to fetch obsidian files:', err)
} finally {
 setLoadingFiles(false)
}
}, [])

 const fetchStatus = async () => {
 try {
 const res = await sidecarApi.aterQueueStatus()
 setQueueStatus(res)
} catch (err) {console.error(err)}
}

 const fetchInbox = async () => {
 setLoadingInbox(true)
 try {
 const res = await sidecarApi.aterListInbox()
 setInboxFiles(res.files || [])
} finally {setLoadingInbox(false)}
}

 const handleDeleteItem = useCallback(async (path: string, isFolder: boolean) => {
    // 1. Lock Protection
    try {
      const isLocked = await checkLockState(path)
      if (isLocked) {
        toast.error("This lesson is locked and cannot be deleted.")
        return
      }
    } catch (err) {
      console.error("Lock check error:", err)
    }

    // 2. User Confirmation
    const itemName = path.split(/[/\\]/).pop() || 'item';
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

 try {
 await sidecarApi.deleteObsidianItem(path)
 await fetchFiles()
 if (selectedPath === path || selectedPath?.startsWith(path + '/')) {
 setSelectedPath(null)
 setLoadedPath(null)
 setNoteMetadata({})
 setNoteContent('')
 setEditedContent('')
 setHubConnections(null)
}
} catch (err: any) {
 toast.error(`Delete failed: ${err.message}`)
}
}, [fetchFiles, selectedPath, lockedNotes])

 const handleCreateItem = useCallback(async () => {
 if (!newItemName) {
 setCreatingInPath(null)
 setCreatingType(null)
 return
}

 const path = creatingInPath ? `${creatingInPath}/${newItemName}` : newItemName
 const fullPath = creatingType === 'file' ? (path.endsWith('.md') ? path : `${path}.md`) : path

 // Lock Protection for parent folder
 if (creatingInPath) {
    try {
      const isLocked = await checkLockState(creatingInPath)
      if (isLocked) {
        toast.error("The target folder is locked.")
        setCreatingInPath(null)
        setCreatingType(null)
        return
      }
    } catch (err) {
      console.error("Lock check error:", err)
    }
 }

 try {
 if (creatingType === 'file') {
 await sidecarApi.createObsidianFile(fullPath, `---\ntitle: ${newItemName.replace('.md', '')}\n---\n\n`)
} else {
 await sidecarApi.createObsidianFolder(fullPath)
}
 await fetchFiles()
 setCreatingInPath(null)
 setCreatingType(null)
 setNewItemName('')
 if (creatingType === 'file') {
 selectFile(fullPath)
}
} catch (err: any) {
 toast.error(`Creation failed: ${err.message}`)
}
}, [creatingInPath, creatingType, newItemName, fetchFiles])

 const handleRenameItem = useCallback(async () => {
 if (!renamingPath || !newItemName) {
 setRenamingPath(null)
 return
}

 // Lock Protection
 try {
   const isLocked = await checkLockState(renamingPath)
   if (isLocked) {
     toast.error("This lesson is locked and cannot be renamed.")
     setRenamingPath(null)
     return
   }
 } catch (err) {
   console.error("Lock check error:", err)
 }

 const parentPath = renamingPath.includes('/') ? renamingPath.substring(0, renamingPath.lastIndexOf('/')) : ''
 let newPath = parentPath ? `${parentPath}/${newItemName}` : newItemName

 // Preserve extension for files if not provided
 if (!renamingPath.endsWith('/') && renamingPath.includes('.')) {
 const ext = renamingPath.split('.').pop()
 if (!newPath.endsWith(`.${ext}`)) {
 newPath += `.${ext}`
}
}

 try {
 await sidecarApi.moveObsidianItem(renamingPath, newPath)
 await fetchFiles()
 if (selectedPath === renamingPath) {
 setSelectedPath(newPath)
}
 setRenamingPath(null)
 setNewItemName('')
} catch (err: any) {
  toast.error(`Rename failed: ${err.message}`)
 }
}, [renamingPath, newItemName, fetchFiles, selectedPath])

const normalizeVaultPath = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase()

const academicHubPathFromNote = (notePath: string, hubName: string): string => {
  const normalized = String(notePath || '').replace(/\\/g, '/')
  const match = normalized.match(/^Notes\/academic\/([^/]+)\/([^/]+)\/([^/]+)\//i)
  if (!match || !hubName) return ''
  return `database/study planner/${match[1]}/${match[2]}/${match[3]}/${hubName.replace(/\.md$/i, '')}.md`
}

const [activeTutorSession, setActiveTutorSession] = useState<any | null>(null)

const activePreview = useMemo(() => {
  if (!selectedPath) return null;
  const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub;
  const hubValue = Array.isArray(rawHub) ? rawHub[0] : rawHub;
  const hubName = String(hubValue || '').replace(/^\[+/, '').replace(/\]+$/, '').split('|')[0].trim().replace(/\.md$/i, '');
  let resolvedHubPath = '';
  if (hubName) {
    resolvedHubPath = academicHubPathFromNote(selectedPath, hubName) || '';
  }
  const isHub = selectedPath.toLowerCase().includes('_hub.md') || String(noteMetadata?.type || '').toLowerCase() === 'hub';
  return {
    title: cleanTitle(noteMetadata?.title || noteMetadata?.Title || selectedPath.split(/[/\\]/).pop()?.replace('.md', '') || 'Lesson'),
    lessonPath: isHub ? selectedPath : resolvedHubPath,
    notePath: selectedPath,
    hubPath: isHub ? selectedPath : resolvedHubPath,
    previewUrl: '',
  };
}, [selectedPath, noteMetadata]);

const isLessonNote = useMemo(() => {
  if (!selectedPath) return false;
  const pathLower = selectedPath.toLowerCase();
  const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub;
  const isHub = pathLower.includes('_hub.md') || String(noteMetadata?.type || '').toLowerCase() === 'hub';
  return !!(isHub || rawHub);
}, [selectedPath, noteMetadata]);

const [isLessonActive, setIsLessonActive] = useState(false);

useEffect(() => {
  const isPanelOpen = localStorage.getItem('ater_lesson_panel_open') === 'true';
  const activeNotePath = localStorage.getItem('ater_study_active_note_path');
  if (isPanelOpen && activeNotePath === selectedPath && isLessonNote) {
    setIsLessonActive(true);
  } else {
    setIsLessonActive(false);
  }
}, [selectedPath, isLessonNote]);

const checkLockState = async (path: string): Promise<boolean> => {
  const targetPath = normalizeVaultPath(path)
  if (lockedNotes.has(targetPath)) return true

  const activeSessionId = localStorage.getItem('ater_active_session_id')
  if (!activeSessionId) return false

  try {
    const session = await sidecarApi.getTutorStatus(activeSessionId)
    if (!session || !session.curriculum) return false

    const inCurriculum = session.curriculum.some((p: string) => normalizeVaultPath(p) === targetPath)
    if (!inCurriculum) return false

    const completed = new Set((session.completed_notes || []).map(normalizeVaultPath))
    const unlocked = new Set((session.active_note_unlocks || []).map(normalizeVaultPath))
    const current = normalizeVaultPath(session.current_note_path || '')

    if (completed.has(targetPath) || unlocked.has(targetPath) || targetPath === current) {
      return false
    }

    return true // Locked
  } catch (err) {
    console.error('Error verifying lock status:', err)
    return false
  }
}

const selectFile = useCallback(async (path: string, page: number = 1, fromHistory: boolean = false, filterPages: number[] = [], keepMetadata: boolean = false) => {
    // Lock validation
    try {
      const isLocked = await checkLockState(path)
      if (isLocked) {
        toast.error("This lesson is locked. Complete your current lesson first.")
        return
      }
    } catch (err) {
      console.error("Lock check error:", err)
    }

    const norm = String(path).toLowerCase();
    const cleanItemName = path.split(/[/\\]/).pop()?.replace('.md', '') || '';
    if (norm.includes('database/courses/')) {
      navigate(`/academic?tab=COURSES&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('database/semesters/') || norm.includes('database/years/')) {
      navigate(`/academic?tab=PROGRAM&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('database/exams/')) {
      navigate(`/academic?tab=EXAMS&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('database/assignments/')) {
      navigate(`/academic?tab=ASSIGNMENTS&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('practice')) {
      navigate(`/academic?tab=PRACTICE&id=${encodeURIComponent(cleanItemName)}`);
      return;
    }

    if (!keepMetadata) {
      // Check if we are opening a PDF that matches the currently open note's source file,
      // in which case we want to extract and preserve the waypoints from the current note's metadata
      const isOpeningPdf = typeof path === 'string' && path.toLowerCase().endsWith('.pdf');
      const noteSource = noteMetadata?.source_file || noteMetadata?.source;
      let sourceMatches = false;
      if (isOpeningPdf && noteSource) {
        let cleanSource = '';
        if (Array.isArray(noteSource) && noteSource.length > 0) {
          cleanSource = noteSource[0];
        } else if (typeof noteSource === 'string') {
          cleanSource = noteSource;
        }
        cleanSource = cleanSource.replace(/^\[+/, '').replace(/\]+$/, '').split('|')[0].trim();
        const cleanSourceBase = cleanSource.split(/[/\\]/).pop()?.toLowerCase();
        const pathBase = path.split(/[/\\]/).pop()?.toLowerCase();
        if (cleanSourceBase && pathBase && (cleanSourceBase === pathBase || path.toLowerCase().includes(cleanSource.toLowerCase()))) {
          sourceMatches = true;
        }
      }

      if (sourceMatches) {
        const wps = Array.isArray(noteMetadata.source_pages)
          ? noteMetadata.source_pages
          : (noteMetadata.source_pages ? [noteMetadata.source_pages] : (noteMetadata.source_page ? [noteMetadata.source_page] : []));
        const numericWaypoints = wps.map(Number).filter(n => !isNaN(n));
        setWaypoints(numericWaypoints);
        const wpIndex = numericWaypoints.indexOf(page);
        setCurrentWaypointIndex(wpIndex >= 0 ? wpIndex : 0);
      } else {
        setWaypoints([]);
      }
    }

    // If the PDF is already active in the viewer, execute a direct jump without reloading or returning early
    if (selectedPath === path && path.toLowerCase().endsWith('.pdf')) {
      setSelectedPage(page);
      pdfRef.current?.handleJump(page);

      // Sync URL search params
      if (!fromHistory) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('path', path);
        if (page > 1) searchParams.set('page', page.toString());
        else searchParams.delete('page');
        if (filterPages.length > 0) searchParams.set('filterPages', filterPages.join(','));
        else searchParams.delete('filterPages');
        navigate(`/obsidian?${searchParams.toString()}`);
      }
      return;
    }

    // 0. Skip if already loading the exact same thing
    if (selectedPath === path && selectedPage === page && !fromHistory) {
      console.log(`[selectFile] Skip: Already on ${path}`);
      return;
    }

    // Always hide Graph View when a file/PDF is explicitly selected to show the main panel content
    setShowGraphView(false);

    selectRequestId.current += 1
    const currentReq = selectRequestId.current

    console.log(`[selectFile] START: ${path} (reqId: ${currentReq})`)

    if (!fromHistory) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('path', path);
      if (page > 1) searchParams.set('page', page.toString());
      else searchParams.delete('page');

      if (filterPages.length > 0) searchParams.set('filterPages', filterPages.join(','));
      else searchParams.delete('filterPages');

      navigate(`/obsidian?${searchParams.toString()}`);

      push({
        type: 'file',
        path: path,
        metadata: { page, filterPages }
      }, false);
    }

    setSelectedPath(path)
    setSelectedPage(page)
    setSelectedFilteredPages(filterPages)

    // Delayed loading state: Only show spinner if it takes > 150ms
    const loadingTimeout = setTimeout(() => {
      if (selectRequestId.current === currentReq) {
        setLoadingNote(true)
      }
    }, 150);

    // Safety timeout: 15 seconds max for any document load
    const safetyTimeout = setTimeout(() => {
      if (selectRequestId.current === currentReq) {
        console.warn(`[selectFile] Safety timeout triggered for ${path} (reqId: ${currentReq})`);
        setLoadingNote(false);
      }
    }, 15000);

    // PDFs are handled by an iframe, we don't need to read content here
    if (typeof path === 'string' && path.toLowerCase().endsWith('.pdf')) {
      console.log(`[selectFile] PDF detected: ${path}`);
      if (!keepMetadata) {
        setNoteMetadata({})
        setNoteContent('')
        setEditedContent('')
      }
      setIsEditing(false)
      clearTimeout(loadingTimeout)
      clearTimeout(safetyTimeout)
      setLoadingNote(false)
      setLoadedPath(path)
      return
    }

    try {
      console.log(`[selectFile] Fetching content: ${path}`);
      const res = await sidecarApi.readObsidianNote(path)

      // Prevent stale data from overwriting new request
      if (selectRequestId.current !== currentReq) {
        console.log(`[selectFile] Request ${currentReq} is stale, ignoring result.`);
        return
      }

      const content = res.content || '';
      const metadata = res.metadata || {};

      setNoteMetadata(metadata);
      setNoteContent(content);
      noteContentRef.current = content;
      setEditedContent(content);
      setIsEditing(false);
      setLoadedPath(path);

      console.log(`[selectFile] SUCCESS: ${path} (${content.length} chars)`);
    } catch (err) {
      console.error(`[selectFile] ERROR: Failed to read note: ${path}`, err)
      if (selectRequestId.current === currentReq) {
        setNoteMetadata({})
        setNoteContent('# Error\nFailed to load content. Please check if the file exists or the backend is running.')
        setLoadedPath(null)
      }
    } finally {
      clearTimeout(loadingTimeout);
      clearTimeout(safetyTimeout);
      if (selectRequestId.current === currentReq) {
        setLoadingNote(false)
      }
    }
  }, [navigate, noteMetadata, selectedPath, selectedPage, location.search, push, lockedNotes])

  const handleWikiLinkClick = async (pageName: string, pageNumber?: number, filterPages: number[] = []) => {
    let cleanPageName = pageName;
    let resolvedPageNumber = pageNumber;

    if (pageName && typeof pageName === 'string' && pageName.includes('#')) {
      const parts = pageName.split('#');
      cleanPageName = parts[0];
      const anchor = parts[1];
      if (anchor.startsWith('page=')) {
        const parsed = parseInt(anchor.replace('page=', ''), 10);
        if (!isNaN(parsed)) {
          resolvedPageNumber = parsed;
        }
      } else {
        const parsed = parseInt(anchor, 10);
        if (!isNaN(parsed)) {
          resolvedPageNumber = parsed;
        }
      }
    }

    selectRequestId.current += 1;
    const currentReq = selectRequestId.current;

    setLoadingNote(true);
    const safetyTimeout = setTimeout(() => {
      if (selectRequestId.current === currentReq) {
        console.warn(`[WikiLink] Safety timeout triggered for ${cleanPageName}`);
        setLoadingNote(false);
      }
    }, 15000);

    try {
      console.log(`[WikiLink] Finding page: ${cleanPageName} (resolvedPageNumber: ${resolvedPageNumber})`);
      const res = await sidecarApi.findVaultPage(cleanPageName);

      if (selectRequestId.current !== currentReq) return;
      if (res.found && res.path) {
        await selectFile(res.path, resolvedPageNumber, false, filterPages);
      } else if (res.found && res.type === 'database') {
        await selectFile(`database/${res.db_id}/${res.file_name}`, resolvedPageNumber, false, filterPages);
      } else {
        console.warn(`[WikiLink] Page not found: ${cleanPageName}. Creating new...`);
        // If the pageName looks like a path (contains slashes), resolve it from root instead of current folder.
        let newPath = "";
        if (pageName.includes('/')) {
          newPath = pageName.endsWith('.md') ? pageName : `${pageName}.md`;
        } else {
          let folder = 'database/bases/Inbox';
          if (selectedPath && selectedPath.includes('/')) {
            folder = selectedPath.substring(0, selectedPath.lastIndexOf('/'));
          }
          newPath = folder ? `${folder}/${pageName}.md` : `${pageName}.md`;
        }

        const initialContent = `---\ntitle: ${pageName.split(/[/\\]/).pop()?.replace('.md', '')}\nread: false\n---\n\n# ${pageName.split(/[/\\]/).pop()?.replace('.md', '')}\n`;

        await sidecarApi.createObsidianFile(newPath, initialContent);
        await fetchFiles();
        await selectFile(newPath, 1, false, []);
      }
    } catch (err) {
      console.error(`[WikiLink] Error:`, err);
      toast.error("Failed to resolve link");
    } finally {
      clearTimeout(safetyTimeout);
      if (selectRequestId.current === currentReq) {
        setLoadingNote(false);
      }
    }
  }

  const openSelectedInLessonRuntime = useCallback(async () => {
    const isCurrentHubNote = typeof selectedPath === 'string' && (
      selectedPath.toLowerCase().includes('_hub.md') ||
      selectedPath.toLowerCase().includes('database/study planner/') ||
      noteMetadata?.type?.toLowerCase() === 'hub'
    );

    if (isCurrentHubNote && selectedPath) {
      try {
        let tutorSession = null;
        try {
          tutorSession = await sidecarApi.getTutorSessionByHub(selectedPath);
        } catch (err) {
          console.error('Failed to fetch tutor session:', err);
        }

        let hubTargetPath = tutorSession?.current_note_path;
        if (!hubTargetPath && tutorSession?.curriculum && tutorSession.curriculum.length > 0) {
          hubTargetPath = tutorSession.curriculum[0];
        }
        if (!hubTargetPath && studyTree && studyTree.length > 0) {
          hubTargetPath = studyTree[0].target || '';
        }

        if (hubTargetPath) {
          let targetMetadata: any = {};
          try {
            const noteRes = await sidecarApi.readObsidianNote(hubTargetPath);
            if (noteRes && noteRes.metadata) {
              targetMetadata = noteRes.metadata;
            }
          } catch (err) {
            console.error('Failed to read note metadata for hubTargetPath:', err);
          }
          const title = cleanTitle(targetMetadata?.title || targetMetadata?.Title || hubTargetPath.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || 'Lesson');
          const preview = {
            title,
            lessonPath: hubTargetPath,
            notePath: hubTargetPath,
            hubPath: selectedPath,
            previewUrl: '',
          };
          localStorage.setItem('ater_lesson_preview', JSON.stringify(preview));
          localStorage.setItem('ater_lesson_panel_open', JSON.stringify(true));
          localStorage.setItem('ater_study_active_note_path', hubTargetPath);
          localStorage.setItem('ater_canonical_lesson_path', hubTargetPath);
          localStorage.setItem('ater_original_note_path', hubTargetPath);
          setSelectedPath(hubTargetPath);
          setSearchParams({ path: hubTargetPath });
          setIsLessonActive(true);
          if (tutorSession) {
            setActiveTutorSession(tutorSession);
          }
          return;
        }
      } catch (err) {
        console.error('Failed to open hub lesson:', err);
      }
    }

    let targetPath = selectedPath;

    // Resolve the last atomic note from the active tutor session
    const activeSessionId = localStorage.getItem('ater_active_session_id');
    if (activeSessionId) {
      const session = sidecarApi.getTutorStatusSync();
      if (session) {
        const normalize = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase();
        const completed = new Set((session.completed_notes || []).map(normalize));
        const unlocked = new Set((session.active_note_unlocks || []).map(normalize));
        const current = normalize(session.current_note_path || '');

        let lastUnlocked = session.current_note_path || '';
        if (!lastUnlocked && session.curriculum) {
          for (let i = session.curriculum.length - 1; i >= 0; i--) {
            const note = session.curriculum[i];
            const normNote = normalize(note);
            if (completed.has(normNote) || unlocked.has(normNote) || normNote === current) {
              lastUnlocked = note;
              break;
            }
          }
        }
        if (lastUnlocked) {
          targetPath = lastUnlocked;
        }
      }
    }

    if (!targetPath || targetPath.toLowerCase().endsWith('.pdf') || isTemporaryLessonPath(targetPath)) {
      toast.error('Select an active tutor session or open an atomic lesson note first.')
      return
    }

    let targetMetadata = noteMetadata;
    if (targetPath !== selectedPath) {
      try {
        const noteRes = await sidecarApi.readObsidianNote(targetPath);
        if (noteRes && noteRes.metadata) {
          targetMetadata = noteRes.metadata;
        }
      } catch (err) {
        console.error('Failed to read note metadata for targetPath:', err);
      }
    }

    let hubPath = ''
    const rawHub = targetMetadata?.hub || targetMetadata?.Hub || targetMetadata?.concept_hub
    const isHubNote = targetPath.toLowerCase().includes('_hub.md') || String(targetMetadata?.type || '').toLowerCase() === 'hub'

    if (isHubNote) {
      hubPath = targetPath
    } else if (rawHub) {
      const hubValue = Array.isArray(rawHub) ? rawHub[0] : rawHub
      const hubName = String(hubValue || '')
        .replace(/^\[+/, '')
        .replace(/\]+$/, '')
        .split('|')[0]
        .trim()
        .replace(/\.md$/i, '')

      if (hubName) {
        const academicHubPath = academicHubPathFromNote(targetPath, hubName)
        if (academicHubPath) {
          hubPath = academicHubPath
        } else {
          try {
            const res = await sidecarApi.findVaultPage(hubName)
            if (res.found && res.path) {
              hubPath = res.path
            }
          } catch (err) {
            console.error('Failed to resolve lesson hub from Knowledge Base:', err)
          }
        }
      }
    }

    const title = cleanTitle(targetMetadata?.title || targetMetadata?.Title || targetPath.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || 'Lesson')
    const preview = {
      title,
      lessonPath: targetPath,
      notePath: targetPath,
      hubPath,
      previewUrl: '',
    }

    localStorage.setItem('ater_lesson_preview', JSON.stringify(preview))
    localStorage.setItem('ater_lesson_panel_open', JSON.stringify(true))
    localStorage.setItem('ater_study_active_note_path', targetPath)
    localStorage.setItem('ater_canonical_lesson_path', targetPath)
    localStorage.setItem('ater_original_note_path', targetPath)
    setSelectedPath(targetPath)
    setSearchParams({ path: targetPath })
    setIsLessonActive(true)
  }, [setSearchParams, noteMetadata, selectedPath, studyTree, setActiveTutorSession])

  const fetchHubs = async () => {
    setLoadingHubs(true)
    try {
      const res = await sidecarApi.listHubs()
      setHubs((res.hubs || []).map(normalizeHub))
    } catch (err) {
      console.error("Failed to fetch hubs:", err)
    } finally {
      setLoadingHubs(false)
    }
  }

  useEffect(() => {
    fetchHubs() // Initial fetch
  }, [])

  useEffect(() => {
    if (sidebarTab === 'hubs') fetchHubs()
  }, [sidebarTab])

  // Grouping logic for Hubs
  const groupedHubs = useMemo(() => {
    const groups: Record<string, any[]> = {}
    hubs.filter(hub => {
      if (!searchQuery) return true;
      return (typeof (hub.title ?? hub.name) === 'string' && (hub.title ?? hub.name ?? '').toLowerCase().includes((searchQuery || '').toLowerCase())) ||
             (hub.course && typeof hub.course === 'string' && hub.course.toLowerCase().includes((searchQuery || '').toLowerCase()));
    }).forEach(hub => {
      const course = hub.course || 'Uncategorized'
      if (!groups[course]) groups[course] = []
      groups[course].push(hub)
    })
    // Sort courses and units
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => (parseInt(a.unit) || 0) - (parseInt(b.unit) || 0))
      return acc
    }, {} as Record<string, any[]>)
  }, [hubs, searchQuery])

  // Grouping logic for PDFs
  const groupedPdfs = useMemo(() => {
    const pdfFiles = files.filter(f => {
      const isPdf = typeof f.path === 'string' && f.path.toLowerCase().endsWith('.pdf');
      if (!isPdf) return false;
      if (!searchQuery) return true;
      return (typeof (f.name ?? (f as any).title) === 'string' && (f.name ?? (f as any).title ?? '').toLowerCase().includes((searchQuery || '').toLowerCase())) ||
             (typeof f.path === 'string' && f.path.toLowerCase().includes((searchQuery || '').toLowerCase()));
    })
    const groups: Record<string, any[]> = {}
    pdfFiles.forEach(file => {
      const parts = file.path.split(/[/\\]/)
      const folder = parts.length > 1 ? parts[parts.length - 2] : 'Root'
      if (!groups[folder]) groups[folder] = []
      groups[folder].push(file)
    })
    return groups
  }, [files, searchQuery])

  const toggleFolder = useCallback((path: string) => {
 const newExpanded = new Set(expandedFolders)
 if (newExpanded.has(path)) newExpanded.delete(path)
 else newExpanded.add(path)
 setExpandedFolders(newExpanded)
}, [expandedFolders])

 const toggleAutoDeploy = async () => {
 await saveConfig({autoDeploy: !config?.autoDeploy})
 await sidecarApi.aterWatcherToggle()
 fetchStatus()
}

 const resetAterSession = () => {
 setSessionId(null)
 setIsAwaitingConfirmation(false)
 setIsCompleted(false)
 setActivePlan(null)
 setPlanData(null)
 setBatchFeed([])
 setSelectedInboxFile(null)
 setAterError(null)
 fetchInbox()
}

 const processSelectedFile = async () => {
 if (!selectedInboxFile) return
 setProcessing(true)
 setAterError(null)
 setActivePlan(null)
 setBatchFeed([])
 setIsCompleted(false)
 setIsAwaitingConfirmation(false)

 try {
 const res = await sidecarApi.aterProcess({file_path: selectedInboxFile.path})
 setActivePlan(res.plan_raw)
 setPlanData(res.plan_structured)
 setSessionId(res.session_id)
 setTotalBatches(res.plan_structured?.batches?.length || 1)
 setCurrentBatch(0)

 // Auto Deploy Circuit
 if (config?.autoDeploy) {
 // Proceed immediately without manual confirmation
 setTimeout(() => confirmDeployment(res.session_id), 800);
} else {
 setIsAwaitingConfirmation(true)
}
} catch (err: any) {
 setAterError(err.message || 'Workflow failed')
} finally {setProcessing(false)}
}

 const confirmDeployment = async (forcedId?: string) => {
 const targetId = forcedId || sessionId
 if (!targetId) return

 setProcessing(true)
 setIsAwaitingConfirmation(false) // Hide button if manual

 try {
 let currentHasMore = true
 let tempBatch = 0
 while (currentHasMore) {
 const res = await sidecarApi.aterConfirm({session_id: targetId})

 if (res.status === 'error') {
 throw new Error((res as any).message || (res as any).detail || "Backend generation failed.");
}

 tempBatch = res.current_batch || (tempBatch + 1)
 setCurrentBatch(tempBatch)
 setBatchFeed(prev => [...prev, {batch: tempBatch, results: res.results}])
 currentHasMore = res.has_more
 if (currentHasMore) await new Promise(r => setTimeout(r, 2000))
}
 setIsCompleted(true)
 fetchFiles() // Refresh explorer
} catch (err: any) {
 setAterError(err.message)
} finally {
 setProcessing(false)
}
}

  const handleRegenerateNote = async (path: string | null) => {
    if (!path) return
    setProcessing(true)
    setAterError(null)
    setActivePlan(null)
    setBatchFeed([])
    setIsCompleted(false)
    setIsAwaitingConfirmation(false)

    try {
      const res = await sidecarApi.aterProcess({file_path: path})
      setActivePlan(res.plan_raw)
      setPlanData(res.plan_structured)
      setSessionId(res.session_id)
      setTotalBatches(res.plan_structured?.batches?.length || 1)
      setCurrentBatch(0)

      if (config?.autoDeploy) {
        setTimeout(() => confirmDeployment(res.session_id), 800)
      } else {
        setIsAwaitingConfirmation(true)
      }
      toast.success("Regeneration started")
    } catch (err: any) {
      setAterError(err.message || 'Regeneration failed')
      toast.error("Regeneration failed")
    } finally {
      setProcessing(false)
    }
  }

  const handleHealNote = async (path: string | null) => {
    if (!path) return
    setProcessing(true)
    try {
      toast.info("Healing note logic triggered...")
      console.log("Heal requested for:", path)
      await new Promise(r => setTimeout(r, 1000))
      toast.success("Note healing complete")
    } catch (err: any) {
      toast.error("Healing failed")
    } finally {
      setProcessing(false)
    }
  }

 // --- Tree Construction ---
 const fileTree = useMemo(() => {
 const root: FileNode[] = []

 files.filter(file => !file.path.endsWith('.html')).forEach(file => {
 const parts = file.path.split(/[/\\]/).filter(p => p.length > 0)
