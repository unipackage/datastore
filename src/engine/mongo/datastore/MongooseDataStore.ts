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

import { Model, Document, FilterQuery, Connection } from "mongoose"
import {
    QueryFilter,
    IDataStoreEngine,
    QueryConditionValue,
    SortOptions,
    FieldsOptions,
} from "../../../datastore/interface"
import { Database, DatabaseOptions } from "../database/index"
import { Result } from "@unipackage/utils"

/**
 * MongooseDataStore class implementing the IDataStore interface for MongoDB operations using Mongoose.
 * @typeparam T - Represents the type of the entity.
 * @typeparam TDocument - Represents the Mongoose document type for the entity.
 */
export class MongooseDataStore<T, TDocument extends T & Document>
    implements IDataStoreEngine<T, TDocument>
{
    private model: Model<TDocument>
    private database: Database
    private conn: Connection | null = null

    /**
     * Constructs a MongooseDataStore instance.
     * @param model - The Mongoose Model for the entity.
     * @param uri - The MongoDB connection URI.
     * @param options - Optional database connection options.
     */
    constructor(
        model: Model<TDocument>,
        uri: string,
        options?: DatabaseOptions
    ) {
        this.model = model
        this.database = new Database(uri, options)
    }

    /**
     * Establishes a connection to the MongoDB database.
     * @returns A promise resolving with a Result containing the connection or an error.
     */
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

    /**
     * Closes the connection to the MongoDB database.
     * @returns A promise resolving with a Result indicating the success or failure of the operation.
     */
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

    /**
     * Builds a MongoDB filter query based on the provided query filter.
     * @param queryFilter - The query filter containing conditions, and, or, and not clauses.
     * @returns A MongoDB FilterQuery based on the provided filter.
     */
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

    /**
     * Applies sorting options to a query builder.
     * @param queryBuilder - The query builder to which sorting options are applied.
     * @param sortOptions - The sorting options to apply.
     */
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

    /**
     * Applies fields selection options to a query builder.
     * @param queryBuilder - The query builder to which fields options are applied.
     * @param fieldsOptions - The fields options to apply.
     */
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

    /**
     * Finds entities in the database based on the provided query filter.
     * @param queryFilter - The query filter for finding entities.
     * @returns A promise resolving with a Result containing the found entities or an error.
     */
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

    /**
     * Updates entities in the database based on the provided query filter and update data.
     * @param queryFilter - The query filter to find entities for updating.
     * @param updateData - The partial data to update on the found entities.
     * @returns A promise resolving with a Result containing the updated entities or an error.
     */
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

    /**
     * Deletes entities in the database based on the provided query filter.
     * @param queryFilter - The query filter to find entities for deletion.
     * @returns A promise resolving with a Result indicating the deletion success or an error.
     */
    public async delete(queryFilter?: QueryFilter<T>): Promise<Result<T>> {
        try {
            const query = this.buildQuery(queryFilter)
            const deletedEntity = await this.model.deleteMany(query).exec()
            return { ok: true, data: deletedEntity as T }
        } catch (error) {
            return { ok: false, error }
        }
    }

    /**
     * Retrieves indexes for the database model.
     * @returns A promise resolving with a Result containing the model's indexes or an error.
     */
    public async getIndexes(): Promise<Result<(keyof T)[]>> {
        try {
            const schemaPaths = this.model.schema.paths
            const fieldNames = Object.keys(schemaPaths) as (keyof T)[]
            return { ok: true, data: fieldNames }
        } catch (error: any) {
            return { ok: false, error: error.message }
        }
    }

    /**
     * Retrieves unique indexes for the database model.
     * @returns A promise resolving with a Result containing the unique indexes or an error.
     */
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
