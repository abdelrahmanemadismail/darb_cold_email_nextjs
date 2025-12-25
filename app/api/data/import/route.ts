import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies } from '@/db/schema/companies';
import { contacts } from '@/db/schema/contacts';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

interface ImportRow {
  'First Name': string;
  'Last name': string;
  'Company': string;
  'Position': string;
  'Email': string;
  'Mobile': string;
  'Linkedin': string;
  'Email Stutse': string;
  'Company size': string;
  'Company keyord': string;
  'Country': string;
  'City': string;
  'Gender': string;
  'Tags': string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as UserRole;
    if (!hasPermission(userRole, 'data:import')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { data: rows } = body as { data: ImportRow[] };

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      companiesCreated: 0,
      contactsCreated: 0,
    };

    // Process each row
    for (const row of rows) {
      try {
        // Skip empty rows
        if (!row['First Name'] && !row['Last name'] && !row['Email']) {
          continue;
        }

        let companyId: string | null = null;

        // Create or find company
        if (row['Company']) {
          const companyName = row['Company'].trim();

          // Check if company exists
          const [existingCompany] = await db
            .select()
            .from(companies)
            .where(eq(companies.name, companyName))
            .limit(1);

          if (existingCompany) {
            companyId = existingCompany.id;
          } else {
            // Create new company
            const keywords = row['Company keyord']
              ? row['Company keyord'].split(',').map(k => k.trim()).filter(Boolean)
              : [];

            const [newCompany] = await db
              .insert(companies)
              .values({
                name: companyName,
                size: row['Company size'] || null,
                city: row['City'] || null,
                country: row['Country'] || null,
                keywords,
                source: 'import',
                createdBy: session.user.email,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();

            companyId = newCompany.id;
            results.companiesCreated++;
          }
        }

        // Check if contact already exists
        const email = row['Email'].trim();
        const [existingContact] = await db
          .select()
          .from(contacts)
          .where(eq(contacts.email, email))
          .limit(1);

        if (existingContact) {
          results.errors.push(`Contact with email ${email} already exists`);
          results.failed++;
          continue;
        }

        // Create contact
        const tags = row['Tags']
          ? row['Tags'].split(',').map(t => t.trim()).filter(Boolean)
          : [];

        const isEmailVerified = row['Email Stutse']?.toLowerCase() === 'verified';

        let gender: string | null = null;
        if (row['Gender']) {
          const genderMap: Record<string, string> = {
            'male': 'male',
            'female': 'female',
            'other': 'other',
          };
          gender = genderMap[row['Gender'].toLowerCase()] || null;
        }

        await db.insert(contacts).values({
          firstName: row['First Name']?.trim() || '',
          lastName: row['Last name']?.trim() || '',
          email,
          phone: row['Mobile'] || null,
          gender,
          position: row['Position'] || null,
          companyId,
          linkedinUrl: row['Linkedin'] || null,
          isEmailVerified,
          tags,
          notes: null,
          createdBy: session.user.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        results.contactsCreated++;
        results.success++;
      } catch (error) {
        console.error('Error importing row:', error);
        results.failed++;
        results.errors.push(
          `Failed to import ${row['First Name']} ${row['Last name']}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}
