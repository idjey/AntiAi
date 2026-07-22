'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldAlert, Key, CheckCircle2 } from 'lucide-react';
import {
  generateIdentity,
  registerIdentity,
  storeIdentity,
  loadIdentity,
} from '@antiai/attestation-core/client';

export default function VerifierPage() {
  const [status, setStatus] = useState<'loading' | 'idle' | 'generating' | 'registered' | 'error'>('loading');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [keyId, setKeyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    checkExistingIdentity();
  }, []);

  async function checkExistingIdentity() {
    try {
      const existing = await loadIdentity();
      if (existing) {
        setKeyId(existing.keyId);
        setStatus('registered');
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  }

  async function handleEnableVerifier() {
    setStatus('generating');
    setErrorMsg('');
    try {
      // 1. Generate local key & mnemonic
      const identity = generateIdentity();
      
      // 2. Register with API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const newKeyId = await registerIdentity(apiUrl, identity.keyPair, 'WEB');
      
      // 3. Store locally
      await storeIdentity(identity.keyPair, identity.mnemonic);
      
      setMnemonic(identity.mnemonic);
      setKeyId(newKeyId);
      setStatus('registered');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to initialize verifier identity');
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8">Verifier Identity</h1>
      
      {status === 'idle' || status === 'generating' || status === 'error' ? (
        <Card>
          <CardHeader>
            <CardTitle>Initialize Verifier Node</CardTitle>
            <CardDescription>
              Generate a cryptographic identity to sign attestations and earn reputation on the network.
              This identity is completely pseudonymous and stored locally on your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'error' && (
              <Alert variant="destructive" className="mb-6">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              By clicking "Enable Verifier Mode", your browser will generate an Ed25519 keypair.
              The secret key never leaves your device. We use a challenge-response protocol to register
              your public key with the network.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleEnableVerifier} 
              disabled={status === 'generating'}
              className="w-full sm:w-auto"
            >
              {status === 'generating' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable Verifier Mode
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <CardTitle>Identity Active</CardTitle>
              </div>
              <CardDescription>
                Your device is now registered as a verifier on the network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Key ID</p>
                <code className="bg-muted px-2 py-1 rounded text-sm break-all">
                  {keyId}
                </code>
              </div>
            </CardContent>
          </Card>

          {mnemonic && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Key className="h-5 w-5 text-amber-500" />
              <AlertTitle className="text-amber-500">Back up your key</AlertTitle>
              <AlertDescription className="mt-3">
                <p className="mb-4 text-sm text-amber-600/90 dark:text-amber-400/90">
                  This 12-word recovery phrase is the ONLY way to recover your identity and reputation
                  if you clear your browser data. Write it down and keep it safe.
                </p>
                <div className="bg-background/50 p-4 rounded-md border border-amber-500/20">
                  <p className="font-mono text-lg text-center tracking-wide leading-relaxed">
                    {mnemonic}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" className="border-amber-500/50 text-amber-600" onClick={() => setMnemonic(null)}>
                    I have safely backed this up
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
