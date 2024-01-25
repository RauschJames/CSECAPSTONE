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

def swap_region(bucket_arn, target_region, assumed_role):
    # Extract the bucket name from the ARN
    bucket_name = bucket_arn.split(':')[-1]

    # Extract the current region from the ARN
    current_region = bucket_arn.split(':')[3]

    # Create an S3 client for the current region using assumed role credentials
    s3_client_current = boto3.client(
        's3', 
        region_name=current_region,
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
    )

    # Get the current bucket location
    response = s3_client_current.get_bucket_location(Bucket=bucket_name)
    current_bucket_location = response.get('LocationConstraint', 'us-east-1')

    # If the bucket is already in the target region, no need to do anything
    if current_bucket_location == target_region:
        return f"The bucket '{bucket_name}' is already in the target region '{target_region}'."

    # Create an S3 client for the target region using assumed role credentials
    s3_client_target = boto3.client(
        's3', 
        region_name=target_region,
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken']
        config=boto3.session.Config(signature_version='s3v4', region_name=s3_region)
    )

    # List objects in the bucket and copy them to the target region
    objects = s3_client_current.list_objects_v2(Bucket=bucket_name).get('Contents', [])
    for obj in objects:
        copy_source = {'Bucket': bucket_name, 'Key': obj['Key']}
        s3_client_target.copy_object(CopySource=copy_source, Bucket=bucket_name, Key=obj['Key'])

    return f"The bucket '{bucket_name}' has been successfully switched to the target region '{target_region}'."

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        bucket_arn = body.get('bucket_arn', '')
        target_region = body.get('target_region', '')
        account_id = body.get('account_id', '')
        role_name = body.get('role_name', '')

        if not bucket_arn or not target_region or not account_id or not role_name:
            return {
                'statusCode': 400,
                'body': json.dumps('Missing required parameters.')
            }

        assumed_role = assume_role(account_id, role_name)
        result = swap_region(bucket_arn, target_region, assumed_role)

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }
