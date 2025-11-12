"use client";

import WalletConnectButton from "@/components/WalletConnectButton";
import { useWalletContext } from "@/context/WalletContext";
import { shortenAddress } from "@/utils/wallets";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import PortfolioActivityTable from "@/components/PortfolioActivityTable";
import { usePortfolioActivity } from "@/hooks/usePortfolioActivity";
import { useDepositContext } from "@/context/DepositContext";

export default function PortfolioSection() {
  const { wallet } = useWalletContext();
  const { totals } = useDepositContext();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<"deposits" | "withdrawals">("deposits");
  const [displayBalance, setDisplayBalance] = useState(0);
  const animationRef = useRef<number | null>(null);
  const { activeDeposits: activityDeposits, pendingWithdrawals: activityWithdrawals, loading: activityLoading, error: activityError, refetch: refetchActivity } = usePortfolioActivity(wallet.address);

  const fetchDeposits = async () => {
    if (!wallet.address) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('wallet', wallet.address);
    if (error) {
      setError(error.message || "Failed to fetch deposits");
    } else {
      setDeposits(data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeposits();
  }, [wallet.address]);

  // Realtime updates
  useEffect(() => {
    if (!wallet.address) return;

    const channel = supabase
      .channel('deposits-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'deposits' },
        (payload) => {
          fetchDeposits();
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deposits' },
        (payload) => {
          if (payload.new.status === 'confirmed') {
            fetchDeposits();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallet.address]);

  // Compute totals
  const confirmedDeposits = deposits.filter(d => d.status === 'confirmed');
  const totalDeposits = confirmedDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalClaimableRewards = confirmedDeposits.reduce((sum, d) => sum + (d.claimable_rewards || 0), 0);
  const totalBalance = totals.totalBalance; // Use context totalBalance for instant updates
  const uniqueVaults = [...new Set(confirmedDeposits.map(d => d.vault_name).filter(Boolean))];
  const vaultCount = uniqueVaults.length;

  // Smooth animation for balance changes
  useEffect(() => {
    const start = displayBalance;
    const end = totalBalance;
    const duration = 800; // ms
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeProgress;
      
      setDisplayBalance(current);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalBalance]);

  // Group by vault_name
  const vaultData = uniqueVaults.map(vaultName => {
    const vaultDeposits = confirmedDeposits.filter(d => d.vault_name === vaultName);
    const depositAmount = vaultDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const claimableRewards = vaultDeposits.reduce((sum, d) => sum + (d.claimable_rewards || 0), 0);
    const apy = vaultDeposits[0]?.apy || 'N/A'; // Assume first deposit has apy
    return {
      vaultName,
      apy,
      depositAmount,
      claimableRewards
    };
  });

  if (!wallet.address) {
    return (
      <div className="w-full py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Vault teaser cards */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-6 sm:justify-center">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="w-full sm:flex-[0_0_47%] rounded-2xl bg-[#1A1A1A] border border-neutral-800 shadow-md hover:shadow-xl transition-shadow overflow-hidden sm:h-[18rem] md:h-[18rem] lg:h-[20rem]"
              >
                <div className="flex flex-col h-full">
                  {/* Left: Image */}
                  <div className="w-full h-40 sm:h-auto sm:basis-[20%] sm:shrink-0 sm:grow-0">
                    <img
                      src="/tinified/portfolio2.jpg"
                      alt="Vault preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Right: Content */}
                  <div className="w-full p-6 md:p-8 flex items-center sm:basis-[80%]">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">VaultFi Prime Vault</h3>
                      <p className="text-sm md:text-base text-neutral-400 leading-relaxed mb-4">
                        Deposit LBTC or other assets into the vault that suits your preferences. Access strategies for
                        higher yields with optimized, active rebalancing.
                      </p>
                      <Button
                        className="bg-gradient-to-r from-[#00FFD1] to-[#00BFA5] text-black font-semibold px-5 py-2 rounded-xl hover:from-[#00FFD1]/90 hover:to-[#00BFA5]/90 transition-all duration-200 shadow"
                        onClick={() => window.location.href = '/app/vaults/vaultfi-prime-vault'}
                      >
                        Access Vault
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Connect Wallet section (unchanged behavior) */}
          <div className="w-full flex items-center justify-center mt-16 md:mt-16">
            <div className="w-full max-w-xl bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-10 text-center">
              <p className="text-neutral-300 mb-6">🔒 Connect your wallet to see your total portfolio.</p>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="w-full max-w-7xl px-4 md:px-6">
        {/* Connected Summary */}
        <div className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
          {/* Address moved to top spanning full width */}
          <div className="md:col-span-3">
            <p className="text-sm text-neutral-400 mb-1">Address</p>
            <p className="text-2xl font-bold">{shortenAddress(wallet.address || undefined)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-1">Total Balance</p>
            <p className="text-2xl font-bold transition-all duration-300">{loading ? "—" : `$${displayBalance.toFixed(2)}`}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-1">Number of Vaults</p>
            <p className="text-2xl font-bold">{loading ? "—" : vaultCount}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-1">Total Earnings (24h)</p>
            <p className="text-2xl font-bold">$0</p>
          </div>
        </div>

        {/* Section 2: Vaults Overview */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">Vaults Overview</h2>
          <div className="grid grid-cols-1 gap-6">
            {/* Vaults Table / Cards */}
            <div className="col-span-1 bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 shadow-md">
              {!wallet.address ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-neutral-300">
                    Connect your wallet to access vaults.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-300">
                    <thead className="text-neutral-400">
                      <tr className="border-b border-neutral-800">
                        <th className="py-4 pr-8">Vault Name</th>
                        <th className="py-4 px-8 text-right">Current APY</th>
                        <th className="py-4 px-8 text-right">Deposit Amount</th>
                        <th className="py-4 pl-8 text-right">Claimable Rewards</th>
                        <th className="py-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaultData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-neutral-400">
                            No confirmed deposits yet. Start by funding a vault.
                          </td>
                        </tr>
                      ) : (
                        vaultData.map((vault) => (
                          <tr key={vault.vaultName} className="border-b border-neutral-900/60 hover:bg-white/5 transition ease-out duration-300">
                            <td className="py-4 pr-8 font-medium text-white">{vault.vaultName}</td>
                            <td className="py-4 px-8 text-right tabular-nums">{vault.apy}%</td>
                            <td className="py-4 px-8 text-right tabular-nums">${vault.depositAmount.toFixed(4)}</td>
                            <td className="py-4 pl-8 text-right tabular-nums">${vault.claimableRewards.toFixed(4)}</td>
                            <td className="py-4">
                              <Button className="bg-white/10 border border-white/10 text-white hover:bg-white/20 transition ease-out duration-300 rounded-xl px-3 py-1">Manage</Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Staking Overview */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">Staking Overview</h2>
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 shadow-md">
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-400 text-sm md:text-base text-center">
                You haven’t staked any assets yet. Start staking to view your portfolio details.
              </p>
              <Button className="px-6 py-2 mt-4 font-semibold text-white rounded-xl bg-gradient-to-r from-[#00FFD1] to-[#0074FF] hover:opacity-90 transition-all">
                Stake Now
              </Button>
            </div>
          </div>
        </section>

        {/* Section 4: DeFi Strategies */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">DeFi Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Aave Stable Strategy", protocol: "Aave", roi: "3.2% - 5.4%" },
              { name: "Compound Flex Strategy", protocol: "Compound", roi: "2.8% - 4.1%" },
              { name: "LBTC Liquidity Boost", protocol: "VaultFi", roi: "4.0% - 6.0%" },
            ].map((s, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition ease-out duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">{s.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-md bg-white/10 border border-white/10 text-neutral-200">{s.protocol}</span>
                </div>
                <p className="text-neutral-300 text-sm mb-4">ROI Range: {s.roi}</p>
                <Button className="bg-white/10 border border-white/10 text-white hover:bg-white/20 rounded-xl transition ease-out duration-300">Explore Strategy</Button>
              </div>
            ))}

            {/* Coming Soon */}
            <div className="bg-[#1A1A1A]/60 border border-neutral-800/60 rounded-2xl p-6 shadow-md backdrop-blur hover:shadow-xl transition ease-out duration-300">
              <div className="h-full flex flex-col items-start justify-between gap-4">
                <div>
                  <h3 className="text-white/80 font-semibold">More Strategies</h3>
                  <p className="text-neutral-400 text-sm mt-1">Coming Soon</p>
                </div>
                <Button disabled className="opacity-60 bg-white/10 border border-white/10 text-white rounded-xl">Explore Strategy</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Activity</h2>
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-4 md:p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-neutral-800">
              <div className="flex">
                <button
                  onClick={() => setActivityTab("deposits")}
                  className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium transition-all duration-200 ${activityTab === "deposits" ? "text-white border-b-2 border-[#7C5CFC]" : "text-neutral-400 hover:text-white"}`}
                  aria-selected={activityTab === "deposits"}
                  role="tab"
                >
                  Active Deposits
                </button>
                <button
                  onClick={() => setActivityTab("withdrawals")}
                  className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium transition-all duration-200 ${activityTab === "withdrawals" ? "text-white border-b-2 border-[#7C5CFC]" : "text-neutral-400 hover:text-white"}`}
                  aria-selected={activityTab === "withdrawals"}
                  role="tab"
                >
                  Pending Withdrawals
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={refetchActivity}
                  disabled={activityLoading}
                  className="text-xs md:text-sm rounded-lg border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors"
                >
                  {activityLoading ? "Refreshing…" : "Refresh"}
                </Button>
              </div>
            </div>
            <div className="mt-4 md:mt-6" role="tabpanel" aria-live="polite">
              {activityError && <div className="text-red-400 text-sm mb-3">{activityError}</div>}
              {activityLoading ? (
                <div className="text-neutral-400 text-sm">Loading activity…</div>
              ) : activityTab === "deposits" ? (
                <PortfolioActivityTable records={activityDeposits} variant="deposits" />
              ) : (
                <PortfolioActivityTable records={activityWithdrawals} variant="withdrawals" />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
