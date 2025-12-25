import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies } from '@/db/schema/companies';
import { contacts } from '@/db/schema/contacts';
import { createCompanySchema, companyQuerySchema } from '@/types/company';
import { eq, ilike, and, desc, asc, sql, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

// GET /api/companies - List all companies with pagination and filters
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const queryParams = companyQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      source: searchParams.get('source'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const { page, limit, search, source, sortBy, sortOrder } = queryParams;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(ilike(companies.name, `%${search}%`));
    }
    if (source) {
      conditions.push(eq(companies.source, source));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    const orderBy = sortOrder === 'asc'
      ? asc(companies[sortBy])
      : desc(companies[sortBy]);

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(companies)
      .where(whereClause);

    // Get companies with contact counts
    const companiesData = await db
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
        contactsCount: sql<number>`count(${contacts.id})::int`,
      })
      .from(companies)
      .leftJoin(contacts, eq(contacts.companyId, companies.id))
      .where(whereClause)
      .groupBy(companies.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: companiesData,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasPermission(userRole, 'data:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCompanySchema.parse(body);

    const [newCompany] = await db
      .insert(companies)
      .values({
        ...validatedData,
        createdBy: session.user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
