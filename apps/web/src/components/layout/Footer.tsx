import Link from "next/link";
import { APP_NAME } from "@/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-graphPurple to-trustLavender flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-primaryText text-lg">{APP_NAME}</span>
            </div>
            <p className="text-secondaryText text-sm max-w-xs">
              GenLayer-powered misinformation detection and credibility verification.
              Every verification is immutably stored on-chain.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-primaryText mb-4 text-sm uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/verify", label: "Verify Content" },
                { href: "/explore", label: "Explore Reports" },
                { href: "/analytics", label: "Analytics" },
                { href: "/history", label: "History" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-secondaryText hover:text-primaryText text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primaryText mb-4 text-sm uppercase tracking-wider">
              Ecosystem
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/reputation", label: "Reputation" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-secondaryText hover:text-primaryText text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-secondaryText text-xs">
            © {new Date().getFullYear()} {APP_NAME}. Powered by GenLayer.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-credibilityGreen animate-pulse" />
            <span className="text-xs text-secondaryText">StudioNet Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
