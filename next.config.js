/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    // Allow cross-origin requests from local network (for mobile testing)
    allowedDevOrigins: [
        'http://192.168.1.64:3000',
        'http://localhost:3000',
    ],
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
