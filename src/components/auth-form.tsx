"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
      },
    });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setEmail(normalizedEmail);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#738b6b]/25 bg-[#738b6b]/10 p-5">
          <MailCheck className="h-6 w-6 text-[#43533e]" />
          <h3 className="mt-4 font-semibold">Check your inbox</h3>
          <p className="mt-2 text-sm leading-6 text-[#625e55]">
            We sent a private sign-in link to <strong>{email}</strong>. Open it in this browser to enter the letter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError("");
          }}
          className="focus-ring mx-auto block rounded text-sm underline underline-offset-4"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={sendMagicLink} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          Your email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="focus-ring h-14 w-full rounded-2xl border border-black/15 bg-white/55 px-4 text-base"
          required
        />
        <p className="mt-2 text-sm text-[#746f65]">Use the address already on the five-member list.</p>
      </div>
      {error && <p className="rounded-xl bg-red-950/8 p-3 text-sm text-red-900">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Email me a sign-in link
        {!busy && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
