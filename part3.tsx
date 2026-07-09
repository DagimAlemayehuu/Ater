 let currentLevel = root

 parts.forEach((part: string, index: number) => {
 const isLast = index === parts.length - 1
 const currentPath = parts.slice(0, index + 1).join('/')

 let existing = currentLevel.find(node => node.name === part)

 if (!existing) {
 const isFolder = !isLast || file.is_dir
 existing = {
 name: part,
 path: currentPath,
 isFolder: isFolder,
 children: isFolder ? [] : undefined
}
 currentLevel.push(existing)
}

 if (!isLast && existing.children) {
 currentLevel = existing.children
}
})
})

 const sortNodes = (nodes: FileNode[]) => {
 nodes.sort((a, b) => {
 if (a.isFolder && !b.isFolder) return -1
 if (!a.isFolder && b.isFolder) return 1
 return a.name.localeCompare(b.name)
})
 nodes.forEach(node => {
 if (node.children) sortNodes(node.children)
})
}

 sortNodes(root)
 return root
}, [files])

  const [isNoteMetadataExpanded, setIsNoteMetadataExpanded] = useState(false)
  const [contentMatchPaths, setContentMatchPaths] = useState<Set<string>>(new Set())

  const matchesSearch = useCallback((node: FileNode, queryLower: string): boolean => {
    if (!queryLower) return true
    if (typeof node.path === 'string' && node.path.toLowerCase().includes(queryLower)) return true
    if (contentMatchPaths.has(node.path)) return true
    if (node.children) {
      return node.children.some(child => matchesSearch(child, queryLower))
    }
    return false
  }, [contentMatchPaths])

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setContentMatchPaths(new Set())
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sidecarApi.searchVaultFull(searchQuery)
        setContentMatchPaths(new Set(res.paths))
      } catch (e) { console.error("Search failed", e) }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return fileTree
    const queryLower = searchQuery.toLowerCase()

    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => matchesSearch(node, queryLower))
        .map(node => ({
          ...node,
          children: node.children ? filterTree(node.children) : undefined
        }))
    }

    return filterTree(fileTree)
  }, [fileTree, searchQuery, matchesSearch])

 const [draggedPath, setDraggedPath] = useState<string | null>(null)
 const [dragOverPath, setDragOverPath] = useState<string | null>(null)
 const expandTimerRef = useRef<NodeJS.Timeout | null>(null)

 const handleDrop = useCallback(async (e: React.DragEvent, targetPath: string | null) => {
  e.preventDefault()
  e.stopPropagation()
  setDragOverPath(null)
  if (expandTimerRef.current) {
   clearTimeout(expandTimerRef.current)
   expandTimerRef.current = null
  }

  const sourcePath = draggedPath || e.dataTransfer.getData('text/plain')
  if (!sourcePath) return

  // 0. Lock Protection
  try {
    const isLockedSource = await checkLockState(sourcePath)
    if (isLockedSource) {
      toast.error("This lesson is locked and cannot be moved.")
      setDraggedPath(null)
      return
    }
    if (targetPath) {
      const isLockedTarget = await checkLockState(targetPath)
      if (isLockedTarget) {
        toast.error("The target folder is locked.")
        setDraggedPath(null)
        return
      }
    }
  } catch (err) {
    console.error("Lock check error:", err)
  }

  // 1. Determine the target folder. If dropped on a file, use its parent folder.
  let targetFolderPath = targetPath
  if (targetPath) {
   // Check if target is a file in the existing files list
   const targetFile = files.find(f => f.path === targetPath)
   if (targetFile && !targetFile.is_dir) {
    targetFolderPath = targetPath.includes('/') ? targetPath.substring(0, targetPath.lastIndexOf('/')) : null
   }
  }

  const fileName = sourcePath.split(/[/\\]/).pop()
  if (!fileName) return

  const newPath = targetFolderPath ? `${targetFolderPath}/${fileName}` : fileName

  // 2. Prevent dropping into self or into a subfolder of self
  if (sourcePath === newPath) return
  if (targetFolderPath && (targetFolderPath === sourcePath || targetFolderPath.startsWith(sourcePath + '/'))) {
   console.warn("Cannot move a folder into itself or its descendants")
   return
  }

  try {
   await sidecarApi.moveObsidianItem(sourcePath, newPath)
   await fetchFiles()
  } catch (err: any) {
   console.error("Move failed:", err)
   toast.error(`Move failed: ${err.message}`)
  } finally {
   setDraggedPath(null)
  }
 }, [draggedPath, files, fetchFiles])

 const renderTree = useCallback((nodes: FileNode[], level = 0) => {
  const result = nodes.map(node => (
    <FileTreeItem
      key={node.path}
      node={node}
      level={level}
      selectedPath={selectedPath}
      renamingPath={renamingPath}
      newItemName={newItemName}
      creatingInPath={creatingInPath}
      creatingType={creatingType}
      expandedFolders={expandedFolders}
      dragOverPath={dragOverPath}
      draggedPath={draggedPath}
      searchQuery={searchQuery}
      onToggleFolder={toggleFolder}
      onSelectFile={selectFile}
      onStartRename={(path, name) => {
        setRenamingPath(path);
        setNewItemName(name);
      }}
      onDelete={handleDeleteItem}
      onNewItem={(path, type) => {
        setCreatingInPath(path);
        setCreatingType(type);
        setNewItemName('');
        if (!expandedFolders.has(path)) toggleFolder(path);
      }}
      onRenameChange={setNewItemName}
      onRenameSubmit={handleRenameItem}
      onRenameCancel={() => setRenamingPath(null)}
      onCreateChange={setNewItemName}
      onCreateSubmit={handleCreateItem}
      onCreateCancel={() => {
        setCreatingInPath(null);
        setCreatingType(null);
      }}
      onDragStart={(e, path) => {
        setDraggedPath(path);
        e.dataTransfer.setData('text/plain', path);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(e.currentTarget, 10, 10);
      }}
      onDragOver={(e, path) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverPath !== path) {
          setDragOverPath(path);
          if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
          const targetNode = files.find(f => f.path === path);
          if (targetNode?.is_dir && !expandedFolders.has(path)) {
            expandTimerRef.current = setTimeout(() => {
              setExpandedFolders(prev => new Set(prev).add(path));
            }, 700);
          }
        }
      }}
      onDragLeave={(e, path) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragOverPath === path) {
          setDragOverPath(null);
          if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
          }
        }
      }}
      onDrop={handleDrop}
      onDragEnd={() => {
        setDraggedPath(null);
        setDragOverPath(null);
        if (expandTimerRef.current) {
          clearTimeout(expandTimerRef.current);
          expandTimerRef.current = null;
        }
      }}
      renderTree={renderTree}
      lockedNotes={lockedNotes}
    />
  ));

  if (level === 0 && creatingInPath === null && creatingType) {
    result.unshift(
      <div key="new-item-root" className="flex items-center gap-2 py-1.5 px-6">
        {creatingType === 'folder' ? <Folder size={14} className="text-muted-foreground" /> : <FileText size={14} className="text-muted-foreground" />}
        <input
          autoFocus
          className="flex-1 bg-background border border-primary rounded-[8px] px-1 py-0.5 text-[13px] outline-none"
          placeholder={`New ${creatingType}...`}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateItem()
            if (e.key === 'Escape') {setCreatingInPath(null); setCreatingType(null);}
          }}
          onBlur={handleCreateItem}
        />
      </div>
    );
  }

  return result;
}, [
  selectedPath,
  renamingPath,
  newItemName,
  creatingInPath,
  creatingType,
  expandedFolders,
  dragOverPath,
  draggedPath,
  searchQuery,
  toggleFolder,
  selectFile,
  handleDeleteItem,
  handleRenameItem,
  handleCreateItem,
  handleDrop,
  files,
  lockedNotes
]);

  const selectedIsPdf = typeof selectedPath === 'string' && selectedPath.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    setSidebarContent(
      <div className="flex flex-col w-full min-h-0 text-left">
        {/* Global Toolbar */}
        <div className="pb-3 flex items-center justify-between gap-1 select-none shrink-0 border-b border-border/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Knowledge Base</span>
          <div className="flex items-center gap-1">
            <button
              className="p-1 text-muted-foreground hover:text-foreground rounded-[4px] hover:bg-muted/30 shrink-0"
              title="New Note"
              onClick={() => {setCreatingInPath(null); setCreatingType('file'); setNewItemName('');}}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 text-muted-foreground hover:text-foreground rounded-[4px] hover:bg-muted/30 shrink-0"
              title="New Folder"
              onClick={() => {setCreatingInPath(null); setCreatingType('folder'); setNewItemName('');}}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 text-muted-foreground hover:text-foreground rounded-[4px] hover:bg-muted/30 shrink-0"
              title="Refresh Vault"
              onClick={fetchFiles}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              className={cn(
                "p-1 rounded-[4px] shrink-0",
                showGraphView
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
              onClick={() => setShowGraphView(!showGraphView)}
              title="Toggle Graph View"
            >
              <Network className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="my-2.5 relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-3 bg-muted/20 border border-border/30 rounded-[6px] text-[11px] focus:outline-none focus:border-foreground/30 transition-all font-medium placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Sidebar Tabs */}
        <div className="flex border-b border-border/20 text-[9px] font-black tracking-widest mb-2 shrink-0 select-none">
          <button
            onClick={() => setSidebarTab('explorer')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              sidebarTab === 'explorer'
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            FILES
          </button>
          <button
            onClick={() => setSidebarTab('hubs')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              sidebarTab === 'hubs'
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            HUBS
          </button>
          <button
            onClick={() => setSidebarTab('pdfs')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              sidebarTab === 'pdfs'
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            PDFS
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 pr-1 text-xs">
          {sidebarTab === 'explorer' && (
            <div
              className="py-1 min-h-full"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => handleDrop(e, null)}
            >
              {files.length > 0 ? renderTree(filteredFiles) : (
                <div className="py-6 text-center opacity-40">
                  <Folder className="w-6 h-6 mx-auto mb-1 opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Vault Empty</p>
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'hubs' && (
            <div className="flex flex-col gap-3 py-1">
              {loadingHubs ? (
                <div className="py-6 flex justify-center"><RefreshCw size={14} className="animate-spin text-muted-foreground/30" /></div>
              ) : Object.keys(groupedHubs).length > 0 ? (
                Object.entries(groupedHubs).map(([course, courseHubs]) => (
                  <div key={course} className="flex flex-col gap-0.5">
                    <div className="px-1 py-0.5 flex items-center gap-2 select-none">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{course}</span>
                      <div className="h-px flex-1 bg-border/20" />
                    </div>
                    {courseHubs.map(hub => (
                      <button
                        key={hub.id}
                        onClick={() => selectFile(hub.path)}
                        className={cn(
                          "flex flex-col p-1.5 rounded-[4px] text-left transition-none text-[11px]",
                          selectedPath === hub.path ? "bg-muted/80 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black opacity-50 tabular-nums">U{hub.unit || '0'}</span>
                          <span className="truncate">{(hub.title ?? hub.name ?? '').replace(' Hub', '')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">No hubs found</div>
              )}
            </div>
          )}

          {sidebarTab === 'pdfs' && (
            <div className="flex flex-col gap-3 py-1">
              {Object.entries(groupedPdfs).map(([folder, folderPdfs]) => (
                <div key={folder} className="flex flex-col gap-0.5">
                  <div className="px-1 py-0.5 flex items-center gap-2 select-none">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{folder}</span>
                    <div className="h-px flex-1 bg-border/20" />
                  </div>
                  {folderPdfs.map(file => (
                    <button
                      key={file.path}
                      onClick={() => selectFile(file.path)}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded-[4px] text-left transition-all text-[11px]",
                        selectedPath === file.path
                          ? "bg-muted/80 text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      )}
                    >
                      <FileText size={12} className={cn(
                        "shrink-0",
                        selectedPath === file.path ? "text-foreground" : "text-muted-foreground/50"
                      )} />
                      <span className="truncate">{(file.name ?? (file as any).title ?? '').replace('.pdf', '')}</span>
                    </button>
                  ))}
                </div>
              ))}
              {Object.keys(groupedPdfs).length === 0 && (
                <div className="py-10 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">No PDFs found</div>
              )}
            </div>
          )}
        </div>
      </div>
    , 'obsidian');
  }, [
    sidebarTab, searchQuery, files, filteredFiles, loadingHubs, groupedHubs, groupedPdfs, selectedPath, showGraphView,
    setSidebarContent, fetchFiles, selectFile, renderTree, handleDrop, setCreatingInPath, setCreatingType, setNewItemName
  ]);

  // --- Card Dashboard CRUD Handlers ---
  const onCreateHub = async () => {
    const name = window.prompt("Enter new Hub title:");
    if (!name) return;
    const cleanName = name.replace(/ /g, '_');
    const targetPath = `hubs/${cleanName}.md`;
    try {
      await sidecarApi.createObsidianFile(targetPath, `---\ntitle: ${name}\ntype: hub\n---\n\n# ${name}\n\n`);
      await fetchFiles();
      await fetchHubs();
      toast.success("Hub created successfully");
    } catch (err: any) {
      toast.error(`Failed to create Hub: ${err.message}`);
    }
  };

  const onCreateNoteInHub = async () => {
    const name = window.prompt("Enter note title:");
    if (!name) return;
    const cleanName = name.replace(/ /g, '_');
    const targetPath = `${cleanName}.md`;
    try {
      await sidecarApi.createObsidianFile(targetPath, `---\ntitle: ${name}\n---\n\n# ${name}\n\n`);
      if (workspaceHub) {
        const hubRes = await sidecarApi.readObsidianNote(workspaceHub);
        const currentContent = hubRes.content || '';
        const updatedContent = `${currentContent}\n\n- [[${cleanName}]]`;
        await sidecarApi.updateObsidianNote(workspaceHub, updatedContent);
      }
      await fetchFiles();
      setWorkspaceHubNotes(prev => [...prev, cleanName]);
      toast.success("Note created and linked successfully");
    } catch (err: any) {
      toast.error(`Failed to create Note: ${err.message}`);
    }
  };

  const onDeleteCard = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = window.confirm(`Are you sure you want to delete ${path.split(/[/\\]/).pop()}?`);
    if (!confirm) return;
    try {
      await sidecarApi.deleteObsidianItem(path);
      await fetchFiles();
      await fetchHubs();
      if (workspaceHub === path) {
        setWorkspaceHub(null);
      }
      toast.success("Item deleted successfully");
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const onRenameCard = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const oldName = path.split(/[/\\]/).pop() || '';
    const newName = window.prompt("Rename item to:", oldName);
    if (!newName || newName === oldName) return;

    const pathParts = path.split(/[/\\]/);
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    try {
      await sidecarApi.moveObsidianItem(path, newPath);
      await fetchFiles();
      await fetchHubs();
      if (workspaceHub === path) {
        setWorkspaceHub(newPath);
      }
      toast.success("Item renamed successfully");
    } catch (err: any) {
      toast.error(`Rename failed: ${err.message}`);
    }
  };

  const onMoveNote = async (notePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const noteName = notePath.split(/[/\\]/).pop()?.replace('.md', '') || '';
    const cleanNoteName = noteName.replace(/ /g, '_');

    const otherHubs = hubs.filter(h => h.path !== workspaceHub);
    if (otherHubs.length === 0) {
      toast.error("No other Hubs available to move to");
      return;
    }

    const hubTitles = otherHubs.map((h, i) => `${i + 1}. ${h.title ?? h.name ?? 'Untitled'}`).join('\n');
    const choice = window.prompt(`Select destination Hub (enter number 1-${otherHubs.length}):\n\n${hubTitles}`);
    if (!choice) return;
    const index = parseInt(choice) - 1;
    if (isNaN(index) || index < 0 || index >= otherHubs.length) {
      toast.error("Invalid choice");
      return;
    }

    const targetHub = otherHubs[index];
    try {
      if (workspaceHub) {
        const currentHubRes = await sidecarApi.readObsidianNote(workspaceHub);
        const content = currentHubRes.content || '';
        const regex = new RegExp(`-?\\s*\\[\\[${cleanNoteName.replace(/_/g, '[_ ]')}(\\|.*?)?\\]\\]\\s*\\n?`, 'g');
        const updatedContent = content.replace(regex, '');
        await sidecarApi.updateObsidianNote(workspaceHub, updatedContent);
      }

      const targetHubRes = await sidecarApi.readObsidianNote(targetHub.path);
      const targetContent = targetHubRes.content || '';
      const updatedTargetContent = `${targetContent}\n\n- [[${cleanNoteName}]]`;
      await sidecarApi.updateObsidianNote(targetHub.path, updatedTargetContent);

      if (workspaceHub) {
        setWorkspaceHubNotes(prev => prev.filter(n => n !== cleanNoteName));
      }
      await fetchFiles();
      toast.success(`Note moved to ${targetHub.title ?? targetHub.name ?? 'Untitled'}`);
    } catch (err: any) {
      toast.error(`Move failed: ${err.message}`);
    }
  };

  const renderDashboardBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground select-none">
        <button
          onClick={() => {
            setWorkspaceHub(null);
          }}
          className="hover:text-foreground transition-colors"
        >
          Hubs
        </button>
        {workspaceHub && (
          <>
            <ChevronRight size={10} className="opacity-40" />
            <span className="text-foreground">
              {workspaceHub.split(/[/\\]/).pop()?.replace('.md', '').replace(/_/g, ' ')}
            </span>
          </>
        )}
      </div>
    )
  }

  const resolveNotesForHub = () => {
    if (loadingHubNotes) return [];
    return files.filter(f => {
      if (f.is_dir || !(f.name ?? (f as any).title ?? '').endsWith('.md')) return false;
      const nameWithoutExt = (f.name ?? (f as any).title ?? '').slice(0, -3).replace(/ /g, '_');
      return workspaceHubNotes.some(link => {
        return link.replace(/ /g, '_') === nameWithoutExt || f.path.replace(/\\/g, '/').includes(link);
      });
    });
  }

  const renderDashboard = () => {
    // Search filtering logic
    const filteredHubs = hubs.filter(h =>
      (h.title ?? h.name ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase()) ||
      (h.course && h.course.toLowerCase().includes(dashboardSearchQuery.toLowerCase()))
    );

    const filteredNotes = resolveNotesForHub().filter(file =>
      (file.name ?? (file as any).title ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase())
    );

    const filteredInbox = inboxFiles.filter(file =>
      (file.name ?? (file as any).title ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase())
    );

    const filteredPdfs = files.filter(f => !f.is_dir && (f.name ?? (f as any).title ?? '').endsWith('.pdf')).filter(file =>
      (file.name ?? (file as any).title ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full w-full p-6 text-foreground overflow-y-auto custom-scrollbar font-sans select-none">
        {/* Dashboard Tabs Switcher */}
        <div className="flex items-center gap-1.5 border-b border-border/10 pb-4 mb-4 shrink-0 select-none">
          {([
            { id: 'hubs', label: 'Hubs', icon: <Network size={12} /> },
            { id: 'inbox', label: 'Inbox', icon: <Archive size={12} /> },
            { id: 'pdfs', label: 'PDFs', icon: <FileText size={12} /> }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setDashboardTab(tab.id);
                setWorkspaceHub(null);
                setDashboardSearchQuery('');
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                dashboardTab === tab.id
                  ? "bg-foreground text-background border-foreground font-extrabold"
                  : "bg-muted/10 text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted/20"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Toolbar: Search & Graph View Toggle */}
        <div className="flex items-center gap-3 mb-6 select-none shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              placeholder={
                dashboardTab === 'hubs'
                  ? (workspaceHub ? "Search note stubs..." : "Search hubs...")
                  : dashboardTab === 'inbox'
                    ? "Search inbox files..."
                    : "Search PDFs..."
              }
              value={dashboardSearchQuery}
              onChange={(e) => setDashboardSearchQuery(e.target.value)}
              className="w-full bg-muted/10 border border-border/40 rounded-[8px] pl-9 pr-4 py-2 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-foreground/30 transition-all font-sans"
            />
            {dashboardSearchQuery && (
              <button
                onClick={() => setDashboardSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground/40 hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowGraphView(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20"
          >
            <Network size={12} />
            <span>Graph View</span>
          </button>
        </div>

        {/* Tab contents */}
        {dashboardTab === 'hubs' && (
          <div className="flex-1 flex flex-col min-h-0">
            {workspaceHub && renderDashboardBreadcrumbs()}

            {/* Level 1: Hubs list */}
            {!workspaceHub && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between select-none">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Curriculum Hub Nodes</span>
                  <button
                    onClick={onCreateHub}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Plus size={10} /> Add Hub
                  </button>
                </div>
                <div className="h-px bg-border/20 mb-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHubs.length > 0 ? (
                    filteredHubs.map(hub => {
                      return (
                        <div
                          key={hub.id}
                          onClick={() => setWorkspaceHub(hub.path)}
                          className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[110px] group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 border border-border/30 px-1.5 py-0.5 rounded-[4px] font-mono">
                                UNIT {hub.unit || '0'}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate mt-1">
                              {hub.title ?? hub.name ?? 'Untitled'}
                            </h3>
                            <p className="text-[9px] text-muted-foreground/50 mt-1 truncate font-mono">
                              {hub.course || 'Uncategorized'}
                            </p>
                          </div>

                          {/* Card CRUD Controls */}
                          <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                            <button
                              onClick={(e) => onRenameCard(hub.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => onDeleteCard(hub.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-3 py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                      {dashboardSearchQuery ? "No matching Hubs found" : "No Hub Notes Found In Vault"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Level 2: Note Stubs inside active Hub */}
            {workspaceHub && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between select-none">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Atomic Note Stubs</span>
                  <button
                    onClick={onCreateNoteInHub}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Plus size={10} /> Add Note
                  </button>
                </div>
                <div className="h-px bg-border/20 mb-2" />

                {loadingHubNotes ? (
                  <div className="py-12 flex justify-center"><RefreshCw size={24} className="animate-spin text-muted-foreground/30" /></div>
                ) : filteredNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map(file => {
                      const cleanNoteName = (file.name ?? (file as any).title ?? '').slice(0, -3).replace(/_/g, ' ');
                      return (
                        <div
                          key={file.path}
                          onClick={() => selectFile(file.path)}
                          className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[96px] group"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1.5">
                              <FileText size={12} className="shrink-0" />
                              <span className="text-[8px] font-black uppercase tracking-widest font-mono truncate">
                                ATOMIC NOTE
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors mt-1.5 leading-snug line-clamp-2">
                              {cleanNoteName}
                            </h3>
                          </div>

                          {/* Note Card Actions */}
                          <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                            <button
                              onClick={(e) => onRenameCard(file.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => onMoveNote(file.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                            >
                              Move
                            </button>
                            <button
                              onClick={(e) => onDeleteCard(file.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                    {dashboardSearchQuery ? "No matching Notes found" : "No Atomic Notes Linked In This Hub Yet"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {dashboardTab === 'inbox' && (
          <div className="space-y-4">
            <div className="px-1 flex items-center justify-between select-none">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Inbox files</span>
              <button
                onClick={async () => {
                  const name = window.prompt("Enter new inbox item title:");
                  if (!name) return;
                  const cleanName = name.replace(/ /g, '_');
                  try {
                    await sidecarApi.createObsidianFile(`inbox/${cleanName}.md`, `---\ntitle: ${name}\n---\n\n`);
                    await fetchInbox();
                    toast.success("Inbox item created");
                  } catch (err: any) {
                    toast.error(`Creation failed: ${err.message}`);
                  }
                }}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Plus size={10} /> Add Item
              </button>
            </div>
            <div className="h-px bg-border/20 mb-2" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInbox.length > 0 ? (
                filteredInbox.map(file => {
                  return (
                    <div
                      key={file.path}
                      onClick={() => selectFile(file.path)}
                      className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[96px] group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1.5">
                          <Archive size={12} className="shrink-0" />
                          <span className="text-[8px] font-black uppercase tracking-widest font-mono">Inbox file</span>
                        </div>
                        <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {(file.name ?? (file as any).title ?? '').replace('.pdf', '')}
                        </h3>
                      </div>

                      {/* Inbox Card Actions */}
                      <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        <button
                          onClick={(e) => onRenameCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => onDeleteCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-3 py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                  {dashboardSearchQuery ? "No matching Inbox files found" : "Inbox is empty"}
                </div>
              )}
            </div>
          </div>
        )}

        {dashboardTab === 'pdfs' && (
          <div className="space-y-4">
            <div className="px-1 flex items-center justify-between select-none">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Reference PDF Documents</span>
              <button
                onClick={async () => {
                  const name = window.prompt("Enter new reference note title:");
                  if (!name) return;
                  const cleanName = name.replace(/ /g, '_');
                  try {
                    await sidecarApi.createObsidianFile(`${cleanName}.md`, `---\ntitle: ${name}\ntags: [reference]\n---\n\n`);
                    await fetchFiles();
                    toast.success("Reference note created");
                  } catch (err: any) {
                    toast.error(`Creation failed: ${err.message}`);
                  }
                }}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Plus size={10} /> Add Reference
              </button>
            </div>
            <div className="h-px bg-border/20 mb-2" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPdfs.length > 0 ? (
                filteredPdfs.map(file => {
                  return (
                    <div
                      key={file.path}
                      onClick={() => selectFile(file.path)}
                      className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[96px] group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1.5">
                          <FileText size={12} className="shrink-0" />
                          <span className="text-[8px] font-black uppercase tracking-widest font-mono">PDF reference</span>
                        </div>
                        <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {(file.name ?? (file as any).title ?? '').replace('.pdf', '')}
                        </h3>
                      </div>

                      {/* PDF Card Actions */}
                      <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        <button
                          onClick={(e) => onRenameCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => onDeleteCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-3 py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                  {dashboardSearchQuery ? "No matching PDFs found" : "No Reference PDFs In Vault"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    return () => {
      setSidebarContent(null, 'obsidian');
    };
  }, [setSidebarContent]);

  return (
  <div className="flex flex-row h-full w-full select-none bg-transparent gap-3 overflow-hidden font-sans relative">
    <style dangerouslySetInnerHTML={{__html: `
      .editor-content p {
        margin-bottom: 1.5rem;
        line-height: 1.7;
        color: hsl(var(--foreground) / 0.8);
      }
      .editor-content strong {
        color: hsl(var(--foreground));
        font-weight: 700;
      }
      .underlined-term {
        border-bottom: 1px solid hsl(var(--muted-foreground));
        padding-bottom: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #242426;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a1a1aa;
      }
      .panel-transition {
        transition: width 0.3s ease-in-out, margin 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out;
      }
    `}} />

    {/* Main Editor Panel */}
    {showGraphView ? (
      <div className="flex-1 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden panel-transition flex flex-col">
        {/* Graph Header Bar */}
        <div className="p-4 border-b border-border/10 flex items-center justify-between shrink-0 select-none">
          <button
            onClick={() => {
              setShowGraphView(false);
              navigate('/academic');
            }}
            className="text-[9px] font-black uppercase tracking-widest hover:text-foreground text-muted-foreground bg-muted/10 border border-border/40 px-2.5 py-1 rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={10} /> Back to Dashboard
          </button>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 font-mono">
            Vault Graph Relations
          </span>
        </div>
        <div className="flex-1 min-h-0 relative">
          <ObsidianGraphView onNodeClick={(path) => {
            selectFile(path);
            setShowGraphView(false);
          }} />
        </div>
      </div>
    ) : (
      <div className="flex-1 flex flex-row min-w-0 h-full gap-3 relative">
        <main
          data-purpose="main-editor"
          className="bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-y-auto custom-scrollbar relative flex flex-col min-w-0 panel-transition"
          style={{ width: (isPanelOpen && artifacts.length > 0) ? `${100 - panelWidth}%` : '100%', flex: (isPanelOpen && artifacts.length > 0) ? 'none' : '1 1 0%' }}
        >
        {!selectedPath ? (
          renderDashboard()
        ) : (
          <div className={cn(
            "mx-auto w-full max-w-full relative flex-1 flex flex-col min-h-0",
            selectedIsPdf ? "px-4 pt-3 pb-0 overflow-hidden" : "py-4 px-6 h-full bg-transparent"
          )}>
            {loadingNote && (
              <PanelLoader label="Loading Document" />
            )}

            {/* Back to Dashboard Button Bar */}
            <div className="mb-3 shrink-0 select-none flex items-center justify-between border-b border-border/10 pb-2">
              <button
                onClick={() => {
                  setSelectedPath(null);
                  setLoadedPath(null);
                  setNoteMetadata({});
                  setNoteContent('');
                  setEditedContent('');
                  // Also clear selection in search query
                  setSearchParams((prev: URLSearchParams) => {
                    prev.delete('path');
                    return prev;
                  });
                }}
                className="text-[9px] font-black uppercase tracking-widest hover:text-foreground text-muted-foreground bg-muted/10 border border-border/40 px-2.5 py-1 rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={10} /> Back to Dashboard
              </button>

              {selectedIsPdf && (
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 font-mono truncate max-w-[300px]">
                  PDF: {selectedPath.split(/[/\\]/).pop()?.replace('.pdf', '')}
                </span>
              )}
            </div>

            {/* Note details */}
            {!selectedIsPdf ? (
              isLessonActive && !isEditing ? (
                <div className="editor-content w-full flex-1 flex flex-col min-h-0">
                  <LearningWorkspace
                    preview={activePreview!}
                    tutorSession={activeTutorSession}
                    onTutorSessionChange={setActiveTutorSession}
                    onPreviewChange={(p) => {
                      if (p?.notePath) {
                        setSelectedPath(p.notePath)
                        setSearchParams({ path: p.notePath })
                      }
                    }}
                    onClose={() => {
                      localStorage.setItem('ater_lesson_panel_open', 'false')
                      setIsLessonActive(false)
                    }}
                    onWikiLinkClick={handleWikiLinkClick}
                    onUpdateProperty={handleUpdateProperty}
                    onDeleteProperty={handleDeleteProperty}
                    onAddProperty={handleAddProperty}
                  />
                </div>
              ) : (
                <div className="editor-content w-full flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <h1 className="min-w-0 text-[32px] font-bold text-foreground tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: '28px' }}>
                        {(noteMetadata?.title || noteMetadata?.Title || selectedPath.split(/[/\\]/).pop()?.replace('.md', '').replace('.pdf', '') || '').replace(/_/g, ' ')}
                      </h1>
                      {!isTemporaryLessonPath(selectedPath) && (
                        <button
                          type="button"
                          onClick={() => void openSelectedInLessonRuntime()}
                          className="h-9 shrink-0 rounded-[8px] border border-border bg-bento-item px-4 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
                        >
                          Continue Lesson
                        </button>
                      )}
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex items-center gap-2 mb-6 border-b border-border pb-6">
                      {noteMetadata?.semester && (
                        <button className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans gap-1">
                          <Calendar size={10} />
                          {cleanTitle(noteMetadata.semester)}
                        </button>
                      )}
                      {noteMetadata?.course && (
                        <button className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans gap-1">
                          <GraduationCap size={10} />
                          {cleanTitle(noteMetadata.course)}
                        </button>
                      )}
                      {noteMetadata?.unit && (
                        <button className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans gap-1">
                          <Hash size={10} />
                          UNIT {cleanTitle(noteMetadata.unit)}
                        </button>
                      )}
                    </div>

                    {config?.showProperties && (
                      <NoteProperties
                        metadata={noteMetadata}
                        onNavigate={handleWikiLinkClick}
                        onAddProperty={handleAddProperty}
                        onUpdateProperty={handleUpdateProperty}
                        onDeleteProperty={handleDeleteProperty}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-h-0">
                    {isEditing ? (
                      <ObsidianEditor
                        value={editedContent}
                        onChange={setEditedContent}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                            e.preventDefault()
                            handleSaveNote()
                          }
                        }}
                        noteList={noteList}
                      />
                    ) : (
                      <MarkdownViewer
                        key={selectedPath}
                        content={noteContent}
                        onNavigate={handleWikiLinkClick}
                        path={selectedPath || undefined}
                        noteMode={String(noteMetadata?.mode || '')}
                        noteTitle={String(noteMetadata?.title || '')}
                        noteCourse={String(noteMetadata?.course || '')}
                      />
                    )}
                  </div>

                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
                <div className="flex-1 min-h-0">
                  <PdfViewer
                    ref={pdfRef}
                    path={selectedPath}
                    title={selectedPath.split(/[/\\]/).pop() || ''}
                    initialPage={selectedPage}
                    filterPages={selectedFilteredPages}
                    onStateChange={handlePdfStateChange}
                  />
                </div>

                {/* Knowledge Navigation Footer for PDF (when in context) */}
                {studyTree.length > 0 && (
                  <div className="border-t border-border bg-bento-panel/50 px-16 py-8">
                    <KnowledgeFooter
                      tree={studyTree}
                      activePath={selectedPath}
                      onNavigate={handleWikiLinkClick}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </main>

        {(isPanelOpen && artifacts.length > 0) && (
          <>
            <button
              type="button"
              aria-label="Resize artifact panel"
              onMouseDown={(event) => {
                event.preventDefault()
                setIsDraggingSplit(true)
              }}
              className="w-1.5 shrink-0 cursor-col-resize border-x border-border/40 bg-muted hover:bg-foreground/20 rounded-[6px]"
            />
            <div
              className="min-w-[420px] max-w-[82%] rounded-[12px] overflow-hidden border border-border/40 bg-bento-panel shadow-sm shrink-0"
              style={{ width: `${panelWidth}%` }}
            >
              <UnifiedSandboxViewer shielded={isDraggingSplit} />
            </div>
          </>
        )}
      </div>
    )}

    {isResizing && (
      <div className="fixed inset-0 z-[9999] cursor-col-resize select-none bg-transparent" />
    )}
  </div>
  )
}
