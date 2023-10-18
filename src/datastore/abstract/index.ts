import { Result } from "@unipackage/utils"
import { IDataStore, QueryFilter } from "../interface"

export abstract class AbstractDatastore<T, U> implements IDataStore<T, U> {
    private ds: IDataStore<T, U>

    constructor(datastore: IDataStore<T, U>) {
        this.ds = datastore
    }

    public async connect(): Promise<Result<any>> {
        return await this.ds.connect()
    }

    public async disconnect(): Promise<Result<void>> {
        return await this.ds.disconnect()
    }

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

    public async create(entity: T): Promise<Result<T>> {
        const createResult = await this.ds.create(entity)
        if (createResult.ok) {
            return { ok: true, data: createResult.data }
        } else {
            return { ok: false, error: createResult.error }
        }
    }

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

    public async delete(queryFilter?: QueryFilter<T> | T): Promise<Result<T>> {
        const deleteResult = await this.ds.delete(queryFilter)
        if (deleteResult.ok) {
            return { ok: true, data: deleteResult.data }
        } else {
            return { ok: false, error: deleteResult.error }
        }
    }

    public async getIndexes?(): Promise<Result<(keyof T)[]>> {
        if (typeof this.ds.getIndexes === "function") {
            return await this.ds.getIndexes()
        } else {
            return { ok: false, error: "getIndexes is not implemented" }
        }
    }

    public async getUniqueIndexes?(): Promise<Result<(keyof T)[]>> {
        if (typeof this.ds.getUniqueIndexes === "function") {
            return await this.ds.getUniqueIndexes()
        } else {
            return { ok: false, error: "getUniqueIndexes is not implemented" }
        }
    }
    public abstract CreateOrupdateByUniqueIndexes?(
        data: T
    ): Promise<Result<T[]>>
}
