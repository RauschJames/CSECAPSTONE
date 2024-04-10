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

def lambda_handler(event, context):

    try:

        query_parameters = event.get('multiValueQueryStringParameters', {})
        bucket_name = query_parameters.get('bucket', {})
        bucket_key = query_parameters.get('bucket_key', {})
        account_name = query_parameters.get('account', {})
        role_name = query_parameters.get('role', {})

        sts_client = boto3.client('sts')
        assumed_role = sts_client.assume_role(
        RoleArn=f'arn:aws:iam::{account_name}:role/{role_name}',
        RoleSessionName='AssumedRoleSession')

        s3_region = get_bucket_region(bucket_name, assumed_role)
        
        
        if(s3_region == None):
            s3_region = 'us-east-1'
        
       
        s3_client = boto3.client('s3',
        aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
        aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
        aws_session_token=assumed_role['Credentials']['SessionToken'],
        config=boto3.session.Config(signature_version='s3v4', region_name=s3_region))

        if not bucket_name:
            raise ValueError("Bucket name not provided in query parameters.")

        
        object_urls = []
        
        try:
            url = s3_client.generate_presigned_url(
                ClientMethod='get_object',
                Params={'Bucket':bucket_name,'Key':bucket_key, 'ResponseContentDisposition': 'attachment', 'ResponseContentType': 'application/octet-stream' },
                ExpiresIn=180, 
                HttpMethod='GET'
            )
                
            object_urls.append({'url': url})
                

        except Exception as url_error:
            print(f"Error generating presigned URL for {obj['Key']}: {url_error}")


        serialized_urls = json.dumps(object_urls)
        
        
        return {
            'statusCode': 200,
            'body': serialized_urls
        }

    except ValueError as ve:
        print(f"ValueError: {ve}")
        return {
            'statusCode': 400,
            'body': json.dumps(ve)
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f"Error retrieving bucket data for {bucket_name}. {str(e)}"})
        }