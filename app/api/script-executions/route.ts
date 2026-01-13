import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { scriptExecutions } from '@/db/schema/script-executions';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/script-executions
 * Get all script executions (recent and active)
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Filter by status if provided
    const executions = status
      ? await db.select().from(scriptExecutions)
          .where(eq(scriptExecutions.status, status as 'running' | 'completed' | 'failed' | 'cancelled'))
          .orderBy(desc(scriptExecutions.startedAt))
          .limit(limit)
      : await db.select().from(scriptExecutions)
          .orderBy(desc(scriptExecutions.startedAt))
          .limit(limit);

    return NextResponse.json({ executions });

  } catch (error) {
    console.error('Failed to fetch script executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch script executions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/script-executions
 * Create a new script execution record
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { scriptType, totalPages, parameters } = body;

    const [execution] = await db.insert(scriptExecutions).values({
      scriptType,
      status: 'running',
      totalPages: totalPages || 0,
      currentPage: 0,
      progressStatus: 'Starting...',
      parameters: parameters as Record<string, unknown>,
      userId: session.user.id,
    }).returning();

    return NextResponse.json({ execution });

  } catch (error) {
    console.error('Failed to create script execution:', error);
    return NextResponse.json(
      { error: 'Failed to create script execution' },
      { status: 500 }
    );
  }
}
