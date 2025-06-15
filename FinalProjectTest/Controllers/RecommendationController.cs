using FinalProjectTest.Models;
using FinalProjectTest.Services;
using Microsoft.AspNetCore.Mvc;
using static FinalProjectTest.Models.RecommendationModels;

namespace FinalProjectTest.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecommendationController : ControllerBase
    {
        private readonly IRecommendationService _recommendationService;

        public RecommendationController(IRecommendationService recommendationService)
        {
            _recommendationService = recommendationService;
        }

        [HttpPost("smart-recommendations")]
        public async Task<ActionResult<List<RecommendationResponse>>> GetSmartRecommendations(
            [FromBody] RecommendationRequest request)
        {
            try
            {
                var recommendations = await _recommendationService.GetRecommendationsAsync(request);
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SmartRecommendations Error]: {ex.Message}");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet("top-rated")]
        public async Task<ActionResult<List<LocationDto>>> GetTopRated([FromQuery] int topN = 250)
        {
            try
            {
                var topRated = await _recommendationService.GetTopRatedPlacesAsync(topN);
                return Ok(topRated);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TopRated Error]: {ex.Message}");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpGet("nearby")]
        public async Task<ActionResult<List<LocationDto>>> GetNearbyPlaces(
            [FromQuery] double lat, [FromQuery] double lon, [FromQuery] int topN = 10)
        {
            try
            {
                var nearby = await _recommendationService.GetNearbyPlacesAsync(lat, lon, topN);
                return Ok(nearby);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NearbyPlaces Error]: {ex.Message}");
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}
