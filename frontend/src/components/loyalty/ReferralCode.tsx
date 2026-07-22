'use client';

import { useState } from 'react';
import { useReferralCode, useApplyReferral } from '@/hooks/useLoyalty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  Link2,
  Mail,
  MessageCircle,
} from 'lucide-react';

interface ReferralCodeProps {
  compact?: boolean;
}

export function ReferralCode({ compact = false }: ReferralCodeProps) {
  const { data, isLoading } = useReferralCode();
  const applyReferral = useApplyReferral();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCopy = async () => {
    if (data?.code) {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (data?.url && navigator.share) {
      try {
        await navigator.share({
          title: 'Join BHD Marketplace',
          text: `Use my referral code ${data.code} to get bonus points!`,
          url: data.url,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    try {
      const result = await applyReferral.mutateAsync(inputCode.trim());
      toast.success(`Referral applied! You earned ${result.bonus} bonus points!`);
      setInputCode('');
      setShowInput(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Invalid referral code');
    }
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Your Code:</span>
              <code className="px-2 py-0.5 bg-white rounded text-sm font-mono font-bold text-purple-700">
                {data?.code || '------'}
              </code>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCopy} className="h-8 w-8 p-0">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* My Referral Code */}
      <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Invite Friends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your referral code with friends and earn bonus points when they join!
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <code className="text-xl font-mono font-bold text-purple-700">
                  {data?.code || 'Loading...'}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-8 gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={handleCopy}
            >
              <Link2 className="w-3 h-3" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={handleShare}
            >
              <Share2 className="w-3 h-3" />
              Share
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
            <Gift className="w-4 h-4 text-purple-600 shrink-0" />
            <p className="text-sm">
              Both you and your friend will receive{' '}
              <span className="font-semibold text-purple-700">50 bonus points</span>{' '}
              when they sign up!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Apply Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            Have a Referral Code?
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showInput ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowInput(true)}
            >
              <Gift className="w-4 h-4 mr-2" />
              Enter Referral Code
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter referral code (e.g., BHD123ABC)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                />
                <Button
                  onClick={handleApplyCode}
                  disabled={applyReferral.isPending || !inputCode.trim()}
                >
                  {applyReferral.isPending ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => { setShowInput(false); setInputCode(''); }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
