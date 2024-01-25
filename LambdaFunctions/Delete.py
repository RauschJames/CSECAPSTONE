#James Rausch
import boto3
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    # Extracting the bucket name, account ID, and role name from the query parameters
    bucket_name = event['queryStringParameters']['bucketName']
    account_id = event['queryStringParameters']['accountId']
    role_name = event['queryStringParameters']['roleName']

    # Assume the role in the target account
    sts_client = boto3.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/{role_name}',
        RoleSessionName='AssumeRoleSession1'
    )
    s3_region = get_bucket_region(bucket_name, assumed_role)
    # Initialize S3 client with assumed role credentials
    s3 = boto3.client(
        's3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
         config=boto3.session.Config(signature_version='s3v4',region_name=s3_region)
    )

    try:
        # Delete all objects and versions in the bucket before deleting the bucket itself
        bucket = boto3.resource(
            's3',
            aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
            aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
            aws_session_token=assumed_role['Credentials']['SessionToken']
        ).Bucket(bucket_name)
        bucket.object_versions.delete()

        # Attempt to delete the bucket
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
