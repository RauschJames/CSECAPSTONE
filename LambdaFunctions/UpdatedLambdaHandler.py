import boto3
import json
#Unused JR
# Create an S3 client
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    # Default response format
    response_format = {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': ''
    }

    # Check for query string parameters and 'bucket' parameter
    if 'queryStringParameters' not in event or 'bucket' not in event['queryStringParameters']:
        response_format['statusCode'] = 400
        response_format['body'] = json.dumps({'error': 'Missing bucket parameter'})
        return response_format

    bucket_name = event['queryStringParameters']['bucket']

    try:
        # List objects in the specified bucket
        s3_response = s3_client.list_objects_v2(Bucket=bucket_name)

        # Extract object keys
        object_keys = [obj['Key'] for obj in s3_response.get('Contents', [])]

        # Construct successful response
        response_format['body'] = json.dumps({
            'bucket': bucket_name,
            'objects': object_keys
        })
        return response_format

    except Exception as e:
        # Log the error and return a 500 response
        print(f"Error accessing S3: {e}")
        response_format['statusCode'] = 500
        response_format['body'] = json.dumps({'error': f'Error retrieving data from bucket: {bucket_name}'})
        return response_format
