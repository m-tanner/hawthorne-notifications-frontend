module.exports = {
    async rewrites() {
        return [
            {
                source: '/health',
                destination: '/api/health',
            },
        ];
    },
};
