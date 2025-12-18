import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, isErrorResponse } from '@/lib/api-auth';
import { db } from '@/db';
import { contacts } from '@/db/schema/contacts';
import { companies } from '@/db/schema/companies';
import { desc, ilike, or, sql, eq } from 'drizzle-orm';

/**
 * GET /api/contacts
 * Fetch all contacts with optional filtering and pagination
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
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with optional search filter and company filter
    let query = db
      .select({
        contact: contacts,
        company: companies,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id));

    // Apply filters
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(contacts.firstName, `%${search}%`),
          ilike(contacts.lastName, `%${search}%`),
          ilike(contacts.email, `%${search}%`),
          ilike(contacts.jobTitle, `%${search}%`),
          ilike(contacts.department, `%${search}%`)
        )
      );
    }

    if (companyId) {
      conditions.push(eq(contacts.companyId, companyId));
    }

    if (status && status.trim()) {
      conditions.push(ilike(contacts.status, `%${status}%`));
    }

    if (conditions.length > 0) {
      // @ts-expect-error - drizzle-orm query builder type inference
      query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
    }

    // Apply ordering, limit and offset
    const results = await query
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);

    // Format response to include company name inline
    const formattedResults = results.map((row) => ({
      ...row.contact,
      companyName: row.company?.name || null,
      companyDomain: row.company?.domain || null,
    }));

    return NextResponse.json({
      data: formattedResults,
      pagination: {
        total: Number(count),
        limit,
        offset,
        hasMore: offset + results.length < Number(count),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Create a new contact
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
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingContact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.email, body.email))
      .limit(1);

    if (existingContact.length > 0) {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      );
    }

    // Insert contact with audit info
    const [newContact] = await db
      .insert(contacts)
      .values({
        ...body,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
