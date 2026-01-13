import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { apolloSearchResults } from '@/db/schema/apollo-search-results';
import { desc, sql, eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/apollo-results
 * Fetch Apollo search results with pagination and filters
 */
export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const processedParam = searchParams.get('processed'); // 'true', 'false', or null for all
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (processedParam !== null && processedParam !== '') {
      // Convert string 'true'/'false' to boolean (query params come as strings)
      const processedValue = processedParam === 'true';
      conditions.push(eq(apolloSearchResults.processed, processedValue));
    }

    if (search) {
      conditions.push(
        sql`(
          ${apolloSearchResults.firstName} ILIKE ${`%${search}%`} OR
          ${apolloSearchResults.organizationName} ILIKE ${`%${search}%`} OR
          ${apolloSearchResults.title} ILIKE ${`%${search}%`}
        )`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apolloSearchResults)
      .where(whereClause);

    // Get paginated results
    const results = await db
      .select()
      .from(apolloSearchResults)
      .where(whereClause)
      .orderBy(desc(apolloSearchResults.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error('Apollo results fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apollo-results
 * Delete Apollo search results
 */
export async function DELETE(req: NextRequest) {
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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array required' },
        { status: 400 }
      );
    }

    // Delete results
    await db
      .delete(apolloSearchResults)
      .where(inArray(apolloSearchResults.id, ids));

    return NextResponse.json({
      success: true,
      message: `Deleted ${ids.length} results`,
    });

  } catch (error) {
    console.error('Apollo results delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete results' },
      { status: 500 }
    );
  }
}
