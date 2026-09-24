CREATE TABLE "authors" (
	"id" serial PRIMARY KEY,
	"fname" text NOT NULL,
	"lname" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_authors" (
	"book_id" integer,
	"author_id" integer,
	CONSTRAINT "book_authors_pkey" PRIMARY KEY("book_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"published_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE RESTRICT;--> statement-breakpoint
INSERT INTO "authors" ("fname", "lname") VALUES
	('Chinua', 'Achebe'),
	('James', 'Frey'),
	('Jobie', 'Hughes'),
	('Witness K', 'Tamsanqa');--> statement-breakpoint
INSERT INTO "books" ("title", "published_at") VALUES
	('Things Fall Apart', '1958'),
	('I am Number Four', '2010'),
	('Nyana wam! Nyana wam!', '2008');--> statement-breakpoint
INSERT INTO "book_authors" ("book_id", "author_id")
SELECT b.id, a.id FROM "books" b, "authors" a
WHERE (b.title = 'Things Fall Apart' AND a.fname = 'Chinua' AND a.lname = 'Achebe')
   OR (b.title = 'I am Number Four' AND a.fname = 'James' AND a.lname = 'Frey')
   OR (b.title = 'I am Number Four' AND a.fname = 'Jobie' AND a.lname = 'Hughes')
   OR (b.title = 'Nyana wam! Nyana wam!' AND a.fname = 'Witness K' AND a.lname = 'Tamsanqa');