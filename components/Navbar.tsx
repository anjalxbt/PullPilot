"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { Menu, Moon, Sun, X } from "lucide-react";

function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on server or before hydration
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-border hover:bg-muted transition-all duration-200 w-[40px]"
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // Only use theme context after mounting on client
  return <ThemeToggleClient />;
}

function ThemeToggleClient() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="border-border hover:bg-muted transition-all duration-200"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navLinks = (
    <>
      <a href="#features" className="text-secondary hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
      <a href="#how" className="text-secondary hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>How it works</a>
      {session && (
        <Link href="/dashboard" className={cn("hover:text-foreground transition-colors", pathname === "/dashboard" ? "text-foreground" : "text-secondary")} onClick={() => setMobileMenuOpen(false)}>
          Dashboard
        </Link>
      )}
      <a href="#docs" className="text-secondary hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Docs</a>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur transition-colors duration-300">
      <div className="container-md flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl text-foreground hover:text-primary transition-colors">
          🤖 AI Review
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {navLinks}
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {status === "loading" ? (
            <Button variant="outline" size="sm" disabled className="border-border">Loading...</Button>
          ) : session ? (
            <>
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    className="w-8 h-8 rounded-full border-2 border-border"
                  />
                )}
                <span className="text-sm text-foreground hidden sm:inline">
                  {session.user?.name}
                </span>
              </div>
              {pathname !== "/dashboard" && (
                <Link href="/dashboard">
                  <Button 
                    size="sm" 
                    className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-white transition-all duration-200"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => signOut()} className="hidden sm:inline-flex border-border hover:bg-muted transition-all duration-200">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                onClick={() => signIn("github")}
                className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-white rounded-full px-6 transition-all duration-200"
              >
                Get Started →
              </Button>
            </>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden border-border hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur animate-in slide-in-from-top-2 duration-200">
          <nav className="container-md flex flex-col gap-4 py-6 text-sm">
            {navLinks}
            <hr className="border-border" />
            {status !== "loading" && (
              session ? (
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-200">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full border-border hover:bg-muted transition-all duration-200">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  onClick={() => { signIn("github"); setMobileMenuOpen(false); }}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-full px-6 transition-all duration-200"
                >
                  Get Started →
                </Button>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
