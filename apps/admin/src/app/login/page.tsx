"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home immediately since login is no longer required
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070708] relative overflow-hidden font-sans p-6">
      <div className="text-center space-y-4">
        <div className="ater-mini-loader mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
          Redirecting to Console...
        </p>
      </div>
    </div>
  );
}
