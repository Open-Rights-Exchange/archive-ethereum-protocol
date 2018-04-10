const tagged = require('../dist/tagged')
const assert = require('assert')
const _ = require('lodash')

describe('tagged', function() {
  describe('inspect', function() {
    it('works', function() {
      const taggedObject = tagged.withTags({
        a: "hi",
        b: tagged.withTags({c: 1}, "sub-hi"),
        c: [tagged.withTags({d: 23}, "sub-ary-hi")]
      }, "top-level")

      const object = {
        a: "hi",
        b: {
          c: 1
        },
        c: [ {d: 23} ]
      }

      assert(_.isEqual(tagged.inspect(taggedObject), object))
    })
  })
})
