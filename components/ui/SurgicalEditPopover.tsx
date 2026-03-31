"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, X, Loader2 } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SurgicalEditPopoverProps {
  /** The full text content to display */
  text: string;
  /** Called when a surgical edit is confirmed */
  onEdit: (oldText: string, newText: string) => Promise<void>;
  /** Accent color for the edit UI */
  accent?: string;
  /** Text display style overrides */
  style?: React.CSSProperties;
  /** Render as inline or block */
  display?: "inline" | "block";
  /** Optional className */
  className?: string;
}

type EditState = "idle" | "selecting" | "editing" | "saving";

// ─── Component ──────────────────────────────────────────────────────────────────

export function SurgicalEditPopover({
  text,
  onEdit,
  accent = "var(--accent)",
  style,
  display = "block",
  className,
}: SurgicalEditPopoverProps) {
  const [editState, setEditState] = useState<EditState>("idle");
  const [selectedText, setSelectedText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editedText]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editState === "editing" && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editState]);

  // Close popover on outside click
  useEffect(() => {
    if (editState === "idle") return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        cancelEdit();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") cancelEdit();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [editState]);

  const cancelEdit = useCallback(() => {
    setEditState("idle");
    setSelectedText("");
    setEditedText("");
    setPopoverPos(null);
    setError(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleMouseUp = useCallback(() => {
    if (editState === "editing" || editState === "saving") return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      return;
    }

    const selected = selection.toString().trim();
    if (!selected || selected.length < 2) return;

    // Verify the selection is within our container
    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // Position the popover near the selection
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setSelectedText(selected);
    setEditedText(selected);
    setPopoverPos({
      top: rect.bottom - containerRect.top + 8,
      left: Math.max(0, Math.min(
        rect.left - containerRect.left + rect.width / 2 - 140,
        containerRect.width - 290
      )),
    });
    setEditState("selecting");
    setError(null);
  }, [editState]);

  const startEditing = useCallback(() => {
    setEditState("editing");
    window.getSelection()?.removeAllRanges();
  }, []);

  const confirmEdit = useCallback(async () => {
    if (!selectedText || editedText === selectedText) {
      cancelEdit();
      return;
    }

    setEditState("saving");
    setError(null);

    try {
      await onEdit(selectedText, editedText);
      setEditState("idle");
      setSelectedText("");
      setEditedText("");
      setPopoverPos(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save edit");
      setEditState("editing");
    }
  }, [selectedText, editedText, onEdit, cancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        confirmEdit();
      }
    },
    [confirmEdit]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        display: display === "inline" ? "inline" : "block",
        cursor: "text",
        ...style,
      }}
      onMouseUp={handleMouseUp}
    >
      {/* Text content with subtle edit hint */}
      <span
        style={{
          borderRadius: 4,
          transition: "background 200ms",
        }}
      >
        {text}
      </span>

      {/* Hover hint — tiny pencil icon */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          marginLeft: 6,
          opacity: 0.25,
          transition: "opacity 200ms",
          verticalAlign: "middle",
          cursor: "default",
        }}
        className="surgical-edit-hint"
        title="Select text to edit"
      >
        <Pencil size={10} />
      </span>

      {/* Popover */}
      <AnimatePresence>
        {popoverPos && editState !== "idle" && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: popoverPos.top,
              left: popoverPos.left,
              zIndex: 100,
              width: 290,
              background: "var(--glass-bg-strong)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--glass-border)",
              borderRadius: 14,
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            {/* Accent top bar */}
            <div
              style={{
                height: 2,
                background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)`,
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: "10px 14px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: `${accent}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Pencil size={10} style={{ color: accent }} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {editState === "selecting" ? "Edit Selection" : "Surgical Edit"}
                </span>
              </div>
              <button
                onClick={cancelEdit}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--muted)",
                  transition: "all 150ms",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                <X size={11} />
              </button>
            </div>

            {editState === "selecting" && (
              <div style={{ padding: "0 14px 12px" }}>
                {/* Show selected text preview */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-soft)",
                    lineHeight: 1.5,
                    padding: "8px 10px",
                    background: `${accent}08`,
                    border: `1px solid ${accent}18`,
                    borderRadius: 8,
                    marginBottom: 10,
                    maxHeight: 60,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  &ldquo;{selectedText}&rdquo;
                </div>
                <button
                  onClick={startEditing}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: `0 4px 12px ${accent}30`,
                    fontFamily: "inherit",
                    transition: "transform 100ms",
                  }}
                >
                  <Pencil size={12} />
                  Edit This Text
                </button>
              </div>
            )}

            {(editState === "editing" || editState === "saving") && (
              <div style={{ padding: "0 14px 12px" }}>
                {/* Original text (faded) */}
                <div style={{ marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Original
                  </span>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      lineHeight: 1.5,
                      padding: "6px 8px",
                      background: "var(--nav-active)",
                      borderRadius: 6,
                      marginTop: 3,
                      textDecoration: "line-through",
                      opacity: 0.6,
                      maxHeight: 44,
                      overflow: "hidden",
                    }}
                  >
                    {selectedText}
                  </div>
                </div>

                {/* Editable replacement */}
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Replacement
                  </span>
                  <textarea
                    ref={textareaRef}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={editState === "saving"}
                    style={{
                      width: "100%",
                      minHeight: 40,
                      maxHeight: 120,
                      resize: "none",
                      fontSize: 12,
                      color: "var(--text)",
                      lineHeight: 1.5,
                      padding: "8px 10px",
                      background: "var(--glass-bg)",
                      border: `1px solid ${accent}30`,
                      borderRadius: 8,
                      marginTop: 3,
                      fontFamily: "inherit",
                      outline: "none",
                      transition: "border-color 200ms, box-shadow 200ms",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = accent;
                      e.target.style.boxShadow = `0 0 0 3px ${accent}18`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = `${accent}30`;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#dc2626",
                      padding: "6px 8px",
                      background: "#dc262608",
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={cancelEdit}
                    disabled={editState === "saving"}
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--text-soft)",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      opacity: editState === "saving" ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmEdit}
                    disabled={editState === "saving" || editedText === selectedText}
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      background:
                        editedText === selectedText
                          ? "var(--nav-active)"
                          : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                      border: "none",
                      borderRadius: 8,
                      color: editedText === selectedText ? "var(--muted)" : "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: editedText === selectedText ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      boxShadow:
                        editedText !== selectedText
                          ? `0 3px 10px ${accent}30`
                          : "none",
                    }}
                  >
                    {editState === "saving" ? (
                      <>
                        <Loader2 size={11} className="surgical-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Check size={11} />
                        Apply
                      </>
                    )}
                  </button>
                </div>

                {/* Keyboard hint */}
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    textAlign: "center",
                    marginTop: 6,
                    opacity: 0.6,
                  }}
                >
                  {navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}+Enter to apply
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline styles for hover hint and spinner */}
      <style jsx global>{`
        .surgical-edit-hint { opacity: 0.15; }
        *:hover > .surgical-edit-hint { opacity: 0.45; }
        @keyframes surgical-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .surgical-spin { animation: surgical-spin 800ms linear infinite; }
      `}</style>
    </div>
  );
}
