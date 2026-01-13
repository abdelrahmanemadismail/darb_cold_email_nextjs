import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { apolloSearchResults } from '@/db/schema/apollo-search-results';
import { sql, eq, inArray } from 'drizzle-orm';

/**
 * PATCH /api/apollo-results/bulk-update
 * Bulk update Apollo search results (mark as processed/unprocessed)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ids, processed } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array required' },
        { status: 400 }
      );
    }

    if (typeof processed !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: processed must be a boolean' },
        { status: 400 }
      );
    }

    // Update results
    await db
      .update(apolloSearchResults)
      .set({ processed })
      .where(inArray(apolloSearchResults.id, ids));

    return NextResponse.json({
      success: true,
      message: `Updated ${ids.length} results`,
      updated: ids.length,
    });

  } catch (error) {
    console.error('Apollo results bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update results' },
      { status: 500 }
    );
  }
}
