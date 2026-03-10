"use client";

import React from "react";

export type ModuleId =
  | "research"
  | "branding"
  | "marketing"
  | "landing"
  | "feasibility"
  | "full-launch";

interface ResultCardProps {
  moduleId: ModuleId;
  result: Record<string, any>;
  deploymentUrl?: string; // only set for landing and full-launch
}

const MODULE_ACCENTS: Record<ModuleId, string> = {
  "full-launch": "#C4975A",
  research: "#5A8C6E",
  branding: "#5A6E8C",
  marketing: "#8C5A7A",
  landing: "#8C7A5A",
  feasibility: "#7A5A8C",
};

export function ResultCard({ moduleId, result, deploymentUrl }: ResultCardProps) {
  const accent = MODULE_ACCENTS[moduleId] || "#666";
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "20px",
        borderLeft: `3px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: accent, fontSize: "14px", fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Complete
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)" }}>{now}</div>
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {moduleId === "research" && <ResearchDisplay result={result} />}
        {moduleId === "branding" && <BrandingDisplay result={result} />}
        {moduleId === "marketing" && <MarketingDisplay result={result} />}
        {moduleId === "landing" && <LandingDisplay result={result} externalUrl={deploymentUrl} />}
        {moduleId === "feasibility" && <FeasibilityDisplay result={result} />}
        {moduleId === "full-launch" && <FullLaunchDisplay result={result} externalUrl={deploymentUrl} />}
      </div>

      {/* Action buttons row */}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text-soft)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Export PDF
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Share
        </button>
        {deploymentUrl && (
          <a
            href={deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: "auto",
              padding: "8px 16px",
              background: accent,
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            View Live Site &rarr;
          </a>
        )}
      </div>
    </div>
  );
}

// -- Module Specific Displays

function ResearchDisplay({ result }: { result: Record<string, any> }) {
  const tamVal = result.tam?.value ?? result.tam;
  let swotItems: string[] = [];

  if (Array.isArray(result.swot)) {
    swotItems = result.swot.map(String);
  } else if (result.swot && typeof result.swot === "object") {
    swotItems = Object.values(result.swot).map(String);
  }

  return (
    <>
      <Row label="Market Summary" value={result.marketSummary} />
      <Row label="TAM" value={tamVal} />
      <Row label="Recommended Concept" value={result.recommendedConcept} />
      {swotItems.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "8px", alignSelf: "center" }}>SWOT</span>
          {swotItems.slice(0, 4).map((item, i) => (
            <span
              key={i}
              style={{
                padding: "4px 8px",
                background: "var(--bg)",
                borderRadius: "4px",
                fontSize: "11px",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              {item.length > 30 ? item.slice(0, 30) + "..." : item}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function BrandingDisplay({ result }: { result: Record<string, any> }) {
  const colors = Array.isArray(result.colorPalette) ? result.colorPalette : [];
  return (
    <>
      <Row label="Brand Name" value={result.brandName} />
      <Row label="Tagline" value={result.tagline} />
      <Row label="Brand Archetype" value={result.brandArchetype} />
      {colors.length > 0 && (
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", width: "120px" }}>Color Palette</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {colors.map((c: string, i: number) => (
              <div
                key={i}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: c,
                  border: "1px solid var(--border)",
                }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MarketingDisplay({ result }: { result: Record<string, any> }) {
  return (
    <>
      <Row label="Theme" value={result.week1Theme || result.theme} />
      <Row label="Total Posts" value={result.totalPostsCount || result.postCount} />
      <Row label="First Blog Title" value={result.firstBlogTitle} />
    </>
  );
}

function LandingDisplay({ result, externalUrl }: { result: Record<string, any>; externalUrl?: string }) {
  return (
    <>
      <Row label="Hero Headline" value={result.heroHeadline} />
      <Row label="Live URL" value={externalUrl || result.deploymentUrl} isLink />
      <Row label="Lead Capture" value={result.leadCaptureActive !== undefined ? (result.leadCaptureActive ? "Active" : "Inactive") : undefined} />
    </>
  );
}

function FeasibilityDisplay({ result }: { result: Record<string, any> }) {
  return (
    <>
      <Row label="Verdict" value={result.verdict} isBadge largeBadge />
      <Row label="Timing Score" value={result.marketTimingScore} />
      <Row label="Break Even" value={result.breakEvenMonth} />
    </>
  );
}

function FullLaunchDisplay({ result, externalUrl }: { result: Record<string, any>; externalUrl?: string }) {
  const brandName = result.brandName || result.branding?.brandName;
  const marketSize = result.marketSize || result.research?.tam?.value || result.tam?.value;
  const verdict = result.verdict || result.feasibility?.verdict;
  const url = externalUrl || result.deploymentUrl || result.landing?.deploymentUrl;

  return (
    <>
      <Row label="Brand Name" value={brandName} />
      <Row label="Market Size" value={marketSize} />
      <Row label="Live URL" value={url} isLink />
      <Row label="Verdict" value={verdict} isBadge largeBadge />
    </>
  );
}

// -- Generic Row Helper

function Row({
  label,
  value,
  isLink,
  isBadge,
  largeBadge,
}: {
  label: string;
  value: any;
  isLink?: boolean;
  isBadge?: boolean;
  largeBadge?: boolean;
}) {
  if (value === undefined || value === null) return null;
  const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);

  let badgeProps: React.CSSProperties = {};
  if (isBadge) {
    const isNoGo = stringValue.toLowerCase().includes("no");
    const isConditional = stringValue.toLowerCase().includes("conditional");
    const color = isNoGo ? "#dc2626" : isConditional ? "#d97706" : "#16a34a";
    const bg = isNoGo ? "#dc262618" : isConditional ? "#d9770618" : "#16a34a18";
    badgeProps = {
      display: "inline-block",
      padding: largeBadge ? "8px 16px" : "4px 8px",
      background: bg,
      color: color,
      borderRadius: "6px",
      fontSize: largeBadge ? "14px" : "12px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    };
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px", alignItems: "baseline" }}>
      <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      {isLink ? (
        <a href={stringValue} target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", color: "var(--text)", textDecoration: "underline" }}>
          {stringValue}
        </a>
      ) : isBadge ? (
        <div>
          <span style={badgeProps}>{stringValue}</span>
        </div>
      ) : (
        <span style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.5 }}>{stringValue}</span>
      )}
    </div>
  );
}

