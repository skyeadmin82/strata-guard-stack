import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRightLeft, 
  Database, 
  CloudDownload,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PSAMigration() {
  const [selectedPSA, setSelectedPSA] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const psaSystems = [
    { id: 'connectwise', name: 'ConnectWise PSA', description: 'Full-featured PSA with extensive API support' },
    { id: 'kaseya', name: 'Kaseya BMS', description: 'Business Management Suite with comprehensive features' },
    { id: 'syncro', name: 'SyncroMSP', description: 'All-in-one RMM and PSA platform' },
    { id: 'atera', name: 'Atera', description: 'Cloud-based RMM and PSA solution' }
  ];

  const startMigration = (psaId: string) => {
    setSelectedPSA(psaId);
    setProgress(25);
    toast({ title: 'Migration Started', description: 'Starting PSA migration process...' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PSA Migration Center</CardTitle>
          <CardDescription>Migrate your data from existing PSA platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Migration Benefits:</strong> Zero downtime, data validation, automatic field matching, full audit trail
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {psaSystems.map((psa) => (
          <Card key={psa.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{psa.name}</CardTitle>
              <CardDescription>{psa.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => startMigration(psa.id)}
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Migration
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {progress > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Migration in progress...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}