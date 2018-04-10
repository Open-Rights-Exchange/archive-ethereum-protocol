require('core-js')
const _ = require('lodash')

const TAG = Object.freeze({
  key: '_open_rights_exchange_protocol_object_tag_'
})
const DATA = Object.freeze({
  key: '_data'
})

const isTagged = (object) => object.hasOwnProperty(TAG.key)
exports.isTagged = isTagged

const withTags = (object, ...tags)=> {
  return Object.assign({[DATA.key]: object}, {[TAG.key]: tags})
}
exports.withTags = withTags

const tags = (object) => object[TAG.key]
exports.tags = tags

const tag = (object) => tags(object)[0]
exports.tag = tag

const subTag = (object) => tags(object)[1]
exports.subTag = subTag

const hasData = (object) => object.hasOwnProperty(DATA.key)
const data = (object) => {
  if (isTagged(object) && hasData(object)) {
    return object[DATA.key]
  }
  return object
}
exports.data = data

const selectType = (types, targetType, name) => {
  // TODO refactor how types are registered to skip the linear scan

  let [[ _, t]] = Object.entries(types).filter(([name, type]) => {
    return type.name === targetType.name
  })

  if (t) {
    return t
  }

  throw new Error('unknown instance of ' + name + ": " + type.name)
}

const defaultFinalizerForProof = (type, value) => {
  return {
    for: type.name,
    value,
  }
}

const selectFinalizer = (func) => {
  switch (func) {
    case 'prove':
      return defaultFinalizerForProof
    default:
  }
  return (_, value) => value
}

exports.dispatch = async (object, context, types, func) => {
  const name = tag(object)
  const type = subTag(object)
  const objectData = data(object)

  const fs = selectType(types, type, name)[func]
  if (fs !== null || fs !== undefined) {
    let f
    let finalizer
    if (_.isArray(fs)) { // custom finalizer
      f = fs[0]
      finalizer = fs[1]
    } else {
      f = fs
      finalizer = selectFinalizer(func)
    }

    const value = await f(objectData, context)

    return finalizer(type, value)
  }
  throw new Error('unknown type of ' + name)
}

// merge updates the tagged object's `_data` with the given `newObject`
const merge = (taggedObject, newObject) => {
  const object = data(taggedObject)
  const objectTags = tags(taggedObject)
  return withTags(Object.assign(object, newObject), ...objectTags)
}
exports.merge = merge

const pairsToObject = (pairs) => pairs.reduce((obj, [k,v]) => Object.assign(obj, {[k]:v}), {})

const inspectField = ([k,v]) => {
  if (_.isArray(v)) {
    return [k, v.map(inspect)]
  }

  if (_.isObject(v)) {
    return [k, inspect(v)]
  }
  return [k,v]
}

const inspect = (taggedObject) => {
  if (!isTagged(taggedObject)) {
    return taggedObject
  }

  const object = data(taggedObject)
  return pairsToObject(Object.entries(object).map(inspectField))
}

// returns an object with structure preserved and the tagging infrastructure removed
exports.inspect = inspect

const notNull = ([k,v]) => k !== null && v !== undefined

const removeDynamicField = ([k, v]) => {
  const vNext = removeDynamicData(v)

  if (vNext === null) {
    return [null]
  }

  const kNext = removeDynamicData(k)
  if (kNext === null) {
    return [null]
  }

  return [kNext, vNext]
}

const removeDynamicData = (tag) => {
  switch (typeof tag) {
    case 'function':
    return null
    case 'string':
    return tag
    case 'object':
      return pairsToObject(Object.entries(tag).map(removeDynamicField).filter(notNull))
    default:
  }
  return tag
}

// removes dynamic data (e.g. functions) that don't survive a {de,}serialization.
exports.equality = (a, b) => {
  const aTags = tags(a).map(removeDynamicData)
  const bTags = tags(b).map(removeDynamicData)

  return _.isEqual(aTags , bTags)
}
