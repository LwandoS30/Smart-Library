import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { Author, Book, readData, updateData } from "../storage";

const router = Router();
const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return true; }
  return false;
};
const withAuthors = (book: Book, authors: Author[]) => ({
  id: book.id, title: book.title, publishedAt: book.publishedAt,
  authors: book.authorIds.map((id) => authors.find((author) => author.id === id)).filter((author): author is Author => author !== undefined),
});

router.get("/", async (req: Request, res: Response) => {
  const { title, publishedAt } = req.query;
  const data = await readData();
  const books = data.books.filter((book) =>
    (!title || book.title.toLowerCase().includes(String(title).toLowerCase())) &&
    (!publishedAt || book.publishedAt === String(publishedAt))
  );
  res.status(200).json(books.sort((a, b) => a.id - b.id).map((book) => withAuthors(book, data.authors)));
});

router.get("/:id", [param("id").isInt().withMessage("ID must be an integer")], async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;
  const data = await readData();
  const book = data.books.find((item) => item.id === Number(req.params.id));
  if (!book) { res.status(404).send("Book not found"); return; }
  res.status(200).json(withAuthors(book, data.authors));
});

router.post("/", [
  body("title").notEmpty().withMessage("Title is required"),
  body("publishedAt").notEmpty().withMessage("Published year is required"),
  body("authors").isArray({ min: 1 }).withMessage("At least one author is required"),
  body("authors.*.fname").notEmpty().withMessage("Author first name required"),
  body("authors.*.lname").notEmpty().withMessage("Author last name required"),
], async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;
  let createdBook: Book | undefined;
  const data = await updateData((current) => {
    const authorIds = (req.body.authors as Omit<Author, "id">[]).map((author) => {
      const existing = current.authors.find((item) => item.fname.toLowerCase() === author.fname.toLowerCase() && item.lname.toLowerCase() === author.lname.toLowerCase());
      if (existing) return existing.id;
      const id = Math.max(0, ...current.authors.map((item) => item.id)) + 1;
      current.authors.push({ id, ...author });
      return id;
    });
    createdBook = { id: Math.max(0, ...current.books.map((item) => item.id)) + 1, title: req.body.title, publishedAt: req.body.publishedAt, authorIds };
    current.books.push(createdBook);
    return current;
  });
  res.status(201).json(withAuthors(createdBook!, data.authors));
});

router.put("/:id", [
  param("id").isInt().withMessage("ID must be an integer"),
  body("title").optional().notEmpty().withMessage("Title cannot be empty"),
  body("publishedAt").optional().notEmpty().withMessage("Published year cannot be empty"),
  body("authorIds").optional().isArray().withMessage("Author IDs must be an array"),
  body("authorIds.*").optional().isInt().withMessage("Author IDs must be integers"),
], async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;
  let found = false;
  const data = await updateData((current) => {
    const book = current.books.find((item) => item.id === Number(req.params.id));
    if (!book) return current;
    found = true;
    if (req.body.title !== undefined) book.title = req.body.title;
    if (req.body.publishedAt !== undefined) book.publishedAt = req.body.publishedAt;
    if (req.body.authorIds !== undefined) book.authorIds = req.body.authorIds;
    return current;
  });
  if (!found) { res.status(404).send("Book not found"); return; }
  const book = data.books.find((item) => item.id === Number(req.params.id))!;
  res.status(200).json(withAuthors(book, data.authors));
});

router.delete("/:id", [param("id").isInt().withMessage("ID must be an integer")], async (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;
  let deleted = false;
  await updateData((current) => {
    const index = current.books.findIndex((item) => item.id === Number(req.params.id));
    if (index === -1) return current;
    current.books.splice(index, 1); deleted = true; return current;
  });
  if (!deleted) { res.status(404).send("Book not found"); return; }
  res.status(200).json({ message: "Book deleted successfully", id: Number(req.params.id) });
});

export default router;
