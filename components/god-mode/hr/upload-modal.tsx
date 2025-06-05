"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export function UploadModal() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-candidates', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      toast.success(`File ${file.name} uploaded successfully. Processing will begin shortly.`);
      
      setFile(null);
    } catch (error) {
      toast.error('Failed to upload file. Please try again.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Upload className="h-4 w-4" /> Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Candidate Profiles</DialogTitle>
          <DialogDescription>
            Upload a CSV file with LinkedIn profile URLs. Each row should contain a single URL.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">CSV File</Label>
            <Input 
              id="file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Example format: Each row should contain a single LinkedIn URL
            </p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              https://www.linkedin.com/in/example1/<br/>
              https://www.linkedin.com/in/example2/<br/>
              ...
            </pre>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={uploadFile} 
            disabled={!file || isUploading}
            className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 