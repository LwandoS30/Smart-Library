# Smart Library API

A REST API built with Node.js, Express, and TypeScript for managing books and authors.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

The API runs at `http://localhost:3000` by default. Set `PORT` to use another port:

```bash
PORT=8080 npm run dev
```

## Production deployment

Build and start the compiled application:

```bash
npm install
npm run build
npm start
```

The host should run `npm start` and provide its assigned port through the `PORT` environment variable. The server listens on all network interfaces, as required by most hosting platforms. The deployment health check can use `GET /health`.

### Render and Neon

1. Create a Neon project and copy its pooled connection string.
2. Create a Render Web Service connected to this repository.
3. Set Render's build command to `npm install && npm run build` and start command to `npm start`.
4. Add `DATABASE_URL` in Render using the Neon connection string. Add `FRONTEND_URL` with the Netlify site URL, for example `https://your-site.netlify.app`.
5. Set Render's health check path to `/health`.

The server creates the required tables on first startup and seeds the initial sample books only when the database is empty. Keep `DATABASE_URL` private and use Neon's pooled connection string for a hosted service.

## API endpoints

Base URL: `/v1/books`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Get all books, optionally filtered by `title` or `publishedAt` |
| GET | `/:id` | Get one book by ID |
| POST | `/` | Create a book with one or more authors |
| PUT | `/:id` | Update an existing book |
| DELETE | `/:id` | Delete a book |

Data is currently stored in memory, so it resets whenever the hosted process restarts. Use a database before relying on this API for persistent production data.# Smart-Library

A simple RESTful API built with **Node.js**, **Express**, and **TypeScript** to manage books and their authors.  
It supports creating, reading, updating, and deleting books, with author management and filtering features.

Features
- Add new books with one or multiple authors.
- View all books or a specific book by ID.
- Filter books by title or publication year.
- Update existing book details.
- Delete books by ID.
- Middleware logger for tracking requests.

  Tech Stack
- Node.js  
- Express 
- TypeScript  
- Express-Validator (for validation)  
- Body-Parser

  Clone repo
  bash
git clone <your-repo-url>
cd project-folder

Install dependencies
 "@types/express": "^5.0.3",
    "@types/node": "^24.4.0",
    "body-parser": "^2.2.0",
    "express": "^5.1.0",
    "express-validator": "^7.2.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.2"
tsconfig.json file should look the as follows:
{
  // Visit https://aka.ms/tsconfig to read more about this file
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true
  }
}
    Run the server
    npx ts-node server.ts
    On the package.json edit the scripts to the following:
    "start": "ts-node src/server.ts",
    "dev": "nodemon --exec ts-node src/server.ts"
    
    npm run dev

    server will be running on:
    http://localhost:3000

    API Endpoints
Base URL: http://localhost:3000/v1/books
Method	Endpoint	Description
GET	/	Get all books (with filtering)
GET	/:id	Get a single book by ID
POST	/	Create a new book with authors
PUT	/:id	Update an existing book
DELETE	/:id	Delete a book by ID
