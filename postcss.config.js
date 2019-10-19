module.exports = {
    plugins: [
        require('postcss-discard-font-face')(['woff2']), // remove old font formats except "woff2"
    ]
};
