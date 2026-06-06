"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWallet } from "@/hooks/useWallet";
import { CATEGORY_LABELS } from "@/constants";
import type { ContentCategory, SubmitContentForm } from "@/types";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(500),
  url: z.string().url("Enter a valid URL").or(z.literal("")),
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(10000),
  claim_summary: z.string().max(1000).optional(),
  category: z.enum([
    "news",
    "social",
    "research",
    "public_statement",
    "blog",
    "press_release",
    "breaking_news",
    "other",
  ]),
});

interface VerificationFormProps {
  onSubmit: (data: SubmitContentForm) => void;
  isLoading?: boolean;
}

export function VerificationForm({ onSubmit, isLoading }: VerificationFormProps) {
  const { isConnected } = useWallet();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SubmitContentForm>({
    resolver: zodResolver(schema),
    defaultValues: { category: "news", url: "" },
  });

  const contentLength = watch("content")?.length || 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="label">Title *</label>
        <input
          {...register("title")}
          className="input"
          placeholder="Article headline or content title"
        />
        {errors.title && (
          <p className="text-riskRed text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="label">Source URL</label>
        <input
          {...register("url")}
          className="input"
          placeholder="https://example.com/article"
          type="url"
        />
        {errors.url && (
          <p className="text-riskRed text-xs mt-1">{errors.url.message}</p>
        )}
      </div>

      <div>
        <label className="label">Category *</label>
        <select {...register("category")} className="input">
          {(Object.keys(CATEGORY_LABELS) as ContentCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Content *</label>
        <textarea
          {...register("content")}
          className="input min-h-[180px] resize-y"
          placeholder="Paste the full article text, tweet content, or claim to verify..."
        />
        <div className="flex items-center justify-between mt-1">
          {errors.content ? (
            <p className="text-riskRed text-xs">{errors.content.message}</p>
          ) : (
            <span />
          )}
          <span
            className={`text-xs ${
              contentLength > 9000 ? "text-riskRed" : "text-secondaryText"
            }`}
          >
            {contentLength}/10000
          </span>
        </div>
      </div>

      <div>
        <label className="label">Claim Summary</label>
        <textarea
          {...register("claim_summary")}
          className="input min-h-[80px] resize-y"
          placeholder="Optional: Summarize the core claim in 1-2 sentences to help GenLayer focus the analysis..."
        />
      </div>

      <div className="bg-surfaceSoft rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-trustLavender/20 flex items-center justify-center mt-0.5 flex-shrink-0">
            <svg
              className="w-3 h-3 text-graphPurple"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-primaryText">
              Immutable Snapshot
            </p>
            <p className="text-xs text-secondaryText mt-0.5">
              Once submitted, your content snapshot is locked forever on GenLayer.
              The content, URL, and metadata cannot be modified.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isConnected}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting to GenLayer...
          </span>
        ) : !isConnected ? (
          "Connect Wallet to Verify"
        ) : (
          "Submit for Verification"
        )}
      </button>
    </form>
  );
}
