import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background w-full rounded-none border-t border-outline-variant -mt-20 relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-6 py-12 max-w-(--spacing-container) mx-auto border-b border-outline-variant mb-6">
        <div className="flex flex-col gap-4">
          <h4 className="font-mono text-[12px] font-black text-on-background uppercase tracking-widest border-b border-outline-variant pb-2">LINKS</h4>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="/">HOME</Link>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="/product">PRODUCT</Link>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="/pricing">PRICING</Link>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="/contact">CONTACT</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-mono text-[12px] font-black text-on-background uppercase tracking-widest border-b border-outline-variant pb-2">HELP</h4>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="#">GUIDES</Link>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="#">FAQ</Link>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="#">SUPPORT</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-mono text-[12px] font-black text-on-background uppercase tracking-widest border-b border-outline-variant pb-2">STATUS</h4>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="#">SYSTEM ONLINE</Link>
          <Link className="text-[10px] font-black font-body uppercase tracking-widest text-on-surface-variant hover:text-on-background transition-colors duration-150 opacity-60 hover:opacity-100" href="#">RELEASE NOTES</Link>
        </div>
      </div>
      <div className="flex justify-between items-center px-6 pb-6 max-w-(--spacing-container) mx-auto">
        <div className="font-mono text-[12px] font-black text-on-background uppercase tracking-widest">
          ATER
        </div>
        <div className="text-[8px] font-black font-body uppercase tracking-widest text-on-surface-variant opacity-40">
          © 2024 ATER. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
