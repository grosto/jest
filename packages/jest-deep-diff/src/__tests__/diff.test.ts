import {stringify} from 'jest-matcher-utils';
import diff from '../diff';
import {DiffObject, Kind} from '../types';

describe('primitive values', () => {
  [
    [true, false],
    [1, 2],
    [0, -0],
    [0, Number.MIN_VALUE], // issues/7941
    [Number.MIN_VALUE, 0],
    ['banana', 'apple'],
    ['1\u{00A0}234,57\u{00A0}$', '1 234,57 $'], // issues/6881
    [
      'type TypeName<T> = T extends Function ? "function" : "object";',
      'type TypeName<T> = T extends Function\n? "function"\n: "object";',
    ],
  ].forEach(([a, b]) => {
    test(`${stringify(a)} is not equal to ${stringify(b)}`, () => {
      expect(diff(a, b).kind).toStrictEqual(Kind.UPDATED);
    });
  });

  [
    [true, true],
    [1, 1],
    [NaN, NaN],
    ['abc', 'abc'],
    ['banana', 'banana'],
  ].forEach(([a, b]) => {
    test(`${stringify(a)} is equal to ${stringify(b)}`, () => {
      expect(diff(a, b).kind).toStrictEqual(Kind.EQUAL);
    });
  });

  test('null and undefined are type unequal', () => {
    expect(diff(undefined, null)).toStrictEqual({
      a: undefined,
      b: null,
      kind: Kind.UNEQUAL_TYPE,
    });
  });
});

describe('primitive wrappers', () => {
  [
    /* eslint-disable no-new-wrappers */
    [new Number(0), new Number(1)],
    [new Boolean(false), new Boolean(true)],
    [new String('ab'), new String('abcd')],
    /* eslint-enable no-new-wrappers */
  ].forEach(([a, b]) => {
    test(`${stringify(a)} is not equal to ${stringify(b)}`, () => {
      const expected: DiffObject = {
        a,
        b,
        kind: Kind.UPDATED,
      };
      expect(diff(a, b)).toStrictEqual(expected);
    });
  });

  [
    /* eslint-disable no-new-wrappers */
    [new Number(2), new Number(2)],
    [new Boolean(false), new Boolean(false)],
    [new String('ab'), new String('ab')],
    /* eslint-enable no-new-wrappers */
  ].forEach(([a, b]) => {
    test(`${stringify(a)} is equal to ${stringify(b)}`, () => {
      const expected: DiffObject = {
        a,
        b,
        kind: Kind.EQUAL,
      };
      expect(diff(a, b)).toStrictEqual(expected);
    });
  });

  [
    /* eslint-disable no-new-wrappers */

    [0, new Number(0)],
    [new Number(0), 0],
    ['abc', new String('abc')],
    [new String('abc'), 'abc'],
    /* eslint-enable no-new-wrappers */
  ].forEach(([a, b]) => {
    test(`${stringify(a)} is not type equal to ${stringify(b)}`, () => {
      const expected: DiffObject = {
        a,
        b,
        kind: Kind.UNEQUAL_TYPE,
      };
      expect(diff(a, b, undefined)).toStrictEqual(expected);
    });
  });
});

