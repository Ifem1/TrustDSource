import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from "crypto-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashContent(content: string, url: string, claimSummary: string): string {
  return CryptoJS.SHA256(content + url + claimSummary).toString();
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatScore(score: number): string {
  return score.toFixed(0);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatDate(dateStr: string): string {
  try {
    if (!dateStr || dateStr.startsWith("seq:")) return dateStr;
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    if (!dateStr) return "";
    if (dateStr.startsWith("seq:")) return `On-chain ${dateStr}`;

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr: string): string {
  return formatDateTime(dateStr);
}

export function getScoreGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 55) return "#3b82f6";
  if (score >= 30) return "#f59e0b";
  return "#ef4444";
}

export function getCredibilityLabel(score: number): string {
  if (score >= 80) return "High Credibility";
  if (score >= 55) return "Moderate Credibility";
  if (score >= 30) return "Low Credibility";
  if (score > 0) return "Misleading";
  return "Unverified";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildShareUrl(reportId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/report/${reportId}`;
}
