import chalk, {Chalk} from 'chalk';
import getType from 'jest-get-type';
import prettyFormat from 'pretty-format';

const fgDelete = chalk.green;
const fgInsert = chalk.red;
const fgCommon = chalk.dim;

const formatCommon = () => fgCommon();

// import {NO_DIFF_MESSAGE} from './constants';

// type PrimitiveValue = string | number | boolean | null | undefined | symbol;
// type ComplexValue =
//   | Function
//   | RegExp
//   | Map<unknown, unknown>
//   | Set<unknown>
//   | Date
//   | Record<string, any>
//   | Array<unknown>;

const INSERTED = 'INSERTED';
const DELETED = 'DELETED';
const EQUAL = 'EQUAL';
const UPDATED = 'UPDATED';
const TYPE_UNEQUAL = 'TYPE_UNEQUAL';

type DiffResult =
  | typeof INSERTED
  | typeof DELETED
  | typeof EQUAL
  | typeof UPDATED
  | typeof TYPE_UNEQUAL;

interface ValuesDiff {
  diffResult: DiffResult;
  path?: Key;
  a: unknown;
  b: unknown;
  propertyDiffs?: Array<ValuesDiff>;
}

function hasDefinedKey(obj: any, key: string) {
  return hasKey(obj, key) && obj[key] !== undefined;
}

function hasKey(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// const getConstructorName = (val: Record<string, unknown>) =>
//   (typeof val.constructor === 'function' && val.constructor.name) || 'Object';

function formatDiffResult(
  diffResult: DiffResult,
  a: unknown,
  b: unknown,
  path: Key | undefined,
) {
  return {
    a,
    b,
    diffResult,
    path,
  };
}

function formatTypeUnequal(
  a: unknown,
  b: unknown,
  path: Key | undefined,
): ValuesDiff {
  return formatDiffResult(TYPE_UNEQUAL, a, b, path);
}

function formatEqual(a: unknown, b: unknown, path: Key | undefined) {
  return formatDiffResult(EQUAL, a, b, path);
}

function formatUpdated(a: unknown, b: unknown, path: Key | undefined) {
  return formatDiffResult(UPDATED, a, b, path);
}

function formatDeleted(a: unknown, b: unknown, path: Key | undefined) {
  return formatDiffResult(DELETED, a, b, path);
}

function formatInserted(a: unknown, b: unknown, path: Key | undefined) {
  return formatDiffResult(INSERTED, a, b, path);
}

function compareStrings(a: string, b: string) {
  // Coerce regexes to strings and treat strings, primitives and objects,
  // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
  // for more details.
  return a == String(b);
}

function compareNumbers(a: number, b: number) {
  return Object.is(Number(a), Number(b));
}

function compareRegExp(a: RegExp, b: RegExp) {
  return (
    a.source == b.source &&
    a.global == b.global &&
    a.multiline == b.multiline &&
    a.ignoreCase == b.ignoreCase
  );
}

type Key = number | string | symbol;

function getComplexValueDiffResult(
  propertyDiffs: Array<ValuesDiff>,
): typeof EQUAL | typeof UPDATED {
  return propertyDiffs.reduce((acc: typeof EQUAL | typeof UPDATED, diff) => {
    let diffResult;
    if (diff.propertyDiffs) {
      diffResult = getComplexValueDiffResult(diff.propertyDiffs);
    } else {
      diffResult = diff.diffResult;
    }
    return diffResult !== EQUAL ? UPDATED : acc;
  }, EQUAL);
}

function getKeys(obj: object) {
  const allKeys = (function(o) {
    const keys = [];
    for (const key in o) {
      if (hasDefinedKey(o, key)) {
        keys.push(key);
      }
    }
    return keys.concat(
      (Object.getOwnPropertySymbols(o) as Array<any>).filter(
        symbol =>
          (Object.getOwnPropertyDescriptor(o, symbol) as any).enumerable,
      ),
    );
  })(obj);

  const extraKeys = [];
  if (allKeys.length === 0) {
    return allKeys;
  }

  for (let x = 0; x < allKeys.length; x++) {
    if (typeof allKeys[x] === 'symbol' || !allKeys[x].match(/^[0-9]+$/)) {
      extraKeys.push(allKeys[x]);
    }
  }

  return extraKeys;
}

export function compareObjects(
  a: Record<Key, unknown>,
  b: Record<Key, unknown>,
  path: Key | undefined,
  diffFunc: Function,
  options: {},
): ValuesDiff {
  const propertyDiffs = [];

  const aKeys: Array<Key | null> = getKeys(a);
  const bKeys: Array<Key | null> = getKeys(b);

  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i] as Key;
    const otherIndex = bKeys.indexOf(key);
    if (otherIndex >= 0) {
      propertyDiffs.push(diffFunc(a[key], b[key], key));
      bKeys[otherIndex] = null;
    } else {
      propertyDiffs.push(formatDeleted(a[key], undefined, key as Key));
    }
  }
  for (let i = 0; i <= bKeys.length; i++) {
    const key = bKeys[i] as Key;
    if (key) {
      propertyDiffs.push(formatInserted(undefined, b[key], key));
    }
  }

  const diffResult = getComplexValueDiffResult(propertyDiffs);

  const diff: ValuesDiff = {
    a,
    b,
    diffResult,
    path,
    ...(diffResult !== EQUAL && {propertyDiffs}),
  };

  return diff;
}

