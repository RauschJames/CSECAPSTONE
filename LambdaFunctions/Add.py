#James Rausch
import boto3
import json

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
    
    # Create an S3 client using the assumed role's credentials
    s3 = boto3.client(
        's3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )

    # Create the bucket
    try:
        response = s3.create_bucket(Bucket=bucket_name)
        return {
            'statusCode': 200,
            'body': json.dumps('Bucket Created Successfully')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }
