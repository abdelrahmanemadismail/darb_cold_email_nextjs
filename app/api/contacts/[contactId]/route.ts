import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contacts } from '@/db/schema/contacts';
import { companies } from '@/db/schema/companies';
import { updateContactSchema } from '@/types/contact';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

type Params = {
  params: Promise<{
    contactId: string;
  }>;
};

// GET /api/contacts/[contactId] - Get single contact with details
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

    const { contactId } = await params;

    // Get contact with company details
    const [contact] = await db
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
          size: companies.size,
          city: companies.city,
          country: companies.country,
        },
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.id, contactId));

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/[contactId] - Update a contact
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

    const { contactId } = await params;
    const body = await request.json();
    const validatedData = updateContactSchema.parse(body);

    // Check email uniqueness if email is being updated
    if (validatedData.email) {
      const existingContact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.email, validatedData.email))
        .limit(1);

      if (existingContact.length > 0 && existingContact[0].id !== contactId) {
        return NextResponse.json(
          { error: 'A contact with this email already exists' },
          { status: 409 }
        );
      }
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

    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    if (!updatedContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[contactId] - Delete a contact
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

    const { contactId } = await params;

    const [deletedContact] = await db
      .delete(contacts)
      .where(eq(contacts.id, contactId))
      .returning();

    if (!deletedContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
