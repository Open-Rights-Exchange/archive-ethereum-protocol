const { instrument, right, condition, capability } = require('../dist/index.js')
const assert = require('assert')

describe('Instrument', function() {
  describe('describe', function() {
    it('can be statically described', function() {
      const issuer = "0x123456789abcdef"
      const instrumentDescription = "some instrument description"
      const rightDescription = "some right description"

      const aCondition = condition.forConstant(true)
      const someConditions = [aCondition]

      const someCapability = capability.forConstant(true)

      const aRight = right.describe({
        description: rightDescription,
        conditions: someConditions,
        capability: someCapability
      })

      const someRights = [aRight]

      const inst = instrument.describe({
        description: instrumentDescription,
        rights: someRights,
        issuer,
      })

      assert(true)
    })
  })
})
