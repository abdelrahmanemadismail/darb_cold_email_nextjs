import { Suspense } from 'react';
import { ApolloResultsTable } from '@/components/apollo/ApolloResultsTable';
import { Card, CardContent } from '@/components/ui/card';

export default function ApolloResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Apollo Search Results</h1>
        <p className="text-muted-foreground mt-2">
          View and manage raw API responses from Apollo.io searches
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">Loading results...</div>
            </CardContent>
          </Card>
        }
      >
        <ApolloResultsTable />
      </Suspense>
    </div>
  );
}
