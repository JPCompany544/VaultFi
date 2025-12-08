/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async redirects() {
        return [
            {
                source: '/dashboard',
                destination: '/cycle-monitor',
                permanent: true,
            },
        ]
    },
};

module.exports = nextConfig;
