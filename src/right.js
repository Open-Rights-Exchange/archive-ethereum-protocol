const hash = require('./hash').default
const tagged = require('./tagged')
const _ = require('lodash')
const condition = require('./condition')
const capability = require('./capability')

const p = console.log

// predicate to filter for a right with a given capability
const withCapability = (cap) => (right) => capability.equality(right.capability, cap)
exports.withCapability = withCapability

const completeDescriptionIfMissing = (right) => {
  if (withCapability(capability.forInstrument())(right)
      && (right.description === null || right.description === undefined)) {
    const { instrument: taggedInstrument } = tagged.data(right.capability)
    const instrument = tagged.data(taggedInstrument)

    return Object.assign(right, {
      description: `right to create an instrument for ${instrument.description}`
    })
  }
  return right
}

const installConditionForCapability = (condition, capability) => (right) => {
  if (withCapability(capability)(right)) {
    return Object.assign(right, {
      conditions: right.conditions.concat(condition)
    })
  }
  return right
}

const compose = (f, g) => (x) => g(f(x))

exports.describe = (options) => {
  const { description, conditions, capability: cap} = options

  const right = {
    description,
    conditions,
    capability: cap
  }

  const transform = compose(completeDescriptionIfMissing,
                     installConditionForCapability(condition.forMatchingHolder(), capability.forAPI()))

  return tagged.withTags(transform(right), 'right')
}

exports.exercise = async (right, {web3, transactionParameters, cpuContractAddress, paymentChannelInstance, contract}) => {
  const { conditions, capability: cap } = tagged.data(right)

  let proofs = []

  if (conditions !== undefined && conditions !== null) {
    for (let c of conditions) {
      const proof = await condition.prove(c, {web3, transactionParameters, cpuContractAddress, contract, paymentChannelInstance})
      proofs.push(proof)
    }
  }

  return capability.decorate(cap, {proofs, contractAddress: contract.address})
}

exports.verify = async (right, proofs, context) => {
  const { conditions } = tagged.data(right)

  if (conditions === undefined || conditions === null) {
    return true
  }

  if (conditions.length !== proofs.length) {
    throw new Error('inconsistent number of proofs and conditions')
  }

  const verificationOperations = _.zipWith(conditions, proofs, (c, p) => {
    return condition.verify(c, Object.assign(context, {proof: p}))
  })
  const verifications = await Promise.all(verificationOperations)
  return verifications.reduce((result, satisfied) => (result && satisfied), true)
}

const findPropertiesTagged = (taggedRight, taggedCriteria) => {
  const [criteriaTag, criteriaSubTag] = tagged.tags(taggedCriteria)
  const criteria = tagged.data(taggedCriteria)

  const right = tagged.data(taggedRight)

  let candidates
  switch (criteriaTag) {
    case 'condition':
      candidates = right.conditions
      break;
    case 'capability':
      candidates = [right.capability]
      break;
    default:
      throw new Error('unknown type of data passed as filter criteria; please use a constructor in the library')
  }

  return candidates.filter((taggedCandidate) => {
    const [tag, subTag] = tagged.tags(taggedCandidate)

    if (!criteria) { // we are interested in type, not value
      return tag === criteriaTag && subTag.name === criteriaSubTag.name
    }

    const candidate = tagged.data(taggedCandidate)

    return _.some(candidate, (val, key) => _.isEqual(val, criteria[key]))
  })
}

const searchTagged = (taggedRight, taggedCriteria) => {
  const matches = findPropertiesTagged(taggedRight, taggedCriteria)

  if (_.some(matches)) {
    return taggedRight
  }
  return null
}

const searchMultiple = (right, criteriaDescriptor) => {
  throw new Error('not implemented, sorry')
}

// searches the right for the given criteria
const search = (criteria) => (right) => {
  if (tagged.isTagged(criteria)) {
    return searchTagged(right, criteria)
  }
  return searchMultiple(right, criteria)
}
exports.search = search

exports.findProperties = (right, criteria) => {
  if (tagged.isTagged(criteria)) {
    return findPropertiesTagged(right, criteria)
  }
  throw new Error('not implemented, sorry')
}
