import { useEffect, useState } from 'react';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { Loader2, X, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to render markdown/list notes cleanly
function renderReleaseNotes(body: string) {
  if (!body) return null;
  const lines = body.split('\n');
  return (
    <div className="space-y-3 font-sans text-left">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={index} className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground mt-3 border-b border-[#242426] pb-1.5">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={index} className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mt-2 mb-0.5">
              {trimmed.replace('#### ', '')}
            </h5>
          );
        }
        if (trimmed.startsWith('- ')) {
          let content = trimmed.substring(2);
          if (content.startsWith('**') && content.includes('**', 2)) {
            const parts = content.split('**');
            return (
              <div key={index} className="flex items-start gap-2 text-[10px] text-muted-foreground font-bold tracking-wide my-1 pl-1 leading-relaxed">
                <span className="mt-1.5 size-1.5 rounded-full bg-foreground/30 shrink-0" />
                <span>
                  <strong className="text-foreground font-black uppercase tracking-wider text-[9px]">{parts[1]}</strong>
                  {parts.slice(2).join('**')}
                </span>
              </div>
            );
          }
          return (
            <div key={index} className="flex items-start gap-2 text-[10px] text-muted-foreground font-bold tracking-wide my-1 pl-1 leading-relaxed">
              <span className="mt-1.5 size-1.5 rounded-full bg-foreground/30 shrink-0" />
              <span>{content}</span>
            </div>
          );
        }
        if (trimmed === '') return null;
        return (
          <p key={index} className="text-[10px] text-muted-foreground/80 font-medium leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [visible, setVisible] = useState(false);

  // Listen for manually-dispatched update events (e.g. from debug/testing)
  useEffect(() => {
    const handleShowDialog = (e: Event) => {
      const customEvent = e as CustomEvent;
      const payload = customEvent.detail;
      console.log('[Updater] Opening update notification:', payload);
      toast.dismiss();
      setUpdateAvailable(payload);
      setTimeout(() => setVisible(true), 50);
    };

    window.addEventListener('show-update-dialog', handleShowDialog);

    return () => {
      window.removeEventListener('show-update-dialog', handleShowDialog);
    };
  }, []);

  // Actual update check — runs 8s after app startup to avoid blocking initialization
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update?.available) {
          console.log('[Updater] New version available:', update.version);
          window.dispatchEvent(
            new CustomEvent('show-update-dialog', { detail: update })
          );
        } else {
          console.log('[Updater] App is up to date.');
        }
      } catch (error: any) {
        // Non-critical — update checks can fail silently (offline, GitHub down, etc.)
        console.warn('[Updater] Check failed (non-critical):', error?.message ?? error);
      }
    };

    const timer = setTimeout(checkForUpdates, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setUpdateAvailable(null), 300);
  };

  const handleUpdate = async () => {
    if (!updateAvailable) return;
    
    setIsUpdating(true);
    try {
      console.log('[Updater] Downloading update...');
      await updateAvailable.downloadAndInstall();
      console.log('[Updater] Done. Relaunching...');
      await relaunch();
    } catch (error: any) {
      console.error('[Updater] Failed to update:', error);
      toast.error('Could not install update: ' + error.message + '. Please check your connection and try again.');
      setIsUpdating(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <div 
      className={`fixed top-6 right-6 z-[9999] max-w-sm w-96 bg-[#151517]/95 border border-[#242426] rounded-[12px] p-5 shadow-2xl backdrop-blur-md transition-all duration-300 transform ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#242426] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-foreground" />
          <span className="font-black uppercase tracking-widest text-foreground text-[11px]">New Version Available</span>
        </div>
        <button 
          onClick={handleClose}
          disabled={isUpdating}
          className="text-muted-foreground hover:text-foreground transition-colors outline-none disabled:opacity-50"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-1 text-left">
        <p className="text-[10px] font-bold text-foreground">
          Ater version {updateAvailable.version} is ready to install.
        </p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Current: {updateAvailable.currentVersion} <ArrowRight className="inline size-2.5 mx-0.5" /> New: {updateAvailable.version}
        </p>
      </div>

      {/* Changelog body */}
      {updateAvailable.body && (
        <div className="mt-3 p-3.5 bg-[#1c1c1e] border border-[#242426]/60 rounded-[8px] max-h-[160px] overflow-y-auto custom-scrollbar">
          {renderReleaseNotes(updateAvailable.body)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-[#242426]">
        <button 
          onClick={handleClose}
          disabled={isUpdating}
          className="text-[9px] font-black uppercase tracking-widest bg-transparent hover:bg-[#232326] text-muted-foreground hover:text-foreground h-8 px-4 rounded-[6px] transition-colors border border-[#242426]/20"
        >
          Later
        </button>
        <button 
          onClick={handleUpdate}
          disabled={isUpdating}
          className="text-[9px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 flex items-center gap-1.5 h-8 px-4 rounded-[6px] transition-all"
        >
          {isUpdating ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Installing...
            </>
          ) : (
            'Update Now'
          )}
        </button>
      </div>
    </div>
  );
}
