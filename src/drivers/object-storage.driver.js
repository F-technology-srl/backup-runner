import aws from 'aws-sdk';
import { join } from 'path';
import { makeCurrentDirectoryName } from '../utils/create-backup-dir-name.js';

const { S3, Credentials, Endpoint } = aws;

function makeS3Client(options) {
  const pathEndpoint = 's3.amazonaws.com';

  const credentials = new Credentials({
    accessKeyId: options.accesKeyId,
    secretAccessKey: options.secretAccesKey,
  });

  const endpoint = new Endpoint(options.endpoint || pathEndpoint);

  const s3Client = new S3({
    endpoint,
    region: options.region,
    accessKeyId: options.accesKeyId,
    secretAccessKey: options.secretAccesKey,
    credentials: credentials,
  });

  return s3Client;
}

async function bucketExists(s3, name) {
  try {
    const result = await s3.getBucketLocation({ Bucket: name }).promise();
    return !!result;
  } catch (error) {
    return false;
  }
}

async function ensureBucketExists(s3, name) {
  const exists = await bucketExists(s3, name);
  if (!exists) {
    await s3.createBucket({ Bucket: name }).promise();
  }
}

export async function read(options, cb) {
  const s3 = makeS3Client(options);
  if (await bucketExists(s3, options.bucketName)) {
    s3.listObjects({
      Bucket: options.bucketName,
    }).eachPage((err, resp, done) => {
      if (resp && !err) {
        resp.Contents.forEach((data) => {
          s3.getObject({
            Key: data.Key,
            Bucket: options.bucketName,
          }).eachPage((err, content, getObjDone) => {
            if (err) {
              cb(err, null);
              return getObjDone(err);
            }
            if (content) {
              cb(null, {
                path: data.Key,
                contentType: content.ContentType,
                body: content.Body,
                size: data.Size,
                isDirectory:
                  data.Size === 0 && content.ContentType === 'application/json',
              });
            }
            getObjDone();
          });
        });
      }
      done(err);
    });
  } else {
    throw new Error(
      `Unable to read from bucket with name: ${options.bucketName}`
    );
  }
}

export async function write(options, data) {
  const { path, contentType, body, size, isDirectory } = data;
  const backupDirName = makeCurrentDirectoryName();
  const s3 = makeS3Client(options);
  await ensureBucketExists(s3, options.bucketName);

  if (!isDirectory) {
    await s3
      .putObject({
        Bucket: options.bucketName,
        Key: join(backupDirName, path),
        Body: body,
        ContentType: contentType,
      })
      .promise();
  }
}

export default {
  write,
  read,
};
