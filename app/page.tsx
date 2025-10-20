"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import BentoGrid from "@/components/BentoGrid";

export default function HomePage() {
  const { data: session } = useSession();
  
  const features = [
    {
      icon: "🤖",
      title: "Automated PR Analysis",
      description: "AI automatically analyzes pull requests for code quality, security issues, and best practices in real-time."
    },
    {
      icon: "💬",
      title: "Intelligent Review Comments",
      description: "Get context-aware feedback and actionable suggestions directly on your pull requests."
    },
    {
      icon: "⚙️",
      title: "Custom Rule Configuration",
      description: "Define your own coding standards and let AI enforce them consistently across all PRs."
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track review metrics, code quality trends, and team performance over time with detailed insights."
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="section relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-gradient" />
        
        <div className="container-md relative z-10">
          <motion.div 
            className="text-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="h1 mb-6 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Cut Code Review Time
              <br />
              & Bugs in Half. Instantly.
            </motion.h1>
            
            <motion.p 
              className="p-lg max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Reviews for AI-powered teams who move fast (but don&apos;t break things)
            </motion.p>
            
            <motion.div 
              className="flex gap-4 justify-center items-center flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {session ? (
                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300"
                  >
                    Go to Dashboard →
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  onClick={() => signIn("github")}
                  className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300"
                >
                  Get Started →
                </Button>
              )}
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground underline transition-colors">
                Want reviews in IDE? Learn More
              </Link>
            </motion.div>

            <motion.div 
              className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <span>Free to use</span>
              <span>|</span>
              <span>No credit card needed</span>
              <span>|</span>
              <span>2-click signup with GitHub/GitLab</span>
            </motion.div>
          </motion.div>

          {/* Mock PR Card Preview */}
          <motion.div
            className="mt-16 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="relative rounded-2xl border border-gray-800 bg-card/50 backdrop-blur-sm p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-700" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-700 rounded w-32 mb-2" />
                  <div className="h-2 bg-gray-800 rounded w-48" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-800 rounded w-full" />
                <div className="h-2 bg-gray-800 rounded w-5/6" />
                <div className="h-2 bg-gray-800 rounded w-4/6" />
              </div>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg border border-accent/30">
                <span className="text-sm font-medium">📝 Create a PR</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="section bg-background">
        <div className="container-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="h2 mb-4">Key Features</h2>
            <p className="p-lg max-w-2xl mx-auto">
              Everything you need to automate and enhance your code review process
            </p>
          </motion.div>
          
          <BentoGrid items={features} />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="section bg-muted/30">
        <div className="container-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="h2 mb-4">How It Works</h2>
            <p className="p-lg max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔗",
                step: "1. Connect GitHub",
                description: "Authenticate with GitHub and select repositories to enable AI reviews."
              },
              {
                icon: "🔍",
                step: "2. Analyze Pull Request",
                description: "AI automatically scans new PRs for issues, patterns, and improvements."
              },
              {
                icon: "✅",
                step: "3. Get AI Feedback",
                description: "Receive actionable comments and suggestions to improve code quality."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="text-center p-8 rounded-2xl bg-card border border-gray-800 hover:border-gray-700 transition-all duration-300"
              >
                <motion.div 
                  className="text-6xl mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {item.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{item.step}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10" />
        
        <motion.div 
          className="container-md text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="h2 mb-6">Ready to Transform Your Code Reviews?</h2>
          <p className="p-lg max-w-2xl mx-auto mb-8">
            Join thousands of developers who are already using AI to ship better code faster.
          </p>
          {session ? (
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300"
              >
                Go to Dashboard →
              </Button>
            </Link>
          ) : (
            <Button 
              size="lg" 
              onClick={() => signIn("github")}
              className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300"
            >
              Get Started →
            </Button>
          )}
        </motion.div>
      </section>
    </main>
  );
}
