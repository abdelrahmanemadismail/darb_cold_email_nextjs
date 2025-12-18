import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, isErrorResponse } from '@/lib/api-auth';
import { db } from '@/db';
import { companies } from '@/db/schema/companies';
import { desc, ilike, or, sql } from 'drizzle-orm';

/**
 * GET /api/companies
 * Fetch all companies with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  // Require data:view permission
  const authResult = await requirePermission(request, 'data:view');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');
    const size = searchParams.get('size');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with optional filters
    let query = db.select().from(companies);

    const filters = [];

    if (search) {
      filters.push(
        or(
          ilike(companies.name, `%${search}%`),
          ilike(companies.industry, `%${search}%`),
          ilike(companies.city, `%${search}%`),
          ilike(companies.domain, `%${search}%`),
          ilike(companies.country, `%${search}%`)
        )
      );
    }

    if (industry && industry.trim()) {
      filters.push(ilike(companies.industry, `%${industry}%`));
    }

    if (size && size.trim()) {
      filters.push(ilike(companies.size, `%${size}%`));
    }

    if (source && source.trim()) {
      filters.push(ilike(companies.source, `%${source}%`));
    }

    if (filters.length > 0) {
      // @ts-expect-error - drizzle-orm query builder type inference
      query = query.where(sql`${sql.join(filters, sql` AND `)}`);
    }

    // Apply ordering, limit and offset
    const results = await query
      .orderBy(desc(companies.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(companies);

    return NextResponse.json({
      data: results,
      pagination: {
        total: Number(count),
        limit,
        offset,
        hasMore: offset + results.length < Number(count),
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

/**
 * POST /api/companies
 * Create a new company
 */
export async function POST(request: NextRequest) {
  // Require data:create permission
  const authResult = await requirePermission(request, 'data:create');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { user } = authResult;

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Insert company with audit info
    const [newCompany] = await db
      .insert(companies)
      .values({
        ...body,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
