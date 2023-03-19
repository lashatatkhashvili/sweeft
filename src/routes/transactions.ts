import { Request, Response } from "express";
import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/user/user";
import Transaction from "../models/transaction/transaction";
import Category from "../models/category/category";

const getEmailFromToken = (request: Request) => {
  const authorization = request.get("authorization");

  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    // @ts-ignore
    const { email } = jwt.verify(authorization.substring(7), "secret");

    return email;
  }
  return null;
};

const router = express.Router();

router.post(
  "/add-transaction",
  async (request: Request, response: Response) => {
    try {
      const { type, description, price, groups, status } = request.body;

      const email = getEmailFromToken(request);

      let user = await User.findOne({ email });

      if (!user) {
        return response.status(401).json({
          error: "Invalid username or password",
        });
      }

      const transaction = new Transaction({
        type,
        description,
        price,
        status: type === "expense" ? status || null : null,
        user: user,
        categories: [],
      });

      if (groups && groups.length) {
        for (let categoryName of groups) {
          const category = await Category.findOne({
            user: user.id,
            name: categoryName,
          });
          if (category) {
            transaction.categories = [...transaction.categories, category._id];
          }
        }
      } else {
        transaction.categories = ["default"];
      }

      await transaction.save();

      response.json(transaction);
    } catch (err) {
      response.status(404).json(err);
    }
  }
);

router.get("/", async (request: Request, response: Response) => {
  try {
    const email = getEmailFromToken(request);

    let user = await User.findOne({ email });

    if (!user) {
      return response.status(401).json({
        error: "Invalid username or password",
      });
    }

    const transactions = await Transaction.find({ user: user.id });

    response.json(transactions);
  } catch (err) {
    response.status(404).json(err);
  }
});

router.post("/filter", async (request, response) => {
  const {
    search,
    sort,
    filter,
    type,
    status,
  }: {
    search: string;
    type: "expense" | "income";
    sort: "asc" | "desc";
    status: "processing" | "completed";
    filter: number[];
  } = request.body;
  const email = getEmailFromToken(request);

  let user = await User.findOne({ email });

  if (!user) {
    return response.status(401).json({
      error: "Invalid username or password",
    });
  }

  const transactions = await Transaction.find({
    user: user.id,
    description: { $regex: search || "" },
    ...(type && { type }),
    ...(status && { status }),
  })
    .sort(sort && { price: sort }) // Should be asc or desc.
    .where("price")
    .gt((filter && filter[0]) || 0)
    .lt((filter && filter[1]) || 9999999999); // Array first element is min price, second is max price.

  response.json(transactions.map((note) => note.toJSON()));
});

export default router;
