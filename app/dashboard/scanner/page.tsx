'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, FileText, CheckCircle2, Loader2, X, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function ScannerPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, etc).');
        return;
      }
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(selected);
      setExtractedData(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(droppedFile);
      setExtractedData(null);
    } else {
      toast.error('Please drop an image file.');
    }
  };

  const handleScan = async () => {
    if (!previewUrl) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: previewUrl }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setExtractedData(data);
      toast.success('Image analyzed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error processing image');
    } finally {
      setLoading(false);
    }
  };

  const handleLogActivity = async () => {
    if (!extractedData || !user) return;
    
    try {
      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        category: extractedData.category || 'energy',
        type: extractedData.type || 'electricity',
        value: parseFloat(extractedData.value) || 0,
        co2_kg: parseFloat(extractedData.estimated_co2_kg) || 0,
        date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      toast.success('Activity logged successfully!');
      
      // Reset
      setFile(null);
      setPreviewUrl(null);
      setExtractedData(null);
    } catch (error: any) {
      toast.error('Failed to log activity.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-primary" /> Carbon Footprint Scanner
        </h1>
        <p className="text-muted-foreground mt-1">Upload a photo of your electricity bill, fuel receipt, or grocery receipt and AI will extract the data.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="glass rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          {!previewUrl ? (
            <div 
              className="w-full h-full border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Click or drag image to upload</h3>
              <p className="text-sm text-muted-foreground mb-4">Supports JPG, PNG (Max 5MB)</p>
              <Button variant="secondary" size="sm">Browse Files</Button>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center">
              <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-black/20" />
                <button 
                  onClick={() => { setPreviewUrl(null); setFile(null); setExtractedData(null); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {!extractedData && (
                <Button onClick={handleScan} disabled={loading} size="lg" className="w-full gap-2">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Image...</> : <><Sparkles className="w-5 h-5" /> Analyze with AI</>}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Results Section */}
        <Card className="glass rounded-2xl p-6 min-h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Extracted Data</h2>
          </div>

          {!extractedData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 opacity-50">
                <FileText className="w-8 h-8" />
              </div>
              <p>Upload and analyze an image to see the extracted carbon data here.</p>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-strong rounded-xl p-4">
                      <div className="text-xs text-muted-foreground mb-1">Title</div>
                      <div className="font-semibold">{extractedData.title || 'N/A'}</div>
                    </div>
                    <div className="glass-strong rounded-xl p-4">
                      <div className="text-xs text-muted-foreground mb-1">Category</div>
                      <div className="font-semibold capitalize">{extractedData.category || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="glass-strong rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Value</div>
                      <div className="font-semibold text-lg">{extractedData.value} {extractedData.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Estimated CO₂</div>
                      <div className="font-bold text-xl text-primary">{extractedData.estimated_co2_kg} kg</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-primary/10 text-primary rounded-xl text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>AI successfully extracted data from the receipt. You can now log this directly to your carbon footprint tracker.</p>
                  </div>
                </div>

                <div className="pt-6 mt-auto">
                  <Button onClick={handleLogActivity} size="lg" className="w-full gap-2">
                    <PlusCircle className="w-5 h-5" /> Log Activity
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </Card>
      </div>
    </div>
  );
}
