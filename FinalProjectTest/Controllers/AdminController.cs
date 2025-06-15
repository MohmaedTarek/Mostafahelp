using FinalProjectTest.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinalProjectTest.Controllers
{
    [Authorize] // Optional: Add role check later
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // ------------------- USER MANAGEMENT ------------------------

        public async Task<IActionResult> UserManagement()
        {
            var users = await _userManager.Users.ToListAsync();
            var viewModels = new List<UserAdminViewModel>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                viewModels.Add(new UserAdminViewModel
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = roles.FirstOrDefault() ?? "User"
                });
            }

            return View(viewModels);
        }

        [HttpGet]
        public async Task<IActionResult> EditUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            var viewModel = new UserAdminViewModel
            {
                Id = user.Id,
                Email = user.Email,
                Role = roles.FirstOrDefault() ?? "User"
            };

            return View(viewModel);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditUser(UserAdminViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var user = await _userManager.FindByIdAsync(model.Id);
            if (user == null) return NotFound();

            user.Email = model.Email;
            user.UserName = model.Email;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                    ModelState.AddModelError(string.Empty, error.Description);
                return View(model);
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, model.Role);

            return RedirectToAction("UserManagement");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                return RedirectToAction("UserManagement");
            }

            return View("Error"); // Error view if deletion fails
        }

        // ------------------- DASHBOARD ------------------------

        public async Task<IActionResult> Dashboard()
        {
            var userCount = await _userManager.Users.CountAsync();
            var locationCount = await _context.Locations.CountAsync();
            var hotelCount = await _context.Locations.CountAsync(l => l.Category == "Hotel");
            var favoriteCount = await _context.Favorites.CountAsync();

            var topFavorited = await _context.Favorites
                .GroupBy(f => f.LocationID)
                .Select(g => new
                {
                    LocationID = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(g => g.Count)
                .Take(5)
                .Join(_context.Locations,
                      f => f.LocationID,
                      l => l.LocationID,
                      (f, l) => new { l.Name, f.Count })
                .ToListAsync();

            ViewBag.UserCount = userCount;
            ViewBag.LocationCount = locationCount;
            ViewBag.HotelCount = hotelCount;
            ViewBag.FavoriteCount = favoriteCount;
            ViewBag.TopFavorited = topFavorited;

            return View();
        }
    }
}
