import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CredibilityGauge } from "@/components/ui/CredibilityGauge";
import { HeroReportPreview } from "@/components/landing/HeroReportPreview";
import { AnimatedPipeline } from "@/components/landing/AnimatedPipeline";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      {/* HERO */}
      <section className="relative flex-1 flex items-center min-h-[88vh] overflow-hidden px-4 sm:px-6 lg:px-10 xl:px-12 py-12 lg:py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[36rem] h-[36rem] bg-graphPurple/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-trustLavender/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left copy */}
            <div>
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-primaryText tracking-tight leading-[1.05] mb-6">
                Verify. Trace.{" "}
                <span className="text-gradient">Trust.</span>
              </h1>

              <p className="text-xl text-secondaryText max-w-xl mb-10 leading-relaxed">
                Submit content, lock a GenLayer snapshot, and receive an
                evidence-bounded credibility report with source provenance
                and an immutable on-chain record.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
                <Link
                  href="/verify"
                  className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
                >
                  Start Verifying
                </Link>
                <Link
                  href="/explore"
                  className="btn-secondary text-base px-8 py-4 w-full sm:w-auto"
                >
                  Explore Reports
                </Link>
              </div>

              {/* Animated platform stats */}
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-graphPurple">
                    <AnimatedCounter to={5} />+
                  </p>
                  <p className="text-xs text-secondaryText mt-1">
                    Verifications
                  </p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-credibilityGreen">
                    <AnimatedCounter to={100} suffix="%" />
                  </p>
                  <p className="text-xs text-secondaryText mt-1">On-chain</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-moderateBlue">
                    <AnimatedCounter to={7} />
                  </p>
                  <p className="text-xs text-secondaryText mt-1">
                    Pipeline steps
                  </p>
                </div>
              </div>
            </div>

            {/* Right live animated report preview */}
            <div className="flex justify-center lg:justify-end">
              <HeroReportPreview />
            </div>
          </div>

          {/* Sample score gauges row */}
          <div className="mt-16 grid grid-cols-3 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
            {[87, 34, 72, 95, 21].map((score, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-4 flex flex-col items-center gap-2"
                style={{
                  animation: `slideUp 0.6s ease-out ${i * 0.1}s backwards`,
                }}
              >
                <CredibilityGauge score={score} size="sm" showLabel={false} />
                <span className="text-xs text-secondaryText">
                  {score >= 80
                    ? "Verified"
                    : score >= 55
                    ? "Moderate"
                    : score >= 30
                    ? "Low"
                    : "Misleading"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge bg-riskRed/10 text-riskRed border-riskRed/20 mb-4">
              The Problem
            </span>
            <h2 className="section-title">
              Misinformation spreads faster than truth
            </h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              The current fact-checking process is manual, slow, subjective,
              and unverifiable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-riskRed">
                Without Trustdsource
              </h3>
              {[
                "User sees viral content",
                "User searches manually",
                "Conflicting information everywhere",
                "Sources are difficult to compare",
                "Fact checking is slow",
                "Trust is subjective, with no proof",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <span className="w-5 h-5 rounded-full bg-riskRed/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-riskRed" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm text-primaryText">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-credibilityGreen">
                With Trustdsource
              </h3>
              {[
                "User submits content in seconds",
                "GenLayer extracts all factual claims",
                "Sources automatically discovered",
                "Credibility bounded by accepted evidence",
                "Evidence compared across sources",
                "Verification report stored on-chain forever",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100"
                >
                  <span className="w-5 h-5 rounded-full bg-credibilityGreen/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-credibilityGreen" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm text-primaryText">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20 mb-4">
              How It Works
            </span>
            <h2 className="section-title">The Verification Pipeline</h2>
            <p className="section-subtitle">
              A focused pipeline for snapshots, evidence, scoring, and on-chain records
            </p>
          </div>

          <AnimatedPipeline />
        </div>
      </section>

      {/* WHY GENLAYER SECTION */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20 mb-4">
              Why GenLayer
            </span>
            <h2 className="section-title">Evidence + Blockchain Consensus</h2>
            <p className="section-subtitle">
              GenLayer uniquely combines LLM intelligence with blockchain
              immutability
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Evidence-Bounded Analysis",
                desc: "GenLayer fetches source evidence in-contract and scores claims from accepted references instead of trusting format-only output.",
                icon: "EV",
                color: "bg-graphPurple/10 text-graphPurple",
              },
              {
                title: "Decentralized Consensus",
                desc: "Validator consensus records the accepted pipeline outcome while deterministic checks limit unsupported credibility claims.",
                icon: "GL",
                color: "bg-moderateBlue/10 text-moderateBlue",
              },
              {
                title: "Immutable Records",
                desc: "Every verification is permanently recorded. No one can alter or delete a credibility report once it is stored.",
                icon: "ON",
                color: "bg-credibilityGreen/10 text-credibilityGreen",
              },
            ].map((item, i) => (
              <div key={i} className="card p-6 space-y-4">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-2xl`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-primaryText text-lg">{item.title}</h3>
                <p className="text-secondaryText text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST SCORE ENGINE */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge bg-credibilityGreen/10 text-credibilityGreen border-credibilityGreen/20 mb-4">
                Trust Score Engine
              </span>
              <h2 className="section-title mb-6">
                Five-dimensional credibility scoring
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Source Quality", weight: "25%", value: 88 },
                  { label: "Evidence Strength", weight: "20%", value: 72 },
                  { label: "Consistency Score", weight: "15%", value: 91 },
                  { label: "Confidence Level", weight: "40%", value: 87 },
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center gap-4">
                    <div className="w-40 flex-shrink-0">
                      <span className="text-sm text-primaryText font-medium">
                        {metric.label}
                      </span>
                      <span className="text-xs text-secondaryText ml-2">
                        {metric.weight}
                      </span>
                    </div>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-graphPurple to-trustLavender"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-primaryText w-8">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="card p-8">
                <CredibilityGauge score={87} size="lg" />
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondaryText">Verdict</span>
                    <span className="badge bg-green-100 text-green-700 border-green-200 text-xs">
                      HIGH CREDIBILITY
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondaryText">Bias Risk</span>
                    <span className="badge bg-green-50 text-green-700 border-green-200 text-xs">
                      LOW
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondaryText">Misinfo Risk</span>
                    <span className="badge bg-green-50 text-green-700 border-green-200 text-xs">
                      LOW
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REPUTATION SYSTEM */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge bg-trustLavender/20 text-graphPurple border-trustLavender/30 mb-4">
              Researcher Reputation
            </span>
            <h2 className="section-title">Build your verification track record</h2>
            <p className="section-subtitle">
              Earn reputation tiers as you contribute to the truth-verification ecosystem
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { tier: "New", icon: "N", points: "0+", color: "text-secondaryText" },
              { tier: "Analyst", icon: "A", points: "50+", color: "text-moderateBlue" },
              { tier: "Researcher", icon: "R", points: "200+", color: "text-trustLavender" },
              { tier: "Trusted", icon: "T", points: "500+", color: "text-graphPurple" },
              { tier: "Expert", icon: "E", points: "1000+", color: "text-credibilityGreen" },
            ].map((tier, i) => (
              <div key={i} className="card p-4 text-center">
                <div className="text-3xl mb-2">{tier.icon}</div>
                <p className={`font-bold text-sm ${tier.color}`}>{tier.tier}</p>
                <p className="text-xs text-secondaryText mt-1">{tier.points} pts</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title mb-6">
            Start verifying now
          </h2>
          <p className="section-subtitle mb-10">
            Connect your wallet and submit your first content for
            GenLayer-powered credibility verification.
          </p>
          <Link href="/verify" className="btn-primary text-lg px-10 py-4 inline-block">
            Verify Content
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
