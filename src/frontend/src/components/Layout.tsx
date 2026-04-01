import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useIsAdmin } from "@/hooks/useQueries";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Settings, X, Zap } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/", label: "Send" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
  { to: "/terms", label: "T&C" },
] as const;

function NavLink({
  to,
  label,
  onClick,
}: { to: string; label: string; onClick?: () => void }) {
  const routerState = useRouterState();
  const isActive = routerState.location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      data-ocid={`nav.${label.toLowerCase().replace(/[^a-z0-9]/g, "")}.link`}
      className={`text-sm font-medium transition-colors px-1 py-0.5 ${
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const isLoggedIn = loginStatus === "success" && !!identity;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle grid background */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      {/* Top glow */}
      <div
        className="fixed inset-x-0 top-0 h-96 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -5%, oklch(0.72 0.22 210 / 0.07) 0%, transparent 60%)",
        }}
      />

      <header className="relative z-50 border-b border-border/60 backdrop-blur-xl bg-card/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            data-ocid="nav.home.link"
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg step-active flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              7 <span className="text-primary">Bucks</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} label={link.label} />
            ))}
            {isAdmin && <NavLink to="/admin" label="Admin" />}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    data-ocid="nav.admin.link"
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Admin Config"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                  {identity.getPrincipal().toString().slice(0, 8)}…
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clear}
                  data-ocid="auth.logout.button"
                  className="border-border hover:border-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={login}
                data-ocid="auth.login.button"
                disabled={loginStatus === "logging-in"}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                {loginStatus === "logging-in" ? "Connecting…" : "Login"}
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-ocid="nav.menu.toggle"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 px-4 py-4 flex flex-col gap-3 bg-card/95 backdrop-blur-xl">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                label={link.label}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                label="Admin"
                onClick={() => setMobileOpen(false)}
              />
            )}
            <div className="pt-3 border-t border-border/50">
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground font-mono">
                    {identity.getPrincipal().toString().slice(0, 16)}…
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clear}
                    data-ocid="auth.mobile.logout.button"
                    className="w-full border-border hover:border-destructive/60 hover:text-destructive"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={login}
                  data-ocid="auth.mobile.login.button"
                  className="w-full bg-primary text-primary-foreground"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" /> Login
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 border-t border-border/50 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mahachi Desmond Private Limited (Reg:
            24167A02122024). All rights reserved.
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
