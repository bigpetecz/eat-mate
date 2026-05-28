import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeInitialUser } from './authProvider';

test('normalizeInitialUser preserves null', () => {
  const result = normalizeInitialUser(null);
  assert.equal(result, null);
});

test('normalizeInitialUser copies id into _id when _id is missing', () => {
  const result = normalizeInitialUser({
    id: 'abc123',
    _id: '' as unknown as string,
    displayName: 'Tester',
    email: 'tester@example.com',
    theme: 'auto',
  });

  assert.ok(result);
  assert.equal(result?._id, 'abc123');
  assert.equal(result?.id, 'abc123');
});

test('normalizeInitialUser leaves existing _id unchanged', () => {
  const result = normalizeInitialUser({
    id: 'abc123',
    _id: 'existing-id',
    displayName: 'Tester',
    email: 'tester@example.com',
    theme: 'dark',
  });

  assert.ok(result);
  assert.equal(result?._id, 'existing-id');
});
