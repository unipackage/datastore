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
import { equal } from "@unipackage/utils"
import {
    IDataStoreEngine,
    QueryFilter,
    GetQueryConditionsByUniqueIndexes,
} from "./interface"
import { AbstractDatastore } from "./abstract"

export class DataStore<T extends Object, U> extends AbstractDatastore<T, U> {
    /**
     * Constructs a DataStore instance.
     * @param datastore - The IDataStore instance to be used.
     */
    constructor(engine: IDataStoreEngine<T, U>) {
        super(engine)
    }

    /**
     * Creates or updates data in the store based on unique indexes.
     * @param data - The data to be created or updated.
     * @returns A Result containing the updated data or an error.
     */
    public async CreateOrupdateByUniqueIndexes(data: T): Promise<Result<T[]>> {
        try {
            const createResult = await this.create(data)

            if (createResult.ok && createResult.data) {
                return { ok: true, data: [createResult.data] }
            } else if (
                JSON.parse(JSON.stringify(createResult.error)).code === 11000
            ) {
                const queryFilterResult =
                    await this.getQueryFilterByUniqueIndexes(data)
                if (!queryFilterResult.ok || !queryFilterResult.data) {
                    return { ok: false, error: queryFilterResult.error }
                }

                const queryFilter = queryFilterResult.data
                const existingDataArrayResult = await this.find(queryFilter)

                if (
                    !existingDataArrayResult.ok ||
                    !existingDataArrayResult.data
                ) {
                    return { ok: false, error: existingDataArrayResult.error }
                }

                const existingDataArray = existingDataArrayResult.data
                const updatedDataArray: T[] = []

                for (const existingData of existingDataArray) {
                    if (this.shouldUpdate(existingData, data)) {
                        const updateResult = await this.update(
                            queryFilter,
                            data
                        )

                        if (updateResult.ok && updateResult.data) {
                            updatedDataArray.push(...updateResult.data)
                        } else {
                            return { ok: false, error: updateResult.error }
                        }
                    } else {
                        updatedDataArray.push(existingData)
                    }
                }

                return { ok: true, data: updatedDataArray }
            } else {
                return { ok: false, error: createResult.error }
            }
        } catch (error: any) {
            return { ok: false, error: error }
        }
    }

    /**
     * Retrieves a query filter based on unique indexes.
     * @param data - The data used to retrieve the query filter.
     * @returns A Result containing the query filter or an error.
     */
    private async getQueryFilterByUniqueIndexes(
        data: T
    ): Promise<Result<QueryFilter<T>>> {
        try {
            const uniqueIndexesResult = await this.getUniqueIndexes?.()
            if (
                !uniqueIndexesResult?.ok ||
                !uniqueIndexesResult?.data ||
                uniqueIndexesResult?.data.length === 0
            ) {
                return {
                    ok: false,
                    error:
                        uniqueIndexesResult?.error ||
                        "Failed to fetch unique indexes",
                }
            }

            const uniqueIndexes = uniqueIndexesResult.data
            const queryConditionsResult = GetQueryConditionsByUniqueIndexes(
                data,
                uniqueIndexes
            )
            if (!queryConditionsResult.ok || !queryConditionsResult.data) {
                return { ok: false, error: queryConditionsResult.error }
            }

            const queryConditions = queryConditionsResult.data
            return { ok: true, data: { conditions: queryConditions } }
        } catch (error: any) {
            return { ok: false, error: error }
        }
    }

    /**
     * Determines if an update is necessary based on existing and new data.
     * @param existingData - The existing data.
     * @param newData - The new data.
     * @param fields - Optional fields to consider in the comparison.
     * @returns A boolean indicating whether an update is necessary.
     */
    protected shouldUpdate(
        existingData: T,
        newData: T,
        fields?: Array<keyof T>
    ): boolean {
        return !equal(existingData, newData, fields)
    }
}
