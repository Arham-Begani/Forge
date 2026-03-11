"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReportModal } from "./ReportModal";
import { MoveUpRight, FileText } from "lucide-react";

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
  deploymentUrl?: string;
}

const MODULE_ACCENTS: Record<ModuleId, string> = {
  "full-launch": "#C4975A",
  research: "#5A8C6E",
  branding: "#5A6E8C",
  marketing: "#8C5A7A",
  landing: "#8C7A5A",
  feasibility: "#7A5A8C",
};

const MODULE_LABELS: Record<ModuleId, string> = {
  "full-launch": "Full Launch",
  research: "Market Research",
  branding: "Brand Strategy",
  marketing: "GTM Strategy",
  landing: "Production Pipeline",
  feasibility: "Investment Assessment",
};

export function ResultCard({ moduleId, result, deploymentUrl }: ResultCardProps) {
  const accent = MODULE_ACCENTS[moduleId] || "#666";
  const label = MODULE_LABELS[moduleId] || "Analysis";
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const [expanded, setExpanded] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: "" });

  const openReport = (title: string, content: string) => {
    setModalContent({ title, content });
    setModalOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 220, damping: 22 }}
        style={{
          background: "var(--glass-bg-strong)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Top accent gradient */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accent}, ${accent}80, transparent)`,
        }} />

        {/* Background glow */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 80,
          background: `linear-gradient(to bottom, ${accent}08, transparent)`,
          pointerEvents: "none",
        }} />

        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 26, height: 26,
              borderRadius: "50%",
              background: `${accent}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                {label} Complete
              </span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{now}</span>
            </div>
          </div>
          <motion.svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </button>

        {/* Collapsible content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
                {/* Divider */}
                <div style={{ height: 1, background: "var(--border)", marginBottom: 4 }} />

                {moduleId === "research" && <ResearchDisplay result={result} onOpenReport={(c) => openReport("Market Research Assessment", c)} />}
                {moduleId === "branding" && <BrandingDisplay result={result} onOpenReport={(c) => openReport("Brand Identity Bible", c)} />}
                {moduleId === "marketing" && <MarketingDisplay result={result} onOpenReport={(c) => openReport("Go-To-Market Strategy", c)} />}
                {moduleId === "landing" && <LandingDisplay result={result} externalUrl={deploymentUrl} />}
                {moduleId === "feasibility" && <FeasibilityDisplay result={result} onOpenReport={(c) => openReport("Strategic Feasibility Report", c)} />}
                {moduleId === "full-launch" && (
                  <FullLaunchDisplay
                    result={result}
                    externalUrl={deploymentUrl}
                    onOpenReport={(t, c) => openReport(t, c)}
                  />
                )}
              </div>

              {/* Action buttons */}
              <div style={{
                display: "flex",
                gap: 8,
                padding: "12px 20px 16px",
                borderTop: "1px solid var(--border)",
                position: "relative",
                zIndex: 1,
              }}>
                <ActionButton
                  label="Export PDF"
                  icon={<FileText size={12} />}
                  onClick={() => {
                    const content = JSON.stringify(result, null, 2)
                    const win = window.open('', '_blank')
                    if (!win) return
                    win.document.write(`<html><head><title>${label} Report</title><style>body{font-family:system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{font-size:24px;border-bottom:2px solid #e5e5e5;padding-bottom:8px}pre{white-space:pre-wrap;font-size:13px;line-height:1.6;background:#f5f5f5;padding:20px;border-radius:8px}</style></head><body><h1>${label} Report</h1><pre>${content}</pre></body></html>`)
                    win.document.close()
                    setTimeout(() => { win.print(); win.close() }, 300)
                  }}
                />
                <ActionButton
                  label="Copy"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
                      alert('Copied to clipboard!')
                    } catch {}
                  }}
                />
                <ActionButton
                  label="Share"
                  onClick={async () => {
                    const text = `${label} Report\n\n${JSON.stringify(result, null, 2)}`
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      try { await navigator.share({ title: `${label} Report`, text }) } catch {}
                    } else {
                      try {
                        await navigator.clipboard.writeText(text)
                        alert('Copied to clipboard for sharing!')
                      } catch {}
                    }
                  }}
                />
                {(deploymentUrl || result.landing?.deploymentUrl || result.deploymentUrl) && (
                  <motion.a
                    whileHover={{ scale: 1.04, opacity: 0.9 }}
                    whileTap={{ scale: 0.96 }}
                    href={deploymentUrl || result.landing?.deploymentUrl || result.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: "auto",
                      padding: "7px 16px",
                      background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      letterSpacing: "0.01em",
                      boxShadow: `0 4px 12px ${accent}40`,
                    }}
                  >
                    <MoveUpRight size={14} />
                    View Live Site
                  </motion.a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
        accentColor={accent}
      />
    </>
  );
}

