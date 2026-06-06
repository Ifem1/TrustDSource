"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useCallback, useState, useEffect } from "react";

export function useWallet() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, isConnected, status } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const connectWallet = useCallback(() => {
    connect({ connector: injected() });
  }, [connect]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  if (!mounted) {
    return {
      address: null,
      isConnected: false,
      isConnecting: false,
      status: "disconnected" as const,
      connectWallet: () => {},
      disconnectWallet: () => {},
    };
  }

  return {
    address: address ?? null,
    isConnected,
    isConnecting,
    status,
    connectWallet,
    disconnectWallet,
  };
}
