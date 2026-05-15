"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Search, RefreshCw } from "lucide-react";

type Entry = {
  id: string;
  email: string;
  full_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  activation_code: string | null;
};

export default function WaitlistManager() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setEntries(data);
    setLoading(false);
  }

  useEffect(() => { fetchEntries(); }, []);

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setUpdatingId(id);
    const activation_code = status === 'approved' ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
    
    const { error } = await supabase
      .from('waiting_list')
      .update({ status, activation_code })
      .eq('id', id);

    if (!error) {
      setEntries(entries.map(e => e.id === id ? { ...e, status, activation_code } : e));
    }
    setUpdatingId(null);
  }

  const filtered = entries.filter(e => 
    e.email.toLowerCase().includes(search.toLowerCase()) || 
    e.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      <header className="bg-background border-b border-border py-10 px-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none uppercase">Waitlist</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="SEARCH" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-card border border-border pl-12 pr-6 py-3 text-[11px] font-black uppercase tracking-widest focus:border-primary outline-none transition-none w-64" 
                />
             </div>
             <button 
               onClick={fetchEntries}
               disabled={loading}
               className="p-3 border border-border bg-card hover:bg-accent disabled:opacity-50 transition-none"
             >
               <RefreshCw className={cn("size-4", loading && "animate-spin")} />
             </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border border-border shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">User</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Code</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-8"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-8 py-8"><Skeleton className="h-6 w-20 mx-auto" /></td>
                      <td className="px-8 py-8"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-8 py-8 text-right"><Skeleton className="h-10 w-32 ml-auto" /></td>
                    </tr>
                  ))
                ) : filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-accent/20 transition-none group">
                    <td className="px-8 py-8">
                      <div className="font-black text-foreground uppercase tracking-tight text-[15px]">{entry.full_name}</div>
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{entry.email}</div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border",
                          entry.status === 'approved' ? "bg-primary/10 border-primary/20 text-primary" : 
                          entry.status === 'rejected' ? "bg-destructive/10 border-destructive/20 text-destructive" : 
                          "bg-muted/30 border-border text-muted-foreground"
                        )}>
                          {entry.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className="font-mono text-xs font-black tracking-widest text-foreground">
                        {entry.activation_code || "---"}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-none">
                        <button 
                          onClick={() => updateStatus(entry.id, 'approved')}
                          disabled={updatingId === entry.id}
                          className="size-10 flex items-center justify-center bg-accent/30 border border-border hover:bg-primary hover:text-primary-foreground transition-none disabled:opacity-50"
                        >
                          <Check className="size-4" />
                        </button>
                        <button 
                          onClick={() => updateStatus(entry.id, 'rejected')}
                          disabled={updatingId === entry.id}
                          className="size-10 flex items-center justify-center bg-accent/30 border border-border hover:bg-destructive hover:text-destructive-foreground transition-none disabled:opacity-50"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">No results found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
