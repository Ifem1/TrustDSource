"use client";

import { useWallet } from "@/hooks/useWallet";
import { truncateAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WalletConnectButtonProps {
  className?: string;
}

export function WalletConnectButton({ className }: WalletConnectButtonProps) {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } =
    useWallet();

  if (isConnected && address) {
    return (
      <button
        onClick={disconnectWallet}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surfaceSoft",
          "hover:border-riskRed hover:bg-red-50 transition-all duration-200 group",
          className
        )}
      >
        <div className="w-2 h-2 rounded-full bg-credibilityGreen" />
        <span className="font-mono text-sm text-primaryText group-hover:text-riskRed transition-colors">
          {truncateAddress(address)}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm",
        "bg-graphPurple text-white hover:bg-trustLavender",
        "shadow-glow-purple hover:shadow-none",
        "transition-all duration-200 disabled:opacity-50",
        className
      )}
    >
      {isConnecting ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
