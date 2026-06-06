"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VerificationHistory } from "@/components/verification/VerificationHistory";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";

export default function HistoryPage() {
  const { address, isConnected } = useWallet();

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primaryText">
            Verification History
          </h1>
          <p className="text-secondaryText mt-2">
            Your personal history of submitted verifications
          </p>
        </div>

        {!isConnected ? (
          <div className="card p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-graphPurple/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-graphPurple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-primaryText mb-3">
              Connect your wallet
            </h2>
            <p className="text-secondaryText text-sm mb-6">
              Connect your wallet to view your personal verification history.
            </p>
            <WalletConnectButton />
          </div>
        ) : (
          <VerificationHistory walletAddress={address ?? undefined} limit={50} />
        )}
      </main>

      <Footer />
    </div>
  );
}
