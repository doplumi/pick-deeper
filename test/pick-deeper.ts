import test from 'ava';

import { pickDeeper } from '../src';

const obj = {
  a: 'b',
  c: 'd',
  e: {
    f: 'g',
    h: 'i',
  },
  j: ['k', 'l'],
  m: [
    {
      n: 'o',
      p: 'q',
    },
    {
      n: {
        o: 'p',
        q: 'r',
      },
    },
    {
      s: [
        {
          t: 'u',
          v: 'w',
        },
        {
          t: 'x',
        },
        {},
      ],
      x: [
        {
          y: 'z',
        },
        'a',
      ],
    },
  ],
};

test('can pick natives', (t) => {
  t.deepEqual(pickDeeper(obj, ['a']), { a: obj.a });
});

test('can pick when property is not found', (t) => {
  t.deepEqual(pickDeeper(obj, ['a', 'c', 'z']), { a: obj.a, c: obj.c });
});

test('can pick whole arrays', (t) => {
  t.deepEqual(pickDeeper(obj, ['a', 'm']), { a: obj.a, m: obj.m });
});

test('can pick inside arrays', (t) => {
  t.deepEqual(pickDeeper(obj, ['a', 'm.*.n']), {
    a: obj.a,
    m: [{ n: obj.m[0].n }, { n: obj.m[1].n }, {}],
  });
});

test('can pick inside arrays inside arrays', (t) => {
  t.deepEqual(pickDeeper(obj, ['a', 'm.*.s.*.t']), {
    a: obj.a,
    m: [
      {},
      {},
      {
        s: [{ t: obj.m[2].s![0].t }, { t: obj.m[2].s![1].t }, {}],
      },
    ],
  });
});

test('can pick when arrays have native properties and transform navite properties to undefined', (t) => {
  t.deepEqual(pickDeeper(obj, ['m.*.x.*.y']), {
    m: [{}, {}, { x: [{ y: 'z' }, undefined] }],
  });
});

test("can pick when array doesn't exist and omit the key from the object", (t) => {
  t.deepEqual(pickDeeper(obj, ['x.*.y.*.z']), {});
});
