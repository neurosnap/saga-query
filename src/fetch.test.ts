import test from 'ava';
import nock from 'nock';
import { fetcher } from './fetch';
import { createApi } from './api';
import { setupStore } from './util';
import { requestMonitor } from './middleware';

const baseUrl = 'https://saga-query.com';
const mockUser = { id: '1', email: 'test@saga-query.com' };

const delay = (n: number = 200) =>
  new Promise((resolve) => {
    setTimeout(resolve, n);
  });

test('fetch - should be able to fetch a resource and save automatically', async (t) => {
  t.plan(3);

  nock(baseUrl).get('/users').reply(200, mockUser);

  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(fetcher({ baseUrl }));

  const fetchUsers = api.get('/users', function* (ctx, next) {
    ctx.cache = true;
    yield next();

    t.deepEqual(ctx.request, {
      url: `${baseUrl}/users`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    t.deepEqual(ctx.json, { ok: true, data: mockUser });
  });

  const store = setupStore(api.saga());
  const action = fetchUsers();
  store.dispatch(action);

  await delay();

  const state = store.getState();
  t.deepEqual(state['@@saga-query/data'][action.payload.key], mockUser);
});

test('fetch - error handling', async (t) => {
  t.plan(2);
  const errMsg = { message: 'something happened' };

  nock(baseUrl).get('/users').reply(500, errMsg);

  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield next();
  });
  api.use(fetcher());

  const fetchUsers = api.get('/users', function* (ctx, next) {
    ctx.cache = true;
    yield next();

    t.deepEqual(ctx.json, { ok: false, data: errMsg });
  });

  const store = setupStore(api.saga());
  const action = fetchUsers();
  store.dispatch(action);

  await delay();

  const state = store.getState();
  t.deepEqual(state['@@saga-query/data'][action.payload.key], errMsg);
});

test('fetch - status 204', async (t) => {
  t.plan(2);
  nock(baseUrl).get('/users').reply(204);

  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield next();
  });
  api.use(fetcher());

  const fetchUsers = api.get('/users', function* (ctx, next) {
    ctx.cache = true;
    yield next();

    t.deepEqual(ctx.json, { ok: true, data: {} });
  });

  const store = setupStore(api.saga());
  const action = fetchUsers();
  store.dispatch(action);

  await delay();

  const state = store.getState();
  t.deepEqual(state['@@saga-query/data'][action.payload.key], {});
});

test('fetch - malformed json', async (t) => {
  t.plan(1);
  nock(baseUrl).get('/users').reply(200, 'not json');

  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(function* (ctx, next) {
    const url = ctx.req().url;
    ctx.request = ctx.req({ url: `${baseUrl}${url}` });
    yield next();
  });
  api.use(fetcher());

  const fetchUsers = api.get('/users', function* (ctx, next) {
    ctx.cache = true;
    yield next();

    t.deepEqual(ctx.json, {
      ok: false,
      data: {
        message:
          'invalid json response body at https://saga-query.com/users reason: Unexpected token o in JSON at position 1',
      },
    });
  });

  const store = setupStore(api.saga());
  const action = fetchUsers();
  store.dispatch(action);

  await delay();
});

test('fetch - POST', async (t) => {
  t.plan(2);
  nock(baseUrl).post('/users').reply(200, mockUser);

  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(fetcher({ baseUrl }));

  const fetchUsers = api.post('/users', function* (ctx, next) {
    ctx.cache = true;
    ctx.request = ctx.req({ body: JSON.stringify(mockUser) });
    yield next();

    t.deepEqual(ctx.req(), {
      url: `${baseUrl}/users`,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(mockUser),
    });

    t.deepEqual(ctx.json, { ok: true, data: mockUser });
  });

  const store = setupStore(api.saga());
  const action = fetchUsers();
  store.dispatch(action);

  await delay();
});

test('fetch - slug in url but payload has empty string for slug value', async (t) => {
  t.plan(1);

  const api = createApi();
  api.use(requestMonitor());
  api.use(api.routes());
  api.use(fetcher({ baseUrl }));

  const fetchUsers = api.post<{ id: string }>(
    '/users/:id',
    function* (ctx, next) {
      ctx.cache = true;
      ctx.request = ctx.req({ body: JSON.stringify(mockUser) });

      yield next();

      t.deepEqual(ctx.json, {
        ok: false,
        data: 'found :id in endpoint name (/users/:id [POST]) but payload has falsy value ()',
      });
    },
  );

  const store = setupStore(api.saga());
  const action = fetchUsers({ id: '' });
  store.dispatch(action);

  await delay();
});
