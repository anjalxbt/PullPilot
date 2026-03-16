import { Github, Twitter } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card transition-colors duration-300">
      <div className="container-md py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="font-bold text-lg text-foreground hover:text-primary transition-colors">
              🤖 AI Review
            </Link>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              AI-powered code review for teams who ship fast.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#how" className="hover:text-foreground transition-colors">How it works</a></li>
              <li><a href="#docs" className="hover:text-foreground transition-colors">Documentation</a></li>
            </ul>
          </div>

          {/* Social + credit */}
          <div>
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Connect</h4>
            <div className="flex items-center gap-3 mb-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          Built by Group 7, Government Engineering College Wayanad · © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
