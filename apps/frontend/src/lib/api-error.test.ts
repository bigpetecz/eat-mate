import { AxiosError, AxiosHeaders } from 'axios';
import { ApiClientError, toApiClientError } from './api-error';

describe('toApiClientError', () => {
  it('passes through ApiClientError unchanged', () => {
    const original = new ApiClientError('already wrapped', 422, 'ERR_FOO');
    const result = toApiClientError(original);
    expect(result).toBe(original);
  });

  it('maps a plain Error to status 500', () => {
    const err = new Error('oops');
    const result = toApiClientError(err);
    expect(result).toBeInstanceOf(ApiClientError);
    expect(result.status).toBe(500);
    expect(result.message).toBe('oops');
  });

  it('maps an unknown value to Unexpected error / 500', () => {
    const result = toApiClientError('string error');
    expect(result.status).toBe(500);
    expect(result.message).toBe('Unexpected error');
  });

  it('extracts status and first message from AxiosError with array message', () => {
    const axiosErr = new AxiosError(
      'Request failed',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 400,
        data: { message: ['field is required', 'other issue'] },
        statusText: 'Bad Request',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      }
    );
    const result = toApiClientError(axiosErr);
    expect(result.status).toBe(400);
    expect(result.message).toBe('field is required');
    expect(result.code).toBe('ERR_BAD_RESPONSE');
  });

  it('extracts status and string message from AxiosError', () => {
    const axiosErr = new AxiosError(
      'Not found',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 404,
        data: { message: 'Resource not found' },
        statusText: 'Not Found',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      }
    );
    const result = toApiClientError(axiosErr);
    expect(result.status).toBe(404);
    expect(result.message).toBe('Resource not found');
  });

  it('falls back to AxiosError.message when response data has no message', () => {
    const axiosErr = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      undefined,
      undefined,
      {
        status: 503,
        data: {},
        statusText: 'Service Unavailable',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      }
    );
    const result = toApiClientError(axiosErr);
    expect(result.status).toBe(503);
    expect(result.message).toBe('Network Error');
  });

  it('defaults to status 500 when AxiosError has no response', () => {
    const axiosErr = new AxiosError('timeout', 'ECONNABORTED');
    const result = toApiClientError(axiosErr);
    expect(result.status).toBe(500);
  });
});
