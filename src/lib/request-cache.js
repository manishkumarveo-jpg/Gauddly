// Short-lived, memory-only caching: never persist customer data or failed requests.
export function cachedRequest(fetcher, ttl = 30_000) {
  let pending;
  let value;
  let expires = 0;
  return () => {
    if (pending) return pending;
    if (Date.now() < expires) return Promise.resolve(value);
    pending = Promise.resolve().then(fetcher).then(result => {
      if (!result?.failed) { value = result; expires = Date.now() + ttl; }
      return result;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}
