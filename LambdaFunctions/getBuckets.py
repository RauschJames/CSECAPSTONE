#James Rausch
import boto3
import json
lambda_region = 'us-west-2'

boto3.setup_default_session(region_name=lambda_region) #added 

def assume_role(account_id, role_name):
    sts_client = boto3.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/{role_name}',
        RoleSessionName='AssumeRoleSession1'
    )
    return assumed_role

def list_buckets_with_regions(assumed_role, account_id, role_name):
    # Initialize a boto3 client for S3 with assumed role credentials
    s3_client = boto3.client(
        's3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken'],
        config=boto3.session.Config(signature_version='s3v4')
    )

    response = s3_client.list_buckets()

    # List to hold bucket data with region
    bucket_arns = []

    for bucket in response['Buckets']:
        # Get bucket location (region)
        location_response = s3_client.get_bucket_location(Bucket=bucket['Name'])
        region = location_response.get('LocationConstraint')

        # AWS S3 API returns None for 'us-east-1', handle this case
        if region is None:
            region = 'us-east-1'

        # Construct bucket ARN and add region info
        bucket_arns.append({
            'BucketName': bucket['Name'],
            'ARN': f'arn:aws:s3::{bucket["Name"]}',
            'REGION': region,
            'ACCOUNT_ID': account_id,
            'ROLE_NAME': role_name
        })

    return bucket_arns

def lambda_handler(event, context):
    try:
        
        query_parameters = event.get('multiValueQueryStringParameters', {})
        account_id = query_parameters.get('account', {})
        role_name = query_parameters.get('role', {})

        if not account_id or not role_name:
            return {
                'statusCode': 400,
                'body': json.dumps('Missing required parameters.')
            }

        assumed_role = assume_role(account_id, role_name)
        bucket_arns = list_buckets_with_regions(assumed_role, account_id, role_name)

        return {
            'statusCode': 200,
            
            'body': json.dumps(bucket_arns)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }

