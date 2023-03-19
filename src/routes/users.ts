import { Request, Response } from "express";
import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import User from "../models/user/user"
import Category from "../models/category/category"


const router = express.Router();

router.post("/register", async (request: Request, response: Response) => {
  try {
    const body = request.body;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(body.password, saltRounds);

    const user = new User({
      name: body.name,
      email: body.email,
      password: passwordHash,
    });

    const savedUser = await user.save();

    const userForToken = {
      name: savedUser.name,
      id: savedUser._id,
      email: savedUser.email,
    };

    const token = jwt.sign(userForToken, "secret");
    savedUser.token = token;

    await user.save();

    const category = new Category({
      name: 'default',
      user
    });
    
    await category.save();

    response.json(savedUser);
  } catch (err) {
    console.log(err)
    response.status(404).json(err);
  }
});

router.post("/login", async (request: Request, response: Response) => {
  try {
    const body = request.body;

    const user = await User.findOne({ email: body.email });
    const passwordCorrect =
      user === null
        ? false
        : await bcrypt.compare(body.password, user.password);

    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: "invalid username or password",
      });
    }

    response.status(200).send({ user });
  } catch (err) {
    response.status(404).json(err);
  }
});

router.post("/reset-password", async (request: Request, response: Response) => {
  try {
    const body = request.body;

    const user = await User.findOne({ email: body.email });
    const passwordCorrect =
      user === null
        ? false
        : await bcrypt.compare(body.password, user.password);
   
    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: "invalid username or password",
      });
    }
    
    const saltRounds = 10;
    const newPassword = await bcrypt.hash(body.newPassword, saltRounds);


    const userForToken = {
      id: user._id,
      email: user.email,
      password: newPassword
    };

    const token = jwt.sign(userForToken, "secret");
    user.token = token;
    user.password = newPassword
    await user.save();

    response.status(200).send({ user });
  } catch (err) {
    response.status(404).json(err);
  }
});



export default router;
