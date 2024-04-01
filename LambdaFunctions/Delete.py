#James Rausch
import boto3
import json
lambda_region = 'us-west-2'

boto3.setup_default_session(region_name=lambda_region) #added 


def get_bucket_region(bucket_name, assumed_role):
    s3_client = boto3.client('s3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )
    
    response = s3_client.get_bucket_location(Bucket=bucket_name)
  
    region = response.get('LocationConstraint')
    
    if region is None:
        return 'us-east-1'
    return region


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

    
    s3_region = get_bucket_region(bucket_name, assumed_role)
    
    # Create an S3 client using the assumed role's credentials
    s3 = boto3.client('s3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken'],
        config=boto3.session.Config(signature_version='s3v4', region_name=s3_region))
    
    # Empty the bucket
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        if 'Contents' in response:
            objects = [{'Key': obj['Key']} for obj in response['Contents']]
            s3.delete_objects(Bucket=bucket_name, Delete={'Objects': objects})
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }
    
    # Delete the bucket
    try:
        s3.delete_bucket(Bucket=bucket_name)
        return {
            'statusCode': 200,
            'body': json.dumps('Bucket Deleted Successfully')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }

