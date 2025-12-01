'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function LoggedOutPage() {
  const router = useRouter();

  const handleReturnToIntelliflo = () => {
    router.push('/dashboard/intelliflo');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Logged Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You have been successfully logged out from Intelliflo.
          </p>
          <Button
            onClick={handleReturnToIntelliflo}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            Return to Intelliflo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
