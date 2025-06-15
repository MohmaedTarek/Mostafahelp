using FinalProjectTest.Data;
using FinalProjectTest.Models;
using Microsoft.EntityFrameworkCore;
using static FinalProjectTest.Models.RecommendationModels;

namespace FinalProjectTest.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly ApplicationDbContext _context;

        public RecommendationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<RecommendationResponse>> GetRecommendationsAsync(RecommendationRequest request)
        {
            var locations = await _context.Locations
                .Include(l => l.Images) // ✅ Include images
                .Where(l => l.Latitude.HasValue && l.Longitude.HasValue)
                .ToListAsync();

            var recommendations = new List<RecommendationResponse>();

            foreach (var location in locations)
            {
                var distance = CalculateDistance(request.UserLatitude, request.UserLongitude,
                                                location.Latitude.Value, location.Longitude.Value);

                var rating = ParseRatingFromAttributes(location.Attributes);
                if (rating < request.MinRating) continue;

                var similarity = CalculateSimilarity(location, request.Keyword, request.Category, request.PlaceName);

                var score = CalculateScore(similarity, distance, rating, location.Category ?? "", location.FullDescription ?? "");

                recommendations.Add(new RecommendationResponse
                {
                    Name = location.Name,
                    Category = location.Category,
                    DistanceKM = distance,
                    Rating = rating,
                    Score = score,
                    GoogleMapsLink = location.GoogleMapsLink,
                    LocationDetails = MapToLocationDto(location)
                });
            }

            return recommendations.OrderByDescending(r => r.Score).Take(request.TopN).ToList();
        }

        public async Task<List<LocationDto>> GetTopRatedPlacesAsync(int topN = 250)
        {
            var locations = await _context.Locations
                .Include(l => l.Images)
                .ToListAsync();

            int perCategory = topN / 4; // Divide across 4 categories (you can customize this)

            // Helper method
            List<LocationDto> GetTopFromCategory(string category)
            {
                return locations
                    .Where(l => string.Equals(l.Category, category, StringComparison.OrdinalIgnoreCase))
                    .Select(l =>
                    {
                        double rating = ParseRatingFromAttributes(l.Attributes);

                        if (rating == 0 && category == "Historical")
                        {
                            int imageScore = l.Images?.Count ?? 0;
                            int descScore = (l.FullDescription?.Length ?? 0) / 250;
                            rating = Math.Min(5, 2 + (imageScore * 0.3) + (descScore * 0.2));
                        }

                        return new { Location = l, Score = rating };
                    })
                    .OrderByDescending(x => x.Score)
                    .Take(perCategory)
                    .Select(x => MapToLocationDto(x.Location))
                    .ToList();
            }

            // Merge top from each category
            var topHotels = GetTopFromCategory("Hotel");
            var topRestaurants = GetTopFromCategory("Restaurant");
            var topCafes = GetTopFromCategory("Cafe");
            var topMonuments = GetTopFromCategory("Historical"); // or "Monument"

            return topHotels
                .Concat(topRestaurants)
                .Concat(topCafes)
                .Concat(topMonuments)
                .OrderByDescending(p => p.Rating) // optional final sort
                .ToList();
        }




        public async Task<List<LocationDto>> GetNearbyPlacesAsync(double userLat, double userLon, int topN = 10)
        {
            var locations = await _context.Locations
                .Include(l => l.Images) // ✅ Include images
                .Where(l => l.Latitude.HasValue && l.Longitude.HasValue)
                .ToListAsync();

            var nearbyPlaces = locations
                .Select(l => new {
                    Location = l,
                    Distance = CalculateDistance(userLat, userLon, l.Latitude.Value, l.Longitude.Value)
                })
                .OrderBy(x => x.Distance)
                .Take(topN)
                .Select(x => MapToLocationDto(x.Location))
                .ToList();

            return nearbyPlaces;
        }

        private double ParseRatingFromAttributes(string attributes)
        {
            if (string.IsNullOrEmpty(attributes)) return 0;

            if (double.TryParse(attributes, out double rating))
            {
                // 🔍 If above 5 → assume hotel rating out of 10
                if (rating > 5) return Math.Round((rating / 10.0) * 5, 1);
                return rating;
            }

            return 0;
        }


        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371; // km
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRadians(double degrees) => degrees * Math.PI / 180;

        private double CalculateSimilarity(Location location, string keyword, string category, string placeName)
        {
            double similarity = 0;

            if (!string.IsNullOrEmpty(keyword))
            {
                var combinedText = $"{location.ShortDescription} {location.FullDescription}".ToLower();
                similarity = combinedText.Contains(keyword.ToLower()) ? 0.8 : 0;
            }
            else if (!string.IsNullOrEmpty(category))
            {
                similarity = location.Category?.ToLower() == category.ToLower() ? 1.0 : 0;
            }
            else if (!string.IsNullOrEmpty(placeName))
            {
                similarity = location.Name?.ToLower().Contains(placeName.ToLower()) == true ? 1.0 : 0;
            }
            else
            {
                similarity = 0.6; // 👈 give some base score to all
            }

            return similarity;
        }


        private double CalculateScore(double similarity, double distance, double rating, string category, string fullDescription)
        {
            double normalizedRating = 0;

            if (!string.IsNullOrEmpty(category))
            {
                var lowerCategory = category.ToLower();
                if (lowerCategory.Contains("hotel"))
                {
                    normalizedRating = Math.Clamp(rating / 10.0, 0, 1); // Hotel rating scale
                }
                else if (lowerCategory.Contains("restaurant") || lowerCategory.Contains("cafe"))
                {
                    normalizedRating = Math.Clamp(rating / 5.0, 0, 1); // Restaurant/Cafe rating scale
                }
            }

            double popularityBoost = 0;
            if (!string.IsNullOrEmpty(fullDescription) &&
                (fullDescription.ToLower().Contains("popular") ||
                 fullDescription.ToLower().Contains("visited") ||
                 fullDescription.ToLower().Contains("famous")))
            {
                popularityBoost = 0.3;
            }

            return (similarity * 0.4) + ((1 / (distance + 1)) * 0.3) + (normalizedRating * 0.2) + popularityBoost;
        }

        private LocationDto MapToLocationDto(Location location)
        {
            return new LocationDto
            {
                LocationID = location.LocationID,
                Name = location.Name,
                Address = location.Address,
                Category = location.Category,
                Rating = ParseRatingFromAttributes(location.Attributes),
                Latitude = location.Latitude ?? 0,
                Longitude = location.Longitude ?? 0,
                ShortDescription = location.ShortDescription,
                FullDescription = location.FullDescription,
                GoogleMapsLink = location.GoogleMapsLink,
                VisitingHours = location.VisitingHours,
                ImageURL = location.Images?.FirstOrDefault()?.ImageURL ?? location.ImageURL
            };
        }
    }
}
