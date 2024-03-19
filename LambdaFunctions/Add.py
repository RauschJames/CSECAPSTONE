#James Rausch
import boto3
import json
lambda_region = 'us-west-2'

boto3.setup_default_session(region_name=lambda_region) #added 

def lambda_handler(event, context):
    # Extracting the bucket name, account ID, and role name from the query parameters
    query_parameters = event.get('multiValueQueryStringParameters', {})
    bucket_name = query_parameters.get('bucket', {})
    account_id = query_parameters.get('account', {})
    role_name = query_parameters.get('role', {})
    
    # Assume the role in the target account
    sts_client = boto3.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/{role_name}',
        RoleSessionName='AssumeRoleSession'
    )

    # Create an S3 client using the assumed role's credentials
    s3 = boto3.client('s3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken'],
        config=boto3.session.Config(signature_version='s3v4'))
    # Create the bucket
    try:
        s3.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={'LocationConstraint': lambda_region})
        return {
            'statusCode': 200,
            'body': json.dumps('Bucket Created Successfully')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }
