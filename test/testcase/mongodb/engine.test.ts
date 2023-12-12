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

import assert from "assert"
import { describe, it } from "mocha"
import { exampleMongoDb } from "../../helper/mongodb/instance"
import { generateExpample } from "../../helper/mongodb/types"

//@ts-ignore
describe("Engine(mongo) Test", () => {
    beforeEach(async () => {
        // TODO:DESIGN
        // try {
        //     execSync("npm run mongodb-anon:run")
        // } catch (error: any) {
        //     console.error("Error clear and run MongoDB container:", error)
        // }
        const res = await exampleMongoDb.connect()
        assert.deepEqual(res.ok, true)
    })

    afterEach(async () => {
        const res = await exampleMongoDb.disconnect()
        assert.deepEqual(res.ok, true)
    })

    describe("Connect test", () => {
        it("normal test", async () => {
            const res = await exampleMongoDb.connect()
            assert.deepEqual(res.ok, true)
        })
    })

    describe("Disconnect test", () => {
        it("normal test", async () => {
            const res = await exampleMongoDb.disconnect()
            assert.deepEqual(res.ok, true)
        })
    })

    describe("Create test", () => {
        it("normal test", async () => {
            const res = await exampleMongoDb.create(
                generateExpample(1, "1", true)
            )
            assert.deepEqual(res.ok, true)
        })

        it("abnormal test", async () => {
            const resNormal = await exampleMongoDb.create(
                generateExpample(2, "2", true)
            )
            assert.deepEqual(resNormal.ok, true)

            const resAbnormal = await exampleMongoDb.create(
                generateExpample(2, "2", true)
            )
            assert.deepEqual(resAbnormal.ok, false)
        })
    })

    describe("Find test", () => {
        it("normal test", async () => {
            const resCreate = await exampleMongoDb.create(
                generateExpample(3, "3", true)
            )
            assert.deepEqual(resCreate.ok, true)

            const resNotExsit = await exampleMongoDb.find({
                conditions: [{ numberElement: 0 }],
            })
            assert.deepEqual(resNotExsit.ok, true)
            assert.deepEqual(resNotExsit.data?.length, 0)

            const resExsit = await exampleMongoDb.find({
                conditions: [{ numberElement: 3 }],
            })
            assert.deepEqual(resExsit.ok, true)
            assert.deepEqual(resExsit.data?.length, 1)
        })
    })

    describe("Update test", () => {
        it("normal test", async () => {
            const resCreate = await exampleMongoDb.create(
                generateExpample(4, "4", true)
            )
            assert.deepEqual(resCreate.ok, true)

            const resPreUpdate = await exampleMongoDb.find({
                conditions: [{ numberElement: 4 }],
            })
            assert.deepEqual(resPreUpdate.data![0].stringElement, "4")

            const res = await exampleMongoDb.update(
                {
                    conditions: [{ numberElement: 4 }],
                },
                { stringElement: "040" }
            )
            assert.deepEqual(res.ok, true)

            const resPostUpdate = await exampleMongoDb.find({
                conditions: [{ numberElement: 4 }],
            })
            assert.deepEqual(resPostUpdate.data![0].stringElement, "040")
        })
    })

    describe("Delete test", () => {
        it("normal test", async () => {
            const resCreate = await exampleMongoDb.create(
                generateExpample(5, "5", true)
            )
            assert.deepEqual(resCreate.ok, true)

            const resPreDelete = await exampleMongoDb.find({
                conditions: [{ numberElement: 5 }],
            })
            assert.deepEqual(resPreDelete.ok, true)
            assert.deepEqual(resPreDelete.data?.length, 1)

            const res = await exampleMongoDb.delete({
                conditions: [{ numberElement: 5 }],
            })
            assert.deepEqual(res.ok, true)

            const resPostDelete = await exampleMongoDb.find({
                conditions: [{ numberElement: 5 }],
            })
            assert.deepEqual(resPostDelete.ok, true)
            assert.deepEqual(resPostDelete.data?.length, 0)
        })
    })

    describe("GetIndexes test", () => {
        it("normal test", async () => {
            const res = await exampleMongoDb.getIndexes!()
            assert.deepEqual(res, {
                ok: true,
                data: [
                    "numberElement",
                    "stringElement",
                    "boolElement",
                    "objectElement",
                    "arrayElement",
                    "_id",
                    "__v",
                ],
            })
        })
    })

    describe("GetUniqueIndexes test", () => {
        it("normal test", async () => {
            const res = await exampleMongoDb.getUniqueIndexes!()
            assert.deepEqual(res, { ok: true, data: ["numberElement"] })
        })
    })
})
