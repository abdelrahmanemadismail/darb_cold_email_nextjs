import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts } from '@/db/schema/contacts';
import { companies } from '@/db/schema/companies';
import { createContactSchema, contactQuerySchema } from '@/types/contact';
import { eq, ilike, or, and, desc, asc, sql, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

// GET /api/contacts - List all contacts with pagination and filters
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
    const queryParams = contactQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      companyId: searchParams.get('companyId'),
      tags: searchParams.get('tags'),
      isEmailVerified: searchParams.get('isEmailVerified'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const { page, limit, search, companyId, tags, isEmailVerified, sortBy, sortOrder } = queryParams;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(contacts.firstName, `%${search}%`),
          ilike(contacts.lastName, `%${search}%`),
          ilike(contacts.email, `%${search}%`),
          ilike(contacts.position, `%${search}%`)
        )
      );
    }
    if (companyId) {
      conditions.push(eq(contacts.companyId, companyId));
    }
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      conditions.push(sql`${contacts.tags} && ARRAY[${sql.join(tagArray.map(t => sql`${t}`), sql`, `)}]::varchar[]`);
    }
    if (isEmailVerified !== undefined) {
      conditions.push(eq(contacts.isEmailVerified, isEmailVerified));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    const orderBy = sortOrder === 'asc'
      ? asc(contacts[sortBy])
      : desc(contacts[sortBy]);

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(contacts)
      .where(whereClause);

    // Get contacts with company information
    const contactsData = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        gender: contacts.gender,
        position: contacts.position,
        companyId: contacts.companyId,
        linkedinUrl: contacts.linkedinUrl,
        isEmailVerified: contacts.isEmailVerified,
        tags: contacts.tags,
        notes: contacts.notes,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
        createdBy: contacts.createdBy,
        lastContactedAt: contacts.lastContactedAt,
        managedBy: contacts.managedBy,
        company: {
          id: companies.id,
          name: companies.name,
          city: companies.city,
          country: companies.country,
        },
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: contactsData,
      pagination: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
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

// POST /api/contacts - Create a new contact
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
    const validatedData = createContactSchema.parse(body);

    // Check if email already exists
    const existingContact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.email, validatedData.email))
      .limit(1);

    if (existingContact.length > 0) {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      );
    }

    // Validate company if provided
    if (validatedData.companyId) {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, validatedData.companyId))
        .limit(1);

      if (!company) {
        return NextResponse.json(
          { error: 'Invalid company ID' },
          { status: 400 }
        );
      }
    }

    const [newContact] = await db
      .insert(contacts)
      .values({
        ...validatedData,
        createdBy: session.user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
