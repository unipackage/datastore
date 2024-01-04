/*******************************************************************************
 *   (c) 2023 unipackage
 *
 *  Licensed under either the MIT License (the "MIT License") or the Apache License, Version 2.0
 *  (the "Apache License"). You may not use this file except in compliance with one of these
 *  licenses. You may obtain a copy of the MIT License at
 *
 *      https://opensource.org/licenses/MIT
 *
 *  Or the Apache License, Version 2.0 at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the MIT License or the Apache License for the specific language governing permissions and
 *  limitations under the respective licenses.
 ********************************************************************************/

import { DatabaseConnection } from "../../../../src/engine/mongo/databaseConnection"
import { ExampleMongoDatastore } from "../repo"

const database_noAuth = DatabaseConnection.getInstance(
    "mongodb://127.0.0.1:27017/datastore"
)
const database_auth = DatabaseConnection.getInstance(
    "mongodb://127.0.0.1:27018/datastoreAuth",
    {
        user: "admin",
        pass: "password",
        dbName: "datastoreAuth",
        authSource: "admin",
        authMechanism: "SCRAM-SHA-256",
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
    }
)

const database_wrongAuth = DatabaseConnection.getInstance(
    "mongodb://127.0.0.1:27018/datastorWrongAuth",
    {
        user: "admin",
        pass: "wrongpassword",
        dbName: "datastoreAuth",
        authSource: "admin",
        authMechanism: "SCRAM-SHA-256",
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
    }
)

export const exampleMongoDb = new ExampleMongoDatastore(database_noAuth)
export const exampleAuthMongoDb = new ExampleMongoDatastore(database_auth)
export const exampleWrongAuthMongoDb = new ExampleMongoDatastore(
    database_wrongAuth
)
