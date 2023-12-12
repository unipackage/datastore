import mongoose, { Schema, Document } from "mongoose"
import { Example } from "../types"

interface ExampleDocument extends Example, Document {}

const ExampleSchema = new Schema<ExampleDocument>({
    boolElement: {
        type: Boolean,
        required: [true, "Please provide the boolElement"],
        index: { unique: true },
    },
    stringElement: {
        type: String,
        required: [true, "Please provide the stringElement"],
    },
    numberElement: {
        type: Number,
        required: [true, "Please provide the numberElement"],
    },
    objectElement: {
        type: Object,
        required: [true, "Please provide the objectElement"],
    },
    arrayElement: {
        type: [Object],
        required: [true, "Please provide the arrayElement"],
    },
})

const ExampleModel =
    mongoose.models.Example ||
    mongoose.model<ExampleDocument>("Example", ExampleSchema)

export { ExampleModel }
export type { ExampleDocument }
