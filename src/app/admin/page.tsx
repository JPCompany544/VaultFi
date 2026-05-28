"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";

interface Deposit {
  id: string;
  amountSol: number | string;
  amountUsd: number;
  txHash: string | null;
  vaultName: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    walletAddress: string;
  };
}

interface Withdrawal {
  id: string;
  amountUsd: number;
  vaultName: string;
  destinationWallet: string;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [confirmingTx, setConfirmingTx] = useState<string | null>(null);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  // Fetch pending deposits
  const fetchPendingDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const response = await fetch('/api/pendingDeposits');
      const data = await response.json();
      
      if (data.success) {
        setPendingDeposits(data.deposits);
      } else {
        console.error('Failed to fetch pending deposits:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pending deposits:', error);
    } finally {
      setLoadingDeposits(false);
    }
  };

  // Fetch pending withdrawals
  const fetchPendingWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const response = await fetch('/api/withdraw?status=pending');
      const data = await response.json();
      
      if (data.success) {
        setPendingWithdrawals(data.withdrawals);
      } else {
        console.error('Failed to fetch pending withdrawals:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pending withdrawals:', error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // Confirm a deposit transaction manually
  const confirmDepositTransaction = async (depositId: string, txHash: string) => {
    if (!depositId) return;
    setConfirmingTx(depositId);
    
    try {
      const response = await fetch('/api/manualConfirmDeposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deposit_id: depositId, tx_hash: txHash }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Deposit confirmed successfully');
        await fetchPendingDeposits();
      } else {
        console.error('Failed to confirm deposit:', data.error);
        alert(`Failed to confirm deposit: ${data.error}`);
      }
    } catch (error) {
      console.error('Error confirming deposit:', error);
      alert('Error confirming deposit');
    } finally {
      setConfirmingTx(null);
    }
  };

  // Process/Settle a withdrawal transaction
  const processWithdrawalTransaction = async (withdrawalId: string) => {
    if (!withdrawalId) return;
    setProcessingWithdrawalId(withdrawalId);
    
    try {
      const response = await fetch('/api/withdraw/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ withdrawal_id: withdrawalId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        await fetchPendingWithdrawals();
      } else {
        console.error('Failed to process withdrawal:', data.error);
        alert(`Failed to process withdrawal: ${data.error}`);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Error processing withdrawal');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  useEffect(() => {
    fetchPendingDeposits();
    fetchPendingWithdrawals();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const shortenTxHash = (txHash: string) => {
    if (!txHash) return "";
    return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="bg-[#121212] border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-neutral-400 hover:text-white"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">Admin Operations Panel</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                void fetchPendingDeposits();
                void fetchPendingWithdrawals();
              }}
              className="bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Refresh All
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* SECTION 1: PENDING DEPOSITS */}
        <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-neutral-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Pending Deposits ({pendingDeposits.length})
            </h2>
          </div>

          {loadingDeposits ? (
            <div className="text-center py-6 text-neutral-400">Loading pending deposits...</div>
          ) : pendingDeposits.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
              <p className="text-neutral-400 text-lg">No pending deposits</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700 text-neutral-400 text-sm">
                    <th className="text-left font-medium py-3">User</th>
                    <th className="text-left font-medium py-3">Amount (SOL)</th>
                    <th className="text-left font-medium py-3">Amount (USD)</th>
                    <th className="text-left font-medium py-3">Vault</th>
                    <th className="text-left font-medium py-3">Transaction</th>
                    <th className="text-left font-medium py-3">Date</th>
                    <th className="text-left font-medium py-3">Status</th>
                    <th className="text-left font-medium py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeposits.map((deposit) => {
                    const solAmt = deposit.amountSol ? Number(deposit.amountSol) / 1e9 : 0;
                    return (
                      <tr key={deposit.id} className="border-b border-neutral-800 text-sm">
                        <td className="py-4">
                          <div className="text-white font-mono font-medium">
                            {shortenAddress(deposit.user.walletAddress)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-white font-medium">
                            {solAmt.toFixed(4)} SOL
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-neutral-300">
                            ${(deposit.amountUsd / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-neutral-300">
                            {deposit.vaultName || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 font-mono">
                          {deposit.txHash ? (
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-300">
                                {shortenTxHash(deposit.txHash)}
                              </span>
                              <a
                                href={`https://explorer.solana.com/tx/${deposit.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7C5CFC] hover:text-[#7C5CFC]/80"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-neutral-500">No hash</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="text-neutral-300">
                            {formatDate(deposit.createdAt)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <Clock size={14} />
                            <span className="font-medium">Pending</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Button
                            onClick={() => confirmDepositTransaction(deposit.id, deposit.txHash!)}
                            disabled={!deposit.txHash || confirmingTx === deposit.id}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 text-xs py-1 h-8"
                          >
                            {confirmingTx === deposit.id ? "Confirming..." : "Confirm"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: PENDING WITHDRAWALS */}
        <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-neutral-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Pending Withdrawals ({pendingWithdrawals.length})
            </h2>
          </div>

          {loadingWithdrawals ? (
            <div className="text-center py-6 text-neutral-400">Loading pending withdrawals...</div>
          ) : pendingWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
              <p className="text-neutral-400 text-lg">No pending withdrawals</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700 text-neutral-400 text-sm">
                    <th className="text-left font-medium py-3">Destination Wallet</th>
                    <th className="text-left font-medium py-3">Vault Name</th>
                    <th className="text-left font-medium py-3">Amount (USD)</th>
                    <th className="text-left font-medium py-3">Created At</th>
                    <th className="text-left font-medium py-3">Status</th>
                    <th className="text-left font-medium py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-neutral-800 text-sm">
                      <td className="py-4">
                        <div className="text-white font-mono font-medium">
                          {shortenAddress(withdrawal.destinationWallet)}
                        </div>
                      </td>
                      <td className="py-4 font-mono text-neutral-300">
                        {withdrawal.vaultName}
                      </td>
                      <td className="py-4">
                        <div className="text-white font-medium">
                          ${withdrawal.amountUsd.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 text-neutral-300">
                        {formatDate(withdrawal.createdAt)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Clock size={14} />
                          <span className="font-medium">Pending Settlement</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Button
                          onClick={() => processWithdrawalTransaction(withdrawal.id)}
                          disabled={processingWithdrawalId === withdrawal.id}
                          className="bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white disabled:opacity-50 text-xs py-1 h-8"
                        >
                          {processingWithdrawalId === withdrawal.id ? "Processing..." : "Process Settlement"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

