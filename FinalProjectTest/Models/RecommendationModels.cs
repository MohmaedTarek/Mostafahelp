namespace FinalProjectTest.Models
{
    public class RecommendationModels
    {
        public class LocationDto
        {
            public int LocationID { get; set; }
            public string Name { get; set; }
            public string Address { get; set; }
            public string Category { get; set; }
            public double? Rating { get; set; }
            public double Latitude { get; set; }
            public double Longitude { get; set; }
            public string ShortDescription { get; set; }
            public string FullDescription { get; set; }
            public string GoogleMapsLink { get; set; }
            public string VisitingHours { get; set; }
            
            public string ImageURL { get; set; }
        }

        public class RecommendationRequest
        {
            public double UserLatitude { get; set; }
            public double UserLongitude { get; set; }
            public int TopN { get; set; } = 10;
            public string? Keyword { get; set; }
            public string? Category { get; set; }
            public string? PlaceName { get; set; }
            public double MinRating { get; set; } = 0;
        }

        public class RecommendationResponse
        {
            public string Name { get; set; }
            public string Category { get; set; }
            public double DistanceKM { get; set; }
            public double Rating { get; set; }
            public double Score { get; set; }
            public string GoogleMapsLink { get; set; }
            public LocationDto LocationDetails { get; set; }
        }
    }
}
