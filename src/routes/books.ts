import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";

const router = Router();

let authors = [
  { id: 1, fname: "Chinua", lname: "Achebe" },
  { id: 2, fname: "James", lname: "Frey" },
  { id: 3, fname: "Jobie", lname: "Hughes" },
  { id: 4, fname: "Witness K", lname: "Tamsanqa" },
];

let books = [
  { id: 1, title: "Things Fall Apart", publishedAt: "1958", authorIds: [1] },
  { id: 2, title: "I am Number Four", publishedAt: "2010", authorIds: [2, 3] },
  { id: 3, title: "Nyana wam! Nyana wam!", publishedAt: "2008", authorIds: [4] },
];

//Helper: Get author objects for given IDs

const getAuthorsForBook = (authorIds: number[]) => {
  return authors.filter((author) => authorIds.includes(author.id));
};
 
const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

// GET all books with authors
router.get("/", (req: Request, res: Response) => {
  const { title, publishedAt } = req.query;

  let result = books;

  // Filter by title (case-insensitive)
  if (title) {
    result = result.filter((book) =>
      book.title.toLowerCase().includes(String(title).toLowerCase())
    );
  }

  // Filter by year published
  if (publishedAt) {
    result = result.filter((book) => book.publishedAt === String(publishedAt));
  }

  // Attach author details
  const booksWithAuthors = result.map((book) => ({
    ...book,
    authors: getAuthorsForBook(book.authorIds),
  }));

  res.status(200).json(booksWithAuthors);
});

// GET a single book by ID
router.get(
  "/:id",
  [param("id").isInt().withMessage("ID must be an integer")],
  (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const book = books.find((book) => book.id === parseInt(id));

    if (!book) {
      return res.status(404).send("Book not found");
    }

    res.status(200).json({ ...book, authors: getAuthorsForBook(book.authorIds) });
  }
);

// POST: Add a new book and its authors 
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("publishedAt").notEmpty().withMessage("Published year is required"),
    body("authors")
      .isArray({ min: 1 })
      .withMessage("At least one author is required"),
    body("authors.*.fname").notEmpty().withMessage("Author first name required"),
    body("authors.*.lname").notEmpty().withMessage("Author last name required"),
  ],
  (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;

    const { title, publishedAt, authors: newAuthors } = req.body;

    // Check for existing authors
    const authorIds: number[] = newAuthors.map((newAuthor: any) => {
      const existingAuthor = authors.find(
        (a) =>
          a.fname.toLowerCase() === newAuthor.fname.toLowerCase() &&
          a.lname.toLowerCase() === newAuthor.lname.toLowerCase()
      );

      if (existingAuthor) {
        return existingAuthor.id;
      } else {
        const newId = authors.length + 1;
        authors.push({ id: newId, ...newAuthor });
        return newId;
      }
    });

    const newBook = {
      id: books.length + 1,
      title,
      publishedAt,
      authorIds,
    };

    books.push(newBook);

    res.status(201).json({ ...newBook, authors: getAuthorsForBook(authorIds) });
  }
);

// PUT: Update books
router.put(
  "/:id",
  [
    param("id").isInt().withMessage("ID must be an integer"),
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("publishedAt")
      .optional()
      .notEmpty()
      .withMessage("Published year cannot be empty"),
    body("authorIds")
      .optional()
      .isArray()
      .withMessage("Author IDs must be an array of integers"),
  ],
  (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { title, publishedAt, authorIds } = req.body;

    const bookIndex = books.findIndex((book) => book.id === parseInt(id));

    if (bookIndex === -1) {
      return res.status(404).send("Book not found");
    }

    // Update fields
    books[bookIndex] = {
      ...books[bookIndex],
      ...(title && { title }),
      ...(publishedAt && { publishedAt }),
      ...(authorIds && { authorIds }),
    };

    res.status(200).json({
      ...books[bookIndex],
      authors: getAuthorsForBook(books[bookIndex].authorIds),
    });
  }
);

// DELETE a book
router.delete(
  "/:id",
  [param("id").isInt().withMessage("ID must be an integer")],
  (req: Request, res: Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const bookIndex = books.findIndex((book) => book.id === parseInt(id));

    if (bookIndex === -1) {
      return res.status(404).send("Book not found");
    }

    const deletedBook = books.splice(bookIndex, 1);
    res.status(200).json({ message: "Book deleted successfully", deletedBook });
  }
);

export default router;
