import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieCastMemberQueryParams"] || {}
);

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
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
    const param = pathParams.reviewerNameOrYear!;

    let commandInput: any;

    // Check if the parameter is a valid year using regex
    const isYear = /^\d{4}$/.test(param);

    if (isYear) {
      // Fetch reviews by year
commandInput = {
  TableName: process.env.TABLE_NAME,
  KeyConditionExpression: "movieId = :movieId AND begins_with(reviewerName, :year)",
  ExpressionAttributeValues: {
    ":movieId": movieId,
    ":year": param,
  },
};
    } else {
      // Fetch reviews by reviewerName
      commandInput = {
        TableName: process.env.TABLE_NAME,
        Key: {
          movieId: movieId,
          reviewerName: param,
        },
      };
    }

    const commandOutput = await ddbDocClient.send(new GetCommand(commandInput));

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: commandOutput.Item,
      }),
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

function createDocumentClient() {
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
  // To add validation logic Later
  // For example, ensure that movieId is a valid number
  return true;
}