import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies, movieCasts, moviesReviews } from "../seed/movies";


export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    const movieCastsTable = new dynamodb.Table(this, "MovieCastTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "actorName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieCast",
    });

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


    movieCastsTable.addLocalSecondaryIndex({
      indexName: "roleIx",
      sortKey: { name: "roleName", type: dynamodb.AttributeType.STRING },
    });


    
    
    // Functions 
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );

    const getMovieCastMembersFn = new lambdanode.NodejsFunction(
      this,
      "GetCastMemberFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieCastsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );

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
      
      const getAllMoviesFn = new lambdanode.NodejsFunction(
        this,
        "GetAllMoviesFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getAllMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );

         // Create the deleteMovieFn Lambda function
    const deleteMovieFn = new lambdanode.NodejsFunction(
      this,
      "DeleteMovieFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/deleteMovie.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
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
            [moviesTable.tableName]: generateBatch(movies),
            [movieCastsTable.tableName]: generateBatch(movieCasts),  // Added
            [movieReviewsTable.tableName]: generateBatch(moviesReviews), //Include Movie Reviews 
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn, movieCastsTable.tableArn, movieReviewsTable.tableArn],  // Includes movie cast and REVIEWS
      }),
    });
        
        const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/addMovie.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-west-1",
          },
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


        

        // Permissions 
        moviesTable.grantReadData(getMovieByIdFn)
        moviesTable.grantReadData(getAllMoviesFn)
        moviesTable.grantReadWriteData(newMovieFn)
        moviesTable.grantReadWriteData(deleteMovieFn);
        movieCastsTable.grantReadData(getMovieCastMembersFn);
        movieReviewsTable.grantReadData(getMovieReviewsFn);
        movieReviewsTable.grantReadData(getMovieReviewerFn);
        movieReviewsTable.grantReadWriteData(getMovieReviewerTranslatedFn);
        movieReviewsTable.grantReadWriteData(newReviewFn);
        
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

      // NEW
      moviesEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(newMovieFn, { proxy: true })
      );


      


    const movieEndpoint = moviesEndpoint.addResource("{movieId}");
    movieEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
    );

    const movieCastEndpoint = moviesEndpoint.addResource("cast");
    movieCastEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieCastMembersFn, { proxy: true })
    );

    movieEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteMovieFn, { proxy: true })
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

// Reviews GET Reviewer's Reviews
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
      }
      
    }
    
    