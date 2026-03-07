jest.mock("../db", () => require("./testDB"));
const { identifyContact } = require("../services/contactService");
const db = require("./testDB");

// Clear the Contact table before each test
beforeEach(async () => {
  await db.query(`DELETE FROM "Contact"`);
  // Reset the ID sequence so IDs are predictable
  await db.query(`ALTER SEQUENCE "Contact_id_seq" RESTART WITH 1`);
});

// Close DB connection after all tests
afterAll(async () => {
  await db.query(`DELETE FROM "Contact"`);
  await db.query(`ALTER SEQUENCE "Contact_id_seq" RESTART WITH 1`);
  await db.pool.end();
});

// Test 1: Brand new contact
test("creates a new primary contact if no match exists", async () => {
  const result = await identifyContact({
    email: "lorraine@hillvalley.edu",
    phoneNumber: "123456",
  });

  expect(result.contact.primaryContatctId).toBe(1);
  expect(result.contact.emails).toEqual(["lorraine@hillvalley.edu"]);
  expect(result.contact.phoneNumbers).toEqual(["123456"]);
  expect(result.contact.secondaryContactIds).toEqual([]);
});

// Test 2: New info on existing contact creates secondary
test("creates a secondary contact when new info matches existing contact", async () => {
  // create same entry as pdf example
  const { rows } = await db.query(
    `INSERT INTO "Contact" ("phoneNumber", email, "linkedId", "linkPrecedence", "createdAt", "updatedAt")
     VALUES ('123456', 'lorraine@hillvalley.edu', null, 'primary', '2023-04-01 00:00:00.374+00', '2023-04-01 00:00:00.374+00')
     RETURNING id`
  );
  const primaryId = rows[0].id;

  const result = await identifyContact({
    email: "mcfly@hillvalley.edu",
    phoneNumber: "123456",
  });

  expect(result.contact.primaryContatctId).toBe(primaryId); // use dynamic ID
  expect(result.contact.emails).toContain("lorraine@hillvalley.edu");
  expect(result.contact.emails).toContain("mcfly@hillvalley.edu");
  expect(result.contact.emails[0]).toBe("lorraine@hillvalley.edu");
  expect(result.contact.phoneNumbers).toEqual(["123456"]);
  expect(result.contact.secondaryContactIds.length).toBe(1);
});

// Test 3: Two primaries get merged
test("demotes newer primary to secondary when two clusters are bridged", async () => {
  // Set up existing state from PDF example
  await db.query(
    `INSERT INTO "Contact" (id, "phoneNumber", email, "linkedId", "linkPrecedence", "createdAt", "updatedAt")
     VALUES 
       (11, '919191', 'george@hillvalley.edu', null, 'primary', '2023-04-11 00:00:00.374+00', '2023-04-11 00:00:00.374+00'),
       (27, '717171', 'biffsucks@hillvalley.edu', null, 'primary', '2023-04-21 05:30:00.11+00', '2023-04-21 05:30:00.11+00')`
  );

  const result = await identifyContact({
    email: "george@hillvalley.edu",
    phoneNumber: "717171",
  });

  expect(result.contact.primaryContatctId).toBe(11); // older one wins
  expect(result.contact.emails[0]).toBe("george@hillvalley.edu"); // primary's email first
  expect(result.contact.emails).toContain("biffsucks@hillvalley.edu");
  expect(result.contact.phoneNumbers[0]).toBe("919191"); // primary's phone first
  expect(result.contact.phoneNumbers).toContain("717171");
  expect(result.contact.secondaryContactIds).toContain(27); // demoted
});

// Test 4: Exact match, no new info
test("returns existing contact without creating new rows if no new info", async () => {
  await db.query(
    `INSERT INTO "Contact" (id, "phoneNumber", email, "linkedId", "linkPrecedence", "createdAt", "updatedAt")
     VALUES (1, '123456', 'lorraine@hillvalley.edu', null, 'primary', '2023-04-01 00:00:00.374+00', '2023-04-01 00:00:00.374+00')`
  );

  const result = await identifyContact({
    email: "lorraine@hillvalley.edu",
    phoneNumber: "123456",
  });

  expect(result.contact.primaryContatctId).toBe(1);
  expect(result.contact.secondaryContactIds).toEqual([]); // no new secondary created
});

// Test 5: Only email provided
test("handles request with only email", async () => {
  const result = await identifyContact({
    email: "lorraine@hillvalley.edu",
    phoneNumber: null,
  });

  expect(result.contact.primaryContatctId).toBeDefined();
  expect(result.contact.emails).toContain("lorraine@hillvalley.edu");
  expect(result.contact.secondaryContactIds).toEqual([]);
});

// Test 6: Only phone provided
test("handles request with only phone number", async () => {
  const result = await identifyContact({
    email: null,
    phoneNumber: "123456",
  });

  expect(result.contact.primaryContatctId).toBeDefined();
  expect(result.contact.phoneNumbers).toContain("123456");
  expect(result.contact.secondaryContactIds).toEqual([]);
});