export function compareArrays(
  a: Array<unknown>,
  b: Array<unknown>,
  path: Key | undefined,
  diffFunc: Function,
  options,
): ValuesDiff {
  let diffResult: DiffResult = EQUAL;
  const propertyDiffs = [];
  let aIndex = a.length - 1;
  let bIndex = b.length - 1;
  while (aIndex > bIndex) {
    diffResult = UPDATED;
    propertyDiffs.push(formatDeleted(a[aIndex], undefined, aIndex));
    aIndex--;
  }
  while (bIndex > aIndex) {
    diffResult = UPDATED;
    propertyDiffs.push(formatInserted(undefined, b[bIndex], aIndex));
    bIndex--;
  }
  while (aIndex >= 0) {
    propertyDiffs.push(diffFunc(a[aIndex], b[aIndex], aIndex));
    aIndex--;
  }
  diffResult =
    diffResult === UPDATED
      ? diffResult
      : getComplexValueDiffResult(propertyDiffs);

  return {
    a,
    b,
    diffResult,
    path,
    ...(diffResult !== EQUAL && {propertyDiffs: propertyDiffs.reverse()}),
  };
}

export function diff(
  a: unknown,
  b: unknown,
  path: Key | undefined,
  options: {},
): ValuesDiff {
  if (a instanceof Error && b instanceof Error) {
    return a.message == b.message
      ? formatEqual(a, b, path)
      : formatUpdated(a, b, path);
  }

  if (Object.is(a, b)) {
    return formatEqual(a, b, path);
  }

  const aType = getType(a);
  if (aType !== getType(b)) {
    return formatTypeUnequal(a, b, path);
  }

  switch (aType) {
    case 'string': {
      return compareStrings(a as string, b as string)
        ? formatEqual(a, b, path)
        : formatUpdated(a, b, path);
    }
    case 'number': {
      return compareNumbers(a as number, b as number)
        ? formatEqual(a, b, path)
        : formatUpdated(a, b, path);
    }
    case 'boolean':
    case 'date':
      return +(a as Date | number) == +(b as Date | number)
        ? formatEqual(a, b, path)
        : formatUpdated(a, b, path);
    case 'regexp':
      return compareRegExp(a as RegExp, b as RegExp)
        ? formatEqual(a, b, path)
        : formatUpdated(a, b, path);
    case 'array':
      return compareArrays(
        a as Array<unknown>,
        b as Array<unknown>,
        path,
        diff,
        options,
      );
    case 'object':
      return compareObjects(
        a as Record<Key, unknown>,
        b as Record<Key, unknown>,
        path,
        diff,
        options,
      );
    default:
      throw new Error('oopsie');
  }
}

const getFormater = a => {
  getType(a);
};

function stringFormatEqual(a, b, path, parentType) {
  return prettyFormat(a);
}

const getConstructorName = a => a.constructor.name;

const getFormatedConstructor = a => {
  const name = getConstructorName(a);
  if (name === 'Object') {
  }
};

function stringFormatUpdated(a, b, path, parentType) {
  const constructor = getFormatedConstructor(a);
  fgCommon(constructor);
}

const getAnnotation = (options): string =>
  fgDelete('- ' + ((options && options.aAnnotation) || 'Expected')) +
  '\n' +
  fgInsert('+ ' + ((options && options.bAnnotation) || 'Received')) +
  '\n\n';

export function formater(valuesDiff: ValuesDiff, parentType?: string): string {
  const message = getAnnotation();
  let diff;
  // if (valuesDiff.diffResult === EQUAL) {
  //   diff = stringFormatEqual(valuesDiff.a, valuesDiff.b, path, parentType);
  // } else if (valuesDiff.diffResult === UPDATED) {
  //   diff = stringFormatUpdated(
  //     valuesDiff.a,
  //     valuesDiff.b,
  //     valuesDiff.path,
  //     parentType,
  //   );
  // }
  return message + diff;
}

// diffObject
// 1. get if defined on both sides
// 2. if yes compare both sides
//   2.1 if their type is different short-circuit
//   2.2 if both values are primitive then compare values
//   2.3 if both values are values are objects recurse
// 3. finally format

class Test extends Array {}

const test = new Test();
console.log(Array.isArray(test));
console.log(Test.name);
