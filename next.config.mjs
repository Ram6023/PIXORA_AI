/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: {
        buildActivity: false,
    },
    images: {
        remotePatterns: [
            {
                hostname: 'assets.lummi.ai',
            },
            {
                hostname: 'images.unsplash.com',
            },
            {
                hostname: 'image.pollinations.ai',
            }
        ],
    },
};

export default nextConfig;
