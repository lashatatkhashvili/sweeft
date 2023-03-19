import mongoose from "mongoose";

const schema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["expense", "income"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  groups: {
    type: Array,
  },
  status: {
    type: String,
    default: null,
    enum: ["processing", "completed", null],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  categories: {
    type: Array,
  },
});

schema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password;
  },
});

const Transaction = mongoose.model("Transaction", schema);

export default Transaction;
