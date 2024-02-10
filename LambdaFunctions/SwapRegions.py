#James Rausch
import boto3
import json

def assume_role(account_id, role_name):
    sts_client = boto3.client('sts')
    assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/{role_name}',
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

def swap_region(bucket_name, target_region, assumed_role):
    current_region = assumed_role['Credentials']['Region']
    
    # Assume role and create S3 client for current region
    s3_client_current = boto3.client(
        's3', 
        region_name=current_region,
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )

    # Create or get the target bucket in the target region
    s3_client_target = create_bucket_in_target_region(bucket_name, target_region, assumed_role)
    
    # Copy objects from the current bucket to the target bucket
    copy_objects_to_target_bucket(bucket_name, bucket_name, s3_client_current, s3_client_target)

    return f"The bucket '{bucket_name}' content has been successfully copied to the target region '{target_region}'."

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        bucket_name = body.get('bucket_name', '')
        target_region = body.get('target_region', '')
        account_id = body.get('account_id', '')
        role_name = body.get('role_name', '')

        if not bucket_name or not target_region or not account_id or not role_name:
            return {'statusCode': 400, 'body': json.dumps('Missing required parameters.')}

        assumed_role = assume_role(account_id, role_name)
        result = swap_region(bucket_name, target_region, assumed_role)

        return {'statusCode': 200, 'body': json.dumps(result)}

    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps(f"Error: {str(e)}")}