// ─── Action Button ──────────────────────────────────────────────────────────

function ActionButton({ label, icon, onClick }: { label: string; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, backgroundColor: "var(--nav-active)" }}
      whileTap={{ scale: 0.96 }}
      style={{
        padding: "7px 14px",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 8,
        color: "var(--text-soft)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 200ms",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ─── Module Specific Displays ───────────────────────────────────────────────

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

function ResearchDisplay({ result, onOpenReport }: { result: Record<string, any>; onOpenReport: (content: string) => void }) {
  const [showChart, setShowChart] = useState(false);
  const tamVal = result.research?.tam?.value ?? result.tam?.value ?? result.tam;
  const stringTam = typeof tamVal === 'object' ? JSON.stringify(tamVal) : String(tamVal || "");
  
  // Mock data for TAM/SAM/SOM chart based on result
  const marketData = [
    { name: "TAM", value: 100, label: resultsToNumber(tamVal) || 1000 },
    { name: "SAM", value: 60, label: resultsToNumber(result.sam?.value) || 600 },
    { name: "SOM", value: 20, label: resultsToNumber(result.som?.value) || 200 },
  ];

  function resultsToNumber(val: any) {
    if (!val) return null;
    const s = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(s);
  }

  return (
    <>
      <Row label="Market Summary" value={result.marketSummary} />
      <Row label="TAM" value={stringTam} />
      <Row label="Recommended Concept" value={result.recommendedConcept} />
      
      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] border border-[var(--border)] rounded-lg text-xs font-bold text-[var(--text-soft)] hover:bg-[var(--glass-bg-strong)] transition-all"
        >
          {showChart ? "Hide Visualization" : "📊 Visualize Market Growth"}
        </button>

        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 200 }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-[var(--sidebar)] rounded-xl p-4 border border-[var(--border)]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#5A8C6E' }}
                  />
                  <Bar dataKey="label" fill="#5A8C6E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {result.researchPaper && (
        <button
          onClick={() => onOpenReport(result.researchPaper)}
          style={viewReportButtonStyle}
        >
          <FileText size={12} />
          View Comprehensive Research Paper
        </button>
      )}
    </>
  );
}

function BrandingDisplay({ result, onOpenReport }: { result: Record<string, any>; onOpenReport: (content: string) => void }) {
  const colors = Array.isArray(result.colorPalette) ? result.colorPalette : [];
  const brandBible = result.branding?.brandBible || result.brandBible;
  return (
    <>
      <Row label="Brand Name" value={result.brandName} highlight />
      <Row label="Tagline" value={result.tagline} />
      <Row label="Archetype" value={result.brandArchetype} />
      {brandBible && (
        <button
          onClick={() => onOpenReport(brandBible)}
          style={viewReportButtonStyle}
        >
          <FileText size={12} />
          View Complete Brand Strategy Bible
        </button>
      )}
      {colors.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <span style={tagLabelStyle}>Identity Palette</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {colors.map((c: any, i: number) => {
              const hex = typeof c === 'string' ? c : (c.hex || '#666');
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.2, y: -2 }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: String(hex),
                    border: "2px solid var(--glass-border)",
                    boxShadow: `0 2px 8px ${hex}40`,
                    cursor: "pointer",
                  }}
                  title={String(hex)}
                />
              )
            })}
          </div>
        </div>
      )}
    </>
  );
}

