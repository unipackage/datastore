import { Result } from "@unipackage/utils"
import { equal } from "@unipackage/utils"
import {
    IDataStore,
    QueryFilter,
    GetQueryConditionsByUniqueIndexes,
} from "./interface"
import { AbstractDatastore } from "./abstract"

export class DataStore<T extends Object, U> extends AbstractDatastore<T, U> {
    constructor(datastore: IDataStore<T, U>) {
        super(datastore)
    }

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

    protected shouldUpdate(
        existingData: T,
        newData: T,
        fields?: Array<keyof T>
    ): boolean {
        return !equal(existingData, newData, fields)
    }
}
