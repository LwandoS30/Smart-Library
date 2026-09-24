import { pgTable, serial, text, integer, primaryKey } from "drizzle-orm/pg-core";

export const authors = pgTable("authors", {
  id: serial().primaryKey(),
  fname: text().notNull(),
  lname: text().notNull(),
});

export const books = pgTable("books", {
  id: serial().primaryKey(),
  title: text().notNull(),
  publishedAt: text("published_at").notNull(),
});

export const bookAuthors = pgTable(
  "book_authors",
  {
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.bookId, table.authorId] })]
);
