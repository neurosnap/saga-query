import fs from 'fs';
import util from 'util';
import prettier from 'prettier';

const write = util.promisify(fs.writeFile);

function createSagaQueryApi() {
  const methods = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'options',
    'head',
    'connect',
    'trace',
  ];

  const uriTmpl = (method: string) => `/**
 * Options only
 */
${method}(req: { saga?: any }): CreateAction<Ctx>;
${method}<P>(
  req: { saga?: any }
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P extends never, ApiSuccess, ApiError = any>(
  req: { saga?: any }
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = any>(req: {
  saga?: any;
}): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
* Middleware only
*/
${method}(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = any>(
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = any>(
  fn: MiddlewareApiCo<Ctx>,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
* Options and Middleware
*/
${method}(req: { saga?: any }, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  req: { saga?: any },
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  req: { saga?: any },
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  req: { saga?: any },
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = any>(
  req: { saga?: any },
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = any>(
  req: { saga?: any },
  fn: MiddlewareApiCo<Ctx>,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;`;
  const uriMethods = methods.map((m) => uriTmpl(m)).join('\n\n');

  const methodTmpl = (method: string) => `/**
 * Only name
 */
${method}(name: ApiName): CreateAction<Ctx>;
${method}<P>(
  name: ApiName,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P extends never, ApiSuccess, ApiError = any>(
  name: ApiName,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = any>(
  name: ApiName,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
 * Name and options
 */
${method}(name: ApiName, req: { saga?: any }): CreateAction<Ctx>;
${method}<P>(
  name: ApiName,
  req: { saga?: any }
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  name: ApiName,
  req: { saga?: any }
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = any>(
  name: ApiName,
  req: { saga?: any }
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = any>(
  name: ApiName,
  req: { saga?: any },
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
 * Name and middleware
 */
${method}(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  name: ApiName,
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  name: ApiName,
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  name: ApiName,
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = any>(
  name: ApiName,
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = any>(
  name: ApiName,
  fn: MiddlewareApiCo<
    Omit<Ctx, 'payload' | 'json'> &
      Payload<P> &
      FetchJson<ApiSuccess, ApiError>
  >,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
 * Name, options, and middleware
 */
${method}(
  name: ApiName,
  req: { saga?: any },
  fn: MiddlewareApiCo<Ctx>,
): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  name: ApiName,
  req: { saga?: any },
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  name: ApiName,
  req: { saga?: any },
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  name: ApiName,
  req: { saga?: any },
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = any>(
  name: ApiName,
  req: { saga?: any },
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = any>(
  name: ApiName,
  req: { saga?: any },
  fn: MiddlewareApiCo<
    Omit<Ctx, 'payload' | 'json'> &
      Payload<P> &
      FetchJson<ApiSuccess, ApiError>
  >,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;`;
  const regMethods = methods.map((m) => methodTmpl(m)).join('\n\n');

  const tmpl = `/**
* This is an auto-generated file, do not edit directly!
* Run "yarn template" to generate this file.
*/
import type { SagaIterator } from "redux-saga";
import type { SagaApi } from "./pipe";
import type {
  ApiCtx,
  CreateAction,
  CreateActionWithPayload,
  Next,
  FetchJson,
  MiddlewareApiCo,
  Payload,
} from "./types";

export type ApiName = string | string[];

export interface SagaQueryApi<Ctx extends ApiCtx = ApiCtx> extends SagaApi<Ctx> {
  request: (
    r: Partial<RequestInit>,
  ) => (ctx: Ctx, next: Next) => SagaIterator<any>;
  cache: () => (ctx: Ctx, next: Next) => SagaIterator<any>;

  uri: (uri: string) => {
    ${uriMethods}
  }

${regMethods}
}`;

  return tmpl;
}

async function createTemplateFile(tmpl: string) {
  await write(
    './src/api-types.ts',
    prettier.format(tmpl, {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'all',
      arrowParens: 'always',
    }),
  );
}

createTemplateFile(createSagaQueryApi()).then(console.log).catch(console.error);