function MarketingDisplay({ result, onOpenReport }: { result: Record<string, any>; onOpenReport: (content: string) => void }) {
  const socialCount = result.socialCalendar?.length ?? result.totalPostsCount ?? 0;
  const blogCount = result.seoOutlines?.length ?? 0;
  const marketingPlan = result.marketingPlan || result.gtmStrategy?.marketingPlan;
  return (
    <>
      <Row label="Strategy" value={result.gtmStrategy?.overview ?? result.theme} />
      <Row label="Assets" value={`${socialCount} posts, ${blogCount} SEO articles`} />
      {marketingPlan && (
        <button
          onClick={() => onOpenReport(marketingPlan)}
          style={viewReportButtonStyle}
        >
          <FileText size={12} />
          View Full 30-Day Growth Strategy
        </button>
      )}
    </>
  );
}

function LandingDisplay({ result, externalUrl }: { result: Record<string, any>; externalUrl?: string }) {
  const heroHeadline = result.landingPageCopy?.hero?.headline || result.heroHeadline;
  return (
    <>
      <Row label="Hero Hook" value={typeof heroHeadline === 'string' ? heroHeadline : JSON.stringify(heroHeadline)} highlight />
      <Row label="Production" value={(externalUrl || result.deploymentUrl) ? "Live on Forge Pipeline" : "Generating components..."} />
      <Row label="Conversion" value="Lead capture hooks active" />
    </>
  );
}

function FeasibilityDisplay({ result, onOpenReport }: { result: Record<string, any>; onOpenReport: (content: string) => void }) {
  const [showChart, setShowChart] = useState(false);
  const verdict = result.feasibility?.verdict || result.verdict;
  const financialModel = result.financialModel || result.feasibility?.financialModel;
  const feasibilityReport = result.feasibilityReport || result.feasibility?.feasibilityReport;

  const chartData = [
    { name: "Y1", revenue: resultsToNumber(financialModel?.yearOne?.revenue) || 120 },
    { name: "Y2", revenue: resultsToNumber(financialModel?.yearTwo?.revenue) || 450 },
    { name: "Y3", revenue: resultsToNumber(financialModel?.yearThree?.revenue) || 1200 },
  ];

  function resultsToNumber(val: any) {
    if (!val) return null;
    const s = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(s);
  }

  return (
    <>
      <Row label="Verdict" value={verdict} isBadge />
      <Row label="Financials" value={`CAC: ${financialModel?.cac || 'TBD'} | LTV: ${financialModel?.ltv || 'TBD'}`} />
      
      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] border border-[var(--border)] rounded-lg text-xs font-bold text-[var(--text-soft)] hover:bg-[var(--glass-bg-strong)] transition-all"
        >
          {showChart ? "Hide Visualization" : "📊 Visualize Revenue Growth"}
        </button>

        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 200 }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-[var(--sidebar)] rounded-xl p-4 border border-[var(--border)]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#7A5A8C' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#7A5A8C" strokeWidth={3} dot={{ r: 4, fill: '#7A5A8C' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {feasibilityReport && (
        <button
          onClick={() => onOpenReport(feasibilityReport)}
          style={viewReportButtonStyle}
        >
          <FileText size={12} />
          View Investment Assessment Report
        </button>
      )}
    </>
  );
}

