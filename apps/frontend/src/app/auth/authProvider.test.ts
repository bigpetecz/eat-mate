import { normalizeInitialUser } from './authProvider';

describe('normalizeInitialUser', () => {
  it('preserves null', () => {
    const result = normalizeInitialUser(null);
    expect(result).toBeNull();
  });

  it('copies id into _id when _id is missing', () => {
    const result = normalizeInitialUser({
      id: 'abc123',
      _id: '' as unknown as string,
      displayName: 'Tester',
      email: 'tester@example.com',
      theme: 'auto',
    });

    expect(result?._id).toBe('abc123');
    expect(result?.id).toBe('abc123');
  });

  it('leaves existing _id unchanged', () => {
    const result = normalizeInitialUser({
      id: 'abc123',
      _id: 'existing-id',
      displayName: 'Tester',
      email: 'tester@example.com',
      theme: 'dark',
    });

    expect(result?._id).toBe('existing-id');
  });
});
