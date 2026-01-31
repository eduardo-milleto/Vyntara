module.exports = {
    // Trigger on these files
    '*.{js,ts,tsx,jsx}': 'eslint --fix',
    '*.json': 'prettier --write',
    '*.md': 'prettier --write',
};
