#James Rausch
import boto3
import json

def lambda_handler(event, context):
    # Extracting the bucket name from the query parameters
    bucket_name = event['queryStringParameters']['bucket_name']

    # Create an S3 client
    s3 = boto3.client('s3')

    # Create the bucket
    try:
        response = s3.create_bucket(Bucket=bucket_name)
        return {
            'statusCode': 200,
            'body': json.dumps('Bucket Created Successfully')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(str(e))
        }
