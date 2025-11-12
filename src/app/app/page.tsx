"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import WalletConnectButton from "@/components/WalletConnectButton";
import PortfolioSection from "@/sections/Portfolio";
import StakingSection from "@/components/StakingSection";
import DeFiPage from "@/components/DeFiPage";
import { VAULTS } from "@/config/vaults";
import { 
  Home, 
  PieChart, 
  Gift, 
  Vault, 
  Coins, 
  Zap,
  Menu,
  X
} from "lucide-react";

const menuItems = [
  { id: "portfolio", label: "Portfolio", icon: "/tinified/institutions-logo.svg" },
  { id: "rewards", label: "Rewards", icon: "/tinified/institutions-logo.svg" },
  { id: "vaults", label: "Vaults", icon: "/tinified/institutions-logo.svg" },
  { id: "staking", label: "Staking", icon: "/tinified/institutions-logo.svg" },
  { id: "defi", label: "DeFi", icon: "/tinified/institutions-logo.svg" },
];

export default function AppLaunchPage() {
  const [activeItem, setActiveItem] = useState("portfolio");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    if (sidebarOpen) document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex w-full max-w-full overflow-x-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-shrink-0 bg-[#121212] border-r border-neutral-800">
        <div className="flex flex-col h-screen sticky top-0 w-full">
          <div className="p-6 border-b border-neutral-800">
            <h1 className="text-xl font-semibold text-white">VaultFi</h1>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <li key={item.id} className="relative">
                    <button
                      onClick={() => setActiveItem(item.id)}
                      className={`group relative w-full flex items-center gap-3 pl-5 pr-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? "text-white bg-white/5"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        aria-hidden
                        className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-gradient-to-b from-[#00FFD1] to-[#0074FF] ${
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                        }`}
                      />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div
        id="mobile-drawer"
        className={`lg:hidden fixed top-0 left-0 h-full w-[70%] bg-gradient-to-b from-[#0B0F19] to-[#131A2A] backdrop-blur-md bg-opacity-90 transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h1 className="text-xl font-semibold text-white">VaultFi</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-neutral-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <li key={item.id} className="relative">
                  <button
                    onClick={() => {
                      setActiveItem(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`group relative w-full flex items-center gap-3 pl-5 pr-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? "text-white bg-white/5"
                        : "text-neutral-300 hover:text-white hover:bg-white/5"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      aria-hidden
                      className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-gradient-to-b from-[#00FFD1] to-[#0074FF] ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-[#121212] border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <Menu size={24} />
          </button>

          {/* Connect Wallet Button - Top Right */}
          <div className="flex-1 flex justify-end">
            <WalletConnectButton />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-6xl w-full mx-auto">
            {activeItem === "defi" ? (
              <DeFiPage />
            ) : activeItem === "vaults" ? (
              <div className="space-y-8">
                {/* Vaults Section */}
                <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full">
                    {/* Left Side - Text Content */}
                    <div className="text-left flex-1 z-10">
                      <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Faculty-Glyphic', color: 'rgb(189 196 251)' }}>
                        Vaults
                      </h1>
                      <p className="text-base sm:text-xl mb-8" style={{ color: 'rgb(189 196 251)' }}>
                        Your Capital. Our expertise
                      </p>
                      
                      {/* Metrics Row */}
                      <div className="flex flex-wrap items-center gap-6 sm:gap-12">
                        <div>
                          <p className="text-sm text-neutral-400 mb-1">TVL in Vaults</p>
                          <p className="text-2xl font-bold text-white">6,703.59 BTC</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-400 mb-1">Users</p>
                          <p className="text-2xl font-bold text-white">4,000+</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-400 mb-1">Ecosystem Partners</p>
                          <p className="text-2xl font-bold text-white">50+</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side - Banner Logo (visible from sm and up) */}
                    <div className="vault-banner-right ml-auto hidden sm:flex sm:items-center sm:justify-end sm:pr-6 lg:pr-8" aria-hidden="true">
                      {/* Force native <img> with explicit classes to avoid global img width rules */}
                      <img
                        alt="VaultFi Banner Logo"
                        src="/banner/banner-logo.png"
                        className="vault-banner-logo"
                        width={240}
                        height={160}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>

                {/* Access Multi-chain Vaults Section */}
                <div className="mt-16">
                  <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Faculty-Glyphic', color: 'rgb(189 196 251)' }}>
                    Access Multi-chain Vaults
                  </h2>
                  
                  {/* Vault Container */}
                  <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8">
                    {/* Top Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                      {/* Left Side */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img 
                          src={VAULTS[0].mainLogo} 
                          alt="Ethereum Logo" 
className="w-9 h-9 sm:w-7 sm:h-7 object-contain brightness-0 invert"
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
                        />
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-white">{VAULTS[0].name}</h3>
                          <p className="text-xs sm:text-sm text-neutral-400">{VAULTS[0].provider}</p>
                        </div>
                      </div>
                      
                      {/* Right Side */}
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
                        <div className="text-right">
                          <p className="text-sm text-neutral-400 mb-1">TVL</p>
                          <p className="text-xl font-bold text-white">{VAULTS[0].tvl}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-neutral-400 mb-1">APY</p>
                          <p className="text-xl font-bold text-white">{VAULTS[0].apy}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-neutral-400 mb-1">Guardian</p>
                          <p className="text-xl font-bold text-white">{VAULTS[0].guardian}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-neutral-700 mb-6"></div>
                    
                    {/* Bottom Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Left Side - Deposit Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                        <span className="text-neutral-400">Deposit</span>
                        
                        {/* Dynamic Deposit Logos */}
                        <div className="flex items-center gap-1">
                          {VAULTS[0].depositLogos.map((logo, i) => (
                            <img 
                              key={i} 
                              src={logo} 
                              alt="Asset" 
                              className="w-6 h-6 rounded-full" 
                            />
                          ))}
                        </div>
                        
                        <span className="text-neutral-400">on</span>
                        
                        {/* Dynamic On Logos */}
                        <div className="flex items-center gap-1">
                          {VAULTS[0].onLogos.map((logo, i) => (
                            <img 
                              key={i} 
                              src={logo} 
                              alt="Chain" 
                              className="w-6 h-6 rounded-full" 
                            />
                          ))}
                        </div>
                        
                        <span className="text-neutral-400">Provided by</span>
                        <img 
                          src={VAULTS[0].providedByLogo} 
                          alt={VAULTS[0].provider} 
                          className="w-6 h-6 rounded-full" 
                        />
                      </div>
                      
                      {/* Right Side - Access Vault Button */}
                      <Button 
                        className="bg-[#7C5CFC] hover:bg-[#8E6FFF] text-white font-semibold px-5 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#7C5CFC]/50 w-fit"
                        onClick={() => window.location.href = `/app/vaults/${VAULTS[0].slug}`}
                      >
                        Access Vault
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Additional Vault Sections */}
                {VAULTS.slice(1).map((vault, index) => (
                  <div key={index} className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8">
                    {/* Top Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                      {/* Left Side */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img 
                          src={vault.mainLogo} 
                          alt={`${vault.name.split(' ')[0]} Logo`} 
                          className="w-9 h-9 sm:w-7 sm:h-7 object-contain" 
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
                        />
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-white">{vault.name}</h3>
                          <p className="text-xs sm:text-sm text-neutral-400">{vault.provider}</p>
                        </div>
                      </div>
                      
                      {/* Right Side */}
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
                        <div className="text-right">
                          <p className="text-sm text-neutral-400 mb-1">TVL</p>
                          <p className="text-xl font-bold text-white">{vault.tvl}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-neutral-400 mb-1">APY</p>
                          <p className="text-xl font-bold text-white">{vault.apy}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-neutral-400 mb-1">Guardian</p>
                          <p className="text-xl font-bold text-white">{vault.guardian}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-neutral-700 mb-6"></div>
                    
                    {/* Bottom Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Left Side - Deposit Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                        <span className="text-neutral-400">Deposit</span>
                        
                        {/* Dynamic Deposit Logos */}
                        <div className="flex items-center gap-1">
                          {vault.depositLogos.map((logo, i) => (
                            <img 
                              key={i} 
                              src={logo} 
                              alt="Asset" 
                              className="w-6 h-6 rounded-full" 
                            />
                          ))}
                        </div>
                        
                        <span className="text-neutral-400">on</span>
                        
                        {/* Dynamic On Logos */}
                        <div className="flex items-center gap-1">
                          {vault.onLogos.map((logo, i) => (
                            <img 
                              key={i} 
                              src={logo} 
                              alt="Chain" 
                              className="w-6 h-6 rounded-full" 
                            />
                          ))}
                        </div>
                        
                        <span className="text-neutral-400">Provided by</span>
                        <img 
                          src={vault.providedByLogo} 
                          alt={vault.provider} 
                          className="w-6 h-6 rounded-full" 
                        />
                      </div>
                      
                      {/* Right Side - Access Vault Button */}
                      <Button 
                        className="bg-[#7C5CFC] hover:bg-[#8E6FFF] text-white font-semibold px-5 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#7C5CFC]/50 w-fit"
                        onClick={() => window.location.href = `/app/vaults/${vault.slug}`}
                      >
                        Access Vault
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeItem === "portfolio" ? (
              <div className="py-6">
                <PortfolioSection />
              </div>
            ) : activeItem === "staking" ? (
              <StakingSection />
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-800 rounded-full mb-6">
                  <Vault className="w-8 h-8 text-neutral-600" />
                </div>
                <h2 className="text-2xl font-semibold text-neutral-600 mb-4">
                  {menuItems.find(item => item.id === activeItem)?.label} Coming Soon
                </h2>
                <p className="text-neutral-500 max-w-md mx-auto">
                  This section is under development. Please check back later.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
