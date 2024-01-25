#James Rausch
import boto3
import json
lambda_region = 'us-west-2'

boto3.setup_default_session(region_name=lambda_region) #added 
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
    # Create an S3 client using the assumed role's credentials
    s3 = boto3.client(
        's3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
        config=boto3.session.Config(signature_version='s3v4',region_name=s3_region)
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
