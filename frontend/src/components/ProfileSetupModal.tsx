import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '../hooks/useQueries';

interface ProfileSetupModalProps {
  onSave: (profile: UserProfile) => Promise<void>;
  isSaving: boolean;
}

export default function ProfileSetupModal({ onSave, isSaving }: ProfileSetupModalProps) {
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), principal: '' });
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Set up your profile</DialogTitle>
          <DialogDescription>
            Please enter your name to get started. This will be displayed throughout the app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="profile-name">Your Name</Label>
            <Input
              id="profile-name"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()} className="w-full">
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
