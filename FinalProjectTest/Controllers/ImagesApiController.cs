using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinalProjectTest.Data;
using FinalProjectTest.Models;

namespace FinalProjectTest.Controllers
{
    [Route("api/images")]
    [ApiController]
    public class ImagesApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ImagesApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/images/first
        [HttpGet("first")]
        public async Task<IActionResult> GetFirstImagePerLocation()
        {
            try
            {
                var firstImages = await _context.Locations
                    .Include(l => l.Images)
                    .Select(l => new
                    {
                        LocationID = l.LocationID,
                        Name = l.Name,
                        Category = l.Category,
                        FirstImage = l.Images.OrderBy(img => img.ImageID)
                                           .Select(img => img.ImageURL)
                                           .FirstOrDefault()
                    })
                    .Where(l => l.FirstImage != null) // Only include locations with images
                    .ToListAsync();

                // Return in the format your frontend expects
                return Ok(new { success = true, data = firstImages });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message, data = new List<object>() });
            }
        }

        // GET: api/images/location/{id} - Get all images for a specific location
        [HttpGet("location/{id}")]
        public async Task<IActionResult> GetImagesByLocation(int id)
        {
            try
            {
                var images = await _context.LocationImages
                    .Where(img => img.LocationID == id)
                    .OrderBy(img => img.ImageID)
                    .Select(img => new
                    {
                        img.ImageID,
                        img.ImageURL,
                        img.LocationID
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = images });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message, data = new List<object>() });
            }
        }

        // GET: api/images/{id} - Get specific image
        [HttpGet("{id}")]
        public async Task<IActionResult> GetImage(int id)
        {
            try
            {
                var image = await _context.LocationImages
                    .FirstOrDefaultAsync(img => img.ImageID == id);

                if (image == null)
                    return NotFound(new { success = false, message = "Image not found" });

                return Ok(new { success = true, data = image });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/images/category/{category} - Get first image for each location in a category
        [HttpGet("category/{category}")]
        public async Task<IActionResult> GetFirstImagesByCategory(string category)
        {
            try
            {
                var monumentCategories = new[] { "Church", "Mosque", "Historical", "Museum", "Palace", "Fortress", "Shrine", "Fountain", "Market", "School" };

                IQueryable<Location> query = _context.Locations.Include(l => l.Images);

                if (category.ToLower() == "monuments")
                {
                    query = query.Where(l => monumentCategories.Contains(l.Category));
                }
                else
                {
                    query = query.Where(l => l.Category == category);
                }

                var images = await query
                    .Select(l => new
                    {
                        LocationID = l.LocationID,
                        Name = l.Name,
                        Category = l.Category,
                        FirstImage = l.Images.OrderBy(img => img.ImageID)
                                           .Select(img => img.ImageURL)
                                           .FirstOrDefault()
                    })
                    .Where(l => l.FirstImage != null)
                    .ToListAsync();

                return Ok(new { success = true, data = images });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message, data = new List<object>() });
            }
        }
    }
}