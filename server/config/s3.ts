import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/cloudfront-signer";

export const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const uploadToS3 = async (
    buffer: Buffer,
    key: string,
    contentType: string,
    isPublic: boolean = false
): Promise<string> => {
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: isPublic ? "public-read" : "private",
        })
    );
    if (isPublic) {
        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    return key; // for private videos, return key only — URL generated via CloudFront
};

export const deleteFromS3 = async (key: string): Promise<void> => {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: key,
        })
    );
};

export const getCloudFrontSignedUrl = (videoKey: string, expiresInSeconds: number = 14400): string => {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return awsGetSignedUrl({
        url: `${process.env.CLOUDFRONT_DOMAIN}/${videoKey}`,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        dateLessThan: new Date(expiresAt * 1000).toISOString(),
    });
};