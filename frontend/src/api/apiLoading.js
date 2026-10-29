const listeners = new Set();
const trackedClients = new WeakSet();
const pendingRequests = new WeakMap();
let activeRequests = 0;

function notifyListeners() {
  listeners.forEach((listener) => listener(activeRequests));
}

function startRequest() {
  activeRequests += 1;
  notifyListeners();

  let isActive = true;
  return () => {
    if (!isActive) return;
    isActive = false;
    activeRequests = Math.max(0, activeRequests - 1);
    notifyListeners();
  };
}

function finishRequest(config) {
  if (!config) return;
  const finish = pendingRequests.get(config);
  if (!finish) return;

  pendingRequests.delete(config);
  finish();
}

export function subscribeToApiLoading(listener) {
  listeners.add(listener);
  listener(activeRequests);
  return () => listeners.delete(listener);
}

export function trackAxiosClient(client) {
  if (trackedClients.has(client)) return;
  trackedClients.add(client);

  client.interceptors.request.use(
    (config) => {
      pendingRequests.set(config, startRequest());
      return config;
    },
    (error) => {
      finishRequest(error.config);
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      finishRequest(response.config);
      return response;
    },
    (error) => {
      finishRequest(error.config);
      return Promise.reject(error);
    },
  );
}
