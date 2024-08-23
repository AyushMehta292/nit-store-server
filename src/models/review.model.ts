import mongoose, { Schema, Document } from 'mongoose';

interface IReview extends Document {
    rating: number;
    comment: string;
    product: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
}

const reviewSchema: Schema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
}, { timestamps: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);

