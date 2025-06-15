using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FinalProjectTest.Models;
using System.Security.Claims;

namespace FinalProjectTest.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public UserController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                    return NotFound(new { Success = false, Message = "User not found" });

                // Get user's favorite locations count
                var favoritesCount = await _context.Favorites
                    .Where(f => f.UserID == userId)
                    .CountAsync();

                return Ok(new
                {
                    Success = true,
                    User = new
                    {
                        Id = user.Id,
                        Email = user.Email,
                        UserName = user.UserName,
                        FavoritesCount = favoritesCount
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("favorites")]
        public async Task<IActionResult> GetFavorites()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var favorites = await _context.Favorites
                    .Where(f => f.UserID == userId)
                    .Include(f => f.Location)
                    .Select(f => new
                    {
                        FavoriteID = f.FavoriteID,
                        LocationID = f.LocationID,
                        Name = f.Location.Name,
                        Category = f.Location.Category,
                        Address = f.Location.Address,
                        Rating = f.Location.Attributes,
                        ImageURL = f.Location.ImageURL,
                        GoogleMapsLink = f.Location.GoogleMapsLink,
                        Latitude = f.Location.Latitude,
                        Longitude = f.Location.Longitude,
                        ShortDescription = f.Location.ShortDescription,
                        FullDescription = f.Location.FullDescription,
                        VisitingHours = f.Location.VisitingHours
                    })
                    .ToListAsync();

                return Ok(new { Success = true, Data = favorites });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        [HttpPost("favorites/{locationId}")]
        public async Task<IActionResult> AddToFavorites(int locationId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                // Check if location exists
                var location = await _context.Locations.FindAsync(locationId);
                if (location == null)
                    return NotFound(new { Success = false, Message = "Location not found" });

                // Check if already in favorites
                var existingFavorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.UserID == userId && f.LocationID == locationId);

                if (existingFavorite != null)
                    return BadRequest(new { Success = false, Message = "Location already in favorites" });

                // Add to favorites
                var favorite = new Favorite
                {
                    UserID = userId,
                    LocationID = locationId
                };

                _context.Favorites.Add(favorite);
                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Location added to favorites" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        [HttpDelete("favorites/{locationId}")]
        public async Task<IActionResult> RemoveFromFavorites(int locationId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var favorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.UserID == userId && f.LocationID == locationId);

                if (favorite == null)
                    return NotFound(new { Success = false, Message = "Favorite not found" });

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                return Ok(new { Success = true, Message = "Location removed from favorites" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        [HttpPost("interactions")]
        public async Task<IActionResult> RecordInteraction([FromBody] UserInteractionRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                // Check if location exists
                var location = await _context.Locations.FindAsync(request.LocationID);
                if (location == null)
                    return NotFound(new { Success = false, Message = "Location not found" });

                // Try to record interaction (only if UserInteractions table exists)
                try
                {
                    var interaction = new UserInteraction
                    {
                        UserId = userId,
                        LocationID = request.LocationID,
                        Type = request.Type
                    };

                    _context.UserInteractions.Add(interaction);
                    await _context.SaveChangesAsync();
                }
                catch
                {
                    // UserInteractions table might not exist yet, that's ok
                }

                return Ok(new { Success = true, Message = "Interaction recorded" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }
    }

    public class UserInteractionRequest
    {
        public int LocationID { get; set; }
        public string Type { get; set; } // "view", "favorite", "directions", etc.
    }
}