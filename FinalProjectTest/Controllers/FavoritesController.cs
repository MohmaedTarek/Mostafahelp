using FinalProjectTest.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using X.PagedList;
using X.PagedList.Extensions;

namespace FinalProjectTest.Controllers
{
    [Authorize]
    public class FavoritesController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public FavoritesController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost]
        public async Task<IActionResult> Add(int locationId)
        {
            var user = await _userManager.GetUserAsync(User);

            if (!_context.Favorites.Any(f => f.UserID == user.Id && f.LocationID == locationId))
            {
                var favorite = new Favorite
                {
                    UserID = user.Id,
                    LocationID = locationId
                };
                _context.Favorites.Add(favorite);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction("Details", "Locations", new { id = locationId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Remove(int locationId)
        {
            var userId = _userManager.GetUserId(User);

            var favorite = await _context.Favorites
                .FirstOrDefaultAsync(f => f.LocationID == locationId && f.UserID == userId);

            if (favorite != null)
            {
                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction("MyFavorites");
        }

        public async Task<IActionResult> MyFavorites(string sortOrder, int? page)
        {
            var user = await _userManager.GetUserAsync(User);
            var favoritesQuery = _context.Favorites
                .Include(f => f.Location)
                .Where(f => f.UserID == user.Id);

            // Sorting logic
            switch (sortOrder)
            {
                case "name_desc":
                    favoritesQuery = favoritesQuery.OrderByDescending(f => f.Location.Name);
                    break;
                case "category":
                    favoritesQuery = favoritesQuery.OrderBy(f => f.Location.Category);
                    break;
                case "category_desc":
                    favoritesQuery = favoritesQuery.OrderByDescending(f => f.Location.Category);
                    break;
                default:
                    favoritesQuery = favoritesQuery.OrderBy(f => f.Location.Name);
                    break;
            }

            ViewBag.CurrentSort = sortOrder;

            int pageSize = 6;
            int pageNumber = page ?? 1;
            var pagedList = favoritesQuery.ToPagedList(pageNumber, pageSize);

            return View("MyFavorites", pagedList);
        }
    }
}
