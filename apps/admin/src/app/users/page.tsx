"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Activity, MoreHorizontal, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: string;
  is_approved: boolean;
  waitlist_status: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    loadUsers();
  }, []);

  async function handleRevoke(id: string) {
    setUpdatingId(id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: false, waitlist_status: 'revoked' })
      .eq('id', id);
    
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_approved: false, waitlist_status: 'revoked' } : u));
    }
    setUpdatingId(null);
  }

  async function handleRestore(id: string) {
    setUpdatingId(id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true, waitlist_status: 'approved' })
      .eq('id', id);
    
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_approved: true, waitlist_status: 'approved' } : u));
    }
    setUpdatingId(null);
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      <header className="bg-background border-b border-border py-8 px-10 shrink-0">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase">
              Users
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
              {loading ? "Counting..." : `${users.length} authenticated profiles`}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</div>
              <div className="flex items-center gap-2 justify-end">
                <div className="size-1.5 bg-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">Active Base</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-8 bg-card border border-border">
                  <div className="flex items-start justify-between mb-6">
                    <Skeleton className="size-12" />
                    <Skeleton className="size-8" />
                  </div>
                  <Skeleton className="h-7 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-8" />
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))
            : users.map((user) => (
                <div key={user.id} className="p-8 bg-card border border-border group hover:border-primary/40 transition-none relative overflow-hidden">
                  {user.waitlist_status === 'revoked' && (
                    <div className="absolute top-0 right-0 px-4 py-1 bg-destructive text-white text-[8px] font-black uppercase tracking-widest">
                      Revoked
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="size-12 bg-accent/50 border border-border flex items-center justify-center">
                      <User className="size-5 text-foreground" />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.waitlist_status === 'revoked' ? (
                        <button 
                          onClick={() => handleRestore(user.id)}
                          disabled={updatingId === user.id}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest border border-primary hover:opacity-90 disabled:opacity-50 transition-none"
                        >
                          Restore
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRevoke(user.id)}
                          disabled={updatingId === user.id || user.role === 'Admin'}
                          className="px-3 py-1.5 bg-destructive text-white text-[9px] font-black uppercase tracking-widest border border-destructive hover:opacity-90 disabled:opacity-50 transition-none"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-xl font-black tracking-tighter text-foreground uppercase truncate">
                      {user.full_name || "Anonymous User"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Mail className="size-3 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                    <div className="space-y-1">
                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="size-2.5" />
                        Role
                      </div>
                      <div className={cn(
                        "px-2 py-0.5 border text-[10px] font-black uppercase tracking-widest inline-block",
                        user.role === 'Admin' ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted/30 border-border text-muted-foreground"
                      )}>
                        {user.role || "User"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="size-2.5" />
                        Joined
                      </div>
                      <div className="text-[11px] font-mono font-bold text-foreground">
                        {mounted ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {!loading && users.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              No authenticated users found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
