import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const schema = z.object({
  mode: fallback(z.string(), "login").default("login"),
  redirect: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [
      { title: "Sign in — Hyur Armenia" },
      { name: "description", content: "Sign in or create a Hyur account to save stays, manage listings and contact Armenian hosts." },
      { property: "og:title", content: "Sign in — Hyur Armenia" },
      { property: "og:description", content: "Access your Hyur travel account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const safeRedirect = redirect.startsWith("/") ? redirect : "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${safeRedirect}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("auth.register"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: safeRedirect });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
        <h1 className="font-display text-2xl font-semibold">
          {isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          {isRegister ? (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("auth.fullName")}</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {isRegister ? t("auth.register") : t("auth.login")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isRegister ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
          <button
            className="font-semibold text-brand hover:underline"
            onClick={() =>
              navigate({ to: "/auth", search: { mode: isRegister ? "login" : "register", redirect } })
            }
          >
            {isRegister ? t("auth.login") : t("auth.register")}
          </button>
        </p>
      </div>
    </div>
  );
}