import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", publishedAt: "", fname: "", lname: "" });

  const loadBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/v1/books`);
      if (!response.ok) throw new Error("The library API could not be reached.");
      setBooks(await response.json());
    } catch (requestError) {
      setError(requestError.message || "Unable to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks = books.filter((book) =>
    `${book.title} ${book.authors.map((author) => `${author.fname} ${author.lname}`).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const submitBook = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/v1/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          publishedAt: form.publishedAt,
          authors: [{ fname: form.fname, lname: form.lname }],
        }),
      });
      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.errors?.[0]?.msg || "Unable to add this book.");
      }
      const createdBook = await response.json();
      setBooks((currentBooks) => [...currentBooks, createdBook]);
      setForm({ title: "", publishedAt: "", fname: "", lname: "" });
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message || "Unable to add this book.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm("Remove this book from the library?")) return;
    try {
      const response = await fetch(`${API_URL}/v1/books/${bookId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete this book.");
      setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this book.");
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Smart Library home">
          <span className="brand-mark"><BookOpen size={20} /></span>
          <span>Smart Library</span>
        </a>
        <span className="status-pill"><span className="status-dot" /> Collection desk</span>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">Your reading archive</p>
          <h1>A calmer way to<br /><em>keep track of books.</em></h1>
          <p className="intro-copy">Browse the collection, discover familiar names, and keep every title within reach.</p>
        </div>
        <div className="stats" aria-label="Collection statistics">
          <div><strong>{books.length}</strong><span>Titles</span></div>
          <div><strong>{new Set(books.flatMap((book) => book.authors.map((author) => `${author.fname} ${author.lname}`))).size}</strong><span>Authors</span></div>
        </div>
      </section>

      <section className="toolbar" aria-label="Book controls">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles or authors" />
        </label>
        <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18} /> Add book</button>
      </section>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {showForm && (
        <div className="form-panel">
          <div className="form-heading"><div><p className="eyebrow">New entry</p><h2>Add a book</h2></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close form"><X size={20} /></button></div>
          <form onSubmit={submitBook} className="book-form">
            <label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Published year<input required value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} /></label>
            <label>Author first name<input required value={form.fname} onChange={(event) => setForm({ ...form, fname: event.target.value })} /></label>
            <label>Author last name<input required value={form.lname} onChange={(event) => setForm({ ...form, lname: event.target.value })} /></label>
            <button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} {saving ? "Adding..." : "Add to collection"}</button>
          </form>
        </div>
      )}

      <section className="collection-section">
        <div className="section-heading"><div><p className="eyebrow">The collection</p><h2>{query ? "Matching books" : "Recently catalogued"}</h2></div><span>{filteredBooks.length} shown</span></div>
        {loading ? <div className="empty-state"><LoaderCircle className="spin" size={25} /><p>Opening the collection...</p></div> : filteredBooks.length === 0 ? <div className="empty-state"><BookOpen size={28} /><p>{error ? "Start the API to load your books." : "No books match your search."}</p></div> : <div className="book-grid">{filteredBooks.map((book) => <article className="book-card" key={book.id}><div className="book-number">{String(book.id).padStart(2, "0")}</div><div className="book-card-content"><h3>{book.title}</h3><p className="authors">{book.authors.map((author) => `${author.fname} ${author.lname}`).join(", ")}</p><p className="year">Published {book.publishedAt}</p></div><button className="delete-button" onClick={() => deleteBook(book.id)} aria-label={`Delete ${book.title}`}><Trash2 size={17} /></button></article>)}</div>}
      </section>
      <footer>Smart Library</footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);