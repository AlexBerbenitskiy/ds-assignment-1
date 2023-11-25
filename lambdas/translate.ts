import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';

const translate = new AWS.Translate();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME || '';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event));

    const { movieId, reviewerName } = event.pathParameters || {};
    const { language } = event.queryStringParameters || {};

    console.log('Parameters:', { movieId, reviewerName, language });

    if (!movieId || !reviewerName || !language) {
      console.log('Invalid request parameters');
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request parameters' }) };
    }

    
    const reviewParams = {
      TableName: tableName,
      Key: { movieId: parseInt(movieId), reviewerName },
    };

    const result = await dynamoDb.get(reviewParams).promise();

    console.log('DynamoDB Result:', result);

    if (!result.Item || !result.Item.content) {
      console.log('Review not found');
      return { statusCode: 404, body: JSON.stringify({ message: 'Review not found' }) };
    }

    const text = result.Item.content; 

    console.log('Retrieved review:', text);

    const translateParams = {
      Text: text,
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
    };

    const translatedMessage = await translate.translateText(translateParams).promise();

    console.log('Translated message:', translatedMessage);

    return { statusCode: 200, body: JSON.stringify({ translatedMessage }) };
  } catch (error) {
    console.error('Error in translation:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
};