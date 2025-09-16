# Smart-Library

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
