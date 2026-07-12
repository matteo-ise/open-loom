import { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { parseArgs } from 'node:util';

const { values: options } = parseArgs({
  options: {
    'account-id': { type: 'string' },
    'access-key': { type: 'string' },
    'secret-key': { type: 'string' },
    bucket: { type: 'string' },
    days: { type: 'string', default: '90' },
  },
});

if (!options['account-id'] || !options['access-key'] || !options['secret-key'] || !options.bucket) {
  console.error('Usage: tsx scripts/setup-r2.ts --account-id=<id> --access-key=<key> --secret-key=<key> --bucket=<name> [--days=90]');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${options['account-id']}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: options['access-key'],
    secretAccessKey: options['secret-key'],
  },
});

async function main() {
  console.log(`Creating bucket '${options.bucket}'...`);
  try {
    await client.send(new CreateBucketCommand({ Bucket: options.bucket as string }));
    console.log('✓ Bucket created (or already exists).');
  } catch (err: any) {
    if (err.name !== 'BucketAlreadyOwnedByYou' && err.name !== 'BucketAlreadyExists') {
      throw err;
    }
    console.log('✓ Bucket already exists.');
  }

  console.log('Setting CORS configuration...');
  await client.send(
    new PutBucketCorsCommand({
      Bucket: options.bucket as string,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    })
  );
  console.log('✓ CORS configured.');

  const days = parseInt(options.days as string, 10);
  if (days > 0) {
    console.log(`Setting Lifecycle Policy (auto-delete after ${days} days)...`);
    await client.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: options.bucket as string,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'AutoDeleteVideos',
              Filter: { Prefix: '' },
              Status: 'Enabled',
              Expiration: { Days: days },
            },
          ],
        },
      })
    );
    console.log('✓ Lifecycle Policy configured.');
  }

  console.log('\nSuccess! R2 bucket is ready for loomforge.');
  console.log('You can now enter these credentials in the loomforge desktop app settings.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
