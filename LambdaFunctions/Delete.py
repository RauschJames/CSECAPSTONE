#James Rausch
import boto3
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    # Initialize S3 client
    s3 = boto3.client('s3')

    # Retrieve the bucket name from the query string parameters
    bucket_name = event['queryStringParameters']['bucketName']

    try:
        # Attempt to delete the bucket
        bucket.object_versions.delete()
        response = s3.delete_bucket(Bucket=bucket_name)
        return {
            'statusCode': 200,
            'body': f"Bucket {bucket_name} deleted successfully."
        }
    except ClientError as e:
        # Handle potential errors
        return {
            'statusCode': 500,
            'body': f"Error deleting bucket: {str(e)}"
        }
