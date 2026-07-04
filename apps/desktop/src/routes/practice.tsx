import React from 'react'
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

  const { setSidebarContent } = useSidebarContent()
  const [activeSubTab, setActiveSubTab] = React.useState<'configure' | 'history'>('configure')

  React.useEffect(() => {
    setView('configuring')
  }, [])

  React.useEffect(() => {
    setSidebarContent(null, 'practice')
    return () => {
      setSidebarContent(null, 'practice')
    }
  }, [setSidebarContent])

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
      {/* Tabs Header */}
      <div className="px-10 pt-8 border-b border-border/10 flex items-center justify-between shrink-0 bg-bento-card">
        <div className="flex gap-6">
          <button 
            onClick={() => {
              setActiveSubTab('configure')
              setView('configuring')
            }}
            className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-3 border-b-2 -mb-[2px] focus:outline-none font-sans", 
              activeSubTab === 'configure' 
                ? "text-foreground border-foreground" 
                : "text-muted-foreground/45 border-transparent hover:text-foreground")}
          >
            Configure
          </button>
          <button 
            onClick={() => {
              setActiveSubTab('history')
              setView('history')
            }}
            className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-3 border-b-2 -mb-[2px] focus:outline-none font-sans", 
              activeSubTab === 'history' 
                ? "text-foreground border-foreground" 
                : "text-muted-foreground/45 border-transparent hover:text-foreground")}
          >
            History
          </button>
        </div>
      </div>

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
