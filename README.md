# Smart Library API

A REST API built with Node.js, Express, and TypeScript for managing books and authors. Data is persisted locally in `data/books.json`; no database or external service is required.

## Run locally

	npm install
	npm run dev

The API runs at http://localhost:3000 by default. Set `PORT` to use another port.

## Production

	npm run build
	npm start

The frontend is built separately:

	cd frontend
	npm ci
	npm run build

Set `VITE_API_URL` to the deployed API URL when building the frontend. Set
`FRONTEND_URL` on the API to the frontend origin. The repository includes
`render.yaml` for deploying both services to Render. The API uses a persistent
disk for `data/books.json`; do not deploy it on an ephemeral filesystem if
book changes must survive restarts.

## API endpoints

Base URL: `/v1/books`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Get all books, optionally filtered by title or publishedAt |
| GET | `/:id` | Get one book by ID |
| POST | `/` | Create a book with one or more authors |
| PUT | `/:id` | Update an existing book |
| DELETE | `/:id` | Delete a book |