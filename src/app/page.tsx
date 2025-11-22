"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Banknote, Zap, Bitcoin, ArrowUpRight } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Ecosystem from "@/components/Ecosystem";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (headerRef.current && !headerRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  return (
    <main className="flex flex-col items-center w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-30 bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/70 border-b border-white/10 overflow-x-hidden">
        <div className="relative mx-auto max-w-6xl w-full px-6 h-16 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <span className="sr-only">Toggle menu</span>
              <span className="text-2xl leading-none">☰</span>
            </button>
            <div className="hidden md:flex items-center font-semibold tracking-wide">
              VaultFi
            </div>
          </div>

          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-sm">
            <a href="#" className="transition-all hover:text-[#00FFD1] hover:underline underline-offset-4 decoration-[#00FFD1]/40">Insights</a>
            <span className="text-white/30">|</span>
            <a href="#" className="transition-all hover:text-[#00FFD1] hover:underline underline-offset-4 decoration-[#00FFD1]/40">Ecosystem</a>
            <span className="text-white/30">|</span>
            <a href="#" className="transition-all hover:text-[#00FFD1] hover:underline underline-offset-4 decoration-[#00FFD1]/40">Products</a>
            <span className="text-white/30">|</span>
            <a href="#" className="transition-all hover:text-[#00FFD1] hover:underline underline-offset-4 decoration-[#00FFD1]/40">Transparency</a>
          </nav>

          <Button
            className="shrink-0 inline-flex items-center justify-center h-10 px-5 rounded-xl font-bold text-white bg-[#7C5CFC] hover:bg-[#8E6FFF] hover:opacity-90 transition-all"
            onClick={() => window.open('/app', '_blank')}
          >
            Launch App
          </Button>

          <div
            id="mobile-menu"
            className={`md:hidden absolute top-full left-0 w-full transition-all duration-300 ease-in-out ${menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
            aria-hidden={!menuOpen}
          >
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#131A2A] border-b border-white/10 shadow-lg">
              <ul className="py-2">
                <li>
                  <a href="#" className="block px-6 py-3 text-white/90 hover:text-white hover:bg-gradient-to-r hover:from-[#00FFD1]/10 hover:to-[#0074FF]/10 transition-all">Insights</a>
                </li>
                <li>
                  <a href="#" className="block px-6 py-3 text-white/90 hover:text-white hover:bg-gradient-to-r hover:from-[#00FFD1]/10 hover:to-[#0074FF]/10 transition-all">Ecosystem</a>
                </li>
                <li>
                  <a href="#" className="block px-6 py-3 text-white/90 hover:text-white hover:bg-gradient-to-r hover:from-[#00FFD1]/10 hover:to-[#0074FF]/10 transition-all">Products</a>
                </li>
                <li>
                  <a href="#" className="block px-6 py-3 text-white/90 hover:text-white hover:bg-gradient-to-r hover:from-[#00FFD1]/10 hover:to-[#0074FF]/10 transition-all">Transparency</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <section className="relative h-screen w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          {/* Use exact filename and extension from /public */}
          <source src="/Earth Rotating 1.MP4" type="video/mp4" />
        </video>

        {/* Overlay content */}
        <div className="relative z-10 flex flex-col items-start justify-center h-full bg-black/40 text-white text-left">
          <div className="w-full max-w-6xl px-6 pt-16">
            {/* spacer for fixed header */}
            <h1 className="text-5xl font-bold mb-4">Your value stays yours.
              <br /> The vault simply makes it yield.</h1>
            <p className="text-lg text-gray-300 mb-6">BTC, ETH and SOL remain in your custody - yet earn yield across verified DeFi routes. </p>
            <Button className="bg-black border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10">
              Our Manifesto
            </Button>
          </div>
          <motion.div
            className="w-full max-w-6xl px-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Primary CTA can remain here if desired in future; per request, only header button remains */}
          </motion.div>
        </div>
        {/* bottom logos - infinite marquee */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="w-full overflow-hidden py-6">
            <div className="[--gap:theme(spacing.10)] [--duration:40s] relative">
              <div className="flex items-center gap-10 animate-[marquee_var(--duration)_linear_infinite] will-change-transform">
                {[
                  
                  "/tinified/AaveLogo-light 1.png",
                  "/tinified/Binance-Logo 1.png",
                  
                  "/tinified/Chainlink-Logo.png",
                  "/tinified/Etherfi.png",
                  "/tinified/Franklin-Templeton.png",
                  "/tinified/Layer 2.png",
                  "/tinified/xrp-xrp-logo 1.png",
                ].concat([
                  "/tinified/AaveLogo-light 1.png",
                  "/tinified/Binance-Logo 1.png",
                  
                  "/tinified/Chainlink-Logo.png",
                  "/tinified/Etherfi.png",
                  "/tinified/Franklin-Templeton.png",
                  "/tinified/Layer 2.png",
                  "/tinified/xrp-xrp-logo 1.png",
                ]).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="logo"
                    className="h-8 w-auto max-w-full object-contain opacity-90"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Metrics */}
      <section className="w-full bg-[#0d0d0d] pt-3 pb-3">
        <div className="w-full px-5">
          <div className="bg-black rounded-2xl p-12 md:p-16 lg:p-20">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-16">
              {/* Heading */}
              <div className="lg:w-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2 }}
                >
                  <h2 className="text-[32px] md:text-[48px] lg:text-[40px] font-bold leading-[1.1] tracking-tight text-white uppercase mb-8">
                    You already hold value.<br />
                    Now make it work—sovereignly.
                  </h2>
                  <div className="space-y-4">
                    <p className="text-[18px] md:text-[24px] lg:text-[20px] text-gray-300 leading-[1.4] max-w-2xl">
                      If you hold 5, 10, or 100 BTC, VaultFi mirrors your liquidity into yield without bridges, wrapped assets, or leverage.
                    </p>
                    <p className="text-[18px] md:text-[24px] lg:text-[28px] text-gray-300 leading-[1.4] max-w-2xl">
                      VaultFi bridges regulated on-chain markets with frictionless global capital flows, positioning Bitcoin as the operating layer of a unified, borderless financial system.
                    </p>
                  </div>
                </motion.div>
              </div>
              
              {/* Metrics Grid */}
              <div className="lg:w-1/2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Custom Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 hover:border-[#00FFC6]/40 hover:shadow-[0_0_20px_#00FFC6]/10 transition-all duration-300 text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <img src="/tinified/coins.svg" alt="Vault Icon" className="w-10 h-10" />
                    </div>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-white mb-1">$765,223,430</p>
                      <p className="text-sm text-gray-400">Total Vault TVL</p>
                    </div>
                    <div className="mt-3">
                      <a 
                        href="https://etherscan.io/address/0x2fd56159f4c8664a1de5c75e430338cfa58cd5b9" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-yellow-400 text-sm inline-flex items-center gap-1 hover:underline hover:text-yellow-300"
                      >
                        Vault Contract Link – Etherscan
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                  
                  {/* Second Custom Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.1 }}
                    className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 hover:border-[#00FFC6]/40 hover:shadow-[0_0_20px_#00FFC6]/10 transition-all duration-300 text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <img src="/tinified/vault.svg" alt="Vault Icon" className="w-10 h-10" />
                    </div>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-white mb-1">6</p>
                      <p className="text-sm text-gray-400">Active Vaults</p>
                    </div>
                    <div className="mt-3">
                      <a 
                        href="/vaults" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-yellow-400 text-sm inline-flex items-center gap-1 hover:underline hover:text-yellow-300"
                      >
                        View Vaults
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                  
                  {/* Third Custom Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 hover:border-[#00FFC6]/40 hover:shadow-[0_0_20px_#00FFC6]/10 transition-all duration-300 text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <img src="/tinified/currency-btc.svg" alt="BTC Icon" className="w-10 h-10" />
                    </div>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-white mb-1">4.6%</p>
                      <p className="text-sm text-gray-400">BTC Yield APY</p>
                    </div>
                  </motion.div>
                  
                  {/* Fourth Custom Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 hover:border-[#00FFC6]/40 hover:shadow-[0_0_20px_#00FFC6]/10 transition-all duration-300 text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <img src="/tinified/badge-check.svg" alt="Verified Icon" className="w-10 h-10" />
                    </div>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-white mb-1">12</p>
                      <p className="text-sm text-gray-400">Verified Proofs</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vaults */}
      <section className="w-full bg-[#0d0d0d] py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Card 1 - Lombard Vault (SOLVBTC Deep Purple) */}
            <Card 
              className="border-none shadow-lg rounded-2xl p-8 md:p-12 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ background: 'linear-gradient(to bottom right, #6D28D9, #5B21B6)' }}
            >
              <CardContent className="p-0 text-white">
                <div className="mb-8">
                  <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">
                    LOMBARD VAULT
                  </h3>
                  <h4 className="text-xl font-bold mb-6">The Universal Bitcoin</h4>
                  <p className="text-base leading-relaxed opacity-90 mb-8">
                    Your personal on-chain chamber. BTC, ETH, or SOL can be deposited here and automatically mirrored across liquidity-grade vault pools. The Vault protects principal while quietly compounding through verified yield paths.
                  </p>
                </div>
                <div className="flex justify-start">
                  <Button className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:shadow-lg px-6 py-3 rounded-full transition-all duration-300">
                    Access Vault →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 - Lombard Staking (XSOLVBTC Soft Lavender) */}
            <Card 
              className="border-none shadow-lg rounded-2xl p-8 md:p-12 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ background: 'linear-gradient(to bottom right, #DDD6FE, #C4B5FD)' }}
            >
              <CardContent className="p-0 text-slate-800">
                <div className="mb-8">
                  <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">
                    LOMBARD STAKING
                  </h3>
                  <h4 className="text-xl font-bold mb-6">The Capital Fuel</h4>
                  <p className="text-base leading-relaxed opacity-80 mb-8">
                    Anchors connect your capital to fixed-term yield engines — Solv, Curve, or Lombard-native validators. Yield rates adapt dynamically to total pool weight. The longer the lock, the stronger the gravity.
                  </p>
                </div>
                <div className="flex justify-start">
                  <Button className="bg-transparent border border-slate-700/30 text-slate-800 hover:bg-slate-700/10 hover:shadow-lg px-6 py-3 rounded-full transition-all duration-300">
                    Stake Assets →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 3 - Lombard DeFi (BTC+ Black) */}
            <Card 
              className="border-none shadow-lg rounded-2xl p-8 md:p-12 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ background: '#000000' }}
            >
              <CardContent className="p-0 text-white">
                <div className="mb-8">
                  <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">
                    LOMBARD DEFI
                  </h3>
                  <h4 className="text-xl font-bold mb-6">The Allocation Hub</h4>
                  <p className="text-base leading-relaxed opacity-90 mb-8">
                    A suite of algorithmic yield strategies that scan on-chain markets for optimized vault positions — bridging liquidity between ecosystems (Ethereum ↔ Solana ↔ BTC L2). Risk-weighted and auto-compounded back into your main vault.
                  </p>
                </div>
                <div className="flex justify-start">
                  <Button className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:shadow-lg px-6 py-3 rounded-full transition-all duration-300">
                    Explore Strategies →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <Ecosystem />

      {/* Pre-Proof Premium Card Section */}
      <section className="w-full bg-[#0d0d0d] pt-3 pb-3">
        <div className="w-full px-5">
          <div className="bg-black rounded-2xl p-12 md:p-16 lg:p-20 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-16">
              {/* Left Lottie Animation */}
              <div className="lg:w-1/2 flex items-center justify-center">
                <DotLottieReact
                  src="https://lottie.host/15dd793c-5ec7-4831-95f7-456f69966b49/asEUsfcUwB.lottie"
                  loop
                  autoplay
                  className="w-full h-full max-w-[400px] max-h-[400px]"
                />
              </div>

              {/* Right text content */}
              <div className="lg:w-1/2">
                <div className="text-left lg:text-left">
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#EDEDED] tracking-wide leading-tight mb-6">
                    WHERE BITCOIN MEETS MULTI-TRILLION DOLLAR MARKET THE 360° WAY
                  </h3>
                  <p className="text-lg text-[#EDEDED] leading-relaxed mb-8 opacity-90">
                    Solv unites DeFi, CeFi, and TradFi into a single programmable infrastructure built to move trillions, unlocking tokenized ETFs, real-world assets, and institutional-grade Bitcoin finance in DeFi.
                  </p>
                  <p className="text-lg text-[#EDEDED] leading-relaxed mb-8 opacity-90">
                    Solv bridges regulated on-chain markets with frictionless global capital flows, positions Bitcoin as the operating layer of a unified, borderless financial system.
                  </p>

                  <div className="mb-8">
                    <p className="uppercase text-sm text-gray-400 mb-4 tracking-wide">Trusted by</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/70 max-w-full">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-base sm:text-lg font-medium">YZI</span>
                        <span className="text-xs sm:text-sm">Labs</span>
                      </div>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-base sm:text-lg font-medium">BLOCKCHAIN</span>
                        <span className="text-xs sm:text-sm">CAPITAL</span>
                      </div>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-base sm:text-lg font-medium">OKX</span>
                        <span className="text-xs sm:text-sm">VENTURES</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button className="bg-transparent border border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-lg transition-all duration-300">
                      View Transparency →
                    </Button>
                    <Button className="bg-transparent border border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-lg transition-all duration-300">
                      Institutional Inquiry →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof-of-Reserves */}
      <section className="w-full max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-semibold mb-6">Proof of Reserves</h2>
        <p className="text-gray-400 mb-6">
          100% On-chain verified. View Bitcoin vault addresses and balances.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {([
            { address: "bc1qxy...9a7z", balance: "123 BTC" },
            { address: "bc1qa8...7kx2", balance: "87 BTC" },
            { address: "bc1qv9...2r0m", balance: "45 BTC" },
          ] as { address: string; balance: string }[]).map((proof, i) => (
            <Card key={i} className="bg-[#13171f] border border-[#1b2028] rounded-2xl">
              <CardContent className="p-5">
                <p className="text-sm text-gray-400 mb-1">Vault Address</p>
                <p className="font-mono text-sm mb-2">{proof.address}</p>
                <p className="text-[#00FFD1] font-semibold">{proof.balance}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="border-[#00BFA5] text-[#00FFD1] px-6 py-3 rounded-xl">
            View All Proofs
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full">
        <div className="bg-black rounded-t-2xl p-12 md:p-16 lg:p-20 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-16">
              {/* Left Side - Newsletter Section */}
              <div className="lg:w-1/2">
                <div className="flex items-center mb-8">
                  <span className="text-2xl font-bold">⚡ SOLV</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-semibold mb-8 leading-tight">
                  Subscribe for <span style={{ color: 'rgb(184 191 251)' }}>Vault&apos;s</span><br />Newsletter
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="flex-1 bg-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
                  />
                  <Button className="bg-gray-700 hover:bg-gray-600 hover:shadow-lg text-white px-8 py-4 rounded-full transition-all duration-300">
                    Subscribe
                  </Button>
                </div>
                <div className="text-sm text-gray-400 leading-relaxed space-y-1">
                  <p>Building the Future of the Bitcoin Economy.</p>
                  <p>Delivering institution-grade solutions connecting Bitcoin capital to global finance.</p>
                  <p className="mt-4">© Vault Protocol. All Rights Reserved.</p>
                </div>
              </div>

              {/* Right Side - Navigation Links */}
              <div className="lg:w-1/2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {/* Security */}
                  <div>
                    <h4 className="font-semibold mb-4 text-white">Security</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Audit Reports</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Term Of Use</a></li>
                    </ul>
                  </div>

                  {/* Explore */}
                  <div>
                    <h4 className="font-semibold mb-4 text-white">Explore</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Docs</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Insights</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Github</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Media Kit</a></li>
                    </ul>
                  </div>

                  {/* Community */}
                  <div>
                    <h4 className="font-semibold mb-4 text-white">Community</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Twitter</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Discord</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Telegram</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">LinkedIn</a></li>
                    </ul>
                  </div>

                  {/* Contact */}
                  <div>
                    <h4 className="font-semibold mb-4 text-white">Contact</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Institutional Inquiry</a></li>
                      <li><a href="#" className="hover:text-[rgb(184,191,251)] transition-colors">Career</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );

}