function FullLaunchDisplay({ result, externalUrl, onOpenReport }: {
  result: Record<string, any>;
  externalUrl?: string;
  onOpenReport: (title: string, content: string) => void;
}) {
  const brandName = result.branding?.brandName || result.brandName;
  const marketSize = result.research?.tam?.value || result.research?.tam || result.tam?.value || result.tam || result.marketSize;
  const verdict = result.feasibility?.verdict || result.verdict;
  const url = externalUrl || result.landing?.deploymentUrl || result.deploymentUrl;

  const stringBrand = typeof brandName === 'object' ? JSON.stringify(brandName) : String(brandName || "");
  const stringMarket = typeof marketSize === 'object' ? (marketSize.value || JSON.stringify(marketSize)) : String(marketSize || "");
  const stringVerdict = typeof verdict === 'object' ? (verdict.verdict || JSON.stringify(verdict)) : String(verdict || "");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h4 style={subHeaderStyle}>Core Strategy</h4>
        <Row label="Venture" value={stringBrand} highlight />
        <Row label="TAM" value={stringMarket} />
        <Row label="Verdict" value={stringVerdict} isBadge />

        {result.research?.researchPaper && (
          <button onClick={() => onOpenReport("Research Assessment", result.research.researchPaper)} style={smallLinkStyle}>
            <FileText size={10} /> Research Paper
          </button>
        )}
        {result.branding?.brandBible && (
          <button onClick={() => onOpenReport("Brand Identity Bible", result.branding.brandBible)} style={smallLinkStyle}>
            <FileText size={10} /> Brand Bible
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h4 style={subHeaderStyle}>Execution Details</h4>
        <Row label="Pipeline" value={url ? "Project Live" : "Drafting..."} />
        <Row label="Marketing" value="GTM Strategy Live" />
        <Row label="Next Steps" value="Beta Launch Cycle" />

        {result.marketing?.marketingPlan && (
          <button onClick={() => onOpenReport("Growth Plan", result.marketing.marketingPlan)} style={smallLinkStyle}>
            <FileText size={10} /> Marketing Plan
          </button>
        )}
        {result.feasibility?.feasibilityReport && (
          <button onClick={() => onOpenReport("Investment Report", result.feasibility.feasibilityReport)} style={smallLinkStyle}>
            <FileText size={10} /> Investment Case
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Row Component ──────────────────────────────────────────────────────────

function Row({
  label,
  value,
  isLink,
  isBadge,
  highlight,
}: {
  label: string;
  value: any;
  isLink?: boolean;
  isBadge?: boolean;
  highlight?: boolean;
}) {
  if (value === undefined || value === null) return null;
  const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);

  return (
    <div style={{
      display: "flex",
      alignItems: "baseline",
      gap: 12,
      padding: "6px 0",
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        width: 90,
        flexShrink: 0,
      }}>
        {label}
      </span>
      {isLink ? (
        <a
          href={stringValue}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            color: "var(--accent)",
            textDecoration: "none",
            borderBottom: "1px solid var(--accent-glow)",
            transition: "opacity 150ms",
          }}
        >
          {stringValue}
        </a>
      ) : isBadge ? (
        <VerdictBadge value={stringValue} />
      ) : (
        <span style={{
          fontSize: 13,
          color: highlight ? "var(--text)" : "var(--text-soft)",
          fontWeight: highlight ? 600 : 400,
          lineHeight: 1.5,
        }}>
          {stringValue}
        </span>
      )}
    </div>
  );
}

function VerdictBadge({ value }: { value: string }) {
  const isNoGo = value.toLowerCase().includes("no");
  const isConditional = value.toLowerCase().includes("conditional");
  const color = isNoGo ? "#dc2626" : isConditional ? "#d97706" : "#16a34a";
  const bg = isNoGo ? "#dc262614" : isConditional ? "#d9770614" : "#16a34a14";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 12px",
      background: bg,
      color: color,
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      border: `1px solid ${color}20`,
    }}>
      <div style={{
        width: 6, height: 6,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}60`,
      }} />
      {value}
    </span>
  );
}

// ─── Shared Styles ──────────────────────────────────────────────────────────

const subHeaderStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
  opacity: 0.8,
};

const viewReportButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text-soft)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 8,
  width: "100%",
  transition: "all 0.2s",
};

const smallLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  background: "transparent",
  border: "none",
  color: "var(--muted)",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "underline",
  opacity: 0.8,
};

const tagLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tagStyle: React.CSSProperties = {
  padding: "4px 10px",
  background: "var(--glass-bg)",
  borderRadius: 6,
  fontSize: 11,
  color: "var(--text-soft)",
  border: "1px solid var(--border)",
  lineHeight: 1.4,
};
