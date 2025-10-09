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
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="container-md flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold text-gray-900">
          AI Review Assistant
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
          <a href="#how" className="text-gray-600 hover:text-gray-900">How it works</a>
          {session && (
            <Link href="/dashboard" className={cn("hover:text-gray-900", pathname === "/dashboard" ? "text-gray-900" : "text-gray-600")}>
              Dashboard
            </Link>
          )}
          <a href="#docs" className="text-gray-600 hover:text-gray-900">Docs</a>
        </nav>
        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <Button variant="outline" size="sm" disabled>Loading...</Button>
          ) : session ? (
            <>
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {session.user?.name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => signIn("github")}>
              Login with GitHub
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
