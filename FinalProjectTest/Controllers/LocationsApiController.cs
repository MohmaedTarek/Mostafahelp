using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinalProjectTest.Data;
using FinalProjectTest.Models;

namespace FinalProjectTest.Controllers
{
    [Route("api/locations")]
    [ApiController]
    public class LocationsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LocationsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/locations - Get all locations
        [HttpGet]
        public async Task<ActionResult> GetLocations([FromQuery] string? category)
        {
            try
            {
                var query = _context.Locations
                    .Include(l => l.Images)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(category))
                {
                    // Handle specific category filtering
                    if (category.ToLower() == "monuments")
                    {
                        // Group all monument-related categories
                        var monumentCategories = new[] { "Church", "Mosque", "Historical", "Museum", "Palace", "Fortress", "Shrine", "Fountain", "Market", "School" };
                        query = query.Where(l => monumentCategories.Contains(l.Category));
                    }
                    else
                    {
                        query = query.Where(l => l.Category == category);
                    }
                }

                var locations = await query.ToListAsync();

                return Ok(locations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/locations/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetLocation(int id)
        {
            try
            {
                var location = await _context.Locations
                    .Include(l => l.Images)
                    .FirstOrDefaultAsync(l => l.LocationID == id);

                if (location == null)
                    return NotFound(new { success = false, message = "Location not found" });

                return Ok(location);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ========== FRONTEND CATEGORY ENDPOINTS ==========

        [HttpGet("restaurants")]
        public async Task<ActionResult> GetRestaurants()
        {
            try
            {
                var results = await _context.Locations
                    .Include(l => l.Images)
                    .Where(l => l.Category == "Restaurant")
                    .ToListAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("cafes")]
        public async Task<ActionResult> GetCafes()
        {
            try
            {
                var results = await _context.Locations
                    .Include(l => l.Images)
                    .Where(l => l.Category == "Cafe")
                    .ToListAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("hotels")]
        public async Task<ActionResult> GetHotels()
        {
            try
            {
                var results = await _context.Locations
                    .Include(l => l.Images)
                    .Where(l => l.Category == "Hotel")
                    .ToListAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("monuments")]
        public async Task<ActionResult> GetMonuments()
        {
            try
            {
                var monumentCategories = new[] { "Church", "Mosque", "Historical", "Museum", "Palace", "Fortress", "Shrine", "Fountain", "Market", "School" };

                var results = await _context.Locations
                    .Include(l => l.Images)
                    .Where(l => monumentCategories.Contains(l.Category))
                    .ToListAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ========== INDIVIDUAL BACKEND CATEGORY ENDPOINTS (for admin/detailed views) ==========

        [HttpGet("churches")] public async Task<ActionResult> GetChurches() => await GetByCategory("Church");
        [HttpGet("fortresses")] public async Task<ActionResult> GetFortresses() => await GetByCategory("Fortress");
        [HttpGet("fountains")] public async Task<ActionResult> GetFountains() => await GetByCategory("Fountain");
        [HttpGet("historical")] public async Task<ActionResult> GetHistorical() => await GetByCategory("Historical");
        [HttpGet("markets")] public async Task<ActionResult> GetMarkets() => await GetByCategory("Market");
        [HttpGet("mosques")] public async Task<ActionResult> GetMosques() => await GetByCategory("Mosque");
        [HttpGet("museums")] public async Task<ActionResult> GetMuseums() => await GetByCategory("Museum");
        [HttpGet("palaces")] public async Task<ActionResult> GetPalaces() => await GetByCategory("Palace");
        [HttpGet("schools")] public async Task<ActionResult> GetSchools() => await GetByCategory("School");
        [HttpGet("shrines")] public async Task<ActionResult> GetShrines() => await GetByCategory("Shrine");

        // ========== PRIVATE HELPER ==========
        private async Task<ActionResult> GetByCategory(string category)
        {
            try
            {
                var results = await _context.Locations
                    .Include(l => l.Images)
                    .Where(l => l.Category == category)
                    .ToListAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}