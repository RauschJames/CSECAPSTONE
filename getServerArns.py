#James Rausch
import boto3
import json

def lambda_handler(event, context):
    # Initialize a boto3 client for S3
    s3_client = boto3.client('s3')

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
            'REGION': region
        })

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': 'https://main.dzyoo64rgfqyj.amplifyapp.com',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(bucket_arns)
    }