describe('RegExp', () => {
  test('regexps with same source and same flags are equal', () => {
    const a = /abc/g;
    const b = /abc/g;

    const expected: DiffObject = {
      a,
      b,
      kind: Kind.EQUAL,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('regexps with difference source are not equal', () => {
    const a = /a/g;
    const b = /abc/g;

    const expected: DiffObject = {
      a,
      b,
      kind: Kind.UPDATED,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('regexps with different flags are not equal', () => {
    const a = /abc/gsy;
    const b = /abc/g;

    const expected: DiffObject = {
      a,
      b,
      kind: Kind.UPDATED,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });
});

describe('Objects', () => {
  test('marks updated field', () => {
    const a = {
      a: 1,
      b: 2,
    };

    const b = {
      a: 1,
      b: 3,
    };

    const expected: DiffObject = {
      a,
      b,

      childDiffs: [
        {
          a: a.a,
          b: b.a,
          kind: Kind.EQUAL,
          path: 'a',
        },
        {
          a: a.b,
          b: b.b,
          kind: Kind.UPDATED,
          path: 'b',
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('marks deleted field', () => {
    const a = {
      a: 1,
      b: 2,
    };

    const b = {
      a: 1,
    };

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: a.a,
          b: b.a,
          kind: Kind.EQUAL,
          path: 'a',
        },
        {
          a: a.b,
          b: undefined,
          kind: Kind.DELETED,
          path: 'b',
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('marks inserted field', () => {
    const a = {
      a: 1,
    };

    const b = {
      a: 1,
      b: 2,
    };

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: a.a,
          b: b.a,
          kind: Kind.EQUAL,
          path: 'a',
        },
        {
          a: undefined,
          b: b.b,
          kind: Kind.INSERTED,
          path: 'b',
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('different constructors are not equal', () => {
    class A {}
    class B {}

    const a = new A();
    const b = new B();

    const expected: DiffObject = {
      a,
      b,
      kind: Kind.UNEQUAL_TYPE,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('non-enumerable members should be skipped during equal', () => {
    const a = {
      x: 3,
    };
    Object.defineProperty(a, 'test', {
      enumerable: false,
      value: 5,
    });

    const b = {
      x: 3,
    };

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: 3,
          b: 3,
          kind: 0,
          path: 'x',
        },
      ],
      kind: Kind.EQUAL,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('non-enumerable symbolic members should be skipped during equal', () => {
    const a = {
      x: 3,
    };
    const mySymbol = Symbol('test');
    Object.defineProperty(a, mySymbol, {
      enumerable: false,
      value: 5,
    });

    const b = {
      x: 3,
    };

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: 3,
          b: 3,
          kind: 0,
          path: 'x',
        },
      ],
      kind: Kind.EQUAL,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('correctly propagates "updated" to parent', () => {
    const a = {
      a: 1,
      b: {
        c: {
          d: 2,
        },
      },
    };

    const b = {
      a: 1,
      b: {
        c: {
          d: 1,
        },
      },
    };

    expect(diff(a, b)).toMatchSnapshot();
  });
});

describe('Arrays', () => {
  test('marks updated field', () => {
    const a = [1, 2];
    const b = [1, 3];

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: a[0],
          b: b[0],
          kind: Kind.EQUAL,
          path: 0,
        },
        {
          a: a[1],
          b: b[1],
          kind: Kind.UPDATED,
          path: 1,
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('marks inserted fields', () => {
    const a = [1];
    const b = [1, 2];

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: a[0],
          b: b[0],
          kind: Kind.EQUAL,
          path: 0,
        },
        {
          a: a[1],
          b: b[1],
          kind: Kind.INSERTED,
          path: 1,
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('marks deleted fields', () => {
    const a = [1, 2];
    const b = [1];

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: a[0],
          b: b[0],
          kind: Kind.EQUAL,
          path: 0,
        },
        {
          a: a[1],
          b: b[1],
          kind: Kind.DELETED,
          path: 1,
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });
});

describe.skip('Maps', () => {
  test('marks updated field', () => {
    const a = new Map([
      ['a', 1],
      ['b', 3],
    ]);
    const b = new Map([
      ['a', 1],
      ['b', 2],
    ]);

    const expected: DiffObject = {
      a,
      b,

      childDiffs: [
        {
          a: a.get('b'),
          b: b.get('b'),
          kind: Kind.UPDATED,
          path: {
            a: 'b',
            b: 'b',
            kind: Kind.EQUAL,
          },
        },
        {
          a: a.get('a'),
          b: b.get('a'),
          kind: Kind.EQUAL,
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('marks deleted field', () => {
    const a = new Map([
      ['b', 3],
      ['a', 1],
    ]);
    const b = new Map([['b', 3]]);

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: a.get('b'),
          b: undefined,
          kind: Kind.DELETED,
          path: 'b',
        },
        {
          a: a.get('a'),
          b: b.get('a'),
          kind: Kind.EQUAL,
          path: {
            a: 'a',
            b: 'a',
            kind: Kind.EQUAL,
          },
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });

  test('marks inserted field', () => {
    const a = new Map([['b', 1]]);
    const b = new Map([
      ['b', 1],
      ['a', 3],
    ]);

    const expected: DiffObject = {
      a,
      b,
      childDiffs: [
        {
          a: undefined,
          b: b.get('a'),
          kind: Kind.INSERTED,
          path: 'a',
        },
        {
          a: a.get('b'),
          b: b.get('b'),
          kind: Kind.EQUAL,
          path: {
            a: 'b',
            b: 'b',
            kind: Kind.EQUAL,
          },
        },
      ],
      kind: Kind.UPDATED,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });
  test('checks deep equality of keys and values', () => {
    const a = new Map([[{a: 1}, 'abcd']]);
    const b = new Map([
      [{a: 1}, 'dsds'],
      [{a: 1}, 'dsassa'],
      [{a: 1}, 'abcd'],
    ]);

    const expected = {
      a,
      b,
      kind: Kind.EQUAL,
      path: undefined,
    };

    expect(diff(a, b)).toStrictEqual(expected);
  });
});

describe('Circular objects', () => {
  test('properties with the same circularity are equal', () => {
    const a = {};
    a.x = a;
    const b = {};
    b.x = b;
    expect(diff(a, b)).toMatchSnapshot();
    expect(diff(b, a)).toEqual(diff(a, b));

    const c = {};
    c.x = a;
    const d = {};
    d.x = b;
    expect(diff(c, d)).toMatchSnapshot();
    expect(diff(d, c)).toEqual(diff(c, d));
  });

  test('properties with different circularity are not equal', () => {
    const a = {};
    a.x = {y: a};
    const b = {};
    const bx = {};
    b.x = bx;
    bx.y = bx;

    expect(diff(a, b)).toMatchSnapshot();
    expect(diff(b, a).kind).toEqual(diff(a, b).kind);

    const c = {};
    c.x = a;
    const d = {};
    d.x = b;
    expect(diff(c, d)).toMatchSnapshot();
    expect(diff(c, d).kind).toEqual(diff(d, c).kind);
  });

  test('are not equal if circularity is not on the same property', () => {
    const a = {};
    const b = {};
    a.a = a;
    b.a = {};
    b.a.a = a;
    expect(diff(a, b)).toMatchSnapshot();
    expect(diff(b, a).kind).toEqual(diff(a, b).kind);

    const c = {};
    c.x = {x: c};
    const d = {};
    d.x = d;
    expect(diff(c, d)).toMatchSnapshot();
    expect(diff(c, d).kind).toEqual(diff(d, c).kind);
  });
});
