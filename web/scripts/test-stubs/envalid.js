const normalizeOptions = (options = {}) => ({
  default: options.default,
  type: options.type,
});

const str = (options = {}) => ({ ...normalizeOptions({ ...options, type: "string" }) });
const num = (options = {}) => ({ ...normalizeOptions({ ...options, type: "number" }) });

const cleanEnv = (env, validators) => {
  const result = {};
  for (const [key, validator] of Object.entries(validators)) {
    const value = env[key];
    if (value === undefined || value === null || value === "") {
      if (validator.default !== undefined) {
        result[key] = validator.type === "number" ? Number(validator.default) : validator.default;
        continue;
      }
      throw new Error(`Missing env var ${key}`);
    }

    if (validator.type === "number") {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        throw new Error(`Invalid number for ${key}`);
      }
      result[key] = parsed;
    } else {
      result[key] = value;
    }
  }
  return result;
};

module.exports = { cleanEnv, str, num };
