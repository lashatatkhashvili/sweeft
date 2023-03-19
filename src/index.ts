import express, { Application, Request, Response } from "express";
import cors from "cors";
import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import users from "./routes/users";
import categories from "./routes/categories";
import transactions from "./routes/transactions";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

const MONGODB_URI: string = process.env.MONGODB_URI || "";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error: any) => {
    console.log("error connection to MongoDB:", error.message);
  });

app.get("/", (req: Request, res: Response) => {
  res.send("Financial application");
});

app.use("/user", users);
app.use("/categories", categories);
app.use("/transactions", transactions);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
