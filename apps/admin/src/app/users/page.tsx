"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Search, 
  Shield, 
  UserCircle, 
  MoreVertical,
  Mail,
  Calendar,
  Lock,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  waitlist_status: string;
  created_at: string;
  last_login?: string;
}

export default function UserBase() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA]">
      <header className="bg-white border-b border-black/5 py-10 px-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 bg-black rounded-xl flex items-center justify-center">
                <Shield className="size-4 text-white" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300">Identity Registry</p>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-black leading-[0.8]">User Base</h1>
          </div>
          <div className="text-right pb-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-1">Total Population</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="size-2 rounded-full bg-black" />
              <p className="text-[14px] font-bold tracking-tight">{users.length} Verified Identities</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-6xl mx-auto">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-6 mb-10">
             <div className="p-8 bg-white border border-black/5 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                   <div className="size-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-black/5">
                      <UserCircle className="size-4 text-black" />
                   </div>
                   <ArrowUpRight className="size-3 text-gray-200" />
                </div>
                <p className="text-4xl font-black tracking-tighter text-black">{users.length}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mt-2">Active Profiles</p>
             </div>
             <div className="p-8 bg-black text-white rounded-[2.5rem] shadow-xl">
                <div className="flex items-center justify-between mb-4">
                   <div className="size-10 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Lock className="size-4 text-white" />
                   </div>
                   <ArrowUpRight className="size-3 text-white/20" />
                </div>
                <p className="text-4xl font-black tracking-tighter">100%</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-2">Identity Verification</p>
             </div>
             <div className="p-8 bg-white border border-black/5 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                   <div className="size-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-black/5">
                      <Calendar className="size-4 text-black" />
                   </div>
                   <ArrowUpRight className="size-3 text-gray-200" />
                </div>
                <p className="text-4xl font-black tracking-tighter text-black">
                   {users.filter(u => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mt-2">New Registrations (24h)</p>
             </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-300" />
              <input 
                type="text" 
                placeholder="Search verified identities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-black/5 rounded-2xl focus:border-black/20 focus:outline-none text-[13px] font-bold transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {filteredUsers.map((user) => (
              <div key={user.id} className="group bg-white border border-black/5 p-8 rounded-[2.5rem] hover:border-black/20 transition-all shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="size-14 bg-gray-50 rounded-2xl border border-black/5 flex items-center justify-center text-[18px] font-black group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                      {user.full_name?.substring(0, 2).toUpperCase() || 'AN'}
                    </div>
                    <div>
                      <h3 className="text-[18px] font-black tracking-tight text-black">{user.full_name || 'Anonymous User'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="size-3 text-gray-300" />
                        <span className="text-[12px] font-bold text-gray-400">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-3 hover:bg-gray-50 rounded-xl transition-all">
                    <MoreVertical className="size-4 text-gray-300" />
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                   <div className="p-4 bg-gray-50 border border-black/5 rounded-2xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-1">Status</p>
                      <p className="text-[12px] font-bold text-black uppercase tracking-tighter">{user.waitlist_status}</p>
                   </div>
                   <div className="p-4 bg-gray-50 border border-black/5 rounded-2xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-1">Joined</p>
                      <p className="text-[12px] font-bold text-black uppercase tracking-tighter">{new Date(user.created_at).toLocaleDateString()}</p>
                   </div>
                </div>

                {/* Subtle Background ID */}
                <div className="absolute -bottom-2 -right-4 text-[40px] font-black text-gray-200/10 select-none pointer-events-none group-hover:text-black/5 transition-all">
                   ID:{user.id.substring(0, 6).toUpperCase()}
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center bg-white border border-black/5 rounded-[2.5rem]">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-300">No identities found in registry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
