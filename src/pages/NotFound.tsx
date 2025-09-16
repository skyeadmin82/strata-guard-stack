import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
              <p className="text-xl text-muted-foreground">Oops! Page not found</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <Button asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default NotFound;
