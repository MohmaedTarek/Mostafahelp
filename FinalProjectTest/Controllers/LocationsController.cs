using FinalProjectTest.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinalProjectTest.Controllers
{
    public class LocationsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public LocationsController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
        {
            _context = context;
            _userManager = userManager;

        }

        public async Task<List<Location>> GetRecommendedForUser(string userId)
        {
            var recentInteractions = await _context.UserInteractions
                .Where(i => i.UserId == userId)
                .OrderByDescending(i => i.Timestamp)
                .Take(30)
                .Include(i => i.Location)
                .ToListAsync();

            var favoriteCategories = recentInteractions
                .GroupBy(i => i.Location.Category)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .ToList();

            var recommended = await _context.Locations
                .Where(l => favoriteCategories.Contains(l.Category))
                .OrderByDescending(l => l.Attributes)
                .Take(9)
                .Include(l => l.Images)
                .ToListAsync();

            return recommended;
        }

        // GET: Locations
        public async Task<IActionResult> Index(string search, string category)
        {
            var locations = _context.Locations
            .Include(l => l.Images) // 🛠 Include images
            .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                locations = locations.Where(l =>
                    l.Name.Contains(search) ||
                    l.ShortDescription.Contains(search) ||
                    l.Category.Contains(search));
            }

            if (!string.IsNullOrEmpty(category) && category != "All")
            {
                locations = locations.Where(l => l.Category == category);
            }

            ViewBag.Categories = await _context.Locations
                .Select(l => l.Category)
                .Distinct()
                .ToListAsync();

            ViewBag.CurrentSearch = search;
            ViewBag.CurrentCategory = category;

            // 🔥 Load user favorites
            var userId = User.Identity.IsAuthenticated ? _context.Users
                .FirstOrDefault(u => u.UserName == User.Identity.Name)?.Id : null;

            var favoriteIds = new List<int>();
            if (userId != null)
            {
                favoriteIds = await _context.Favorites
                    .Where(f => f.UserID == userId)
                    .Select(f => f.LocationID)
                    .ToListAsync();
            }

            ViewBag.FavoriteLocationIds = favoriteIds;

            return View(await locations.ToListAsync());
        }
        public async Task<IActionResult> Map()
        {
            var locations = await _context.Locations
                .Where(l => !string.IsNullOrEmpty(l.Address)) // optional
                .ToListAsync();

            return View(locations);
        }



        // GET: Locations/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var location = await _context.Locations
                .Include(l => l.Images)
                .FirstOrDefaultAsync(m => m.LocationID == id);

            if (location == null)
                return NotFound();

            if (User.Identity.IsAuthenticated)
            {
                var userId = _userManager.GetUserId(User);
                _context.UserInteractions.Add(new UserInteraction
                {
                    UserId = userId,
                    LocationID = id,
                    Type = "view"
                });

                await _context.SaveChangesAsync();
            }

            return View(location);
        }



        // GET: Locations/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Locations/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("LocationID,Name,Address,Category,Attributes,ProximityScore,ImageURL,DetailURL,VisitingHours,ShortDescription,FullDescription")] Location location)
        {
            if (ModelState.IsValid)
            {
                _context.Add(location);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(location);
        }

        // GET: Locations/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var location = await _context.Locations.FindAsync(id);
            if (location == null)
            {
                return NotFound();
            }
            return View(location);
        }

        // POST: Locations/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("LocationID,Name,Address,Category,Attributes,ProximityScore,ImageURL,DetailURL,VisitingHours,ShortDescription,FullDescription")] Location location)
        {
            if (id != location.LocationID)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(location);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!LocationExists(location.LocationID))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            return View(location);
        }

        // GET: Locations/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var location = await _context.Locations
                .FirstOrDefaultAsync(m => m.LocationID == id);
            if (location == null)
            {
                return NotFound();
            }

            return View(location);
        }

        // POST: Locations/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location != null)
            {
                _context.Locations.Remove(location);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        private double ToRadians(double angle) => angle * Math.PI / 180;

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371; // Radius of Earth in KM
            double dLat = ToRadians(lat2 - lat1);
            double dLon = ToRadians(lon2 - lon1);
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }


        [HttpGet]
        public async Task<IActionResult> NearMe(double? lat, double? lng, string sortBy = "distance")
        {
            if (lat == null || lng == null)
                return View(new List<Location>()); // fallback view if no coords

            var allLocations = await _context.Locations
                .Include(l => l.Images)
                .Where(l => l.Latitude.HasValue && l.Longitude.HasValue)
                .ToListAsync();

            foreach (var loc in allLocations)
            {
                loc.DistanceInKm = CalculateDistance(lat.Value, lng.Value, loc.Latitude.Value, loc.Longitude.Value);
            }

            // Apply sorting
            var sorted = sortBy switch
            {
                "rating" => allLocations
                    .OrderByDescending(l => double.TryParse(l.Attributes, out var rating) ? rating : 0)
                    .ToList(),

                "name" => allLocations
                    .OrderBy(l => l.Name)
                    .ToList(),

                _ => allLocations
                    .OrderBy(l => l.DistanceInKm)
                    .ToList()
            };

            ViewBag.UserLat = lat;
            ViewBag.UserLng = lng;
            ViewBag.SortBy = sortBy;

            return View(sorted);
        }



        private bool LocationExists(int id)
        {
            return _context.Locations.Any(e => e.LocationID == id);
        }
    }
}
