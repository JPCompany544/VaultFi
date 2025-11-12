"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, ExternalLink } from "lucide-react";

interface Deposit {
  id: string;
  amount: number;
  txHash: string | null;
  vaultName: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    wallet: string;
  };
}

export default function AdminPage() {
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingTx, setConfirmingTx] = useState<string | null>(null);

  // Fetch pending deposits
  const fetchPendingDeposits = async () => {
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
      setLoading(false);
    }
  };

  // Confirm a transaction
  const confirmTransaction = async (txHash: string) => {
    if (!txHash) return;
    
    setConfirmingTx(txHash);
    
    try {
      const response = await fetch('/api/confirmTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txHash }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Transaction confirmed:', data.deposit);
        // Refresh the list
        await fetchPendingDeposits();
      } else {
        console.error('Failed to confirm transaction:', data.error);
        alert(`Failed to confirm transaction: ${data.error}`);
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      alert('Error confirming transaction');
    } finally {
      setConfirmingTx(null);
    }
  };

  useEffect(() => {
    fetchPendingDeposits();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const shortenTxHash = (txHash: string) => {
    return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
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
            <h1 className="text-2xl font-bold text-white">Admin - Pending Deposits</h1>
          </div>
          <Button
            onClick={fetchPendingDeposits}
            className="bg-[#7C5CFC] hover:bg-[#7C5CFC]/90 text-white"
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center text-white">Loading pending deposits...</div>
        ) : (
          <div className="bg-[#1A1A1A] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Pending Deposits ({pendingDeposits.length})
              </h2>
            </div>

            {pendingDeposits.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                <p className="text-neutral-400 text-lg">No pending deposits</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left text-neutral-400 font-medium py-3">User</th>
                      <th className="text-left text-neutral-400 font-medium py-3">Amount</th>
                      <th className="text-left text-neutral-400 font-medium py-3">Vault</th>
                      <th className="text-left text-neutral-400 font-medium py-3">Transaction</th>
                      <th className="text-left text-neutral-400 font-medium py-3">Date</th>
                      <th className="text-left text-neutral-400 font-medium py-3">Status</th>
                      <th className="text-left text-neutral-400 font-medium py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b border-neutral-800">
                        <td className="py-4">
                          <div className="text-white font-medium">
                            {shortenAddress(deposit.user.wallet)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-white font-medium">
                            {deposit.amount} ETH
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-neutral-300">
                            {deposit.vaultName || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4">
                          {deposit.txHash ? (
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-300 font-mono">
                                {shortenTxHash(deposit.txHash)}
                              </span>
                              <a
                                href={`https://etherscan.io/tx/${deposit.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7C5CFC] hover:text-[#7C5CFC]/80"
                              >
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-neutral-500">No hash</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="text-neutral-300 text-sm">
                            {formatDate(deposit.createdAt)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-yellow-400" />
                            <span className="text-yellow-400 font-medium">Pending</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Button
                            onClick={() => confirmTransaction(deposit.txHash!)}
                            disabled={!deposit.txHash || confirmingTx === deposit.txHash}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          >
                            {confirmingTx === deposit.txHash ? "Confirming..." : "Confirm"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
