const React = require("react");

function SWRConfig({ children }) {
  return React.createElement(React.Fragment, null, children);
}

function useSWR() {
  return { data: undefined, error: undefined };
}

module.exports = { SWRConfig };
module.exports.default = useSWR;
