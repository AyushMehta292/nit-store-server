import mongoose, { Schema, Document } from "mongoose";

interface IProduct extends Document {
  title: string;
  description: string;
  image: string[];
  price: number;
  // bidPrice: number;
  numberOfItems: number;
  spamCount: number;
  soldBy: mongoose.Types.ObjectId;
}

const productSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: [{ type: String, required: true }],      //max 4 images per product
    price: { type: Number, required: true },
    // bidPrice: { type: Number, default: function() { return this.price; } },
    numberOfItems: { type: Number, required: true },
    spamCount: { type: Number, default: 0 },
    soldBy: { type: Schema.Types.ObjectId, ref: "User"},
  },
  { timestamps: true }
);

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
