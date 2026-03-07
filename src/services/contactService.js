const db = require("../db");

const identifyContact = async ({ email, phoneNumber }) => {
  // 1. Find all contacts matching either email or phoneNumber

  // db query returns this :
  // {
  //   rows: [
  //     { id: 1, email: "a@mail.com" },
  //     { id: 2, email: "b@mail.com" }
  //   ],
  //   rowCount: 2,
  //   command: "SELECT"
  // }

  const { rows: matchingContacts } = await db.query(
    `SELECT * FROM "Contact" 
     WHERE "deletedAt" IS NULL 
     AND ("email" = $1 OR "phoneNumber" = $2)
     AND ($1 IS NOT NULL OR $2 IS NOT NULL)`,
    [email ?? null, phoneNumber ?? null]
  ); // equivalent to result = db.query(); matchingContacts = result.rows

  // 2. No matches, create brand new customer
  if (matchingContacts.length === 0) {
    const { rows } = await db.query(
      `INSERT INTO "Contact" ("email", "phoneNumber", "linkPrecedence", "createdAt", "updatedAt")
       VALUES ($1, $2, 'primary', NOW(), NOW())
       RETURNING *`,
      [email ?? null, phoneNumber ?? null]
    );
    return buildResponse(rows[0], []);
  }

  // 3. Collect all primary IDs from matching contacts
  const primaryIds = new Set();
  for (const contact of matchingContacts) {
    if (contact.linkPrecedence === "primary") {
      primaryIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryIds.add(contact.linkedId);
    }
  }

  // 4. Fetch all primaries, oldest first
  const { rows: primaries } = await db.query(
    `SELECT * FROM "Contact" 
     WHERE id = ANY($1) AND "deletedAt" IS NULL
     ORDER BY "createdAt" ASC`,
    [Array.from(primaryIds)]
  );

  const truePrimary = primaries[0];

  // 5. If multiple primaries, demote newer ones to secondary
  if (primaries.length > 1) {
    const toDemoteIds = primaries.slice(1).map((p) => p.id);

    await db.query(
      `UPDATE "Contact"
       SET "linkPrecedence" = 'secondary', "linkedId" = $1, "updatedAt" = NOW()
       WHERE id = ANY($2)`,
      [truePrimary.id, toDemoteIds]
    );

    // Re-link any secondaries that were pointing to the demoted primaries
    await db.query(
      `UPDATE "Contact"
       SET "linkedId" = $1, "updatedAt" = NOW()
       WHERE "linkedId" = ANY($2) AND "deletedAt" IS NULL`,
      [truePrimary.id, toDemoteIds]
    );
  }

  // 6. Fetch all secondaries under truePrimary
  const { rows: allSecondaries } = await db.query(
    `SELECT * FROM "Contact"
     WHERE "linkedId" = $1 AND "deletedAt" IS NULL`,
    [truePrimary.id]
  );

  // 7. Check if request contains new info not already in the cluster
  const allEmails = new Set(
    [truePrimary, ...allSecondaries].map((c) => c.email).filter(Boolean)
  );
  const allPhones = new Set(
    [truePrimary, ...allSecondaries].map((c) => c.phoneNumber).filter(Boolean)
  );

  const isNewEmail = email && !allEmails.has(email);
  const isNewPhone = phoneNumber && !allPhones.has(phoneNumber);

  if (isNewEmail || isNewPhone) {
    const { rows: newSecondaryRows } = await db.query(
      `INSERT INTO "Contact" ("email", "phoneNumber", "linkedId", "linkPrecedence", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'secondary', NOW(), NOW())
       RETURNING *`,
      [email ?? null, phoneNumber ?? null, truePrimary.id]
    );
    allSecondaries.push(newSecondaryRows[0]);
  }

  return buildResponse(truePrimary, allSecondaries);
};

const buildResponse = (primary, secondaries) => {
  const emails = [];
  const phoneNumbers = [];

  // Primary's values always come first
  if (primary.email) emails.push(primary.email);
  if (primary.phoneNumber) phoneNumbers.push(primary.phoneNumber);

  for (const s of secondaries) {
    if (s.email && !emails.includes(s.email)) emails.push(s.email);
    if (s.phoneNumber && !phoneNumbers.includes(s.phoneNumber)) phoneNumbers.push(s.phoneNumber);
  }

  return {
    contact: {
      primaryContatctId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaries.map((s) => s.id),
    },
  };
};

module.exports = { identifyContact };