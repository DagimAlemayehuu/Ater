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

  React.useEffect(() => {
    if (view === 'dashboard' || view === 'history' || view === 'vault' || view === 'configuring') {
      setSidebarContent(
        <div className="flex flex-col gap-1 w-full font-sans">
          <div className="px-3 mb-2 flex items-center gap-2 select-none">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">Practice Hub</span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={11} />, dataTour: 'tab-practice-dashboard' },
            { id: 'history', label: 'History', icon: <Clock size={11} />, dataTour: 'tab-practice-history' },
            { id: 'vault', label: 'Reference Vault', icon: <BookOpen size={11} />, dataTour: 'tab-practice-vault' },
            { id: 'configuring', label: 'Custom', icon: <Sliders size={11} />, dataTour: 'tab-practice-custom' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none outline-none focus-visible:ring-1 focus-visible:ring-primary",
                view === t.id
                  ? "bg-bento-item text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-bento-item/30"
              )}
              data-tour={t.dataTour}
            >
              <span className="shrink-0 text-muted-foreground">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>,
        'practice'
      )
    } else if (view === 'session') {
      setSidebarContent(
        <div className="flex flex-col gap-1 w-full font-sans">
          <div className="px-3 mb-2 flex items-center gap-2 select-none">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">Session Active</span>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <button
            onClick={() => setView('dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none text-muted-foreground hover:text-foreground hover:bg-bento-item/30"
          >
            <span>Exit Practice</span>
          </button>
        </div>,
        'practice'
      )
    } else {
      setSidebarContent(null, 'practice')
    }
    return () => {
      setSidebarContent(null, 'practice')
    }
  }, [view, setSidebarContent, setView])

  if (view === 'dashboard') {
    return (
      <PracticeDashboard
        view={view}
        setView={setView}
        pastPractices={pastPractices}
        analytics={analytics}
        selectedHub={selectedHub}
        handleReviewDueCards={handleReviewDueCards}
      />
    )
  }

  if (view === 'history') {
    return (
      <PracticeHistory
        view={view}
        setView={setView}
        pastPractices={pastPractices}
        handleResumePractice={handleResumePractice}
        handleDeletePractice={handleDeletePractice}
      />
    )
  }

  if (view === 'vault') {
    return (
      <PracticeVault
        view={view}
        setView={setView}
        hubs={hubs}
        selectedHub={selectedHub}
        setSelectedHub={setSelectedHub}
        loadVaultFiles={loadVaultFiles}
        vaultSourceName={vaultSourceName}
        setVaultSourceName={setVaultSourceName}
        vaultSourceText={vaultSourceText}
        setVaultSourceText={setVaultSourceText}
        handleVaultUploadText={handleVaultUploadText}
        vaultLoading={vaultLoading}
        vaultStatus={vaultStatus}
        vaultFiles={vaultFiles}
        vaultSelectedFiles={vaultSelectedFiles}
        setVaultSelectedFiles={setVaultSelectedFiles}
        vaultMode={vaultMode}
        setVaultMode={setVaultMode}
        handleVaultPracticeGenerate={handleVaultPracticeGenerate}
      />
    )
  }

  if (view === 'configuring') {
    return (
      <PracticeConfigurator
        setView={setView}
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
    )
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
        setView={setView}
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
        setView={setView}
        elapsedSec={elapsedSec}
        setAdvancedConfig={setAdvancedConfig}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden">
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
            Session state invalidated
          </p>
          <Button
            onClick={() => setView('dashboard')}
            variant="outline"
            className="h-10 px-8 border-border bg-bento-card hover:bg-bento-item text-foreground rounded-[8px] font-black uppercase tracking-widest text-[10px]"
          >
            Reset Interface
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PracticeModule
