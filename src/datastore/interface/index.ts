import { Result } from "@unipackage/utils"

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
export type QueryCondition<T> = Partial<Record<keyof T, QueryConditionValue<T>>>
export type QueryConditionValue<T> = T[keyof T] | QueryConditionOperators<T>

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

export interface SortOptions<T> {
    field: keyof T
    order?: "asc" | "desc"
}

export interface FieldsOptions<T> {
    include?: (keyof T)[]
    exclude?: (keyof T)[]
}

export interface IDataStore<T, U> {
    connect(): Promise<Result<any>>
    disconnect(): Promise<Result<void>>
    find(queryFilter?: QueryFilter<T>): Promise<Result<T[]>>
    create(entity: T): Promise<Result<T>>
    update(
        queryFilter: QueryFilter<T>,
        updateData: Partial<T>
    ): Promise<Result<T[]>>
    delete(queryFilter?: QueryFilter<T> | T): Promise<Result<T>>
    getIndexes?(): Promise<Result<(keyof T)[]>>
    getUniqueIndexes?(): Promise<Result<(keyof T)[]>>

    //impl by domain
    CreateOrupdateByUniqueIndexes?(data: T): Promise<Result<T[]>>
}

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
