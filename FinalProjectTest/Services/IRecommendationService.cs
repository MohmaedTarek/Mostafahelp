using static FinalProjectTest.Models.RecommendationModels;

namespace FinalProjectTest.Services
{
    public interface IRecommendationService
    {
        Task<List<RecommendationResponse>> GetRecommendationsAsync(RecommendationRequest request);
        Task<List<LocationDto>> GetTopRatedPlacesAsync(int topN = 10);
        Task<List<LocationDto>> GetNearbyPlacesAsync(double userLat, double userLon, int topN = 10);

    }
}
