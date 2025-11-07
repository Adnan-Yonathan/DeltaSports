class OpenAI {
  constructor(config = {}) {
    this.config = config;
    this.chat = {
      completions: {
        create: async () => {
          throw new Error("OpenAI client stub executed unexpectedly");
        },
      },
    };
  }
}

module.exports = OpenAI;
module.exports.default = OpenAI;
