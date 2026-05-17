import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await check();
        if (update?.available) {
          console.log('[Updater] Update available:', update.version);
          setUpdateAvailable(update);
        } else {
          console.log('[Updater] App is up to date.');
        }
      } catch (error) {
        console.error('[Updater] Failed to check for updates:', error);
      }
    }

    // Check for updates shortly after app starts
    const timeout = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const handleUpdate = async () => {
    if (!updateAvailable) return;
    
    setIsUpdating(true);
    try {
      console.log('[Updater] Starting download and install...');
      await updateAvailable.downloadAndInstall();
      console.log('[Updater] Install complete, relaunching...');
      await relaunch();
    } catch (error: any) {
      console.error('[Updater] Failed to update:', error);
      toast.error('Failed to install update: ' + error.message);
      setIsUpdating(false);
      setUpdateAvailable(null);
    }
  };

  if (!updateAvailable) return null;

  return (
    <AlertDialog open={!!updateAvailable}>
      <AlertDialogContent className="bg-surface border-outline-variant font-sans">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black uppercase tracking-tight text-foreground text-xl">Update Available</AlertDialogTitle>
          <AlertDialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
            Ater version {updateAvailable.version} is available. You are currently on {updateAvailable.currentVersion}.
            {updateAvailable.body && (
              <div className="mt-4 p-4 bg-background border border-outline-variant font-mono text-[10px] normal-case text-foreground whitespace-pre-wrap max-h-[150px] overflow-auto custom-scrollbar">
                {updateAvailable.body}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel 
            onClick={() => setUpdateAvailable(null)}
            disabled={isUpdating}
            className="text-[10px] font-black uppercase tracking-widest bg-transparent hover:bg-surface-container-low"
          >
            Later
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleUpdate}
            disabled={isUpdating}
            className="text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Now'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
