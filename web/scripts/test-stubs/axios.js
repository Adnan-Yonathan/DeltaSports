const buildUrl = (baseUrl = "", path = "", params = {}) => {
  const url = new URL(path, baseUrl || "http://localhost");
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  for (const [key, value] of entries) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
};

const create = (config = {}) => ({
  async get(path, options = {}) {
    const target = buildUrl(config.baseURL, path, options.params ?? {});
    const response = await fetch(target, {
      headers: { ...(config.headers ?? {}), ...(options.headers ?? {}) },
      method: "GET",
    }).catch(() => ({ ok: false }));

    if (!response || !response.ok) {
      return { data: {} };
    }

    try {
      const data = await response.json();
      return { data };
    } catch {
      return { data: {} };
    }
  },
});

module.exports = { create };
module.exports.default = { create };
