import { Request, Response } from "express";
import express from "express";

import jwt from "jsonwebtoken";
import User from "../models/user/user";
import Category from "../models/category/category";
import Transaction from "../models/transaction/transaction";

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

router.get("/", async (request: Request, response: Response) => {
  try {
    const email = getEmailFromToken(request);

    let user = await User.findOne({ email });

    if (!user) {
      return response.status(401).json({
        error: "Invalid username or password",
      });
    }

    const categories = await Category.find({ user: user.id });

    response.json(categories);
  } catch (err) {
    response.status(404).json(err);
  }
});

router.post(
  "/create-category",
  async (request: Request, response: Response) => {
    try {
      const { name } = request.body;

      if (!name) {
        return response.status(404).json({
          error: "Name is required",
        });
      }

      const email = getEmailFromToken(request);

      let user = await User.findOne({ email });

      if (!user) {
        return response.status(401).json({
          error: "Invalid username or password",
        });
      }

      const category = new Category({
        name: name,
        user: user,
      });

      await category.save();

      response.json(category);
    } catch (err) {
      response.status(404).json(err);
    }
  }
);

router.post(
  "/change-category-name",
  async (request: Request, response: Response) => {
    try {
      const { name, newName } = request.body;

      if (!name || !newName) {
        return response.status(404).json({
          error: "Name and new name are required",
        });
      }

      const email = getEmailFromToken(request);

      let user = await User.findOne({ email });

      if (!user) {
        return response.status(401).json({
          error: "Invalid username or password",
        });
      }

      const category = await Category.findOneAndUpdate(
        { user: user.id, name: name },
        { name: newName }
      );

      response.json(category);
    } catch (err) {
      response.status(404).json(err);
    }
  }
);

router.delete(
  "/delete-category/:name",
  async (request: Request, response: Response) => {
    try {
      const { name } = request.params;

      if (!name) {
        return response.status(404).json({
          error: "Name is required",
        });
      }

      const email = getEmailFromToken(request);

      let user = await User.findOne({ email });

      if (!user) {
        return response.status(401).json({
          error: "Invalid username or password",
        });
      }

      const category = await Category.findOne({ user: user.id, name: name });

      const transactions = await Transaction.find({
        user: user.id,
        categories: category?._id,
      });

      if (transactions && transactions.length) {
        for (let transaction of transactions) {
          const arr = [...transaction?.categories];
          arr.splice(transaction.categories.indexOf(category?._id), 1);
          if (!arr.includes("default")) {
            arr.push("default");
          }

          transaction.categories = arr;

          await transaction.save();
        }
      }

      await category?.deleteOne();

      response.json(category);
    } catch (err) {
      response.status(404).json(err);
    }
  }
);

export default router;
