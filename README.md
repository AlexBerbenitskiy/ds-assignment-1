## ServerlessREST Assignment - Distributed Systems.

__Name:__ Alexander Berbenitskiy

This repository contains the implementation of a serverless REST API for the AWS platform. A CDK stack creates the infrastructure. The domain context of the API is movie reviews.

### API endpoints.

+ POST /movies/reviews - adds a movie review. - WORKS
+ GET /movies/{movieId}/reviews - Get all the reviews for a movie with the specified id. - WORKS
+ GET /movies/{movieId}/reviews?minRating=n - Get all the reviews for the movie with the specified ID with a rating greater than the minRating. ATTEMPTED - IN SEPARATE BRANCH
+ GET /movies/{movieId}/reviews/{reviewerName} - Get the review for the movie with the specified movie ID and written by the named reviewer. - WORKS
+ PUT /movies/{movieId}/reviews/{reviewerName} - Update the text of a review. (movie ID and reviewer username uniquely identify a review item). - ATTEMPTED
+ GET /movies/{movieId}/reviews/{year} - Get the review(s) for the movie with the specified movie ID and were written in a specified year. - ATTEMPTED - IN SEPARATE BRANCH
+ GET /movies/reviews/{reviewerName} - Get all the reviews written by a specific reviewer. - ATTEMPTED

+ GET /movies/{movieId}/reviews/{reviewerName}/translation?language=code - Get a translated version of the review for the movie with the specified movie ID and written by the named reviewer. 
This endpoint works up until the stage of the translation where the translation attempt fails due to an "AccessDeniedException."
![image](https://github.com/AlexBerbenitskiy/ds-assignment-1/assets/74902057/6122c6ff-fc0a-4c45-971a-69424518d608)
The Lambda function lacks the necessary permissions to use the translation service even though all permissions seem to have been given on AWS.




### Deployed API in API Gateway Service

![image](https://github.com/AlexBerbenitskiy/ds-assignment-1/assets/74902057/e2f350a2-78ea-4706-b5f0-8447b04dcb8e)

### Resources
![image](https://github.com/AlexBerbenitskiy/ds-assignment-1/assets/74902057/91cca3a4-39fb-4623-a18a-f64bf9ab812d)

![image](https://github.com/AlexBerbenitskiy/ds-assignment-1/assets/74902057/4cd48931-de88-4ca7-891d-f759d14ec1c3)

![image](https://github.com/AlexBerbenitskiy/ds-assignment-1/assets/74902057/6f0d8349-e0d1-4505-963c-c923ac6fc6be)



### Authentication

Authentication was not implemented successfully.

### Independent learning (If relevant).

+The following files were used for assistance in the translation endpoint

https://docs.aws.amazon.com/translate/latest/dg/what-is.html
https://completecoding.io/typescript-translation-api/
https://docs.aws.amazon.com/cdk/v2/guide/multiple_languages.html
https://completecoding.io/typescript-translation-api/

