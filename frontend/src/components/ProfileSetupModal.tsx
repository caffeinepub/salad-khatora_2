import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Leaf, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfileSetupModal() {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const saveMutation = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    try {
      await saveMutation.mutateAsync({ name: name.trim() });
      setOpen(false);
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="font-heading">Welcome to Salad Khatora!</DialogTitle>
          </div>
          <DialogDescription>
            Let's set up your admin profile. What should we call you?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-sm font-medium">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-name"
              placeholder="e.g. Chef Maria"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              className={error ? 'border-destructive' : 'border-border'}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-green"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Get Started'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
