import express, { Express } from "express";
import bodyParser from "body-parser";
import { loggerMiddleware } from "./Middelware/logger";
import router from './routes/books'

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.json());

app.use(loggerMiddleware);
app.use("/v1/books", router);

app.listen(PORT, () => {
    console.log(`Sever is running on http://localhost:${PORT}`);
});