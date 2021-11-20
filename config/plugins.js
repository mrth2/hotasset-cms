module.exports = ({ env }) => ({
    email: {
        provider: 'sendgrid',
        providerOptions: {
            apiKey: env('SENDGRID_API_KEY'),
        },
        settings: {
            defaultFrom: 'jon@hotasset.com',
            defaultReplyTo: 'jon@hotasset.com',
            testAddress: 'hi@hoatrinh.dev'
        }
    },
    upload: {
        provider: 'cloudinary',
        providerOptions: {
            cloud_name: env('CLOUDINARY_NAME'),
            api_key: env('CLOUDINARY_KEY'),
            api_secret: env('CLOUDINARY_SECRET'),
            upload_preset: 'ml_default'
        },
    }
});