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
import { IDataStore, QueryFilter } from "../interface"

/**
 * Abstract class defining a data store with common CRUD operations.
 * Provides a basis for implementing concrete data stores.
 */
export abstract class AbstractDatastore<T, U> implements IDataStore<T, U> {
    private ds: IDataStore<T, U>

    /**
     * Constructs an AbstractDatastore instance.
     * @param datastore - The concrete data store implementation.
     */
    constructor(datastore: IDataStore<T, U>) {
        this.ds = datastore
    }

    /**
     * Establishes a connection to the data store.
     * @returns A promise that resolves with a Result object.
     */
    public async connect(): Promise<Result<any>> {
        return await this.ds.connect()
    }

    /**
     * Closes the connection to the data store.
     * @returns A promise that resolves with a Result object.
     */
    public async disconnect(): Promise<Result<void>> {
        return await this.ds.disconnect()
    }

    /**
     * Finds entities in the data store based on the provided query filter.
     * @param queryFilter - The query filter used for finding entities.
     * @returns A promise that resolves with a Result containing the found entities.
     */
    public async find(queryFilter?: QueryFilter<T>): Promise<Result<T[]>> {
        try {
            const result = await this.ds.find(queryFilter)
            if (result.ok) {
                const existingData = result.data
                return { ok: true, data: existingData }
            } else {
                return { ok: false, error: result.error }
            }
        } catch (error: any) {
            return { ok: false, error: error }
        }
    }

    /**
     * Creates a new entity in the data store.
     * @param entity - The entity to be created.
     * @returns A promise that resolves with a Result containing the created entity.
     */
    public async create(entity: T): Promise<Result<T>> {
        const createResult = await this.ds.create(entity)
        if (createResult.ok) {
            return { ok: true, data: createResult.data }
        } else {
            return { ok: false, error: createResult.error }
        }
    }

    /**
     * Updates entities in the data store that match the given query filter.
     * @param queryFilter - The query filter used for updating entities.
     * @param updateData - The data used for updating entities.
     * @returns A promise that resolves with a Result containing the updated entities.
     */
    public async update(
        queryFilter: QueryFilter<T>,
        updateData: Partial<T>
    ): Promise<Result<T[]>> {
        const result = await this.ds.update(queryFilter, updateData)
        if (result.ok) {
            const existingData = result.data
            return { ok: true, data: existingData }
        } else {
            return { ok: false, error: result.error }
        }
    }

    /**
     * Deletes entities from the data store based on the provided query filter.
     * @param queryFilter - The query filter used for deleting entities.
     * @returns A promise that resolves with a Result containing the deleted entities.
     */
    public async delete(queryFilter?: QueryFilter<T> | T): Promise<Result<T>> {
        const deleteResult = await this.ds.delete(queryFilter)
        if (deleteResult.ok) {
            return { ok: true, data: deleteResult.data }
        } else {
            return { ok: false, error: deleteResult.error }
        }
    }

    /**
     * Retrieves indexes from the data store.
     * @returns A promise that resolves with a Result containing the indexes.
     */
    public async getIndexes?(): Promise<Result<(keyof T)[]>> {
        if (typeof this.ds.getIndexes === "function") {
            return await this.ds.getIndexes()
        } else {
            return { ok: false, error: "getIndexes is not implemented" }
        }
    }

    /**
     * Retrieves unique indexes from the data store.
     * @returns A promise that resolves with a Result containing the unique indexes.
     */
    public async getUniqueIndexes?(): Promise<Result<(keyof T)[]>> {
        if (typeof this.ds.getUniqueIndexes === "function") {
            return await this.ds.getUniqueIndexes()
        } else {
            return { ok: false, error: "getUniqueIndexes is not implemented" }
        }
    }

    /**
     * Abstract method to be implemented by subclasses for creating or updating entities based on unique indexes.
     * @param data - The data used for creating or updating entities.
     * @returns A promise that resolves with a Result containing the created or updated entities.
     */
    public abstract CreateOrupdateByUniqueIndexes?(
        data: T
    ): Promise<Result<T[]>>
}
