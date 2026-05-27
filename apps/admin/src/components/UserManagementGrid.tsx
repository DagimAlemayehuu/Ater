"use client";

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, RefreshCw, Shield, User, Coins, ToggleLeft, History } from 'lucide-react'
import { cn } from '@/lib/utils'

type Profile = {
  id: string
  email: string
  full_name: string
  account_status: 'active' | 'suspended' | 'banned'
  credit_balance: number
  locked_features: string[]
  created_at: string
}

type LedgerEntry = {
  id: string
  amount: number
  feature_slug: string
  created_at: string
}

const availableFeatures = [
  { slug: 'ai_locked', label: 'AI Features Lockout' },
  { slug: 'academic_locked', label: 'Academic Dashboard Lockout' },
  { slug: 'explorer_locked', label: 'Explorer Lockout' },
  { slug: 'full_system_locked', label: 'Full System Lockout' },
]


export function UserManagementGrid() {
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLedgerLoading, setIsLedgerLoading] = useState(false)
  const [newCreditBalance, setNewCreditBalance] = useState<number>(0)
  const [newFeatureSlug, setNewFeatureSlug] = useState<string>('ai_locked')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Clear notifications after time
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setErrorMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  // Fetch users
  async function fetchUsers() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setUsers(data)
      } else if (error) {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[User Management] Failed to load profiles:', e)
      setErrorMessage('Failed to connect to profile database.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch selected user's credit ledger
  async function fetchUserLedger(userId: string) {
    setIsLedgerLoading(true)
    try {
      const { data, error } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8)
      if (!error && data) {
        setLedger(data)
      }
    } catch (e: unknown) {
      console.error('[User Management] Failed to load ledger:', e)
    } finally {
      setIsLedgerLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchUserLedger(selectedUser.id)
      setNewCreditBalance(selectedUser.credit_balance)
    }
  }, [selectedUser])

  // Handle balance override
  async function updateBalance(overrideVal?: number) {
    if (!selectedUser) return
    const targetBalance = overrideVal !== undefined ? overrideVal : newCreditBalance
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credit_balance: targetBalance })
        .eq('id', selectedUser.id)
      
      if (!error) {
        const delta = targetBalance - selectedUser.credit_balance
        if (delta !== 0) {
          await supabase.from('credit_ledger').insert({
            user_id: selectedUser.id,
            amount: delta,
            feature_slug: 'admin-adjustment'
          })
          fetchUserLedger(selectedUser.id)
        }
        setSelectedUser({ ...selectedUser, credit_balance: targetBalance })
        setSuccessMessage(`Credits updated to ${targetBalance}`)
        fetchUsers()
      } else {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[User Management] Failed to update balance:', e)
      setErrorMessage('Failed to push balance modification.')
    }
  }

  // Handle account status toggle
  async function updateStatus(status: 'active' | 'suspended' | 'banned') {
    if (!selectedUser) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status })
        .eq('id', selectedUser.id)
      if (!error) {
        setSelectedUser({ ...selectedUser, account_status: status })
        setSuccessMessage(`Status updated to ${status.toUpperCase()}`)
        fetchUsers()
      } else {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[User Management] Failed to update status:', e)
      setErrorMessage('Failed to modify status constraints.')
    }
  }

  // Add locked feature tag
  async function addLockedFeature() {
    if (!selectedUser || !newFeatureSlug.trim()) return
    const updated = [...(selectedUser.locked_features || []), newFeatureSlug.trim()]
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ locked_features: updated })
        .eq('id', selectedUser.id)
      if (!error) {
        setSelectedUser({ ...selectedUser, locked_features: updated })
        const addedSlug = newFeatureSlug.trim()
        setNewFeatureSlug('ai_locked')
        setSuccessMessage(`Feature ${addedSlug} restricted`)
        fetchUsers()
      } else {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[User Management] Failed to lock feature:', e)
      setErrorMessage('Failed to apply feature restriction.')
    }
  }

  // Delete locked feature tag
  async function removeLockedFeature(featureToDelete: string) {
    if (!selectedUser) return
    const updated = (selectedUser.locked_features || []).filter(f => f !== featureToDelete)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ locked_features: updated })
        .eq('id', selectedUser.id)
      if (!error) {
        setSelectedUser({ ...selectedUser, locked_features: updated })
        setSuccessMessage(`Feature restriction ${featureToDelete} removed`)
        fetchUsers()
      } else {
        setErrorMessage(error.message)
      }
    } catch (e: unknown) {
      console.error('[User Management] Failed to remove feature lock:', e)
      setErrorMessage('Failed to lift feature restriction.')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl relative select-none">
      {/* Toast notifications */}
      {(successMessage || errorMessage) && (
        <div className={cn(
          "fixed bottom-6 right-6 px-4 py-3 border border-border/40 rounded-[8px] text-[9px] uppercase tracking-widest z-50 shadow-2xl flex items-center gap-2 bg-bento-card",
          successMessage ? "text-foreground" : "text-destructive border-destructive/20 bg-destructive/5"
        )}>
          {successMessage ? successMessage : errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* User directory bento card */}
        <div className={cn(
          "bg-bento-card border border-border/40 rounded-[12px] overflow-hidden transition-all duration-300",
          selectedUser ? "lg:col-span-7" : "lg:col-span-12"
        )}>
          <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center bg-bento-panel/30">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <User className="size-3.5 text-foreground" />
              Users
            </h3>
            <button 
              onClick={fetchUsers}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer border border-border/40 rounded-[6px] bg-bento-card"
            >
              <RefreshCw className="size-3" />
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-[10px] leading-relaxed">
              <thead>
                <tr className="border-b border-border/40 text-[8px] uppercase tracking-widest text-muted-foreground bg-bento-panel/10">
                  <th className="px-6 py-3 font-black">Email</th>
                  <th className="px-6 py-3 font-black">Status</th>
                  <th className="px-6 py-3 font-black">Credits</th>
                  {!selectedUser && <th className="px-6 py-3 font-black">Restrictions</th>}
                  <th className="px-6 py-3 font-black text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={selectedUser ? 4 : 5} className="text-center py-12 text-muted-foreground uppercase text-[8px] tracking-widest">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={selectedUser ? 4 : 5} className="text-center py-12 text-muted-foreground uppercase text-[8px] tracking-widest">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)}
                      className={cn(
                        "hover:bg-bento-item/20 cursor-pointer transition-colors",
                        selectedUser?.id === u.id ? 'bg-bento-item/40' : ''
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground text-[11px] truncate max-w-[180px]">{u.full_name || 'Anonymous'}</div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[180px]">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 text-[8px] uppercase font-bold border rounded-[4px]",
                          u.account_status === 'active' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : u.account_status === 'suspended'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            : 'bg-destructive/10 border-destructive/20 text-destructive'
                        )}>
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground font-black">
                        {u.credit_balance >= 99999999 ? 'Unlimited' : u.credit_balance}
                      </td>
                      {!selectedUser && (
                        <td className="px-6 py-4 text-muted-foreground uppercase text-[9px] font-bold">
                          {u.locked_features?.length > 0 
                            ? `${u.locked_features.length} restricted` 
                            : 'unrestricted'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button className="border border-border/40 px-3 py-1 bg-bento-card hover:bg-bento-item text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-[6px] transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected user audit bento card (displays side-by-side) */}
        {selectedUser && (
          <div className="lg:col-span-5 bg-bento-card border border-border/40 rounded-[12px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center bg-bento-panel/30 shrink-0">
              <div className="min-w-0">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">
                  User profile
                </h3>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1 truncate">
                  {selectedUser.full_name || 'Anonymous'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer border border-border/40 rounded-[6px] bg-bento-card"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar text-[10px]">
              
              {/* Credit Override section */}
              <div className="space-y-2.5 p-4 border border-border/40 rounded-[8px] bg-bento-panel/20">
                <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="size-3.5 text-foreground" />
                  Credits
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newCreditBalance ?? 0}
                    onChange={e => setNewCreditBalance(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-bento-bg border border-border/40 text-foreground text-[11px] px-3 py-1.5 rounded-[6px] focus:border-border/80 outline-none"
                  />
                  <button 
                    onClick={() => updateBalance()}
                    className="border border-border/40 bg-bento-card hover:bg-bento-item text-[9px] font-black uppercase tracking-widest px-4.5 rounded-[6px] transition-colors cursor-pointer text-foreground"
                  >
                    Save
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setNewCreditBalance(99999999)
                    updateBalance(99999999)
                  }}
                  className="w-full text-center border border-dashed border-border/40 hover:border-foreground/30 bg-bento-panel/30 text-muted-foreground hover:text-foreground text-[8px] font-black uppercase tracking-widest py-2 rounded-[6px] transition-colors cursor-pointer"
                >
                  Set unlimited
                </button>
              </div>

              {/* Account Status Settings */}
              <div className="space-y-2.5 p-4 border border-border/40 rounded-[8px] bg-bento-panel/20">
                <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <ToggleLeft className="size-3.5 text-foreground" />
                  Status
                </div>
                <select
                  value={selectedUser.account_status}
                  onChange={e => updateStatus(e.target.value as 'active' | 'suspended' | 'banned')}
                  className="w-full bg-bento-bg border border-border/40 text-foreground text-[11px] px-3 py-2 rounded-[6px] focus:border-border/80 outline-none uppercase font-bold cursor-pointer"
                >
                  <option value="active" className="bg-bento-card">Active</option>
                  <option value="suspended" className="bg-bento-card">Suspended</option>
                  <option value="banned" className="bg-bento-card">Banned</option>
                </select>
              </div>

              {/* Feature Lock Controls */}
              <div className="space-y-2.5 p-4 border border-border/40 rounded-[8px] bg-bento-panel/20">
                <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="size-3.5 text-foreground" />
                  Restrictions
                </div>
                
                {/* List features currently locked */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.locked_features?.length === 0 ? (
                    <span className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">
                      No restrictions.
                    </span>
                  ) : (
                    selectedUser.locked_features?.map(f => (
                      <span 
                        key={f} 
                        className="px-2.5 py-1 border border-destructive/20 bg-destructive/10 text-destructive text-[8px] uppercase font-black flex items-center gap-1.5 rounded-[4px]"
                      >
                        {f}
                        <button 
                          onClick={() => removeLockedFeature(f)}
                          className="hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Form to lock a feature */}
                <div className="flex gap-2 pt-2">
                  <select
                    value={newFeatureSlug}
                    onChange={e => setNewFeatureSlug(e.target.value)}
                    className="flex-1 bg-bento-bg border border-border/40 text-foreground text-[10px] px-3 py-1.5 focus:border-border/80 outline-none rounded-[6px] uppercase font-bold cursor-pointer"
                  >
                    {availableFeatures.map(f => (
                      <option key={f.slug} value={f.slug} className="bg-bento-card">
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={addLockedFeature}
                    className="border border-border/40 bg-bento-card hover:bg-bento-item text-[9px] font-black uppercase tracking-widest px-4.5 rounded-[6px] transition-colors cursor-pointer text-foreground shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Credit Ledger History */}
              <div className="space-y-2.5 p-4 border border-border/40 rounded-[8px] bg-bento-panel/20 flex-1 flex flex-col min-h-0">
                <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <History className="size-3.5 text-foreground" />
                  History
                </div>

                <div className="overflow-hidden border border-border/40 rounded-[6px] bg-bento-bg/50">
                  <table className="w-full text-left text-[9px] leading-relaxed">
                    <tbody className="divide-y divide-border/20">
                      {isLedgerLoading ? (
                        <tr>
                          <td className="text-center py-6 text-muted-foreground uppercase text-[8px] tracking-widest">
                            Loading...
                          </td>
                        </tr>
                      ) : ledger.length === 0 ? (
                        <tr>
                          <td className="text-center py-6 text-muted-foreground uppercase text-[8px] tracking-widest">
                            No logs.
                          </td>
                        </tr>
                      ) : (
                        ledger.map(l => (
                          <tr key={l.id} className="hover:bg-bento-item/10 transition-colors">
                            <td className="px-3 py-2 select-text">
                              <div className="font-bold text-foreground truncate max-w-[120px]">{l.feature_slug || 'adjustment'}</div>
                              <div className="text-[7.5px] text-muted-foreground mt-0.5">
                                {new Date(l.created_at).toLocaleDateString()} {new Date(l.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </td>
                            <td className={cn(
                              "px-3 py-2 text-right font-black",
                              l.amount > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                            )}>
                              {l.amount > 0 ? `+${l.amount}` : l.amount}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
