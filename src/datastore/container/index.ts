import { IDataStore } from "../interface"
import { Result } from "@unipackage/utils"

export interface DatastoreContainerOptions {
    singleton?: boolean
    lifecycle?: {
        beforeCreate?: () => Result<void>
        afterCreate?: () => Result<void>
        onDestroy?: () => Result<void> //TODO
    }
    lazy?: boolean
}

export class DataStoreContainer {
    private static instance: DataStoreContainer

    private instances: Map<any, any>
    private childContainers: DataStoreContainer[]

    private constructor() {
        this.instances = new Map()
        this.childContainers = []
    }

    public static getInstance(): DataStoreContainer {
        if (!DataStoreContainer.instance) {
            DataStoreContainer.instance = new DataStoreContainer()
        }
        return DataStoreContainer.instance
    }

    public register<T, U>(
        key: any,
        dataStore: IDataStore<T, U>,
        options: DatastoreContainerOptions = {}
    ): Result<void> {
        const { singleton = true } = options

        if (singleton) {
            return this.registerSingleton<T, U>(key, dataStore, options)
        } else {
            return this.registerTransient<T, U>(key, dataStore, options)
        }
    }

    public resolve<T, U>(key: any): Result<IDataStore<T, U>> {
        const instance = this.instances.get(key)
        if (instance) {
            if (typeof instance.get === "function") {
                return instance.get()
            } else {
                return { ok: true, data: instance }
            }
        }

        for (const childContainer of this.childContainers) {
            const resolvedInstance = childContainer.resolve<T, U>(key)
            if (resolvedInstance.ok) {
                return resolvedInstance
            }
        }

        return { ok: false, error: `No instance found for key '${key}'` }
    }

    public unregister(key: any): Result<void> {
        const instance = this.instances.get(key)
        if (instance) {
            this.instances.delete(key)
            return { ok: true }
        }

        return { ok: false, error: `DataStore with key '${key}' not found.` }
    }

    public destroy(): Result<void> {
        const onDestroyResults: Result<void>[] = []

        for (const instance of this.instances.values()) {
            if (typeof instance.onDestroy === "function") {
                const onDestroyResult = instance.onDestroy()
                onDestroyResults.push(onDestroyResult)
            }
        }

        for (const childContainer of this.childContainers) {
            const onDestroyResult = childContainer.destroy()
            onDestroyResults.push(onDestroyResult)
        }

        this.instances.clear()
        this.childContainers = []

        if (onDestroyResults.every((result) => result.ok)) {
            return { ok: true }
        } else {
            const errors = onDestroyResults
                .filter((result) => !result.ok)
                .map((result) => result.error)
            return { ok: false, error: errors.join("\n") }
        }
    }

    public createChildContainer(): DataStoreContainer {
        const childContainer = new DataStoreContainer()
        this.childContainers.push(childContainer)
        return childContainer
    }

    private registerSingleton<T, U>(
        key: any,
        dataStore: IDataStore<T, U>,
        options: DatastoreContainerOptions
    ): Result<void> {
        if (this.instances.has(key)) {
            return {
                ok: false,
                error: `Singleton with key '${key}' is already registered.`,
            }
        }

        if (options?.lazy) {
            const getInstance = () => {
                const beforeCreateResult = options.lifecycle?.beforeCreate?.()
                if (
                    options.lifecycle?.beforeCreate &&
                    (!beforeCreateResult || !beforeCreateResult.ok)
                ) {
                    return {
                        ok: false,
                        error: `Error in beforeCreate lifecycle callback for '${key}': ${beforeCreateResult?.error}`,
                    }
                }

                return { ok: true, data: dataStore }
            }

            this.instances.set(key, { get: getInstance })
        } else {
            const beforeCreateResult = options.lifecycle?.beforeCreate?.()
            if (
                options.lifecycle?.beforeCreate &&
                (!beforeCreateResult || !beforeCreateResult.ok)
            ) {
                return {
                    ok: false,
                    error: `Error in beforeCreate lifecycle callback for '${key}': ${beforeCreateResult?.error}`,
                }
            }

            this.instances.set(key, dataStore)
        }

        const afterCreateResult = options.lifecycle?.afterCreate?.()
        if (
            options.lifecycle?.afterCreate &&
            (!afterCreateResult || !afterCreateResult.ok)
        ) {
            return {
                ok: false,
                error: `Error in afterCreate lifecycle callback for '${key}': ${afterCreateResult?.error}`,
            }
        }

        return { ok: true }
    }

    private registerTransient<T, U>(
        key: any,
        dataStore: IDataStore<T, U>,
        options: DatastoreContainerOptions
    ): Result<void> {
        const beforeCreateResult = options.lifecycle?.beforeCreate?.()
        if (
            options.lifecycle?.beforeCreate &&
            (!beforeCreateResult || !beforeCreateResult.ok)
        ) {
            return {
                ok: false,
                error: `Error in beforeCreate lifecycle callback for '${key}': ${beforeCreateResult?.error}`,
            }
        }

        if (options?.lazy) {
            this.instances.set(key, {
                get: () => ({ ok: true, data: dataStore }),
            })
        } else {
            this.instances.set(key, dataStore)
        }

        const afterCreateResult = options.lifecycle?.afterCreate?.()
        if (
            options.lifecycle?.afterCreate &&
            (!afterCreateResult || !afterCreateResult.ok)
        ) {
            return {
                ok: false,
                error: `Error in afterCreate lifecycle callback for '${key}': ${afterCreateResult?.error}`,
            }
        }

        return { ok: true }
    }
}
