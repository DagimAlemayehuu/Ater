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
  status: "pending" | "approved" | "rejected";
  created_at: string;
  activation_code: string | null;
};

/** Cryptographically secure 8-char uppercase alphanumeric token */
function generateActivationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

function codeForApproval(entry: Entry): string {
  return entry.activation_code || generateActivationCode();
}

export default function WaitlistManager() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  async function handleUpdate(id: string, action: "approved" | "rejected") {
    setUpdatingId(id);
    const current = entries.find((entry) => entry.id === id);
    if (!current) {
      setUpdatingId(null);
      return;
    }

    const activation_code = action === "approved" ? codeForApproval(current) : null;
    const { error } = await supabase
      .from("waiting_list")
      .update({ status: action, activation_code })
      .eq("id", id);

    if (!error) {
      await supabase
        .from("profiles")
        .update({
          activation_code,
          is_approved: action === "approved",
          waitlist_status: action,
        })
        .eq("email", current.email);
    }

    if (!error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: action, activation_code } : e))
      );
    }
    setUpdatingId(null);
  }

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("waiting_list")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchEntries();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("admin-waitlist-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waiting_list" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setEntries((prev) => [payload.new as Entry, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setEntries((prev) =>
              prev.map((e) => (e.id === payload.new.id ? { ...e, ...(payload.new as Entry) } : e))
            );
          } else if (payload.eventType === "DELETE") {
            setEntries((prev) => prev.filter((e) => e.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = entries.filter(
    (e) =>
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.full_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground font-sans">

      <header className="bg-background border-b border-border py-6 sm:py-8 px-4 sm:px-10 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground leading-none uppercase">
              Waitlist
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
              {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border border-border pl-10 pr-5 py-2.5 text-[11px] font-bold uppercase tracking-widest focus:border-foreground outline-none w-full lg:w-56 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={fetchEntries}
              disabled={loading}
              className="p-2.5 border border-border bg-card hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                    User
                  </th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                    Applied
                  </th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground text-center">
                    Status
                  </th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                    Code
                  </th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-8 py-6"><Skeleton className="h-4 w-48" /></td>
                        <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-8 py-6"><Skeleton className="h-5 w-20 mx-auto" /></td>
                        <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-8 py-6 text-right"><Skeleton className="h-9 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  : filtered.map((entry) => (
                      <tr key={entry.id} className="hover:bg-accent/20 group">
                        <td className="px-8 py-6">
                          <div className="font-bold text-foreground text-[13px]">
                            {entry.full_name || "—"}
                          </div>
                          <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            {entry.email}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {mounted ? new Date(entry.created_at).toLocaleDateString() : "—"}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-center">
                            <span
                              className={cn(
                                "px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                                entry.status === "approved"
                                  ? "bg-primary/10 border-primary/20 text-primary"
                                  : entry.status === "rejected"
                                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                                  : "bg-muted/30 border-border text-muted-foreground"
                              )}
                            >
                              {entry.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-mono text-[11px] font-bold tracking-widest text-foreground">
                            {entry.activation_code || "—"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(entry.id, "approved")}
                              disabled={updatingId === entry.id || entry.status === "approved"}
                              className="size-9 flex items-center justify-center bg-card border border-border hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Approve"
                            >
                              <Check className="size-4" />
                            </button>
                            <button
                              onClick={() => handleUpdate(entry.id, "rejected")}
                              disabled={updatingId === entry.id || entry.status === "rejected"}
                              className="size-9 flex items-center justify-center bg-card border border-border hover:bg-destructive hover:text-destructive-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Reject"
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
              <div className="py-16 text-center">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  {search ? "No results for your search." : "No applicants yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
