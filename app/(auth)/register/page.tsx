'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Registration Disabled</CardTitle>
          <CardDescription className="text-center">
            Public registration is not available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-center">
            <p className="mb-2">
              New accounts can only be created by system administrators.
            </p>
            <p className="text-muted-foreground">
              Please contact your administrator to request an account.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full" variant="default">
            <Link href="/login">
              Go to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
