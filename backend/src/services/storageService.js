import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const bucket = process.env.AWS_S3_BUCKET

const storageService = {
  async uploadFile(file, storageKey) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    })

    await s3.send(command)

    return {
      storageKey,
    }
  },

  async getFile(storageKey) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    })

    return await s3.send(command)
  },

  async deleteFile(storageKey) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    })

    await s3.send(command)
  },
}

export default storageService