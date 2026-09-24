import type { Config, Context } from "@netlify/functions";
import { and, asc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { authors, bookAuthors, books } from "../../db/schema.js";

type AuthorInput = { fname: string; lname: string };
type BookRow = { id: number; title: string; publishedAt: string };

const jsonResponse = (data: unknown, status = 200) => Response.json(data, { status });

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isValidAuthorList = (value: unknown): value is AuthorInput[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((author) => isNonEmptyString(author?.fname) && isNonEmptyString(author?.lname));

const isIntegerId = (value: string) => /^\d+$/.test(value);

const attachAuthors = async (bookRows: BookRow[]) => {
  if (!bookRows.length) return [];
  const bookIds = bookRows.map((book) => book.id);
  const links = await db
    .select({ bookId: bookAuthors.bookId, id: authors.id, fname: authors.fname, lname: authors.lname })
    .from(bookAuthors)
    .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
    .where(inArray(bookAuthors.bookId, bookIds))
    .orderBy(asc(authors.id));

  const grouped = new Map<number, { id: number; fname: string; lname: string }[]>();
  for (const link of links) {
    const list = grouped.get(link.bookId) ?? [];
    list.push({ id: link.id, fname: link.fname, lname: link.lname });
    grouped.set(link.bookId, list);
  }
  return bookRows.map((book) => ({ ...book, authors: grouped.get(book.id) ?? [] }));
};

const getBookById = async (id: number) => {
  const [book] = await db
    .select({ id: books.id, title: books.title, publishedAt: books.publishedAt })
    .from(books)
    .where(eq(books.id, id));
  if (!book) return null;
  const [withAuthors] = await attachAuthors([book]);
  return withAuthors;
};

const listBooks = async (req: Request) => {
  const url = new URL(req.url);
  const title = url.searchParams.get("title");
  const publishedAt = url.searchParams.get("publishedAt");

  const conditions = [];
  if (title) conditions.push(ilike(books.title, `%${title}%`));
  if (publishedAt) conditions.push(eq(books.publishedAt, publishedAt));

  const query = db
    .select({ id: books.id, title: books.title, publishedAt: books.publishedAt })
    .from(books)
    .orderBy(asc(books.id));
  const bookRows = conditions.length ? await query.where(and(...conditions)) : await query;
  return jsonResponse(await attachAuthors(bookRows));
};

const getBook = async (id: string) => {
  if (!isIntegerId(id)) return jsonResponse({ errors: [{ msg: "ID must be an integer" }] }, 400);
  const book = await getBookById(Number(id));
  if (!book) return new Response("Book not found", { status: 404 });
  return jsonResponse(book);
};

const createBook = async (req: Request) => {
  const body = await req.json().catch(() => null);
  const errors: { msg: string }[] = [];
  if (!isNonEmptyString(body?.title)) errors.push({ msg: "Title is required" });
  if (!isNonEmptyString(body?.publishedAt)) errors.push({ msg: "Published year is required" });
  if (!isValidAuthorList(body?.authors)) {
    errors.push({ msg: "At least one author with first and last name is required" });
  }
  if (errors.length) return jsonResponse({ errors }, 400);

  const bookId = await db.transaction(async (tx) => {
    const authorIds: number[] = [];
    for (const author of body.authors as AuthorInput[]) {
      const [existing] = await tx
        .select({ id: authors.id })
        .from(authors)
        .where(and(ilike(authors.fname, author.fname), ilike(authors.lname, author.lname)))
        .limit(1);
      if (existing) {
        authorIds.push(existing.id);
      } else {
        const [created] = await tx.insert(authors).values(author).returning({ id: authors.id });
        authorIds.push(created.id);
      }
    }
    const [book] = await tx
      .insert(books)
      .values({ title: body.title, publishedAt: body.publishedAt })
      .returning({ id: books.id });
    await tx.insert(bookAuthors).values(authorIds.map((authorId) => ({ bookId: book.id, authorId })));
    return book.id;
  });

  return jsonResponse(await getBookById(bookId), 201);
};

const putBook = async (req: Request, id: string) => {
  if (!isIntegerId(id)) return jsonResponse({ errors: [{ msg: "ID must be an integer" }] }, 400);
  const numericId = Number(id);

  const body = await req.json().catch(() => null);
  const errors: { msg: string }[] = [];
  if (body?.title !== undefined && !isNonEmptyString(body.title)) errors.push({ msg: "Title cannot be empty" });
  if (body?.publishedAt !== undefined && !isNonEmptyString(body.publishedAt)) {
    errors.push({ msg: "Published year cannot be empty" });
  }
  if (
    body?.authorIds !== undefined &&
    (!Array.isArray(body.authorIds) || !body.authorIds.every((authorId: unknown) => Number.isInteger(authorId)))
  ) {
    errors.push({ msg: "Author IDs must be integers" });
  }
  if (errors.length) return jsonResponse({ errors }, 400);

  const found = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: books.id }).from(books).where(eq(books.id, numericId));
    if (!existing) return false;

    const updates: Partial<{ title: string; publishedAt: string }> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.publishedAt !== undefined) updates.publishedAt = body.publishedAt;
    if (Object.keys(updates).length) {
      await tx.update(books).set(updates).where(eq(books.id, numericId));
    }

    if (body.authorIds !== undefined) {
      await tx.delete(bookAuthors).where(eq(bookAuthors.bookId, numericId));
      if (body.authorIds.length) {
        await tx
          .insert(bookAuthors)
          .values(body.authorIds.map((authorId: number) => ({ bookId: numericId, authorId })));
      }
    }
    return true;
  });

  if (!found) return new Response("Book not found", { status: 404 });
  return jsonResponse(await getBookById(numericId));
};

const deleteBook = async (id: string) => {
  if (!isIntegerId(id)) return jsonResponse({ errors: [{ msg: "ID must be an integer" }] }, 400);
  const [deleted] = await db.delete(books).where(eq(books.id, Number(id))).returning({ id: books.id });
  if (!deleted) return new Response("Book not found", { status: 404 });
  return jsonResponse({ message: "Book deleted successfully", id: deleted.id });
};

export default async (req: Request, context: Context) => {
  const id = context.params.id;

  try {
    if (req.method === "GET" && !id) return await listBooks(req);
    if (req.method === "GET" && id) return await getBook(id);
    if (req.method === "POST" && !id) return await createBook(req);
    if (req.method === "PUT" && id) return await putBook(req, id);
    if (req.method === "DELETE" && id) return await deleteBook(id);
    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

export const config: Config = {
  path: ["/v1/books", "/v1/books/:id"],
};
