import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useIsAdmin } from "@/hooks/useQueries";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, X, Zap } from "lucide-react";
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
      className={`text-sm font-medium transition-colors ${
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
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.72 0.2 210 / 0.08) 0%, transparent 60%)",
        }}
      />

      <header
        className="relative z-50 border-b border-border/50 backdrop-blur-xl"
        style={{ background: "oklch(0.08 0.012 255 / 0.85)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            data-ocid="nav.home.link"
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg step-active flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground tracking-tight">
              7 <span className="text-primary">Bucks</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} label={link.label} />
            ))}
            {isAdmin && <NavLink to="/admin" label="Admin" />}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="text-xs text-muted-foreground font-mono">
                  {identity.getPrincipal().toString().slice(0, 8)}…
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clear}
                  data-ocid="auth.logout.button"
                  className="border-border/50 hover:border-destructive/50 hover:text-destructive"
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
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                {loginStatus === "logging-in" ? "Connecting…" : "Login"}
              </Button>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
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

        {mobileOpen && (
          <div
            className="md:hidden border-t border-border/50 px-4 py-4 flex flex-col gap-4"
            style={{ background: "oklch(0.08 0.012 255 / 0.95)" }}
          >
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
            <div className="pt-2 border-t border-border/50">
              {isLoggedIn ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clear}
                  data-ocid="auth.mobile.logout.button"
                  className="w-full"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
                </Button>
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
