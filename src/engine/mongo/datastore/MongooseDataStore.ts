import { Model, Document, FilterQuery, Connection } from "mongoose"
import {
    QueryFilter,
    IDataStore,
    QueryConditionValue,
    SortOptions,
    FieldsOptions,
} from "../../../datastore/interface"
import { Database, DatabaseOptions } from "../database/index"
import { Result } from "@unipackage/utils"

export class MongooseDataStore<T, TDocument extends T & Document>
    implements IDataStore<T, TDocument>
{
    private model: Model<TDocument>
    private database: Database
    private conn: Connection | null = null

    constructor(
        model: Model<TDocument>,
        uri: string,
        options?: DatabaseOptions
    ) {
        this.model = model
        this.database = Database.getInstance(uri, options)
    }

    public async connect(): Promise<Result<Connection>> {
        if (!this.conn) {
            const connectionResult = await this.database.connect()

            if (connectionResult.ok) {
                this.conn = connectionResult.data as Connection
                await this.model.createIndexes()
                return { ok: true, data: this.conn }
            } else {
                return { ok: false, error: connectionResult.error }
            }
        }

        return { ok: true, data: this.conn as Connection }
    }

    public async disconnect(): Promise<Result<void>> {
        try {
            if (this.conn) {
                await this.database.disconnect()
                this.conn = null
            }
            return { ok: true }
        } catch (error) {
            return { ok: false, error }
        }
    }

    private buildQuery(queryFilter?: QueryFilter<T>): FilterQuery<T> {
        const { conditions, and, or, not } = queryFilter || {}

        const query: FilterQuery<T> = {}

        if (conditions) {
            for (const condition of conditions) {
                const field = Object.keys(condition)[0] as keyof T
                const value = condition[field] as QueryConditionValue<T>

                query[field] = value as any
            }
        }

        if (and) {
            for (const filter of and) {
                const result = this.buildQuery(filter)
                Object.assign(query, result)
            }
        }

        if (or) {
            const orConditions = or.map((filter) => {
                const result = this.buildQuery(filter)
                return result
            })

            if (orConditions.length > 0) {
                query.$or = orConditions
            }
        }

        if (not) {
            const notResult = this.buildQuery(not)
            const notConditions = notResult
            for (const field in notConditions) {
                if (notConditions.hasOwnProperty(field)) {
                    const key = field as keyof T & string
                    query[key] = {
                        $ne: notConditions[key],
                    } as FilterQuery<T>[keyof T]
                }
            }
        }

        return query
    }

    private applySortOptions(
        queryBuilder: ReturnType<Model<TDocument>["find"]>,
        sortOptions?: SortOptions<T>[]
    ) {
        if (sortOptions) {
            const sortCriteria: { [key: string]: "asc" | "desc" } = {}

            for (const sortOption of sortOptions) {
                sortCriteria[sortOption.field as string] =
                    sortOption.order === "desc" ? "desc" : "asc"
            }

            queryBuilder.sort(sortCriteria)
        }
    }

    private applyFieldsOptions(
        queryBuilder: ReturnType<Model<TDocument>["find"]>,
        fieldsOptions?: FieldsOptions<T>
    ) {
        if (fieldsOptions) {
            const projection: Record<string, number | boolean | object> = {}

            for (const field of Object.keys(fieldsOptions)) {
                projection[field] = 1
            }

            queryBuilder.select(projection)
        }
    }

    public async find(queryFilter?: QueryFilter<T>): Promise<Result<T[]>> {
        try {
            const { page, limit, sort, fields } = queryFilter || {}

            const query = this.buildQuery(queryFilter)

            const queryBuilder = this.model.find(query)

            if (page && limit) {
                queryBuilder.skip((page - 1) * limit).limit(limit)
            }

            this.applySortOptions(queryBuilder, sort)
            this.applyFieldsOptions(queryBuilder, fields)

            const data = await queryBuilder.exec()

            return { ok: true, data }
        } catch (error) {
            return { ok: false, error }
        }
    }

    public async create(entity: T): Promise<Result<T>> {
        try {
            const createdEntity = await this.model.create(entity)
            return { ok: true, data: createdEntity }
        } catch (error) {
            return { ok: false, error }
        }
    }

    public async update(
        queryFilter: QueryFilter<T>,
        updateData: Partial<T>
    ): Promise<Result<T[]>> {
        try {
            const query = this.buildQuery(queryFilter)
            const entitiesToUpdate = await this.model.find(query).exec()

            const updatedEntities: T[] = []
            for (const entity of entitiesToUpdate) {
                Object.assign(entity, updateData)
                const updatedEntity = await entity.save()
                //TODO: confirm
                updatedEntities.push(updatedEntity as T)
            }

            return { ok: true, data: updatedEntities }
        } catch (error) {
            return { ok: false, error }
        }
    }

    public async delete(queryFilter?: QueryFilter<T>): Promise<Result<T>> {
        try {
            const query = this.buildQuery(queryFilter)
            const deletedEntity = await this.model.deleteMany(query).exec()
            return { ok: true, data: deletedEntity as T }
        } catch (error) {
            return { ok: false, error }
        }
    }

    public async getIndexes(): Promise<Result<(keyof T)[]>> {
        try {
            const schemaPaths = this.model.schema.paths
            const fieldNames = Object.keys(schemaPaths) as (keyof T)[]
            return { ok: true, data: fieldNames }
        } catch (error: any) {
            return { ok: false, error: error.message }
        }
    }

    public async getUniqueIndexes(): Promise<Result<(keyof T)[]>> {
        try {
            const indexes = await this.model.collection.indexes()
            const uniqueIndexes = indexes
                .filter((index: any) => index.unique)
                .map((index: any) => {
                    const fields = Object.keys(index.key) as (keyof T)[]
                    return fields
                })
                .flat()
            return { ok: true, data: uniqueIndexes }
        } catch (error: any) {
            return { ok: false, error: error.message }
        }
    }
}
