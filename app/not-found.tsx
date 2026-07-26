import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Leaf } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Leaf className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved. 
        Let's get you back on track to saving the planet.
      </p>
      <Link href="/">
        <Button size="lg" className="gap-2">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
