import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { pool } from "../db";

const router = Router();

const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

const booksQuery = `
  SELECT b.id, b.title, b.published_at AS "publishedAt",
    COALESCE(json_agg(json_build_object('id', a.id, 'fname', a.fname, 'lname', a.lname)
      ORDER BY a.id) FILTER (WHERE a.id IS NOT NULL), '[]') AS authors
  FROM books b
  LEFT JOIN book_authors ba ON ba.book_id = b.id
  LEFT JOIN authors a ON a.id = ba.author_id
`;

router.get("/", async (req: Request, res: Response) => {
  const { title, publishedAt } = req.query;
  const conditions: string[] = [];
  const values: string[] = [];

  if (title) {
    values.push(`%${String(title)}%`);
    conditions.push(`b.title ILIKE $${values.length}`);
  }
  if (publishedAt) {
    values.push(String(publishedAt));
    conditions.push(`b.published_at = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(`${booksQuery} ${where} GROUP BY b.id ORDER BY b.id`, values);
  res.status(200).json(result.rows);
});

router.get(
  "/:id",
  [param("id").isInt().withMessage("ID must be an integer")],
  async (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;
    const result = await pool.query(`${booksQuery} WHERE b.id = $1 GROUP BY b.id`, [req.params.id]);
    if (!result.rows[0]) {
      res.status(404).send("Book not found");
      return;
    }
    res.status(200).json(result.rows[0]);
  }
);

router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("publishedAt").notEmpty().withMessage("Published year is required"),
    body("authors").isArray({ min: 1 }).withMessage("At least one author is required"),
    body("authors.*.fname").notEmpty().withMessage("Author first name required"),
    body("authors.*.lname").notEmpty().withMessage("Author last name required"),
  ],
  async (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const authorIds: number[] = [];
      for (const author of req.body.authors) {
        const existing = await client.query(
          "SELECT id FROM authors WHERE LOWER(fname) = LOWER($1) AND LOWER(lname) = LOWER($2)",
          [author.fname, author.lname]
        );
        if (existing.rows[0]) {
          authorIds.push(existing.rows[0].id);
        } else {
          const created = await client.query(
            "INSERT INTO authors (fname, lname) VALUES ($1, $2) RETURNING id",
            [author.fname, author.lname]
          );
          authorIds.push(created.rows[0].id);
        }
      }

      const book = await client.query(
        "INSERT INTO books (title, published_at) VALUES ($1, $2) RETURNING id",
        [req.body.title, req.body.publishedAt]
      );
      for (const authorId of authorIds) {
        await client.query("INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)", [book.rows[0].id, authorId]);
      }
      await client.query("COMMIT");

      const created = await pool.query(`${booksQuery} WHERE b.id = $1 GROUP BY b.id`, [book.rows[0].id]);
      res.status(201).json(created.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);

router.put(
  "/:id",
  [
    param("id").isInt().withMessage("ID must be an integer"),
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("publishedAt").optional().notEmpty().withMessage("Published year cannot be empty"),
    body("authorIds").optional().isArray().withMessage("Author IDs must be an array"),
    body("authorIds.*").optional().isInt().withMessage("Author IDs must be integers"),
  ],
  async (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updates: string[] = [];
      const values: unknown[] = [];
      if (req.body.title !== undefined) {
        values.push(req.body.title);
        updates.push(`title = $${values.length}`);
      }
      if (req.body.publishedAt !== undefined) {
        values.push(req.body.publishedAt);
        updates.push(`published_at = $${values.length}`);
      }
      values.push(req.params.id);
      const existing = await client.query("SELECT id FROM books WHERE id = $1", [req.params.id]);
      if (!existing.rows[0]) {
        await client.query("ROLLBACK");
        res.status(404).send("Book not found");
        return;
      }
      if (updates.length) {
        await client.query(`UPDATE books SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
      }
      if (req.body.authorIds !== undefined) {
        await client.query("DELETE FROM book_authors WHERE book_id = $1", [req.params.id]);
        for (const authorId of req.body.authorIds) {
          await client.query("INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2)", [req.params.id, authorId]);
        }
      }
      await client.query("COMMIT");
      const updated = await pool.query(`${booksQuery} WHERE b.id = $1 GROUP BY b.id`, [req.params.id]);
      res.status(200).json(updated.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:id",
  [param("id").isInt().withMessage("ID must be an integer")],
  async (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;
    const result = await pool.query("DELETE FROM books WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows[0]) {
      res.status(404).send("Book not found");
      return;
    }
    res.status(200).json({ message: "Book deleted successfully", id: result.rows[0].id });
  }
);

export default router;
