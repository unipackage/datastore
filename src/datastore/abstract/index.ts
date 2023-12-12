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
import { IDataStore, IDataStoreEngine, QueryFilter } from "../interface"

/**
 * Abstract class defining a data store with common CRUD operations.
 * Provides a basis for implementing concrete data stores.
 */
export abstract class AbstractDatastore<T, U> implements IDataStore<T, U> {
    private engine: IDataStoreEngine<T, U>

    /**
     * Constructs an AbstractDatastore instance.
     * @param datastore - The concrete data store implementation.
     */
    constructor(engine: IDataStoreEngine<T, U>) {
        this.engine = engine
    }

    /**
     * Establishes a connection to the data store.
     * @returns A promise that resolves with a Result object.
     */
    public async connect(): Promise<Result<any>> {
        return await this.engine.connect()
    }

    /**
     * Closes the connection to the data store.
     * @returns A promise that resolves with a Result object.
     */
    public async disconnect(): Promise<Result<void>> {
        return await this.engine.disconnect()
    }

    /**
     * Finds entities in the data store based on the provided query filter.
     * @param queryFilter - The query filter used for finding entities.
     * @returns A promise that resolves with a Result containing the found entities.
     */
    public async find(queryFilter?: QueryFilter<T>): Promise<Result<T[]>> {
        return await this.engine.find(queryFilter)
    }

    /**
     * Creates a new entity in the data store.
     * @param entity - The entity to be created.
     * @returns A promise that resolves with a Result containing the created entity.
     */
    public async create(entity: T): Promise<Result<T>> {
        return await this.engine.create(entity)
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
        return await this.engine.update(queryFilter, updateData)
    }

    /**
     * Deletes entities from the data store based on the provided query filter.
     * @param queryFilter - The query filter used for deleting entities.
     * @returns A promise that resolves with a Result containing the deleted entities.
     */
    public async delete(queryFilter?: QueryFilter<T> | T): Promise<Result<T>> {
        return await this.engine.delete(queryFilter)
    }

    /**
     * Retrieves indexes from the data store.
     * @returns A promise that resolves with a Result containing the indexes.
     */
    public async getIndexes?(): Promise<Result<(keyof T)[]>> {
        if (
            !this.engine.getIndexes ||
            typeof this.engine.getIndexes !== "function"
        ) {
            return { ok: false, error: "Not suppot method" }
        }
        return await this.engine.getIndexes()
    }

    /**
     * Retrieves unique indexes from the data store.
     * @returns A promise that resolves with a Result containing the unique indexes.
     */
    public async getUniqueIndexes?(): Promise<Result<(keyof T)[]>> {
        if (
            !this.engine.getUniqueIndexes ||
            typeof this.engine.getUniqueIndexes !== "function"
        ) {
            return { ok: false, error: "Not suppot method" }
        }
        return await this.engine.getUniqueIndexes()
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
