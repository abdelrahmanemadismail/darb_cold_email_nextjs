import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, isErrorResponse } from '@/lib/api-auth';
import { db } from '@/db';
import { companies } from '@/db/schema/companies';
import { eq } from 'drizzle-orm';

/**
 * GET /api/companies/[companyId]
 * Fetch a single company by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const authResult = await requirePermission(request, 'data:view');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { companyId } = await params;

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[companyId]
 * Update a company
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const authResult = await requirePermission(request, 'data:edit');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { companyId } = await params;
    const body = await request.json();

    // Check if company exists
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!existingCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Extract only allowed fields (exclude readonly fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, createdBy, ...allowedFields } = body;

    // Update company
    const [updatedCompany] = await db
      .update(companies)
      .set({
        ...allowedFields,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning();

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[companyId]
 * Delete a company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const authResult = await requirePermission(request, 'data:delete');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { companyId } = await params;

    // Check if company exists
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!existingCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Delete company
    await db.delete(companies).where(eq(companies.id, companyId));

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
