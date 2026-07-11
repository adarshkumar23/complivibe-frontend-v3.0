"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Copy, Check, ExternalLink, Plus, Download, Compass } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/store/ui-store";
import { useCopilot } from "@/lib/hooks/useCopilot";
import { CopilotContextCards } from "@/components/copilot/CopilotContextCards";

const SUGGESTED_PROMPTS = [
  "What needs attention?",
  "Summarize this page",
  "Show missing evidence",
  "Which risks are highest?",
  "What should I review next?"
];

/** Friendly current-module label derived from the route — static formatting only. */
function moduleLabel(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  const parts = pathname.split("/").filter(Boolean).slice(1); // drop "dashboard"
  if (parts.length === 0) return "Command Center";
  return parts
    .map((p) => p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" / ");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          },
          () => undefined
        );
      }}
      className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold text-cv-slate ring-1 ring-white/70 transition hover:text-cv-ink"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CopilotDrawer() {
  const open = useUiStore((s) => s.copilotOpen);
  const setOpen = useUiStore((s) => s.setCopilotOpen);
  const pathname = usePathname();
  const currentModule = useMemo(() => moduleLabel(pathname), [pathname]);

  const copilot = useCopilot({ route: pathname ?? undefined, module: currentModule }, open);
  const [input, setInput] = useState("");

  const connected = copilot.contextCards.filter((c) => c.status === "available").length;
  const unavailable = copilot.contextCards.filter((c) => c.status === "unavailable").length;

  const canChat = !copilot.isUnavailable && !copilot.isCheckingBackend;

  const submit = () => {
    if (!canChat || copilot.isSending) return;
    copilot.send(input);
    setInput("");
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col p-3 sm:p-4"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-shell cv-glass-strong shadow-sidebar">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/60 px-5 py-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cv-brand text-white shadow-tile">
                  <Sparkles size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold leading-tight text-cv-ink">CompliVibe Copilot</p>
                  <p className="truncate text-[11px] text-cv-slate">Page-aware governance assistance</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cv-ring-focus inline-flex h-8 w-8 items-center justify-center rounded-full text-cv-slate hover:bg-white/70"
                  aria-label="Close Copilot"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {/* Current context */}
                <section>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/55 p-3 ring-1 ring-white/70">
                    <Compass size={15} className="text-cv-blue" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-cv-ink">{currentModule}</p>
                      <p className="text-[11px] text-cv-slate">
                        {connected} data source{connected === 1 ? "" : "s"} available
                        {unavailable > 0 ? ` · ${unavailable} unavailable` : ""}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Context cards */}
                <section>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Workspace context</p>
                  <CopilotContextCards cards={copilot.contextCards} />
                </section>

                {/* Suggested prompts */}
                <section>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Suggested prompts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={!canChat}
                        onClick={() => setInput(p)}
                        className={cn(
                          "cv-ring-focus rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-white/70 transition",
                          canChat
                            ? "bg-white/70 text-cv-slate hover:bg-white hover:text-cv-ink"
                            : "cursor-not-allowed bg-white/40 text-cv-mist"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Chat / messages */}
                <section>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cv-mist">Conversation</p>
                  {copilot.isCheckingBackend ? (
                    <p className="rounded-2xl bg-white/55 p-3 text-[12px] text-cv-slate ring-1 ring-white/70">
                      Checking Copilot backend…
                    </p>
                  ) : copilot.isUnavailable ? (
                    <div className="rounded-2xl bg-slate-400/10 p-3 ring-1 ring-slate-400/15">
                      <p className="text-[12px] font-semibold text-cv-ink">Copilot backend unavailable.</p>
                      <p className="mt-1 text-[11px] text-cv-slate">
                        AI responses are disabled until a backend Copilot endpoint is available.
                      </p>
                    </div>
                  ) : copilot.messages.length === 0 ? (
                    <p className="rounded-2xl bg-white/55 p-3 text-[12px] text-cv-slate ring-1 ring-white/70">
                      Ask a question to get governance assistance grounded in this workspace&apos;s real data.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {copilot.messages.map((m) => (
                        <li
                          key={m.id}
                          className={cn(
                            "rounded-2xl p-3 text-[12px] leading-relaxed ring-1",
                            m.role === "user"
                              ? "bg-cv-brand-soft text-cv-ink ring-white/60"
                              : m.note
                                ? "bg-slate-400/10 text-cv-slate ring-slate-400/15"
                                : "bg-white/70 text-cv-ink ring-white/70"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.role === "assistant" && !m.note ? (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <CopyButton text={m.content} />
                              {m.sources?.map((src, i) =>
                                src.href ? (
                                  <Link
                                    key={i}
                                    href={src.href}
                                    className="cv-ring-focus inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold text-cv-blue ring-1 ring-white/70 hover:bg-white"
                                  >
                                    <ExternalLink size={10} />
                                    {src.label}
                                  </Link>
                                ) : (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded-full bg-white/60 px-2 py-1 text-[10px] font-semibold text-cv-slate ring-1 ring-white/70"
                                  >
                                    {src.label}
                                  </span>
                                )
                              )}
                            </div>
                          ) : null}
                        </li>
                      ))}
                      {copilot.isSending ? (
                        <li className="rounded-2xl bg-white/55 p-3 text-[12px] text-cv-slate ring-1 ring-white/70">
                          Thinking…
                        </li>
                      ) : null}
                      {copilot.sendError ? (
                        <li className="rounded-2xl bg-rose-500/10 p-3 text-[12px] text-rose-600 ring-1 ring-rose-500/15">
                          Copilot request failed. Please try again.
                        </li>
                      ) : null}
                    </ul>
                  )}
                </section>
              </div>

              {/* Composer + actions */}
              <div className="border-t border-white/60 px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    disabled={!canChat}
                    rows={1}
                    placeholder={canChat ? "Ask Copilot…" : "Copilot backend unavailable"}
                    className={cn(
                      "max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl bg-white/70 px-3.5 py-2.5 text-[13px] text-cv-ink ring-1 ring-white/70 placeholder:text-cv-mist focus:outline-none focus:ring-cv-blue/40",
                      !canChat && "cursor-not-allowed opacity-60"
                    )}
                  />
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!canChat || copilot.isSending || input.trim().length === 0}
                    className="cv-ring-focus inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-cv-brand text-white shadow-button transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Ask Copilot"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    title="Action endpoint unavailable."
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-full bg-white/50 px-2.5 py-1 text-[10px] font-semibold text-cv-mist ring-1 ring-white/60"
                  >
                    <Plus size={11} />
                    Create task
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Action endpoint unavailable."
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-full bg-white/50 px-2.5 py-1 text-[10px] font-semibold text-cv-mist ring-1 ring-white/60"
                  >
                    <Download size={11} />
                    Export answer
                  </button>
                  <p className="ml-auto text-[10px] text-cv-mist">Copilot can be imprecise — verify decisions.</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
