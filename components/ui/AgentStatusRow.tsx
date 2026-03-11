"use client";

import React from "react";
import { motion } from "framer-motion";

export type AgentId = "genesis" | "identity" | "marketing" | "pipeline" | "feasibility";
export type AgentStatus = "waiting" | "running" | "complete" | "failed";

export interface AgentStatusRowProps {
  agentId: AgentId;
  status: AgentStatus;
}

const AGENT_CONFIG: Record<AgentId, { name: string; color: string; description: string }> = {
  genesis:     { name: "Genesis Engine",      color: "#5A8C6E", description: "Market Research" },
  identity:    { name: "Identity Architect",   color: "#5A6E8C", description: "Brand Identity" },
  marketing:   { name: "Content Factory",     color: "#8C5A7A", description: "Marketing Strategy" },
  pipeline:    { name: "Production Pipeline",  color: "#8C7A5A", description: "Landing Page" },
  feasibility: { name: "Deep Validation",      color: "#7A5A8C", description: "Feasibility Study" },
};

export function AgentStatusRow({ agentId, status }: AgentStatusRowProps) {
  const config = AGENT_CONFIG[agentId];
  if (!config) return null;
  const accent = config.color;
  const isRunning = status === "running";
  const isComplete = status === "complete";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.25 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: 12,
        background: isRunning ? `${accent}08` : isComplete ? `${accent}05` : "transparent",
        border: isRunning ? `1px solid ${accent}20` : "1px solid transparent",
        width: "100%",
        boxSizing: "border-box",
        transition: "background 300ms, border-color 300ms",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Running progress bar */}
      {isRunning && (
        <motion.div
          style={{
            position: "absolute",
            bottom: 0, left: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            borderRadius: 2,
          }}
          animate={{ width: ["0%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Left: Icon + Agent Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <motion.div
          style={{
            width: 30, height: 30,
            borderRadius: 8,
            background: `${accent}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            border: `1px solid ${accent}20`,
          }}
          animate={isRunning ? { scale: [1, 1.05, 1] } : {}}
          transition={isRunning ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
        >
          <AgentIcon agentId={agentId} color={accent} />
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
            {config.name}
          </span>
          <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.01em" }}>
            {config.description}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <StatusBadge status={status} accent={accent} />
    </motion.div>
  );
}

function StatusBadge({ status, accent }: { status: AgentStatus; accent: string }) {
  if (status === "waiting") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--nav-active)",
        color: "var(--muted)",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11, fontWeight: 500,
        letterSpacing: "0.02em",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted)", opacity: 0.5 }} />
        Queued
      </div>
    );
  }

  if (status === "running") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: `${accent}14`,
        color: accent,
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11, fontWeight: 600,
        letterSpacing: "0.02em",
        boxShadow: `0 0 8px ${accent}20`,
      }}>
        <motion.div
          style={{ width: 6, height: 6, borderRadius: "50%", background: accent }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        Running
      </div>
    );
  }

  if (status === "complete") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(90, 140, 110, 0.10)",
          color: "#5A8C6E",
          padding: "4px 10px",
          borderRadius: 20,
          fontSize: 11, fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
          <path d="M8.33333 2.5L3.75 7.08333L1.66667 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Done
      </motion.div>
    );
  }

  if (status === "failed") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(220, 38, 38, 0.08)",
          color: "#dc2626",
          padding: "4px 10px",
          borderRadius: 20,
          fontSize: 11, fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor">
          <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Failed
      </motion.div>
    );
  }

  return null;
}

function AgentIcon({ agentId, color }: { agentId: AgentId; color: string }) {
  const size = 14;
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (agentId) {
    case "genesis":
      return <svg {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
    case "identity":
      return <svg {...props}><circle cx="13.5" cy="6.5" r=".5" fill={color} /><circle cx="17.5" cy="10.5" r=".5" fill={color} /><circle cx="8.5" cy="7.5" r=".5" fill={color} /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>;
    case "marketing":
      return <svg {...props}><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>;
    case "pipeline":
      return <svg {...props}><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>;
    case "feasibility":
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    default:
      return null;
  }
}

export default AgentStatusRow;
