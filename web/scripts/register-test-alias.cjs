const Module = require("module");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, ".test-dist", "src");
const stubRoot = path.join(projectRoot, "scripts", "test-stubs");
const aliasPrefix = "@/";
const bareAlias = "@";

const moduleMap = new Map([
  ["openai", path.join(stubRoot, "openai.js")],
  ["envalid", path.join(stubRoot, "envalid.js")],
  ["axios", path.join(stubRoot, "axios.js")],
  ["pino", path.join(stubRoot, "pino.js")],
  ["uuid", path.join(stubRoot, "uuid.js")],
  ["swr", path.join(stubRoot, "swr.js")],
]);

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (typeof request === "string" && (request === bareAlias || request.startsWith(aliasPrefix))) {
    const remainder = request === bareAlias ? "" : request.slice(aliasPrefix.length);
    const targetPath = path.join(distRoot, remainder);
    return originalResolveFilename.call(this, targetPath, parent, isMain, options);
  }
  if (typeof request === "string" && moduleMap.has(request)) {
    return originalResolveFilename.call(this, moduleMap.get(request), parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
