import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api/client";

type Mode = "login" | "register";

const emailIsValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Validation ---
  const emailValid = emailIsValid(email);
  const pwRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const pwComposeValid = pwRules.length && pwRules.upper && pwRules.special;

  const nameError =
    mode === "register" && touched.name && name.trim().length === 0 ? "Name is required" : "";
  const emailError = touched.email
    ? email.trim().length === 0
      ? "Email is required"
      : !emailValid
        ? "Enter a valid email address (must include @)"
        : ""
    : "";
  const passwordError =
    touched.password && password.length === 0 ? "Password is required" : "";

  const formValid =
    mode === "login"
      ? emailValid && password.length > 0
      : name.trim().length > 0 && emailValid && pwComposeValid;

  function markAllTouched() {
    setTouched({ name: true, email: true, password: true });
  }

  async function handleSubmit() {
    setServerError(null);
    setNotice(null);
    markAllTouched();
    if (!formValid) return;

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        navigate("/home", { replace: true });
      } else {
        // Register only — then send them to sign in with their new credentials.
        await register({ name: name.trim(), email: email.trim(), password });
        setMode("login");
        setName("");
        setEmail("");
        setPassword("");
        setTouched({ name: false, email: false, password: false });
        setNotice("Account created — please sign in with your credentials.");
      }
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setServerError(null);
    setNotice(null);
    setTouched({ name: false, email: false, password: false });
  }

  function useDemo() {
    switchMode("login");
    setEmail("demo@deskflex.app");
    setPassword("password123");
  }

  function onPwKey(e: KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Left: living blueprint */}
      <div className="relative hidden overflow-hidden bg-[#0C1A2E] lg:block">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(110% 80% at 30% 0%, rgba(74,120,200,0.25), transparent 55%)" }}
        />
        <BlueprintHero />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 backdrop-blur">
              <span className="h-3.5 w-3.5 rounded-[3px] bg-mint-node shadow-[0_0_10px_#34E0A1]" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">DeskFlex</span>
          </div>
          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mint-node">
              The office, mapped
            </p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
              See every open desk at a glance.
            </h1>
            <p className="mt-4 max-w-sm text-white/60">
              A live floor plan of your workspace. Glowing seats are free — tap one to claim your
              day. No clashes, no spreadsheets.
            </p>
          </div>
          <p className="font-mono text-xs text-white/30">Hot-desking for hybrid teams</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-paper px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            {mode === "login" ? "Welcome back" : "Get started"}
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>

          <div className="mt-7 space-y-4">
            {mode === "register" && (
              <Field label="Full name" error={nameError}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  autoComplete="name"
                  className={inputClass(!!nameError)}
                  placeholder="Jordan Rivera"
                />
              </Field>
            )}

            <Field label="Email" error={emailError}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                className={inputClass(!!emailError)}
                placeholder="you@company.com"
              />
            </Field>

            <Field label="Password" error={passwordError}>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  onKeyUp={onPwKey}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className={inputClass(!!passwordError) + " pr-16"}
                  placeholder={mode === "login" ? "Your password" : "Create a strong password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto h-7 rounded-md px-2 font-mono text-[10px] uppercase text-ink-soft hover:text-ink focus:outline-none"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {capsOn && (
                <p className="mt-1.5 font-mono text-[11px] text-amber-600">⚠ Caps Lock is on</p>
              )}
            </Field>

            {/* Live password requirements (sign-up only) */}
            {mode === "register" && (password.length > 0 || touched.password) && (
              <ul className="space-y-1.5 rounded-xl border border-line bg-surface p-3 text-xs">
                <Req ok={pwRules.length}>At least 8 characters</Req>
                <Req ok={pwRules.upper}>One uppercase letter (A–Z)</Req>
                <Req ok={pwRules.special}>One special character (!@#$…)</Req>
              </ul>
            )}

            {notice && (
              <p className="rounded-lg border border-mint/30 bg-mint-tint px-3 py-2 text-sm text-mint">
                {notice}
              </p>
            )}

            {serverError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
            </button>
            <button
              onClick={useDemo}
              className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-ink"
            >
              Use demo
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BlueprintHero() {
  const cells = Array.from({ length: 48 }, (_, i) => i);
  const open = new Set([3, 7, 12, 18, 19, 25, 31, 33, 40, 44]);
  const mine = new Set([21]);
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-90">
      <div
        className="grid origin-center -rotate-[8deg] scale-110 grid-cols-8 gap-2"
        style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.4))" }}
      >
        {cells.map((i) => {
          const isOpen = open.has(i);
          const isMine = mine.has(i);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2 + (i % 8) * 0.03 + Math.floor(i / 8) * 0.04,
                type: "spring",
                stiffness: 300,
                damping: 22,
              }}
              className="h-9 w-9 rounded-lg border"
              style={{
                background: isOpen ? "rgba(52,224,161,0.16)" : isMine ? "rgba(142,132,255,0.22)" : "#15263C",
                borderColor: isOpen ? "#34E0A1" : isMine ? "#8E84FF" : "#28405F",
                boxShadow: isOpen
                  ? "0 0 14px rgba(52,224,161,0.5)"
                  : isMine
                    ? "0 0 14px rgba(142,132,255,0.5)"
                    : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  [
    "w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-soft/50 focus:outline-none focus:ring-2",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
      : "border-line focus:border-primary focus:ring-primary/25",
  ].join(" ");

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}

function Req({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={`flex items-center gap-2 transition-colors ${ok ? "text-mint" : "text-ink-soft"}`}>
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] ${
          ok ? "bg-mint-tint text-mint" : "bg-paper text-ink-soft"
        }`}
      >
        {ok ? "✓" : "•"}
      </span>
      {children}
    </li>
  );
}
