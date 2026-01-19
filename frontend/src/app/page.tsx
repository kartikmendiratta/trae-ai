"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Headphones, MessageSquare, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = () => {
    login();
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="text-foreground">AI</span>
            <span className="text-muted-foreground ml-1">Helpdesk</span>
          </h1>
          <Button onClick={handleLogin}>Login</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Smart Support,
            <br />
            <span className="text-muted-foreground">Powered by AI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            An intelligent helpdesk that understands your customers.
            Get sentiment analysis, smart routing, and instant answers.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={handleLogin}>
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <FeatureCard
            icon={MessageSquare}
            title="Real-time Chat"
            description="Instant messaging between customers and agents"
          />
          <FeatureCard
            icon={Zap}
            title="AI Analysis"
            description="Automatic sentiment detection and smart tagging"
          />
          <FeatureCard
            icon={Headphones}
            title="Smart Routing"
            description="Route tickets to the right team automatically"
          />
          <FeatureCard
            icon={Shield}
            title="RAG Search"
            description="Find similar issues with vector search"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          AI Smart Helpdesk MVP • Built with Next.js, FastAPI & Supabase
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
      <Icon className="h-8 w-8 text-foreground mb-4" />
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
