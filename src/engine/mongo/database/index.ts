import mongoose, { ConnectOptions } from "mongoose"
import { Result } from "@unipackage/utils"

export interface DatabaseOptions extends ConnectOptions {
    bufferCommands?: boolean
    autoIndex?: boolean
    useNewUrlParser?: boolean
    useUnifiedTopology?: boolean
}

export class Database {
    private static instance: Database
    private conn: mongoose.Connection | null = null
    private options: DatabaseOptions
    private MONGODB_URI: string

    private constructor(uri: string, options?: DatabaseOptions | undefined) {
        this.options = options ? options : {}
        this.MONGODB_URI = uri
    }

    public static getInstance(
        uri: string,
        options: DatabaseOptions | undefined
    ): Database {
        if (!Database.instance) {
            Database.instance = new Database(uri, options)
        }
        return Database.instance
    }

    public async connect(): Promise<Result<mongoose.Connection>> {
        if (this.conn) {
            return { ok: true, data: this.conn }
        }

        try {
            const mongooseInstance = await mongoose.connect(this.MONGODB_URI!, {
                ...this.options,
            })
            this.conn = mongooseInstance.connection
            return { ok: true, data: this.conn }
        } catch (error) {
            return { ok: false, error }
        }
    }

    public async disconnect(): Promise<Result<void>> {
        try {
            if (this.conn) {
                await this.conn.close()
                this.conn = null
            }
            return { ok: true }
        } catch (error) {
            return { ok: false, error }
        }
    }
}
