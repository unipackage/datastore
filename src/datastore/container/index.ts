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

import { IDataStore } from "../interface"
import { Result } from "@unipackage/utils"

/**
 * Options for configuring DatastoreContainer.
 */
export interface DatastoreContainerOptions {
    singleton?: boolean
    lifecycle?: {
        beforeCreate?: () => Result<void>
        afterCreate?: () => Result<void>
        onDestroy?: () => Result<void> //TODO
    }
    lazy?: boolean
}

/**
 * DataStoreContainer manages data store instances and their lifecycle.
 */
export class DataStoreContainer {
    private static instance: DataStoreContainer

    private instances: Map<any, any>
    private childContainers: DataStoreContainer[]

    /**
     * Constructs a new DataStoreContainer instance.
     * This constructor is private to enforce the singleton pattern.
     * Initializes the internal maps for instances and child containers.
     */
    private constructor() {
        this.instances = new Map()
        this.childContainers = []
    }

    /**
     * Retrieves the singleton instance of DataStoreContainer.
     * If the instance does not exist, a new instance is created.
     * @returns The singleton instance of DataStoreContainer.
     */
    public static getInstance(): DataStoreContainer {
        if (!DataStoreContainer.instance) {
            DataStoreContainer.instance = new DataStoreContainer()
        }
        return DataStoreContainer.instance
    }

    /**
     * Registers a data store instance in the container.
     * @param key - The key to register the data store instance.
     * @param dataStore - The data store instance to be registered.
     * @param options - Configuration options for the data store.
     * @returns A result indicating success or failure with an optional error message.
     */
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

    /**
     * Retrieves an instance registered under the provided key.
     * Searches both the current container and child containers.
     * @param key - The key to retrieve the instance.
     * @returns A Result containing the instance if found, otherwise an error result.
     */
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

    /**
     * Unregisters an instance associated with the provided key.
     * @param key - The key associated with the instance to be unregistered.
     * @returns A Result indicating success or failure in unregistering the instance.
     */
    public unregister(key: any): Result<void> {
        const instance = this.instances.get(key)
        if (instance) {
            this.instances.delete(key)
            return { ok: true }
        }

        return { ok: false, error: `DataStore with key '${key}' not found.` }
    }

    /**
     * Destroys all instances and child containers in the container.
     * Executes onDestroy lifecycle methods and clears the container.
     * @returns A Result indicating the success or failure of the destruction process.
     */
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

    /**
     * Creates and returns a new child container.
     * @returns A new instance of DataStoreContainer as a child container.
     */
    public createChildContainer(): DataStoreContainer {
        const childContainer = new DataStoreContainer()
        this.childContainers.push(childContainer)
        return childContainer
    }

    /**
     * Registers a singleton instance into the container.
     * @param key - The key associated with the instance.
     * @param dataStore - The instance to be registered.
     * @param options - Optional settings for the instance.
     * @returns A Result indicating success or failure in registering the singleton instance.
     */
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

    /**
     * Registers a transient instance into the container.
     * @param key - The key associated with the instance.
     * @param dataStore - The instance to be registered.
     * @param options - Optional settings for the instance.
     * @returns A Result indicating success or failure in registering the transient instance.
     */
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
