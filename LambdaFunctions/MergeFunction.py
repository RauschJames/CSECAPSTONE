#James Rausch
import boto3
import json

def assume_role(account_id, role_name):
    sts_client = boto3.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/{role_name}',
        RoleSessionName='AssumeRoleSession'
    )
    return assumed_role['Credentials']

def get_s3_client(credentials, region_name):
    return boto3.client(
        's3',
        region_name=region_name,
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken'],
    )

def lambda_handler(event, context):
    try:
        # Extract necessary information from the event
        source_bucket = event['source_bucket']
        destination_bucket = event['destination_bucket']
        source_account_id = event.get('source_account_id')  # Optional, use if different from Lambda execution account
        destination_account_id = event.get('destination_account_id')  # Optional, use if different from Lambda execution account
        role_name = event.get('role_name')  # Required if assuming a role
        source_region = event.get('source_region', 'us-east-1')  # Default to us-east-1 if not provided
        destination_region = event.get('destination_region', 'us-east-1')  # Default to us-east-1 if not provided

        # Assume role in source account if provided and different from Lambda execution account
        if source_account_id:
            source_credentials = assume_role(source_account_id, role_name)
            s3_client_source = get_s3_client(source_credentials, source_region)
        else:
            s3_client_source = boto3.client('s3', region_name=source_region)

        # Assume role in destination account if provided and different from Lambda execution account
        if destination_account_id:
            destination_credentials = assume_role(destination_account_id, role_name)
            s3_client_destination = get_s3_client(destination_credentials, destination_region)
        else:
            s3_client_destination = boto3.client('s3', region_name=destination_region)

        # List objects in the source bucket
        response = s3_client_source.list_objects_v2(Bucket=source_bucket)

        # Copy each object to the destination bucket
        for obj in response.get('Contents', []):
            copy_source = {'Bucket': source_bucket, 'Key': obj['Key']}
            s3_client_destination.copy_object(CopySource=copy_source, Bucket=destination_bucket, Key=obj['Key'])

        return {
            'statusCode': 200,
            'body': f"Objects from {source_bucket} copied to {destination_bucket}."
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }
