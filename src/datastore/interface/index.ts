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

import { Result } from "@unipackage/utils"

/**
 * Represents operators used in a query condition.
 */
export interface QueryConditionOperators<T> {
    $eq?: T[keyof T]
    $ne?: T[keyof T]
    $gt?: T[keyof T]
    $gte?: T[keyof T]
    $lt?: T[keyof T]
    $lte?: T[keyof T]
    $in?: T[keyof T][]
    $nin?: T[keyof T][]
    $regex?: RegExp
}

/**
 * Represents the value for a query condition.
 */
export type QueryConditionValue<T> = T[keyof T] | QueryConditionOperators<T>

/**
 * Represents a condition used in a query filter.
 */
export type QueryCondition<T> = Partial<Record<keyof T, QueryConditionValue<T>>>

/**
 * Represents sorting options for query results.
 */
export interface SortOptions<T> {
    field: keyof T
    order?: "asc" | "desc"
}

/**
 * Represents options for fields in query results.
 */
export interface FieldsOptions<T> {
    include?: (keyof T)[]
    exclude?: (keyof T)[]
}

/**
 * Represents a filter object for querying data.
 */
export interface QueryFilter<T> {
    conditions?: QueryCondition<T>[]
    and?: QueryFilter<T>[]
    or?: QueryFilter<T>[]
    not?: QueryFilter<T>
    page?: number
    limit?: number
    sort?: SortOptions<T>[]
    fields?: FieldsOptions<T>
}

/**
 * Data store engine interface for handling CRUD operations.
 */
export interface IDataStoreEngine<T, U> {
    /**
     * Establishes a connection to the data store.
     * @returns A promise that resolves with a Result object.
     */
    connect(): Promise<Result<any>>

    /**
     * Closes the connection to the data store.
     * @returns A promise that resolves with a Result object.
     */
    disconnect(): Promise<Result<void>>

    /**
     * Finds entities in the data store based on the provided query filter.
     * @param queryFilter - The query filter used for finding entities.
     * @returns A promise that resolves with a Result containing the found entities.
     */
    find(queryFilter?: QueryFilter<T>): Promise<Result<T[]>>

    /**
     * Creates a new entity in the data store.
     * @param entity - The entity to be created.
     * @returns A promise that resolves with a Result containing the created entity.
     */
    create(entity: T): Promise<Result<T>>

    /**
     * Updates entities in the data store that match the given query filter.
     * @param queryFilter - The query filter used for updating entities.
     * @param updateData - The data used for updating entities.
     * @returns A promise that resolves with a Result containing the updated entities.
     */
    update(
        queryFilter: QueryFilter<T>,
        updateData: Partial<T>
    ): Promise<Result<T[]>>

    /**
     * Deletes entities from the data store based on the provided query filter.
     * @param queryFilter - The query filter used for deleting entities.
     * @returns A promise that resolves with a Result containing the deleted entities.
     */
    delete(queryFilter?: QueryFilter<T> | T): Promise<Result<T>>

    /**
     * Retrieves indexes from the data store.
     * @returns A promise that resolves with a Result containing the indexes.
     */
    getIndexes?(): Promise<Result<(keyof T)[]>>

    /**
     * Retrieves unique indexes from the data store.
     * @returns A promise that resolves with a Result containing the unique indexes.
     */
    getUniqueIndexes?(): Promise<Result<(keyof T)[]>>
}

/**
 * Data store interface for handling CRUD operations.
 */
export interface IDataStore<T, U> extends IDataStoreEngine<T, U> {
    /**
     * Creates or updates entities based on unique indexes in the data store.
     * @note implementation by basic class
     * @param data - The data used for creating or updating entities.
     * @returns A promise that resolves with a Result containing the created or updated entities.
     */
    CreateOrupdateByUniqueIndexes?(data: T): Promise<Result<T[]>>
}

/**
 * Gets query conditions by unique indexes.
 *
 * @param data - The data object.
 * @param uniqueIndexes - The unique indexes.
 * @returns The query conditions or an error result.
 */
export function GetQueryConditionsByUniqueIndexes<T>(
    data: T,
    uniqueIndexes?: (keyof T)[]
): Result<QueryCondition<T>[]> {
    try {
        if (!uniqueIndexes || uniqueIndexes.length === 0) {
            //TO BE CONFIRMED
            return { ok: true, data: [{ ...data }] }
        }

        const queryConditions: QueryCondition<T>[] = []
        uniqueIndexes.forEach((uniqueIndex) => {
            const value = data[uniqueIndex]
            if (value !== undefined) {
                const condition: QueryCondition<T> = {
                    [uniqueIndex]: value,
                } as QueryCondition<T>
                queryConditions.push(condition)
            }
        })
        return {
            ok: queryConditions.length !== 0 ? true : false,
            data: queryConditions,
        }
    } catch (error) {
        return { ok: false, error }
    }
}
