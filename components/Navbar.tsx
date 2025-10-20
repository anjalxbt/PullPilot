"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-background/80 backdrop-blur">
      <div className="container-md flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl text-foreground hover:text-accent transition-colors">
          🤖 AI Review
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          {session && (
            <Link href="/dashboard" className={cn("hover:text-foreground transition-colors", pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground")}>
              Dashboard
            </Link>
          )}
          <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">Docs</a>
        </nav>
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <Button variant="outline" size="sm" disabled className="border-gray-700">Loading...</Button>
          ) : session ? (
            <>
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    className="w-8 h-8 rounded-full border-2 border-gray-700"
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
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => signOut()} className="border-gray-700 hover:bg-muted">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">Log In</span>
              <Button 
                size="sm" 
                onClick={() => signIn("github")}
                className="bg-accent hover:bg-accent/90 text-white border-accent rounded-full px-6"
              >
                Get Started →
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
