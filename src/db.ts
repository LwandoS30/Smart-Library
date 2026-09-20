import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: { rejectUnauthorized: false },
});

export const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS authors (
      id SERIAL PRIMARY KEY,
      fname TEXT NOT NULL,
      lname TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      published_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS book_authors (
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
      PRIMARY KEY (book_id, author_id)
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM books");
  if (rows[0].count > 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const seededAuthors = [
      ["Chinua", "Achebe"],
      ["James", "Frey"],
      ["Jobie", "Hughes"],
      ["Witness K", "Tamsanqa"],
    ];
    const authorIds: number[] = [];

    for (const [fname, lname] of seededAuthors) {
      const result = await client.query(
        "INSERT INTO authors (fname, lname) VALUES ($1, $2) RETURNING id",
        [fname, lname]
      );
      authorIds.push(result.rows[0].id);
    }

    const seededBooks = [
      ["Things Fall Apart", "1958", [authorIds[0]]],
      ["I am Number Four", "2010", [authorIds[1], authorIds[2]]],
      ["Nyana wam! Nyana wam!", "2008", [authorIds[3]]],
    ] as const;

    for (const [title, publishedAt, authors] of seededBooks) {
      const book = await client.query(
        "INSERT INTO books (title, published_at) VALUES ($1, $2) RETURNING id",
        [title, publishedAt]
      );
      for (const authorId of authors) {
        await client.query(
          "INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)",
          [book.rows[0].id, authorId]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
