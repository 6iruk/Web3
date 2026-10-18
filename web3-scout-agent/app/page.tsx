"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Copy,
  ExternalLink,
  Fingerprint,
  BriefcaseBusiness,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Step = { tool: string; args: unknown; result: any; error?: boolean };
type Message = { role: "user" | "agent"; text: string; steps?: Step[]; error?: boolean };
type Status = { hasApiKey: boolean; model: string; tools: { name: string; description: string }[] };
type WalletInfo = { address: string | null; balance?: string };

const QUICK_PROMPTS = [
  {
    icon: BriefcaseBusiness,
    title: "Find Web3 opportunities",
    description: "Search remote roles that fit my skills",
    prompt: "Help me find remote Web3 jobs. Ask me for my skills if needed, then search for matching roles.",
  },
  {
    icon: MessageSquareText,
    title: "Write a job brief",
    description: "Create a clear role or bounty description",
    prompt: "Help me write a Web3 job description. Ask me for the role, tech stack, compensation, and requirements.",
  },
  {
    icon: Sparkles,
    title: "Promote my profile",
    description: "Draft a post that gets noticed",
    prompt: "Help me write a social post announcing that I'm available for Web3 work. Ask about my skills and proof of work.",
  },
  {
    icon: Fingerprint,
    title: "Verify a wallet",
    description: "Review an on-chain address",
    prompt: "Help me verify a Web3 candidate or employer wallet. Ask me for the wallet address and network.",
  },
];

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadWallet = () => fetch("/api/wallet").then((r) => r.json()).then(setWallet);

  useEffect(() => {
    fetch("/api/agent").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
    loadWallet().catch(() => setWallet(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function createWallet() {
    setCreating(true);
    try {
      await fetch("/api/wallet", { method: "POST" });
      await loadWallet();
    } finally {
      setCreating(false);
    }
  }

  async function send(text: string) {
    if (!text.trim() || thinking) return;
    const history: Message[] = [...messages, { role: "user", text }];
    setMessages(history);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((m) => !m.error)
            .map(({ role, text }) => ({ role, text })),
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        data.error
          ? { role: "agent", text: data.error, error: true }
          : { role: "agent", text: data.answer, steps: data.steps },
      ]);
      if (data.steps?.some((s: Step) => s.result?.payment)) loadWallet();
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          text: "I couldn't reach the server. Check that the app is running, then try again.",
          error: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  const ready = Boolean(status?.hasApiKey);
  const walletReady = Boolean(wallet?.address);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border/80 bg-white/70 px-5 py-6 lg:flex">
          <a href="#" className="mb-10 flex items-center gap-3 px-2" aria-label="Scout home">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">scout<span className="text-primary">.</span></span>
              <span className="block text-xs text-muted-foreground">Web3 talent copilot</span>
            </span>
          </a>

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
          <div className="flex flex-col gap-1">
            <a href="#assistant" className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary">
              <Bot className="size-[18px]" /> Scout assistant
            </a>
            <a href="#setup" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <ShieldCheck className="size-[18px]" /> Setup & wallet
            </a>
            <a href="#tools" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Wrench className="size-[18px]" /> Agent capabilities
            </a>
          </div>

          <div className="mt-auto rounded-2xl border border-border bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("size-2 rounded-full", ready ? "bg-emerald-500" : "bg-amber-400")} />
              <span className="text-sm font-semibold">{ready ? "Agent is ready" : "Finish setup"}</span>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              {ready
                ? "Your assistant is connected and ready to help with Web3 talent tasks."
                : "Connect your Gemini API key to start using Scout."}
            </p>
            <a href="#setup" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              {ready ? "View configuration" : "Complete setup"} <ArrowUpRight className="size-3.5" />
            </a>
          </div>
          <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-muted-foreground">
            <span>Built for Web3 work</span>
            <span className="rounded-md bg-muted px-2 py-1">BETA</span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/80 bg-background/90 px-5 py-4 backdrop-blur-xl md:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </span>
              <span className="font-bold tracking-tight">scout<span className="text-primary">.</span></span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              <span>Workspace</span><ChevronRight className="size-4" /><span className="font-medium text-foreground">Scout assistant</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                <span className={cn("size-2 rounded-full", ready ? "bg-emerald-500" : "bg-amber-400")} />
                {ready ? "Assistant connected" : "Setup required"}
              </div>
              {status && <Badge variant="outline" className="rounded-full bg-white px-3 py-1 font-medium text-muted-foreground">Model · {status.model}</Badge>}
            </div>
          </header>

          <div className="mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_330px] xl:gap-8 xl:p-8">
            <section className="min-w-0" id="assistant">
              <div className="mb-6">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <span className="relative flex size-2">
                    <span className={cn("absolute inline-flex size-full rounded-full opacity-60", ready ? "animate-ping bg-emerald-400" : "bg-amber-400")} />
                    <span className={cn("relative inline-flex size-2 rounded-full", ready ? "bg-emerald-500" : "bg-amber-500")} />
                  </span>
                  YOUR WEB3 WORK, WITH A LITTLE HELP
                </div>
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl xl:text-[42px] xl:leading-[1.15]">
                  Find your next opportunity.<br className="hidden sm:block" /> Make the right hire.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Scout helps candidates and teams move faster — from finding Web3 roles and writing job briefs to checking on-chain signals.
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {QUICK_PROMPTS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => send(item.prompt)}
                        disabled={!ready}
                        className="group flex min-h-[126px] flex-col items-start rounded-2xl border border-border bg-white p-4 text-left shadow-[0_1px_2px_rgba(20,30,55,0.03)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55 sm:p-5"
                      >
                        <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-5" />
                        </span>
                        <span className="flex w-full items-center justify-between gap-2 font-semibold">
                          {item.title}<ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground">{item.description}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <Card className="min-h-[580px] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_35px_rgba(28,39,64,0.05)] xl:min-h-[calc(100vh-285px)]">
                <CardHeader className="flex-row items-center justify-between border-b border-border/80 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bot className="size-5" /></span>
                    <div>
                      <h2 className="font-semibold">Chat with Scout</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Ask a question or tell Scout what you need</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground" onClick={() => setMessages([])} disabled={messages.length === 0 || thinking}>
                    <RotateCcw className="size-4" /> <span className="hidden sm:inline">New chat</span>
                  </Button>
                </CardHeader>

                <ScrollArea className="h-[420px] min-h-0 flex-1 xl:h-[calc(100vh-430px)] xl:min-h-[390px]">
                  <div className="flex min-h-full flex-col gap-5 p-4 sm:p-6">
                    {messages.length === 0 && (
                      <div className="m-auto flex max-w-md flex-col items-center py-10 text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-7" /></div>
                        <h3 className="text-lg font-semibold">What can I help you with?</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Try one of the shortcuts above, or describe what you're trying to do in your own words.
                        </p>
                        {!ready && (
                          <a href="#setup" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                            Finish setup first <ArrowDownRight className="size-4" />
                          </a>
                        )}
                      </div>
                    )}

                    {messages.map((m, i) =>
                      m.role === "user" ? (
                        <div key={i} className="flex justify-end gap-3">
                          <div className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm sm:max-w-[80%]">{m.text}</div>
                        </div>
                      ) : (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-primary"><Bot className="size-4" /></span>
                          <div className="flex min-w-0 max-w-[90%] flex-1 flex-col gap-2 sm:max-w-[85%]">
                            {m.steps?.map((s, j) => <ToolCall key={j} step={s} />)}
                            <div className={cn("whitespace-pre-wrap rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-6", m.error ? "flex gap-2 border border-destructive/20 bg-destructive/5 text-destructive" : "border border-border/70 bg-muted/60 text-foreground")}>
                              {m.error && <CircleAlert className="mt-1 size-4 shrink-0" />}
                              {m.text}
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {thinking && (
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-primary"><Bot className="size-4" /></span>
                        <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                          <span className="flex gap-1"><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary" /></span>
                          Scout is thinking…
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                <CardFooter className="block border-t border-border bg-white p-4 sm:p-5">
                  <form
                    className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={ready ? "Tell Scout what you need…" : "Add your Gemini API key to start"}
                      disabled={!ready || thinking}
                      className="min-h-10 flex-1 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
                      aria-label="Message Scout"
                    />
                    <Button type="submit" className="size-10 rounded-xl" disabled={!ready || thinking || !input.trim()} aria-label="Send message">
                      <Send className="size-4" />
                    </Button>
                  </form>
                  <p className="mt-2 px-1 text-[11px] text-muted-foreground">Scout can make mistakes. Review important details before acting.</p>
                </CardFooter>
              </Card>
            </section>

            <aside className="flex flex-col gap-5">
              <Card id="setup" className="rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(20,30,55,0.03)]">
                <CardHeader className="flex-row items-start justify-between px-5 pb-3 pt-5">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Your setup</div>
                    <h2 className="text-base font-semibold">Ready when you are</h2>
                  </div>
                  <Badge variant="outline" className={cn("rounded-full", ready && walletReady ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                    {ready && walletReady ? "All set" : "Action needed"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-5 pb-5">
                  <SetupStatus
                    icon={<Check className="size-4" />}
                    title="Gemini API key"
                    detail={ready ? "Connected and ready" : "Needed to power the assistant"}
                    done={ready}
                  />
                  {!ready && (
                    <p className="rounded-xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
                      Add <Code>GEMINI_API_KEY</Code> to your <Code>.env</Code> file, then restart the app.{" "}
                      <a className="font-semibold text-primary hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a free key</a>
                    </p>
                  )}
                  <div className="h-px bg-border/80" />
                  <SetupStatus
                    icon={<Wallet className="size-4" />}
                    title="Agent wallet"
                    detail={walletReady ? "Wallet created" : "Used for agent payment tools"}
                    done={walletReady}
                  />
                  {wallet && !wallet.address && (
                    <Button onClick={createWallet} disabled={creating} className="w-full rounded-xl">
                      <Wallet className="size-4" /> {creating ? "Creating wallet…" : "Create agent wallet"}
                    </Button>
                  )}
                  {wallet?.address && <WalletDetails wallet={wallet} onRefresh={loadWallet} />}
                </CardContent>
              </Card>

              <Card id="tools" className="rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(20,30,55,0.03)]">
                <CardHeader className="px-5 pb-3 pt-5">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Zap className="size-4 text-primary" /> Capabilities</div>
                  <h2 className="text-base font-semibold">What Scout can do</h2>
                  <p className="text-sm leading-5 text-muted-foreground">Tools available to the assistant right now.</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 px-5 pb-5">
                  {status?.tools?.length ? status.tools.map((tool) => (
                    <div key={tool.name} className="flex gap-3 rounded-xl border border-border/70 p-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><Wrench className="size-4" /></span>
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold">{formatToolName(tool.name)}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">Loading available tools…</p>
                  )}
                  <p className="border-t border-border/80 pt-3 text-xs leading-5 text-muted-foreground">
                    Add or update tools in <Code>agent/tools.ts</Code>. New tools appear here automatically.
                  </p>
                </CardContent>
              </Card>

              <div className="rounded-2xl bg-slate-900 p-5 text-white">
                <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-white/10"><ShieldCheck className="size-5 text-emerald-300" /></div>
                <h3 className="font-semibold">Proof over promises</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Scout can inspect on-chain signals to help you make more informed decisions about Web3 talent.</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-300" /> On-chain checks available</div>
              </div>
            </aside>
          </div>

          <footer className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-2 px-4 pb-6 text-xs text-muted-foreground sm:px-6 xl:px-8">
            <span>Scout · Web3 talent copilot</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" /> Your workspace is ready to use</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

function formatToolName(name: string) {
  return name
    .replace(/_/g, " ")
    .replace(/\(simulation\)/i, " · simulation")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SetupStatus({ icon, title, detail, done }: { icon: React.ReactNode; title: string; detail: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", done ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground")}>
        {done ? <Check className="size-4" /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className={cn("size-2 shrink-0 rounded-full", done ? "bg-emerald-500" : "bg-amber-400")} />
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>;
}

function WalletDetails({ wallet, onRefresh }: { wallet: WalletInfo; onRefresh: () => void }) {
  const [copied, setCopied] = useState(false);
  const address = wallet.address!;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Wallet address</p>
          <code className="block truncate text-xs text-primary">{address}</code>
        </div>
        <Button variant="ghost" size="icon" className="rounded-lg" onClick={copy} aria-label="Copy wallet address">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Balance · Base Sepolia</p>
          <p className="mt-1 text-sm font-semibold">{wallet.balance ?? "Not available"}</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg bg-white" onClick={onRefresh}><RefreshCw className="size-3.5" /> Refresh</Button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs font-medium">
        <a className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary" href={`https://sepolia.basescan.org/address/${address}`} target="_blank" rel="noreferrer">
          View explorer <ExternalLink className="size-3.5" />
        </a>
        <a className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary" href="https://docs.base.org/base-chain/tools/network-faucets" target="_blank" rel="noreferrer">
          Get test ETH <ExternalLink className="size-3.5" />
        </a>
      </div>
      <p className="text-[11px] leading-4 text-muted-foreground">Testnet wallet. Stored locally in <Code>.agent-wallet.json</Code>.</p>
    </div>
  );
}

function ToolCall({ step }: { step: Step }) {
  const payment = step.result?.payment;
  return (
    <Collapsible className="overflow-hidden rounded-xl border border-border bg-white text-xs">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-muted/60">
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
        <span className="text-muted-foreground">Used tool</span>
        <span className="min-w-0 truncate font-semibold text-foreground">{formatToolName(step.tool)}</span>
        {payment && <Badge className="ml-auto rounded-full bg-blue-100 text-blue-800">Paid {payment.amount}</Badge>}
        {step.error && <Badge variant="destructive" className="ml-auto rounded-full">Failed</Badge>}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 border-t border-border bg-muted/30 px-3 py-3">
        <Json label="Input" value={step.args} />
        <Json label="Output" value={step.result} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function Json({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <pre className="overflow-x-auto rounded-lg border border-border bg-white p-3 text-[11px] leading-5 text-foreground">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}