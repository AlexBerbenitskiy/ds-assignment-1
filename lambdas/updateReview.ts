import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["MovieReview"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);

    const body = event.body ? JSON.parse(event.body) : undefined;
    if (!body) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    if (!isValidBodyParams(body)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Incorrect type. Must match Movie Review schema",
          schema: schema.definitions["MovieReview"],
        }),
      };
    }

    const pathParams = event.pathParameters;
    if (!pathParams || !isValidPathParams(pathParams)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Invalid path parameters",
        }),
      };
    }

    const movieId = parseInt(pathParams.movieId ?? "0");
    const reviewerName = pathParams.reviewerName;

    const existingReview = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          movieId: movieId,
          reviewerName: reviewerName,
        },
      })
    );

    if (!existingReview.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Review not found" }),
      };
    }

    const commandOutput = await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          movieId: movieId,
          reviewerName: reviewerName,
          ...body,
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Review updated" }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}

function isValidPathParams(pathParams: any) {
  return true;
}