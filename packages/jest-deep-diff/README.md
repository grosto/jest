# Jest New Diff

I have not thought about the name at all. If there are good suggestions, you are more than welcome.

## Motivation

`jest-diff` package works by serializing the values and then diffing the serializations. This approach works for most of the scenarios but has a few edge cases. New Diff tries to address these limitations by first by diffing the values and then serializing the differences.

## Understanding design and codebase

Consider this my attempt to produce something that works to help me improve my understanding of the problem space.

There are two major parts of the current implementation.

1. `diff` function which produces DiffObject(Representation of Diff as an Object)
2. `format` function which produces formatted string based on DiffObject

There is support for plugins for custom types. I have made ReactElement and AsymmetricMatcher Plugin, but they are not fully functional.

API is almost identical to jest-diff. There are 2 extra fields added in the options but rest is identical, but not all of them are implemented.

## `diff`

### supported types:

- [x] primitives (String is the only primitve with childDiffs)
- [x] Date
- [x] RegExp
- [x] Function
- [x] PrimitiveWrapper
- [x] Array
- [x] Object
- [x] Circular
- [ ] Map
- [ ] Set
- [ ] DOM Node

I am quite happy with this module. It's clear to me what it does. Its job is to mark values as Inserted, Updated, Deleted, Equal or TypeUnequal and to produce an object which represents the differences between 2 values.

## `format`

- [x] primitives
- [x] Function
- [x] Array
- [x] Object
- [x] Circular
- [ ] Date
- [ ] RegExp
- [ ] Map
- [ ] Set
- [ ] DOM Node

`format` has two parts, `diffFormat`(desperately needs a name) and `print`. One which produces an array of `Line` objects from `DiffObject` and another which serializes this array based on options.

### `Line` type

`Line` is a terminal line that will be printed on the screen. It has `type` of Inserted, Common or Deleted. For now, the type determines the color of the content and diff indicator('-', '+'). `val` is a value that should be serialized. `prefix` and `suffix` are added to the serialized value, as well as `indent`.

`Line` also has `skipSerialize` field which can be passed if you want to serializer `val` yourself.

Note: `Line` can be printed as multiple lines too, but that is up to print function.

Example:

```ts
const line: Line = {type: Inserted, prefix: '"a": ', sufix: ',', val: {b: 1}};
```

can be rendered as

```
....more diff

-  "a": Object {
     "b": 1,
   },

...more diff
```

or

```
....more diff

-  "a": Object {...},

...more diff
```

### `Print`

The second part of `format` is the print function. It serializes the `val` from the `Line` and builds a final diff string. `serialize` function currently is `pretty-format` with extra plugins;

## Problems of implementation:

`serialize` and `diffFormat` needs to be manually kept in sync.

```ts
const a = {
  a: {
    a: 1,
  },
};
const b = {
  a: 'a',
};

console.log(newDiff(a, b));
/**
 *    Object { <- Constructor name and properties are formated by diffFormat
 * -    "a": Object { <-- Constructor name and properties are formatted by serialize
 *        "a": 1,
 *      },
 * +    "a": 'a',
 *    }
 */
```

In `jest-diff` that is the output. If we are going to keep it, then maybe the current abstraction is not the best. I would expect that there is no need to fully print the inner object.
