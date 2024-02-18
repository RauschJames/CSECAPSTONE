import boto3
import json

def assume_role(account_id, role):
    sts_client = boto3.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/{role}',
        RoleSessionName='AssumeRoleSession1'
    )
    return assumed_role

def create_bucket_in_target_region(bucket_name, target_region, assumed_role):
    s3_client = boto3.client(
        's3',
        region_name=target_region,
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )
    bucket_creation_config = {'LocationConstraint': target_region}
    s3_client.create_bucket(Bucket=bucket_name, CreateBucketConfiguration=bucket_creation_config if target_region != 'us-east-1' else None)
    return s3_client

def copy_objects_to_target_bucket(source_bucket, target_bucket, s3_client_source, s3_client_target):
    objects = s3_client_source.list_objects_v2(Bucket=source_bucket).get('Contents', [])
    for obj in objects:
        copy_source = {'Bucket': source_bucket, 'Key': obj['Key']}
        s3_client_target.copy_object(CopySource=copy_source, Bucket=target_bucket, Key=obj['Key'])

def change_bucket_name(old_bucket_name, new_bucket_name, target_region, assumed_role):
    # Create or get the new bucket with the new name in the target region
    s3_client_target = create_bucket_in_target_region(new_bucket_name, target_region, assumed_role)
    
    # Assume role and create S3 client for the current region of the old bucket
    current_region = assumed_role['Credentials']['Region']
    s3_client_current = boto3.client(
        's3', 
        region_name=current_region,
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )
    
    # Copy objects from the old bucket to the new bucket
    copy_objects_to_target_bucket(old_bucket_name, new_bucket_name, s3_client_current, s3_client_target)
    
    # Optionally, delete the old bucket after successful copy
    # s3_client_current.delete_bucket(Bucket=old_bucket_name)

    return f"The contents of '{old_bucket_name}' have been successfully copied to the new bucket '{new_bucket_name}' in the target region '{target_region}'. Optionally, the old bucket can be deleted."

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        old_bucket_name = body.get('old_bucket_name', '')
        new_bucket_name = body.get('new_bucket_name', '')
        target_region = body.get('target_region', '')
        account_id = body.get('account_id', '')
        role_name = body.get('role_name', '')

        if not old_bucket_name or not new_bucket_name or not target_region or not account_id or not role_name:
            return {'statusCode': 400, 'body': json.dumps('Missing required parameters.')}

        assumed_role = assume_role(account_id, role_name)
        result = change_bucket_name(old_bucket_name, new_bucket_name, target_region, assumed_role)

        return {'statusCode': 200, 'body': json.dumps(result)}

    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps(f"Error: {str(e)}")}
