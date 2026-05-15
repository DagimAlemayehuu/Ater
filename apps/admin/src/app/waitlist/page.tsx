"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpDown,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WaitlistEntry {
  id: string;
  email: string;
  full_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  activation_code?: string;
}

export default function WaitlistManager() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchWaitlist() {
    setLoading(true);
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setEntries(data);
    setLoading(false);
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const activationCode = status === 'approved' ? Math.random().toString(36).substring(2, 10).toUpperCase() : null;
    
    const { error } = await supabase
      .from('waiting_list')
      .update({ 
        status, 
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        activation_code: activationCode
      })
      .eq('id', id);

    if (!error) {
      setEntries(entries.map(e => e.id === id ? { ...e, status, activation_code: activationCode || undefined } : e));
    }
  }

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const filteredEntries = entries.filter(e => 
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA]">
      <header className="bg-white border-b border-black/5 py-10 px-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 bg-black rounded-xl flex items-center justify-center">
                <UserPlus className="size-4 text-white" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300">Waitlist Engine</p>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-black leading-[0.8]">Candidates</h1>
          </div>
          <div className="text-right pb-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-1">Managing</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="size-2 rounded-full bg-black" />
              <p className="text-[14px] font-bold tracking-tight">{entries.filter(e => e.status === 'pending').length} Active Candidates</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-6xl mx-auto">
          {/* Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="relative w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-300 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search candidates by identity or node..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-black/5 rounded-2xl focus:border-black/20 focus:outline-none text-[13px] font-bold transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-4 bg-white border border-black/5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                <Filter className="size-3.5" />
                Filter
              </button>
              <button className="flex items-center gap-2 px-5 py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg shadow-black/10">
                Export Data
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.01)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Identity</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Registry Date</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Status</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Code</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-[14px] font-bold text-black tracking-tight">{entry.full_name || 'Anonymous candidate'}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{entry.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[12px] font-bold text-black">{new Date(entry.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">{new Date(entry.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        entry.status === 'approved' && "bg-black border-black text-white shadow-md",
                        entry.status === 'pending' && "bg-gray-100 border-black/5 text-black",
                        entry.status === 'rejected' && "bg-gray-50 border-black/5 text-gray-200"
                      )}>
                        {entry.status === 'approved' ? <CheckCircle2 className="size-3" /> : 
                         entry.status === 'rejected' ? <XCircle className="size-3" /> : 
                         <Clock className="size-3" />}
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                       {entry.activation_code ? (
                         <code className="text-[11px] font-black bg-gray-50 px-3 py-1 rounded-lg border border-black/5 tracking-widest">{entry.activation_code}</code>
                       ) : (
                         <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">---</span>
                       )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.status !== 'approved' && (
                          <button 
                            onClick={() => updateStatus(entry.id, 'approved')}
                            className="p-2.5 bg-black text-white rounded-xl hover:scale-105 transition-all shadow-lg"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                        )}
                        {entry.status !== 'rejected' && (
                          <button 
                            onClick={() => updateStatus(entry.id, 'rejected')}
                            className="p-2.5 bg-white border border-black/5 text-black rounded-xl hover:bg-gray-50 transition-all"
                          >
                            <XCircle className="size-4" />
                          </button>
                        )}
                        <button className="p-2.5 bg-white border border-black/5 text-black rounded-xl hover:bg-gray-50 transition-all">
                          <MoreVertical className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEntries.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300">No matching candidates found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
