import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies } from '@/db/schema/companies';
import { contacts } from '@/db/schema/contacts';
import { bulkOperationSchema } from '@/types/contact';
import { inArray, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

// POST /api/data/bulk - Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    const body = await request.json();
    const { ids, operation, tags, keywords } = bulkOperationSchema.parse(body);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'companies' or 'contacts'

    if (!type || (type !== 'companies' && type !== 'contacts')) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "companies" or "contacts"' },
        { status: 400 }
      );
    }

    switch (operation) {
      case 'delete':
        if (!hasPermission(userRole, 'data:delete')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (type === 'companies') {
          await db.delete(companies).where(inArray(companies.id, ids));
        } else {
          await db.delete(contacts).where(inArray(contacts.id, ids));
        }

        return NextResponse.json({
          message: `Successfully deleted ${ids.length} ${type}`,
          count: ids.length,
        });

      case 'addTags':
        if (!hasPermission(userRole, 'data:edit')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!tags || tags.length === 0) {
          return NextResponse.json(
            { error: 'Tags are required for addTags operation' },
            { status: 400 }
          );
        }

        if (type !== 'contacts') {
          return NextResponse.json(
            { error: 'addTags operation is only valid for contacts' },
            { status: 400 }
          );
        }

        await db
          .update(contacts)
          .set({
            tags: sql`array(select distinct unnest(${contacts.tags} || ARRAY[${sql.join(tags.map(t => sql`${t}`), sql`, `)}]::varchar[]))`,
            updatedAt: new Date(),
          })
          .where(inArray(contacts.id, ids));

        return NextResponse.json({
          message: `Successfully added tags to ${ids.length} contacts`,
          count: ids.length,
        });

      case 'addKeywords':
        if (!hasPermission(userRole, 'data:edit')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!keywords || keywords.length === 0) {
          return NextResponse.json(
            { error: 'Keywords are required for addKeywords operation' },
            { status: 400 }
          );
        }

        if (type !== 'companies') {
          return NextResponse.json(
            { error: 'addKeywords operation is only valid for companies' },
            { status: 400 }
          );
        }

        await db
          .update(companies)
          .set({
            keywords: sql`array(select distinct unnest(${companies.keywords} || ARRAY[${sql.join(keywords.map(k => sql`${k}`), sql`, `)}]::varchar[]))`,
            updatedAt: new Date(),
          })
          .where(inArray(companies.id, ids));

        return NextResponse.json({
          message: `Successfully added keywords to ${ids.length} companies`,
          count: ids.length,
        });

      case 'removeTags':
        if (!hasPermission(userRole, 'data:edit')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!tags || tags.length === 0) {
          return NextResponse.json(
            { error: 'Tags are required for removeTags operation' },
            { status: 400 }
          );
        }

        if (type !== 'contacts') {
          return NextResponse.json(
            { error: 'removeTags operation is only valid for contacts' },
            { status: 400 }
          );
        }

        await db
          .update(contacts)
          .set({
            tags: sql`array(select unnest(${contacts.tags}) except select unnest(ARRAY[${sql.join(tags.map(t => sql`${t}`), sql`, `)}]::varchar[]))`,
            updatedAt: new Date(),
          })
          .where(inArray(contacts.id, ids));

        return NextResponse.json({
          message: `Successfully removed tags from ${ids.length} contacts`,
          count: ids.length,
        });

      case 'removeKeywords':
        if (!hasPermission(userRole, 'data:edit')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!keywords || keywords.length === 0) {
          return NextResponse.json(
            { error: 'Keywords are required for removeKeywords operation' },
            { status: 400 }
          );
        }

        if (type !== 'companies') {
          return NextResponse.json(
            { error: 'removeKeywords operation is only valid for companies' },
            { status: 400 }
          );
        }

        await db
          .update(companies)
          .set({
            keywords: sql`array(select unnest(${companies.keywords}) except select unnest(ARRAY[${sql.join(keywords.map(k => sql`${k}`), sql`, `)}]::varchar[]))`,
            updatedAt: new Date(),
          })
          .where(inArray(companies.id, ids));

        return NextResponse.json({
          message: `Successfully removed keywords from ${ids.length} companies`,
          count: ids.length,
        });

      case 'export':
        if (!hasPermission(userRole, 'data:export')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let data;
        if (type === 'companies') {
          data = await db
            .select()
            .from(companies)
            .where(inArray(companies.id, ids));
        } else {
          data = await db
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
              companyName: companies.name,
            })
            .from(contacts)
            .leftJoin(companies, sql`${contacts.companyId} = ${companies.id}`)
            .where(inArray(contacts.id, ids));
        }

        return NextResponse.json({
          data,
          count: data.length,
          type,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
