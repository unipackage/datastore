import { ExampleMongoDatastore } from "../repo"

export const exampleMongoDb = new ExampleMongoDatastore(
    "mongodb://127.0.0.1:27017/fnode"
)
