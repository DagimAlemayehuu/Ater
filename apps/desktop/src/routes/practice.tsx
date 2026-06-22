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
