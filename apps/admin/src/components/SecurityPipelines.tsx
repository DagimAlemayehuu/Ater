"use client";

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ShieldAlert, RefreshCw, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'

type BlacklistedDevice = {
  machine_id_hash: string
  created_at: string
  reason: string
}

type Profile = {
  id: string
  email: string
  full_name: string
  machine_id: string | null
}

export function SecurityPipelines() {
  const [blacklist, setBlacklist] = useState<BlacklistedDevice[]>([])
  const [isLoadingBlacklist, setIsLoadingBlacklist] = useState(true)
  const [users, setUsers] = useState<Profile[]>([])
  const [newDeviceHash, setNewDeviceHash] = useState('')
  const [banReason, setBanReason] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Clear messages
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setErrorMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  // Fetch blacklisted device hashes
  async function fetchBlacklist() {
    setIsLoadingBlacklist(true)
    try {
      const { data, error } = await supabase
        .from('hardware_blacklist')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setBlacklist(data)
      }
    } catch (e) {
      console.error('[Security] Failed to fetch blacklist:', e)
    } finally {
      setIsLoadingBlacklist(false)
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, machine_id')
        .order('full_name', { ascending: true })
      if (!error && data) {
        setUsers(data)
      }
    } catch (e) {
      console.error('[Security] Failed to fetch users for selection:', e)
    }
  }

  useEffect(() => {
    fetchBlacklist()
    fetchUsers()
  }, [])

  // Blacklist a device
  async function blacklistDevice() {
    if (!newDeviceHash.trim()) return
    try {
      const { error } = await supabase
        .from('hardware_blacklist')
        .insert({
          machine_id_hash: newDeviceHash.trim(),
          reason: banReason.trim() || 'Manual admin block'
        })
      if (!error) {
        setNewDeviceHash('')
        setBanReason('')
        setSuccessMessage('Hardware footprint blacklisted successfully.')
        fetchBlacklist()
      } else {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[Security] Failed to ban device:', e)
      setErrorMessage('Failed to add device signature block.')
    }
  }

  // Lift device blacklist
  async function removeBlacklist(hash: string) {
    try {
      const { error } = await supabase
        .from('hardware_blacklist')
        .delete()
        .eq('machine_id_hash', hash)
      if (!error) {
        setSuccessMessage('Hardware blacklist block lifted.')
        fetchBlacklist()
      } else {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[Security] Failed to remove blacklist:', e)
      setErrorMessage('Failed to lift blacklist restriction.')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[10px] max-w-5xl relative select-none">
      {/* Toast notifications */}
      {(successMessage || errorMessage) && (
        <div className={cn(
          "fixed bottom-6 right-6 px-4 py-3 border border-border/40 rounded-[8px] text-[9px] uppercase tracking-widest z-50 shadow-2xl flex items-center gap-2 bg-bento-card",
          successMessage ? "text-foreground" : "text-destructive border-destructive/20 bg-destructive/5"
        )}>
          {successMessage ? successMessage : errorMessage}
        </div>
      )}

      {/* Device Ban Creator Card */}
      <div className="md:col-span-5 p-6 bg-bento-card border border-border/40 rounded-[12px] space-y-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-4.5 text-muted-foreground" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">
            Ban Device
          </h3>
        </div>

        <div className="space-y-2.5">
          <select
            onChange={e => {
              const selectedUser = users.find(u => u.id === e.target.value);
              if (selectedUser?.machine_id) {
                setNewDeviceHash(selectedUser.machine_id);
                setBanReason(`Device of ${selectedUser.full_name || selectedUser.email}`);
              } else {
                setNewDeviceHash('');
                setBanReason('');
              }
            }}
            className="w-full bg-bento-bg border border-border/40 text-foreground text-[10px] px-3 py-2 focus:border-border/80 outline-none rounded-[6px] uppercase font-bold cursor-pointer"
          >
            <option value="">-- Choose User --</option>
            {users.map(u => (
              <option key={u.id} value={u.id} disabled={!u.machine_id} className="bg-bento-card">
                {u.full_name || u.email} {!u.machine_id ? '(No Device)' : `(${u.machine_id.slice(0, 8)}...)`}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Device signature..."
            value={newDeviceHash}
            onChange={e => setNewDeviceHash(e.target.value)}
            className="w-full bg-bento-bg border border-border/40 text-foreground text-[10px] px-3 py-1.5 focus:border-border/80 outline-none rounded-[6px]"
          />
          <input
            type="text"
            placeholder="Reason..."
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            className="w-full bg-bento-bg border border-border/40 text-foreground text-[10px] px-3 py-1.5 focus:border-border/80 outline-none rounded-[6px]"
          />
          <button
            onClick={blacklistDevice}
            className="w-full py-2.5 bg-destructive/10 hover:bg-destructive/20 border border-destructive/25 text-destructive text-[8px] font-black uppercase tracking-widest transition-colors rounded-[6px] cursor-pointer font-bold"
          >
            Ban
          </button>
        </div>
      </div>

      {/* Banned device indices list */}
      <div className="md:col-span-7 bg-bento-card border border-border/40 rounded-[12px] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border/40 bg-bento-panel/30 flex justify-between items-center select-none shrink-0">
          <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            Banned Devices
          </h3>
          <button 
            onClick={fetchBlacklist} 
            className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer border border-border/40 rounded-[6px] bg-bento-card"
          >
            <RefreshCw className="size-3" />
          </button>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar bg-bento-card">
          {isLoadingBlacklist ? (
            <div className="text-center py-6 text-muted-foreground text-[8px] uppercase tracking-widest">
              Loading...
            </div>
          ) : blacklist.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-[8px] uppercase tracking-widest">
              No banned devices.
            </div>
          ) : (
            <div className="space-y-2">
              {blacklist.map(b => (
                <div key={b.machine_id_hash} className="flex justify-between items-center border border-border/40 p-3 bg-bento-bg/30 text-[9px] leading-relaxed rounded-[6px]">
                  <div className="space-y-1 select-text min-w-0 flex-1 pr-2">
                    <div className="font-bold text-foreground break-all">{b.machine_id_hash}</div>
                    <div className="text-muted-foreground text-[8px]">Reason: {b.reason}</div>
                  </div>
                  <button
                    onClick={() => removeBlacklist(b.machine_id_hash)}
                    className="text-muted-foreground hover:text-foreground p-2 transition-colors cursor-pointer border border-border/40 bg-bento-card rounded-[6px] shrink-0"
                  >
                    <Trash className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
