var test = require("tape")

var corsify = require("../index")

test("corsify is a function", function (assert) {
    assert.equal(typeof corsify, "function")
    assert.end()
})
