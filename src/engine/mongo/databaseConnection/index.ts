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

import mongoose, { ConnectOptions } from "mongoose"

/**
 * Database connection options.
 */
export interface DatabaseConnectionOptions extends ConnectOptions {
    bufferCommands?: boolean
    autoIndex?: boolean
    useNewUrlParser?: boolean
    useUnifiedTopology?: boolean
}

/**
 * Singleton Database class for handling MongoDB connections.
 */
export class DatabaseConnection {
    private static instances: { [key: string]: DatabaseConnection } = {}
    private conn: mongoose.Connection | null = null
    private options: DatabaseConnectionOptions
    private MONGODB_URI: string

    /**
     * Constructs a Database instance.
     * @param uri - The MongoDB connection URI.
     * @param options - Optional database connection options.
     */
    private constructor(
        uri: string,
        options?: DatabaseConnectionOptions | undefined
    ) {
        this.options = options ? options : {}
        this.MONGODB_URI = uri
    }

    /**
     * Get a Database instance.
     * @param uri - The MongoDB connection URI.
     * @param options - Optional database connection options.
     */
    public static getInstance(
        uri: string,
        options?: DatabaseConnectionOptions
    ): DatabaseConnection {
        if (!DatabaseConnection.instances[uri]) {
            DatabaseConnection.instances[uri] = new DatabaseConnection(
                uri,
                options
            )
        }
        return DatabaseConnection.instances[uri]
    }

    /**
     * Establishes a connection to the MongoDB database.
     * @returns A promise resolving with the mongoose Connection object or an error Result.
     */
    public connection(): mongoose.Connection {
        if (this.conn) {
            return this.conn
        }

        try {
            this.conn = mongoose.createConnection(this.MONGODB_URI!, {
                ...this.options,
            })
            return this.conn
        } catch (error: any) {
            throw new Error(error)
        }
    }

    /**
     * Closes the connection to the MongoDB database.
     * @returns A promise resolving with a Result indicating the success or failure of the operation.
     */
    public async disconnect() {
        try {
            if (this.conn) {
                await this.conn.close()
                this.conn = null
            }
        } catch (error: any) {
            throw new Error(error)
        }
    }
}
