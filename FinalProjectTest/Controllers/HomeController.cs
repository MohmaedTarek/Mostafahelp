using FinalProjectTest.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace FinalProjectTest.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public HomeController(ILogger<HomeController> logger, ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _logger = logger;
            _context = context;
            _userManager = userManager;
        }

        public async Task<IActionResult> Index(string category)
        {
            var userId = User.Identity.IsAuthenticated ? _userManager.GetUserId(User) : null;

            var locationsQuery = _context.Locations
                .Include(l => l.Images)
                .Where(l => l.Category != "Hotel");

            if (!string.IsNullOrEmpty(category) && category != "All")
            {
                locationsQuery = locationsQuery.Where(l => l.Category == category);
            }

            var allLocations = await locationsQuery.ToListAsync();

            var topRated = allLocations
                .OrderByDescending(l => double.TryParse(l.Attributes, out var rating) ? rating : 0)
                .Take(6)
                .ToList();

            List<Location> recommended;

            if (!string.IsNullOrEmpty(userId))
            {
                // Fetch recent interactions
                var recentInteractions = await _context.UserInteractions
                    .Where(i => i.UserId == userId)
                    .OrderByDescending(i => i.Timestamp)
                    .Take(30)
                    .Include(i => i.Location)
                    .ToListAsync();

                // Extract favorite categories
                var favoriteCategories = recentInteractions
                    .Where(i => i.Location != null && !string.IsNullOrEmpty(i.Location.Category))
                    .Select(i => i.Location.Category)
                    .GroupBy(c => c)
                    .OrderByDescending(g => g.Count())
                    .Select(g => g.Key)
                    .ToList();

                // Extract specific location IDs as well
                var recentLocationIds = recentInteractions
                    .Where(i => i.Location != null)
                    .Select(i => i.Location.LocationID)
                    .ToList();

                // DEBUG: Log insights
                _logger.LogInformation("User ID: " + userId);
                _logger.LogInformation("Favorite Categories: " + string.Join(", ", favoriteCategories));
                _logger.LogInformation("Recent Location IDs: " + string.Join(", ", recentLocationIds));

                // Build recommendation list
                var allRecommended = await _context.Locations
                    .Include(l => l.Images)
                    .Where(l =>
                        (favoriteCategories.Contains(l.Category) || recentLocationIds.Contains(l.LocationID)) &&
                        !topRated.Select(t => t.LocationID).Contains(l.LocationID))
                    .ToListAsync();

                recommended = allRecommended
                    .OrderByDescending(l => double.TryParse(l.Attributes, out var rating) ? rating : 0)
                    .Take(6)
                    .ToList();

                _logger.LogInformation("Recommended Count: " + recommended.Count);
            }
            else
            {
                // Fallback for guests
                recommended = await _context.Locations
                    .Include(l => l.Images)
                    .Where(l => l.Category != "Hotel" &&
                                !topRated.Select(t => t.LocationID).Contains(l.LocationID))
                    .OrderBy(r => Guid.NewGuid())
                    .Take(6)
                    .ToListAsync();
            }

            var categories = await _context.Locations
                .Where(l => l.Category != "Hotel")
                .Select(l => l.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            ViewBag.Recommended = recommended;
            ViewBag.Categories = categories;
            ViewBag.CurrentCategory = category ?? "All";

            return View(topRated);
        }






        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
