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
import {
    exampleAuthMongoDb,
    exampleWrongAuthMongoDb,
} from "../../helper/mongodb/instance"

//@ts-ignore
describe("Engine(mongo) Auth Test", () => {
    describe("Connect test(auth)", () => {
        it("normal test", async () => {
            const res = await exampleAuthMongoDb.connect()
            assert.deepEqual(res.ok, true)
        })

        it("abnormal test(auth)", async () => {
            const res = await exampleWrongAuthMongoDb.connect()
            assert.deepEqual(res.ok, false)
        })
    })

    describe("Disconnect test", () => {
        it("normal test", async () => {
            const res = await exampleAuthMongoDb.disconnect()
            assert.deepEqual(res.ok, true)
        })

        it("abnormal test", async () => {
            const res = await exampleWrongAuthMongoDb.disconnect()
            assert.deepEqual(res.ok, true)
        })
    })
})
