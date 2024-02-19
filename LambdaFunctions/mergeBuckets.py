
import boto3
import json

lambda_region = 'us-west-2'

boto3.setup_default_session(region_name=lambda_region)

def get_bucket_region(bucket_name, assumed_role):
    s3_client = boto3.client('s3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )
    
    response = s3_client.get_bucket_location(Bucket=bucket_name)
    return response.get('LocationConstraint', 'us-east-1')

def assume_role(account_id, role_name):
    sts_client = boto3.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/{role_name}',
        RoleSessionName='AssumeRoleSession'
    )
    return assumed_role

def get_s3_client(assumed_role, region):
    s3_client = boto3.client('s3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken'],
        config=boto3.session.Config(signature_version='s3v4', region_name=region))
    
    return s3_client

def lambda_handler(event, context):
    try:
        # Extract necessary information from the event
        query_parameters = event.get('multiValueQueryStringParameters', {})
        source_bucket = query_parameters.get('bucket2', {})
        destination_bucket = query_parameters.get('bucket', {})
        source_account_id = query_parameters.get('account2', {}) 
        destination_account_id = query_parameters.get('account', {})  
        role_name_source = query_parameters.get('role2', {})  
        role_name_destination = query_parameters.get('role', {})  

        source_role = assume_role(source_account_id, role_name_source)
        source_region = get_bucket_region(source_bucket, source_role)
        s3_client_source = get_s3_client(source_role, source_region)
        
        destination_role = assume_role(destination_account_id, role_name_destination)
        destination_region = get_bucket_region(destination_bucket, destination_role)
        s3_client_destination = get_s3_client(destination_role, destination_region)
        
        response = s3_client_source.list_objects_v2(Bucket=source_bucket)

        # Copy each object to the destination bucket
        for obj in response.get('Contents', []):
            response = s3_client_source.get_object(Bucket=source_bucket, Key=obj['Key'])
            object_data = response['Body'].read()
            s3_client_destination.put_object(Bucket=destination_bucket, Key=obj['Key'], Body=object_data)


        return {
            'statusCode': 200,
            'body': f"Objects from {source_bucket} copied to {destination_bucket}."
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }