import prettyFormat from 'pretty-format';
import {diff as newDiff, formater} from '../compareObjects';
import diff from '../';

describe('objects', () => {
  test.only('minimal case object', () => {
    const a = {a: 5};
    const b = {a: 4};

    // const b = new User();
    // b.a = {b: {c: 6}};
    // const expected = [
    //   '  Object {',
    //   '    "a": Object {',
    //   '      "b": Object {',
    //   '-       "c": 5,',
    //   '+       "c": 6,',
    //   '      },',
    //   '    },',
    //   '-   "b": 5,',
    //   '  }',
    // ].join('\n');

    // const diffResult = newDiff(a, b, undefined, {});
    // console.log(formater(newDiff(a, b, undefined, {})));
  });

  test('minimal case array', () => {
    const a = [1, 2, 3];
    const b = [1, 2];

    const diffResult = newDiff(a, b, undefined, {});
    console.log(diff(a, b));
  });
});
