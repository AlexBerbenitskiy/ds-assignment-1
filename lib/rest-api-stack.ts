import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { moviesReviews } from "../seed/movies";


export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  

    //Review Table
    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReview",
    });

    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "reviewIx",
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
    });


    
    //MOVIES REMAINING FUNCTIONS
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieReviews.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );

      const getAllMoviesFn = new lambdanode.NodejsFunction(
        this,
        "GetAllMoviesFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getMovieReviews.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );
   

  //REVIEWS FUNCTIONS 

    //get reviews function
    const getMovieReviewsFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewsFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieReviews.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    // get reviewer function
const getMovieReviewerFn = new lambdanode.NodejsFunction(
  this,
  "GetMovieReviewerFn",
  {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.NODEJS_16_X,
    entry: `${__dirname}/../lambdas/getMovieReviewer.ts`, 
    timeout: cdk.Duration.seconds(10),
    memorySize: 128,
    environment: {
      TABLE_NAME: movieReviewsTable.tableName,
      REGION: 'eu-west-1',
    },
  }
);

    // get reviewer function
    const getMovieReviewerTranslatedFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewerTranslatedFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/translate.ts`, 
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    // get reviewer function
    const getMovieReviewerAllFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieReviewerAllFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieReviewerAll.ts`, 
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );
      
      

        
    //IMPLEMENTED REVIEWS TABLE
    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [movieReviewsTable.tableName]: generateBatch(moviesReviews), //Include Movie Reviews 
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn],  // Includes movie cast and REVIEWS
      }),
    });

        

        //POST REVIEW 
        const newReviewFn = new lambdanode.NodejsFunction(this, "addMovieReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/addReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: "eu-west-1",
          },
        });

        
        //UPDATE REVIEW 
        const updateReviewFn = new lambdanode.NodejsFunction(this, "updateMovieReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/updateReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: "eu-west-1",
          },
        });


        

        // Permissions 
        movieReviewsTable.grantReadData(getMovieReviewsFn);
        movieReviewsTable.grantReadData(getMovieReviewerFn);
        movieReviewsTable.grantReadWriteData(getMovieReviewerTranslatedFn);
        movieReviewsTable.grantReadWriteData(newReviewFn);
        movieReviewsTable.grantReadWriteData(updateReviewFn);
        movieReviewsTable.grantReadData(getMovieReviewerAllFn);


          // REST API 
    const api = new apig.RestApi(this, "RestAPI", {
      description: "demo api",
      deployOptions: {
        stageName: "dev",
      },
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    

    const moviesEndpoint = api.root.addResource("movies");

    

    moviesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
    );


    const movieEndpoint = moviesEndpoint.addResource("{movieId}");
    movieEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
    );


    
   // REVIEWS ENDPOINT

// Reviews - GET Reviews
const movieReviewsEndpoint = movieEndpoint.addResource("reviews");
movieReviewsEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true })
);

// Reviews POST
movieReviewsEndpoint.addMethod(
  "POST",
  new apig.LambdaIntegration(newReviewFn, { proxy: true })
);

// Reviews GET Reviewer's Reviews with movieId
const specificReviewerEndpoint = movieReviewsEndpoint.addResource("{reviewerName}");
specificReviewerEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getMovieReviewerFn, { proxy: true })
);

// REVIEWS TRANSLATE
const translationEndpoint = specificReviewerEndpoint.addResource("translation");
translationEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getMovieReviewerTranslatedFn, { proxy: true })
);

// NEW ENDPOINT: Reviews GET Reviewer's Reviews without movieId
const reviewsWithoutMovieIdEndpoint = movieReviewsEndpoint.addResource("reviews");
reviewsWithoutMovieIdEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getMovieReviewerAllFn, { proxy: true })
);

// REVIEWS UPDATE Review
const updateReviewEndpoint = specificReviewerEndpoint.addResource("update");
updateReviewEndpoint.addMethod(
  "PUT",
  new apig.LambdaIntegration(updateReviewFn, { proxy: true })
);
      }
      
    }
    
    