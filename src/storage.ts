import fs from "node:fs/promises";
import path from "node:path";

export type Author = { id: number; fname: string; lname: string };
export type Book = { id: number; title: string; publishedAt: string; authorIds: number[] };
type LibraryData = { authors: Author[]; books: Book[] };

const dataPath = path.join(process.cwd(), "data", "books.json");
const seedData: LibraryData = {
  authors: [
    { id: 1, fname: "Chinua", lname: "Achebe" },
    { id: 2, fname: "James", lname: "Frey" },
    { id: 3, fname: "Jobie", lname: "Hughes" },
    { id: 4, fname: "Witness K", lname: "Tamsanqa" },
  ],
  books: [
    { id: 1, title: "Things Fall Apart", publishedAt: "1958", authorIds: [1] },
    { id: 2, title: "I am Number Four", publishedAt: "2010", authorIds: [2, 3] },
    { id: 3, title: "Nyana wam! Nyana wam!", publishedAt: "2008", authorIds: [4] },
  ],
};

let writeQueue = Promise.resolve();

export const initializeStorage = async () => {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  try { await fs.access(dataPath); } catch { await writeData(seedData); }
};

export const readData = async (): Promise<LibraryData> => {
  return JSON.parse(await fs.readFile(dataPath, "utf8")) as LibraryData;
};

export const updateData = async (update: (data: LibraryData) => LibraryData) => {
  const operation = writeQueue.then(async () => {
    const data = update(await readData());
    await writeData(data);
    return data;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
};

const writeData = async (data: LibraryData) => {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
};
