import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies } from '@/db/schema/companies';
import { contacts } from '@/db/schema/contacts';
import { updateCompanySchema } from '@/types/company';
import { eq, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

type Params = {
  params: Promise<{
    companyId: string;
  }>;
};

// GET /api/companies/[companyId] - Get single company with details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasPermission(userRole, 'data:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { companyId } = await params;

    // Get company with contact count
    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
        size: companies.size,
        city: companies.city,
        country: companies.country,
        keywords: companies.keywords,
        source: companies.source,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
        createdBy: companies.createdBy,
        contactsCount: count(contacts.id),
      })
      .from(companies)
      .leftJoin(contacts, eq(contacts.companyId, companies.id))
      .where(eq(companies.id, companyId))
      .groupBy(companies.id);

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

// PATCH /api/companies/[companyId] - Update a company
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasPermission(userRole, 'data:edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { companyId } = await params;
    const body = await request.json();
    const validatedData = updateCompanySchema.parse(body);

    const [updatedCompany] = await db
      .update(companies)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning();

    if (!updatedCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[companyId] - Delete a company
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasPermission(userRole, 'data:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { companyId } = await params;

    // Check if company has contacts
    const [{ contactCount }] = await db
      .select({ contactCount: count() })
      .from(contacts)
      .where(eq(contacts.companyId, companyId));

    if (Number(contactCount) > 0) {
      // Option 1: Prevent deletion if company has contacts
      // You can change this behavior to cascade delete or set null
      return NextResponse.json(
        {
          error: 'Cannot delete company with associated contacts',
          contactCount: Number(contactCount),
        },
        { status: 400 }
      );
    }

    const [deletedCompany] = await db
      .delete(companies)
      .where(eq(companies.id, companyId))
      .returning();

    if (!deletedCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
