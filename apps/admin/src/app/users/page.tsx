"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Activity, Shield, MoreHorizontal } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">
      <header className="bg-background border-b border-border py-10 px-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none uppercase">Users</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Base</div>
              <div className="text-2xl font-black text-foreground tabular-nums">{loading ? "..." : users.length}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-10 bg-card border border-border shadow-sm">
                <Skeleton className="size-12 mb-6" />
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-8" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            ))
          ) : users.map((user) => (
            <div key={user.id} className="p-10 bg-card border border-border rounded-none shadow-sm transition-none group hover:border-primary/30">
              <div className="flex items-start justify-between mb-8">
                <div className="size-14 bg-accent flex items-center justify-center border border-border">
                  <User className="size-6 text-foreground" />
                </div>
                <button className="p-2 opacity-0 group-hover:opacity-100 transition-none">
                  <MoreHorizontal className="size-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="mb-10">
                <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase">{user.full_name}</h3>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-8">
                <div className="flex items-center gap-3">
                  <Activity className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</div>
                    <div className="text-[11px] font-black uppercase tracking-tight text-foreground">Active</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Role</div>
                    <div className="text-[11px] font-black uppercase tracking-tight text-foreground">{user.role || "User"}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
