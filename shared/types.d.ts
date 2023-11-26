

  export type MovieReview = {
    movieId: number;
    reviewerName: string;
    reviewDate: string;
    content: string;
    rating: number;
  };


  export type MovieReviewQueryParams = {
    movieId: number;
    reviewerName?: string;
    reviewDate?: string;
  };

  