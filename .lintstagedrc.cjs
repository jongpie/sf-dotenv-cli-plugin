module.exports = {
  '*.{ts,js,json,yml,yaml,md}': (filenames) =>
    filenames.map((filename) => `prettier --write '${filename}'`),
  '{src,test}/**/*.ts': (filenames) => {
    if (filenames.length === 0) {
      return [];
    }

    const quoted = filenames.map((f) => `"${f}"`).join(' ');
    return [`eslint --fix ${quoted}`, 'npm run test'];
  },
};
