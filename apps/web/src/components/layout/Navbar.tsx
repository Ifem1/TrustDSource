"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";

const navLinks = [
  { href: "/verify", label: "Verify" },
  { href: "/explore", label: "Explore" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reputation", label: "Reputation" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-graphPurple to-trustLavender flex items-center justify-center shadow-glow-purple">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-primaryText text-lg tracking-tight">
                {APP_NAME}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname === link.href ||
                      pathname.startsWith(link.href + "/")
                      ? "bg-surfaceSoft text-primaryText"
                      : "text-secondaryText hover:text-primaryText hover:bg-surfaceSoft"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={cn(
                "hidden sm:block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === "/dashboard"
                  ? "bg-surfaceSoft text-primaryText"
                  : "text-secondaryText hover:text-primaryText hover:bg-surfaceSoft"
              )}
            >
              Dashboard
            </Link>
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
