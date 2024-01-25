import boto3
import json

def swap_region(bucket_arn, target_region):
    # Extract the bucket name from the ARN
    bucket_name = bucket_arn.split(':')[-1]

    # Create an S3 client for the current region
    current_region = bucket_arn.split(':')[3]
    s3_client_current = boto3.client('s3', region_name=current_region)

    
    response = s3_client_current.get_bucket_location(Bucket=bucket_name)
    current_bucket_location = response.get('LocationConstraint', 'us-east-1')

    # If the bucket is already in the target region, no need to do anything
    if current_bucket_location == target_region:
        return f"The bucket '{bucket_name}' is already in the target region '{target_region}'."

    # Copy the objects from the current region to the target region
    s3_client_target = boto3.client('s3', region_name=target_region)

    # List objects in the bucket
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

        if not bucket_arn or not target_region:
            return {
                'statusCode': 400,
                'body': json
