import {
    BucketAlreadyExists,
    BucketAlreadyOwnedByYou,
    CreateBucketCommand,
    S3Client,
    waitUntilBucketExists,
} from "@aws-sdk/client-s3";
  
  const bucketName = 'mango-tango-stocks-data';

  /**
   * Create an Amazon S3 bucket.
   * @param {{ bucketName: string }} config
   * Code snipit From AWS SDK https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
   */
  export const createS3Bucket = async () => {
    const client = new S3Client({});
  
    try {
      const { Location } = await client.send(
        new CreateBucketCommand({
          Bucket: bucketName,
        }),
      );
      await waitUntilBucketExists({ client }, { Bucket: bucketName });
      console.log(`Bucket created with location ${Location}`);
    } catch (caught) {
      if (caught instanceof BucketAlreadyExists) {
        console.error(
          `The bucket "${bucketName}" already exists in another AWS account. Bucket names must be globally unique.`,
        );
      }
      else if (caught instanceof BucketAlreadyOwnedByYou) {
        console.error(
          `The bucket "${bucketName}" already exists in this AWS account.`,
        );
      } else {
        throw caught;
      }
    }
  };
  
  