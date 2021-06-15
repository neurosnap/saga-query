import test from 'ava';
import createSagaMiddleware, { SagaIterator } from 'redux-saga';
import { put, call } from 'redux-saga/effects';
import {
  createAction,
  createReducerMap,
  MapEntity,
  createTable,
} from 'robodux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import sagaCreator from 'redux-saga-creator';

import { urlParser, queryCtx } from './middleware';
import { FetchCtx } from './fetch';
import { createApi } from './api';

interface User {
  id: string;
  name: string;
  email: string;
}

const mockUser: User = { id: '1', name: 'test', email: 'test@test.com' };
const mockUser2: User = { id: '2', name: 'two', email: 'two@test.com' };

function setupStore(
  saga: any,
  reducers: any = { users: (state: any = {}) => state },
) {
  const sagaMiddleware = createSagaMiddleware();
  const reducer = combineReducers(reducers);
  const store: any = createStore(reducer, applyMiddleware(sagaMiddleware));
  sagaMiddleware.run(saga);
  return store;
}

test('createApi - POST', (t) => {
  t.plan(1);
  const name = 'users';
  const cache = createTable<User>({ name });
  const query = createApi<FetchCtx>();

  query.use(query.routes());
  query.use(queryCtx);
  query.use(urlParser);
  query.use(function* fetchApi(ctx, next) {
    t.deepEqual(ctx.request, {
      url: '/users',
      method: 'POST',
      body: JSON.stringify({ email: mockUser.email }),
    });
    const data = {
      users: [mockUser],
    };
    ctx.response = { status: 200, ok: true, data };
    yield next();
  });

  const createUser = query.post<{ email: string }>(
    `/users`,
    function* processUsers(ctx: FetchCtx<{ users: User[] }>, next) {
      ctx.request = {
        method: 'POST',
        body: JSON.stringify({ email: ctx.payload.email }),
      };
      yield next();
      if (!ctx.response.ok) return;
      const { users } = ctx.response.data;
      const curUsers = users.reduce<MapEntity<User>>((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {});
      yield put(cache.actions.add(curUsers));
    },
  );

  const reducers = createReducerMap(cache);
  const store = setupStore(query.saga(), reducers);
  store.dispatch(createUser({ email: mockUser.email }));
});

test('middleware - with request fn', (t) => {
  t.plan(1);
  const query = createApi();
  query.use(query.routes());
  query.use(queryCtx);
  query.use(urlParser);
  query.use(function* (ctx, next) {
    t.deepEqual(ctx.request, { method: 'POST', url: '/users' });
  });
  const createUser = query.create('/users', query.request({ method: 'POST' }));
  const store = setupStore(query.saga());
  store.dispatch(createUser());
});

test('run() on endpoint action - should run the effect', (t) => {
  t.plan(1);
  const api = createApi();
  api.use(api.routes());
  let acc = '';
  const action1 = api.get<{ id: string }>('/users/:id', function* (ctx, next) {
    yield next();
    acc += 'a';
  });
  const action2 = api.get('/users2', function* (ctx, next) {
    yield next();
    yield call(action1.run, action1({ id: '1' }));
    acc += 'b';
    t.assert(acc === 'ab');
  });

  const store = setupStore(api.saga());
  store.dispatch(action2());
});

test('run() from a normal saga', (t) => {
  t.plan(2);
  const api = createApi();
  api.use(api.routes());
  let acc = '';
  const action1 = api.get<{ id: string }>('/users/:id', function* (ctx, next) {
    yield next();
    acc += 'a';
  });
  const action2 = createAction('ACTION');
  function* onAction(): SagaIterator {
    const ctx = yield call(action1.run, action1({ id: '1' }));
    const payload = { name: '/users/:id [GET]', options: { id: '1' } };
    t.deepEqual(ctx, {
      action: {
        type: '@@saga-query/users/:id [GET]',
        payload,
      },
      name: '/users/:id [GET]',
      payload: { id: '1' },
    });
    acc += 'b';
    t.assert(acc === 'ab');
  }

  const store = setupStore(sagaCreator({ api: api.saga(), action: onAction }));
  store.dispatch(action2());
});
