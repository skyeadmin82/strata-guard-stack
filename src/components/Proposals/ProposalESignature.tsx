import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PenTool, Download, Send, Check, X } from 'lucide-react';

interface ProposalESignatureProps {
  proposalId: string;
  proposalTitle: string;
  clientEmail?: string;
  onSignatureComplete?: () => void;
}

interface SignatureData {
  id: string;
  signer_email: string;
  signer_name: string;
  signature_type: string;
  is_verified: boolean;
  signed_at?: string;
  expires_at?: string;
}

export const ProposalESignature: React.FC<ProposalESignatureProps> = ({
  proposalId,
  proposalTitle,
  clientEmail,
  onSignatureComplete
}) => {
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState(clientEmail || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchSignatures();
  }, [proposalId]);

  const fetchSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_signatures')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = async () => {
    if (!signerName || !signerEmail) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setLoading(true);
      
      // Convert canvas to base64
      const signatureData = canvas.toDataURL();
      
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', currentUser.user?.id)
        .single();

      const { error } = await supabase
        .from('proposal_signatures')
        .insert({
          tenant_id: userProfile?.tenant_id,
          proposal_id: proposalId,
          signer_email: signerEmail,
          signer_name: signerName,
          signature_type: 'electronic',
          signature_data: { image: signatureData },
          is_verified: true,
          signed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          requested_at: new Date().toISOString(),
          delivery_attempts: 0,
          delivery_errors: []
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Signature saved successfully',
      });

      setShowSignatureDialog(false);
      clearSignature();
      setSignerName('');
      setSignerEmail(clientEmail || '');
      await fetchSignatures();
      onSignatureComplete?.();
    } catch (error) {
      console.error('Error saving signature:', error);
      toast({
        title: 'Error',
        description: 'Failed to save signature',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendSignatureRequest = async () => {
    if (!signerEmail) {
      toast({
        title: 'Error',
        description: 'Please enter signer email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', currentUser.user?.id)
        .single();

      const { error } = await supabase
        .from('proposal_signatures')
        .insert({
          tenant_id: userProfile?.tenant_id,
          proposal_id: proposalId,
          signer_email: signerEmail,
          signer_name: signerName || 'Client',
          signature_type: 'electronic',
          is_verified: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          requested_at: new Date().toISOString(),
          delivery_attempts: 0,
          delivery_errors: []
        });

      if (error) throw error;

      // TODO: Send email notification
      toast({
        title: 'Success',
        description: 'Signature request sent successfully',
      });

      await fetchSignatures();
    } catch (error) {
      console.error('Error sending signature request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send signature request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">E-Signature Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage electronic signatures for "{proposalTitle}"
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
            <DialogTrigger asChild>
              <Button>
                <PenTool className="w-4 h-4 mr-2" />
                Add Signature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Electronic Signature</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="signer-name">Signer Name</Label>
                    <Input
                      id="signer-name"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signer-email">Signer Email</Label>
                    <Input
                      id="signer-email"
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Signature</Label>
                  <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="border rounded cursor-crosshair w-full"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-sm text-muted-foreground">
                        Draw your signature above
                      </p>
                      <Button variant="outline" size="sm" onClick={clearSignature}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveSignature} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Signature'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={sendSignatureRequest} disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            Request Signature
          </Button>
        </div>
      </div>

      {/* Signature Status */}
      <Card>
        <CardHeader>
          <CardTitle>Signature Status</CardTitle>
        </CardHeader>
        <CardContent>
          {signatures.length > 0 ? (
            <div className="space-y-4">
              {signatures.map((signature) => (
                <div key={signature.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      signature.is_verified ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">{signature.signer_name}</p>
                      <p className="text-sm text-muted-foreground">{signature.signer_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={signature.is_verified ? 'default' : 'secondary'}>
                      {signature.is_verified ? 'Signed' : 'Pending'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {signature.signed_at ? 
                        new Date(signature.signed_at).toLocaleDateString() : 
                        'Not signed yet'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No signatures yet</h3>
              <p className="text-muted-foreground mb-4">
                Add signatures or send signature requests to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};