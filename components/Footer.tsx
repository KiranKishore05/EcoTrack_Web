import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8 text-center text-muted-foreground mt-auto">
      <div className="container flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-foreground">EcoTrack</h3>

        <p className="mt-2 text-sm">
          Built by Kiran Kishore
        </p>

        <div className="mt-4 flex justify-center gap-6">
          <Link
            href="https://github.com/KiranKishore05"
            target="_blank"
            className="hover:text-foreground transition-colors"
          >
            <span className="sr-only">GitHub</span>
            <Github className="h-5 w-5" />
          </Link>

          <Link
            href="https://www.linkedin.com/in/kiran-kishore-05/" // Assuming this, user said YOUR-LINKEDIN
            target="_blank"
            className="hover:text-foreground transition-colors"
          >
            <span className="sr-only">LinkedIn</span>
            <Linkedin className="h-5 w-5" />
          </Link>

          <Link
            href="mailto:kishorekiran129@gmail.com"
            className="hover:text-foreground transition-colors"
          >
            <span className="sr-only">Email</span>
            <Mail className="h-5 w-5" />
          </Link>
        </div>

        <p className="mt-4 text-xs">
          © {new Date().getFullYear()} EcoTrack. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
