"use client";

import { WalletProviders } from "@/context/WalletContext";
import { DepositProviders } from "@/context/DepositContext";
import dynamic from "next/dynamic";
import React from "react";
import { Toaster } from "react-hot-toast";

const WalletModal = dynamic(() => import("@/components/WalletModal"), { ssr: false });

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletProviders>
      <DepositProviders>
        {children}
        <WalletModal />
        <Toaster position="top-right" />
      </DepositProviders>
    </WalletProviders>
  );
}
