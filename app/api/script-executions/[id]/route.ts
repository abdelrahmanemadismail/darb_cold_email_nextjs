import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { scriptExecutions } from '@/db/schema/script-executions';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/script-executions/[id]
 * Update script execution progress or status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const { status, currentPage, progressStatus, results, errorMessage } = body;

    const updateData: Partial<typeof scriptExecutions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (currentPage !== undefined) updateData.currentPage = currentPage;
    if (progressStatus !== undefined) updateData.progressStatus = progressStatus;
    if (results !== undefined) updateData.results = results;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;

    // Set completedAt when status changes to completed, failed, or cancelled
    if (status && ['completed', 'failed', 'cancelled'].includes(status)) {
      updateData.completedAt = new Date();
    }

    const [execution] = await db
      .update(scriptExecutions)
      .set(updateData)
      .where(eq(scriptExecutions.id, id))
      .returning();

    if (!execution) {
      return NextResponse.json(
        { error: 'Script execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ execution });

  } catch (error) {
    console.error('Failed to update script execution:', error);
    return NextResponse.json(
      { error: 'Failed to update script execution' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/script-executions/[id]
 * Delete a script execution record
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await db
      .delete(scriptExecutions)
      .where(eq(scriptExecutions.id, id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete script execution:', error);
    return NextResponse.json(
      { error: 'Failed to delete script execution' },
      { status: 500 }
    );
  }
}
