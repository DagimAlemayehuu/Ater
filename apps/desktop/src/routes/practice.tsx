import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BlockingLoader } from '@/components/ui/loading-state'
import { usePracticeConfig } from '@/hooks/usePracticeConfig'
import { PracticeDashboard } from '@/components/practice/PracticeDashboard'
import { PracticeHistory } from '@/components/practice/PracticeHistory'
import { PracticeVault } from '@/components/practice/PracticeVault'
import { PracticeConfigurator } from '@/components/practice/PracticeConfigurator'
import { PracticeSession } from '@/components/practice/PracticeSession'
import { PracticeResults } from '@/components/practice/PracticeResults'
import { useSidebarContent } from '@/context/sidebar-content-context'
import { LayoutDashboard, Clock, BookOpen, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PracticeModule({ noAnimation = false }: { noAnimation?: boolean }) {
  const {
    hubs,
    selectedHub,
    setSelectedHub,
    advancedConfig,
    setAdvancedConfig,
    isLoading,
    view,
    setView,
    session,
    pastPractices,
    genStatus,
    availableNotes,
    analytics,
    vaultFiles,
    vaultLoading,
    vaultStatus,
    vaultSourceText,
    setVaultSourceText,
    vaultSourceName,
    setVaultSourceName,
    vaultSelectedFiles,
    setVaultSelectedFiles,
    vaultMode,
    setVaultMode,
    explainOpen,
    setExplainOpen,
    explainQuestion,
    setExplainQuestion,
    elapsedSec,
    artifacts,
    isPanelOpen,
    panelWidth,
    setIsDraggingSplit,
    loadVaultFiles,
    handleVaultUploadText,
    handleVaultPracticeGenerate,
    loadHubNotes,
    handleStartSession,
    handleResumePractice,
    handleDeletePractice,
    handleReviewDueCards,
  } = usePracticeConfig()

  const navigate = useNavigate()
  const { setSidebarContent } = useSidebarContent()
  const [activeSubTab, setActiveSubTab] = React.useState<'configure' | 'history'>('configure')

  React.useEffect(() => {
    setView('configuring')
  }, [])

  React.useEffect(() => {
    setSidebarContent(
      <div className="flex flex-col gap-1 w-full font-sans">
        <div className="px-3 mb-2 flex items-center gap-2 select-none">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">Practice</span>
          <div className="h-px flex-1 bg-border/20" />
        </div>
        <button
          onClick={() => {
            setActiveSubTab('configure')
            setView('configuring')
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none outline-none cursor-pointer",
            activeSubTab === 'configure'
              ? "bg-bento-item text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-bento-item/30"
          )}
        >
          <Sliders size={11} className="shrink-0 text-muted-foreground" />
          <span>Configure</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('history')
            setView('history')
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none outline-none cursor-pointer",
            activeSubTab === 'history'
              ? "bg-bento-item text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-bento-item/30"
          )}
        >
          <Clock size={11} className="shrink-0 text-muted-foreground" />
          <span>History</span>
        </button>
        
        <div className="pt-4 mt-4 border-t border-border/20 px-1">
          <button
            onClick={() => navigate('/academic')}
            className="w-full flex items-center justify-center py-2 border border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-bento-item/30 rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>,
      'practice'
    )
    return () => {
      setSidebarContent(null, 'practice')
    }
  }, [activeSubTab, setSidebarContent, navigate])

  const handleSetView = (nextView: string) => {
    if (nextView === 'dashboard' || nextView === 'configuring') {
      setView('configuring')
      setActiveSubTab('configure')
    } else if (nextView === 'history') {
      setView('history')
      setActiveSubTab('history')
    } else {
      setView(nextView)
    }
  }

  if (view === 'loading') {
    return (
      <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden">
        <div className="flex-1 overflow-hidden flex items-center justify-center">
          <BlockingLoader label={genStatus} />
        </div>
      </div>
    )
  }

  if (view === 'session' && session.currentQuestion) {
    return (
      <PracticeSession
        session={session}
        view={view}
        setView={handleSetView}
        selectedHub={selectedHub}
        hubs={hubs}
        explainOpen={explainOpen}
        setExplainOpen={setExplainOpen}
        explainQuestion={explainQuestion}
        setExplainQuestion={setExplainQuestion}
        artifacts={artifacts}
        isPanelOpen={isPanelOpen}
        panelWidth={panelWidth}
        setIsDraggingSplit={setIsDraggingSplit}
        handleSubmitAnswer={session.checkAnswer}
        nextQuestion={session.nextQuestion}
        resetSession={session.reset}
        handleSelectAnswer={session.selectAnswer}
        handleExplainMore={() => {
          if (session.currentQuestion) {
            setExplainQuestion(session.currentQuestion)
            setExplainOpen(true)
          }
        }}
      />
    )
  }

  if (view === 'results') {
    return (
      <PracticeResults
        session={session}
        view={view}
        setView={handleSetView}
        elapsedSec={elapsedSec}
        setAdvancedConfig={setAdvancedConfig}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-bento-panel font-sans overflow-hidden">
      {/* Tab Body Container */}
      <div className="flex-1 overflow-hidden relative">
        {activeSubTab === 'configure' ? (
          <div className="absolute inset-0 overflow-y-auto">
            <PracticeConfigurator
              setView={handleSetView}
              advancedConfig={advancedConfig}
              setAdvancedConfig={setAdvancedConfig}
              hubs={hubs}
              selectedHub={selectedHub}
              setSelectedHub={setSelectedHub}
              availableNotes={availableNotes}
              isLoading={isLoading}
              handleStartSession={handleStartSession}
              loadHubNotes={loadHubNotes}
            />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto">
            <PracticeHistory
              view={view}
              setView={handleSetView}
              pastPractices={pastPractices}
              handleResumePractice={handleResumePractice}
              handleDeletePractice={handleDeletePractice}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PracticeModule
