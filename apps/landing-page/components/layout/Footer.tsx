import Link from "next/link";

export function Footer() {
  return (
    <footer className="sticky top-0 z-[100] h-screen bg-background grid-background flex flex-col items-center justify-center border-t border-outline-variant">
      <div className="industrial-container w-full flex flex-col gap-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-outline-variant pb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-6 bg-primary"></div>
              <span className="text-2xl font-black tracking-tighter">ATER.</span>
            </div>
            <p className="technical-label opacity-40 leading-relaxed max-w-sm uppercase">
              HIGH-PERFORMANCE STUDY ENGINE BUILT FOR THE NEXT GENERATION OF STUDENTS. SECURE. PRIVATE. LOCAL.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="technical-label text-primary font-black">NAVIGATE_SYSTEM</h4>
            <ul className="space-y-2">
              {['PRODUCT', 'PRICING', 'CONTACT', 'WAITLIST'].map(link => (
                <li key={link}>
                  <Link href={link === 'WAITLIST' ? '/waitlist' : `/${link.toLowerCase()}`} className="technical-label opacity-40 hover:opacity-100 transition-opacity">
                    {`// ${link}`}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="technical-label text-primary font-black">CONNECT_NODE</h4>
            <ul className="space-y-2">
              {['TWITTER', 'GITHUB', 'DISCORD', 'DOCUMENTATION'].map(link => (
                <li key={link}>
                  <Link href="#" className="technical-label opacity-40 hover:opacity-100 transition-opacity">
                    {`// ${link}`}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 technical-label opacity-40 text-[10px]">
          <span>© 2026 ATER_ENGINE_V0.0.1</span>
          <div className="flex gap-8">
            <span>PRIVACY_PROTOCOL</span>
            <span>TERMS_OF_SERVICE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
