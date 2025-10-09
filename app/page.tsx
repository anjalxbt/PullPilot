import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="section bg-gradient-to-b from-indigo-50 to-white">
        <div className="container-md text-center">
          <h1 className="h1 mb-6">
            Automate Your GitHub Pull Request Reviews with AI
          </h1>
          <p className="p-lg max-w-2xl mx-auto mb-8">
            Reduce manual effort, enforce code quality, and speed up code reviews using AI-driven feedback.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">Login with GitHub</Button>
            </Link>
            <Button variant="outline" size="lg">View Demo</Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section">
        <div className="container-md">
          <h2 className="h2 text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="🤖"
              title="Automated PR Analysis"
              description="AI automatically analyzes pull requests for code quality, security issues, and best practices."
            />
            <FeatureCard
              icon="💬"
              title="Intelligent Review Comments"
              description="Get context-aware feedback and suggestions directly on your pull requests."
            />
            <FeatureCard
              icon="⚙️"
              title="Custom Rule Configuration"
              description="Define your own coding standards and let AI enforce them across all PRs."
            />
            <FeatureCard
              icon="📊"
              title="Analytics Dashboard"
              description="Track review metrics, code quality trends, and team performance over time."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="section bg-gray-50">
        <div className="container-md">
          <h2 className="h2 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-2">1. Connect GitHub</h3>
              <p className="text-gray-600">
                Authenticate with GitHub and select repositories to enable AI reviews.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">2. Analyze Pull Request</h3>
              <p className="text-gray-600">
                AI automatically scans new PRs for issues, patterns, and improvements.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">3. Get AI Feedback</h3>
              <p className="text-gray-600">
                Receive actionable comments and suggestions to improve code quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container-md text-center">
          <h2 className="h2 mb-6">Join the Beta</h2>
          <p className="p-lg max-w-xl mx-auto mb-8">
            Start automating your code reviews today. Sign in with GitHub to get started.
          </p>
          <Link href="/dashboard">
            <Button size="lg">Sign in with GitHub</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
