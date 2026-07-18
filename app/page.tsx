'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Leaf, TrendingDown, Brain, Trophy, BarChart3, Target,
  ArrowRight, Sparkles, Zap, Globe, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Recommendations',
    desc: 'Personalized eco-friendly suggestions powered by Llama 3.3 70B analyzing your habits and emission trends.',
  },
  {
    icon: TrendingDown,
    title: 'Carbon Calculator',
    desc: 'Accurate daily, weekly, and monthly carbon footprint calculation across transport, food, energy, and water.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Beautiful visualizations with line charts, bar charts, pie charts, and heatmaps for trend analysis.',
  },
  {
    icon: Target,
    title: 'Carbon Budget',
    desc: 'Set monthly carbon budgets, track usage in real-time, and get AI predictions for future emissions.',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    desc: 'Earn badges, build streaks, gain XP, and level up through gamified sustainability tracking.',
  },
  {
    icon: Globe,
    title: 'Sustainability Index',
    desc: 'A 0–100 score that reflects your environmental impact and tracks progress over time.',
  },
];

const STATS = [
  { label: 'CO2 Tracked', value: '12M+ kg' },
  { label: 'Activities Logged', value: '850K+' },
  { label: 'Avg. Reduction', value: '34%' },
  { label: 'Active Users', value: '45K+' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">EcoTrack</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="gap-1.5">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm text-muted-foreground">AI-Powered Sustainability Management</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
        >
          Track your impact.
          <br />
          <span className="text-gradient">Change the planet.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          EcoTrack uses AI to analyze your daily habits, calculate your carbon footprint,
          and deliver personalized recommendations to live more sustainably.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4"
        >
          <Link href="/signup">
            <Button size="lg" className="gap-2 text-base h-12 px-8">
              Start tracking free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-base h-12 px-8">
              Sign in
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
        >
          {STATS.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <div className="text-2xl md:text-3xl font-bold text-gradient">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything you need to live greener
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From daily habit tracking to AI-powered recommendations, EcoTrack gives you
            the tools to understand and reduce your environmental impact.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:glow-primary transition-shadow group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="glass-strong rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-fade" />
          <div className="relative z-10">
            <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to reduce your footprint?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of users building sustainable habits with AI-powered insights.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base h-12 px-8">
                Create your free account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="font-semibold">EcoTrack</span>
            <span className="text-sm text-muted-foreground ml-2">© 2026 EcoTrack</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Carbon Neutral</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
