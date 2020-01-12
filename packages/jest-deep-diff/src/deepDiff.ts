import getType = require('jest-get-type');

/** https://github.com/Microsoft/TypeScript/issues/24587 */
type Key = string | number /* | symbol */;

export enum DiffResult {
  INSERTED = 'INSERTED',
  DELETED = 'DELETED',
  EQUAL = 'EQUAL',
  UPDATED = 'UPDATED',
  TYPE_UNEQUAL = 'TYPE_UNEQUAL',
}

export interface ValuesDiff {
  diffResult: DiffResult;
  path?: Key;
  a: unknown;
  b: unknown;
  propertyDiffs?: Array<ValuesDiff>;
}

function createDiffResult(
  diffResult: DiffResult,
  a: unknown,
  b: unknown,
  path: Key | undefined,
) {
  return {
    a,
    b,
    diffResult,
    ...(path && {path}),
  };
}

function createTypeUnequal(
  a: unknown,
  b: unknown,
  path: Key | undefined,
): ValuesDiff {
  return createDiffResult(DiffResult.TYPE_UNEQUAL, a, b, path);
}

const createEqual = (a: unknown, b: unknown, path: Key | undefined) =>
  createDiffResult(DiffResult.EQUAL, a, b, path);

const createUpdated = (a: unknown, b: unknown, path: Key | undefined) =>
  createDiffResult(DiffResult.UPDATED, a, b, path);

const createDeleted = (a: unknown, b: unknown, path: Key | undefined) =>
  createDiffResult(DiffResult.DELETED, a, b, path);

const createInserted = (a: unknown, b: unknown, path: Key | undefined) =>
  createDiffResult(DiffResult.INSERTED, a, b, path);

// compare functions

const compareStrings = (a: string, b: string) => a == String(b);

const compareNumbers = (a: number, b: number) =>
  Object.is(Number(a), Number(b));

const compareDatesAndBooleans = (a: Date | boolean, b: Date | boolean) =>
  +a == +b;

const compareRegExps = (a: RegExp, b: RegExp) =>
  Object.is(a.source, b.source) &&
  Object.is(a.global, b.global) &&
  Object.is(a.multiline, b.multiline) &&
  Object.is(a.ignoreCase, b.ignoreCase);

const compareErrors = (a: Error, b: Error) => a.message == b.message;

function getComplexValueDiffResult(
  propertyDiffs: Array<ValuesDiff>,
): DiffResult.EQUAL | DiffResult.UPDATED {
  return propertyDiffs.reduce(
    (acc: DiffResult.EQUAL | typeof DiffResult.UPDATED, diff) => {
      let diffResult;
      if (diff.propertyDiffs) {
        diffResult = getComplexValueDiffResult(diff.propertyDiffs);
      } else {
        diffResult = diff.diffResult;
      }
      return diffResult !== DiffResult.EQUAL ? DiffResult.UPDATED : acc;
    },
    DiffResult.EQUAL,
  );
}

function hasKey(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function getKeys(obj: object) {
  const allKeys = (function(o) {
    const keys = [];
    for (const key in o) {
      if (hasKey(o, key)) {
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
      propertyDiffs.push(createDeleted(a[key], undefined, key as Key));
    }
  }
  for (let i = 0; i <= bKeys.length; i++) {
    const key = bKeys[i] as Key;
    if (key) {
      propertyDiffs.push(createInserted(undefined, b[key], key));
    }
  }

  const diffResult = getComplexValueDiffResult(propertyDiffs);

  const diff: ValuesDiff = {
    a,
    b,
    diffResult,
    path,
    ...(diffResult !== DiffResult.EQUAL && {propertyDiffs}),
  };

  return diff;
}

export function compareArrays(
  a: Array<unknown>,
  b: Array<unknown>,
  path: Key | undefined,
  diffFunc: Function,
): ValuesDiff {
  let diffResult = DiffResult.EQUAL;
  const propertyDiffs = [];
  let aIndex = a.length - 1;
  let bIndex = b.length - 1;
  while (aIndex > bIndex) {
    diffResult = DiffResult.UPDATED;
    propertyDiffs.push(createDeleted(a[aIndex], undefined, aIndex));
    aIndex--;
  }
  while (bIndex > aIndex) {
    diffResult = DiffResult.UPDATED;
    propertyDiffs.push(createInserted(undefined, b[bIndex], aIndex));
    bIndex--;
  }
  while (aIndex >= 0) {
    propertyDiffs.push(diffFunc(a[aIndex], b[aIndex], aIndex));
    aIndex--;
  }
  diffResult =
    diffResult === DiffResult.UPDATED
      ? diffResult
      : getComplexValueDiffResult(propertyDiffs);

  return {
    a,
    b,
    diffResult,
    path,
    ...(diffResult !== DiffResult.EQUAL && {
      propertyDiffs: propertyDiffs.reverse(),
    }),
  };
}

// deepDiff
function deepDiff(a: unknown, b: unknown, path?: Key): ValuesDiff {
  if (Object.is(a, b)) return createEqual(a, b, path);

  const aType = getType(a);

  if (a instanceof Error && b instanceof Error) {
    return compareErrors(a, b)
      ? createEqual(a, b, path)
      : createUpdated(a, b, path);
  }

  switch (aType) {
    case 'string': {
      return compareStrings(a as string, b as string)
        ? createEqual(a, b, path)
        : createUpdated(a, b, path);
    }
    case 'number': {
      return compareNumbers(a as number, b as number)
        ? createEqual(a, b, path)
        : createUpdated(a, b, path);
    }
    case 'boolean':
    case 'date':
      return compareDatesAndBooleans(a as Date | boolean, b as Date | boolean)
        ? createEqual(a, b, path)
        : createUpdated(a, b, path);
    case 'regexp':
      return compareRegExps(a as RegExp, b as RegExp)
        ? createEqual(a, b, path)
        : createUpdated(a, b, path);
  }

  if (getType.isPrimitive(a) !== getType.isPrimitive(b)) {
    return createTypeUnequal(a, b, path);
  }

  switch (aType) {
    case 'array':
      return compareArrays(
        a as Array<unknown>,
        b as Array<unknown>,
        path,
        deepDiff,
      );
    case 'object':
      return compareObjects(
        a as Record<Key, unknown>,
        b as Record<Key, unknown>,
        path,
        deepDiff,
      );
    default:
      throw new Error('oopsie');
  }
}

export default deepDiff;
