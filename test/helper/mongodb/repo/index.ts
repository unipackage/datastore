import { DataStore } from "../../../../src/datastore"
import { MongooseDataStore } from "../../../../src/implements/mongo/datastore/MongooseDataStore"
import { Example } from "../types"
import { ExampleModel, ExampleDocument } from "../model"

export class ExampleMongoDatastore extends DataStore<Example, ExampleDocument> {
    constructor(uri: string) {
        super(
            new MongooseDataStore<Example, ExampleDocument>(ExampleModel, uri)
        )
    }
}
