import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, isErrorResponse } from '@/lib/api-auth';
import { db } from '@/db';
import { contacts } from '@/db/schema/contacts';
import { eq } from 'drizzle-orm';

/**
 * GET /api/contacts/[contactId]
 * Fetch a single contact by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const authResult = await requirePermission(request, 'data:view');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { contactId } = await params;

    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

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

/**
 * PUT /api/contacts/[contactId]
 * Update a contact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const authResult = await requirePermission(request, 'data:edit');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { contactId } = await params;
    const body = await request.json();

    // Check if contact exists
    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // If email is being changed, check for duplicates
    if (body.email && body.email !== existingContact.email) {
      const [duplicate] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.email, body.email))
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { error: 'A contact with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Extract only allowed fields (exclude readonly fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, createdBy, companyName, companyDomain, ...allowedFields } = body;

    // Update contact
    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...allowedFields,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[contactId]
 * Delete a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const authResult = await requirePermission(request, 'data:delete');
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { contactId } = await params;

    // Check if contact exists
    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Delete contact
    await db.delete(contacts).where(eq(contacts.id, contactId));

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
