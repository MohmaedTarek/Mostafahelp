using FinalProjectTest.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExcelDataReader;
using System.Data;
using System.Text.RegularExpressions;


namespace FinalProjectTest.Data
{
    public class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

            await ImportLocations(serviceProvider);
            await ImportHotels(serviceProvider);
            await ImportLocationImages(serviceProvider);
            await SeedAdminUser(serviceProvider);
            await ImportRestaurants(serviceProvider);
            await ImportCafes(serviceProvider);

        }

        public static async Task ImportLocations(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    if (context.Locations.Any(l => l.Category != "Hotel"))
    {
        Console.WriteLine("📂 Landmarks already seeded. Skipping.");
        return;
    }

    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "Full_Data.xlsx");

    using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
    using var reader = ExcelReaderFactory.CreateReader(stream);

    var config = new ExcelDataSetConfiguration
    {
        ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
    };

    var dataSet = reader.AsDataSet(config);
    var table = dataSet.Tables[0];
    var records = new List<Location>();

    foreach (DataRow row in table.Rows)
    {
        string category = row["Category"]?.ToString()?.Trim();

        if (!string.IsNullOrWhiteSpace(category) && category.ToLower() != "hotel")
        {
            string name = row["Name"]?.ToString();
            string address = row["Address"]?.ToString();
            string shortDescription = row["ShortDescription"]?.ToString();
            string fullDescription = row["FullDescription"]?.ToString();
            string visitingHours = row["VisitingHours"]?.ToString();
            string detailURL = row["DetailURL"]?.ToString();
            string googleMapsLink = row["GoogleMapsLink"]?.ToString();

            // Attempt to get coordinates
            double latitude = 0, longitude = 0;
            bool hasParsedCoords = false;

            if (double.TryParse(row["Latitude"]?.ToString(), out double lat) &&
                double.TryParse(row["Longitude"]?.ToString(), out double lng))
            {
                latitude = lat;
                longitude = lng;
                hasParsedCoords = true;
            }
            else if (!string.IsNullOrWhiteSpace(googleMapsLink))
            {
                var match = Regex.Match(googleMapsLink, @"@(-?\d+\.\d+),(-?\d+\.\d+)");
                if (match.Success && 
                    double.TryParse(match.Groups[1].Value, out lat) &&
                    double.TryParse(match.Groups[2].Value, out lng))
                {
                    latitude = lat;
                    longitude = lng;
                    hasParsedCoords = true;
                }
            }

            records.Add(new Location
            {
                Name = name,
                Address = address,
                ShortDescription = shortDescription,
                FullDescription = fullDescription,
                VisitingHours = visitingHours,
                DetailURL = detailURL,
                GoogleMapsLink = googleMapsLink,
                Category = category,
                ImageURL = "",
                Attributes = "",
                Latitude = hasParsedCoords ? latitude : 0,
                Longitude = hasParsedCoords ? longitude : 0
            });
        }
    }

    await context.Locations.AddRangeAsync(records);
    await context.SaveChangesAsync();
    Console.WriteLine($"✅ {records.Count} landmarks seeded.");
}


        public static async Task ImportHotels(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            if (await context.Locations.AnyAsync(l => l.Category == "Hotel"))
            {
                Console.WriteLine("🏨 Hotels already seeded. Skipping.");
                return;
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "Updated_Full_Data.xlsx");

            using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            using var reader = ExcelReaderFactory.CreateReader(stream);

            var config = new ExcelDataSetConfiguration
            {
                ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
            };

            var dataSet = reader.AsDataSet(config);
            var table = dataSet.Tables[0];
            var hotels = new List<Location>();

            foreach (DataRow row in table.Rows)
            {
                string category = row["Category"]?.ToString()?.Trim();

                if (!string.IsNullOrWhiteSpace(category) && category.ToLower() == "hotel")
                {
                    hotels.Add(new Location
                    {
                        Name = row["Name"]?.ToString(),
                        Address = row["Address"]?.ToString(),
                        ShortDescription = row["ShortDescription"]?.ToString() ?? "Book a stay at this hotel.",
                        FullDescription = row["FullDescription"]?.ToString(),
                        VisitingHours = row["VisitingHours"]?.ToString(),
                        DetailURL = row["DetailURL"]?.ToString(),
                        GoogleMapsLink = row["GoogleMapsLink"]?.ToString(),
                        Category = category,
                        ImageURL = "",
                        Attributes = row["Attributes"]?.ToString(),
                        Latitude = 0,
                        Longitude = 0
                    });
                }
            }

            await context.Locations.AddRangeAsync(hotels);
            await context.SaveChangesAsync();
            Console.WriteLine($"🏨 {hotels.Count} hotels seeded.");
        }

        public static async Task ImportRestaurants(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            if (await context.Locations.AnyAsync(l => l.Category == "Restaurant"))
            {
                Console.WriteLine("🍽️ Restaurants already seeded. Skipping.");
                return;
            }
            

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "cairo_restaurants_cleaned.xlsx");

            using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            using var reader = ExcelReaderFactory.CreateReader(stream);

            var config = new ExcelDataSetConfiguration
            {
                ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
            };

            var dataSet = reader.AsDataSet(config);
            var table = dataSet.Tables[0];
            var restaurants = new List<Location>();
            var images = new List<LocationImage>();

            foreach (DataRow row in table.Rows)
            {
                var name = row["name"]?.ToString();
                var address = row["address"]?.ToString();
                var desc = row["description"]?.ToString();
                var rating = row["rating"]?.ToString();
                var price = row["priceLevel"]?.ToString();
                var hours = row["opening_hours_text"]?.ToString();
                var lat = row["latitude"] != DBNull.Value ? Convert.ToDouble(row["latitude"]) : 0;
                var lng = row["longitude"] != DBNull.Value ? Convert.ToDouble(row["longitude"]) : 0;
                var website = row["website"]?.ToString();

                var fullDescription = $"Rating: {rating} | Price: {price}\nHours: {hours}\n\n{desc}";

                var location = new Location
                {
                    Name = name,
                    Address = address,
                    Category = "Restaurant",
                    ShortDescription = desc,
                    FullDescription = fullDescription,
                    VisitingHours = hours,
                    DetailURL = website,
                    GoogleMapsLink = "",
                    ImageURL = "",
                    Attributes = rating, // Mapping rating to Attributes column
                    Latitude = lat,
                    Longitude = lng
                };

                context.Locations.Add(location);
                await context.SaveChangesAsync(); // Save to get the LocationID

                var galleryColumns = new[] { "image", "photos/0", "photos/1", "photos/2", "photos/3", "photos/4", "photos/5", "photos/6", "photos/7", "photos/8", "photos/9", "photos/10", "photos/11", "photos/12", "photos/13", "photos/14", "photos/15", "photos/16", "photos/17", "photos/18", "photos/19", "photos/20", "photos/21", "photos/22", "photos/23" };
                foreach (var col in galleryColumns)
                {
                    if (table.Columns.Contains(col))
                    {
                        var imageUrl = row[col]?.ToString();
                        if (!string.IsNullOrWhiteSpace(imageUrl))
                        {
                            images.Add(new LocationImage
                            {
                                LocationID = location.LocationID,
                                ImageURL = imageUrl.Trim()
                            });
                        }
                    }
                }
            }

            await context.LocationImages.AddRangeAsync(images);
            await context.SaveChangesAsync();

            Console.WriteLine($"🍽️ {table.Rows.Count} restaurants and {images.Count} images seeded from Restaurants.xlsx");
        }

        public static async Task ImportCafes(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            if (await context.Locations.AnyAsync(l => l.Category == "Cafe"))
            {
                Console.WriteLine("Cafes already seeded. Skipping.");
                return;
            }
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "cairo_cafes_cleaned.xlsx");

            using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            using var reader = ExcelReaderFactory.CreateReader(stream);

            var config = new ExcelDataSetConfiguration
            {
                ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
            };

            var dataSet = reader.AsDataSet(config);
            var table = dataSet.Tables[0];
            var cafes = new List<Location>();
            var images = new List<LocationImage>();

            foreach (DataRow row in table.Rows)
            {
                var name = row["name"]?.ToString();
                var address = row["address"]?.ToString();
                var desc = row["description"]?.ToString();
                var rating = row["rating"]?.ToString();
                var price = row["priceLevel"]?.ToString();
                var hours = row["opening_hours_text"]?.ToString();
                var lat = row["latitude"] != DBNull.Value ? Convert.ToDouble(row["latitude"]) : 0;
                var lng = row["longitude"] != DBNull.Value ? Convert.ToDouble(row["longitude"]) : 0;
                var website = row["website"]?.ToString();
                var image = row.Table.Columns.Contains("image") ? row["image"]?.ToString() : null;

                var fullDescription = $"Rating: {rating} | Price: {price}\nHours: {hours}\n\n{desc}";

                var location = new Location
                {
                    Name = name,
                    Address = address,
                    Category = "Cafe",
                    ShortDescription = desc,
                    FullDescription = fullDescription,
                    VisitingHours = hours,
                    DetailURL = website,
                    GoogleMapsLink = "",
                    ImageURL = "",
                    Attributes = rating,
                    Latitude = lat,
                    Longitude = lng
                };

                context.Locations.Add(location);
                await context.SaveChangesAsync();

                if (!string.IsNullOrWhiteSpace(image))
                {
                    images.Add(new LocationImage
                    {
                        LocationID = location.LocationID,
                        ImageURL = image.Trim()
                    });
                }
            }

            await context.LocationImages.AddRangeAsync(images);
            await context.SaveChangesAsync();

            Console.WriteLine($"☕ {table.Rows.Count} cafes and {images.Count} images seeded from cairo_cafes_cleaned.xlsx");
        }



        public static async Task ImportLocationImages(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            if (await context.LocationImages.AnyAsync())
            {
                Console.WriteLine("🖼️ Location images already seeded. Skipping.");
                return;
            }

            int addedImages = 0;

            // 🔹 Part 1: Landmarks
            var landmarkPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "Landmarks.xlsx");
            using var lStream = new FileStream(landmarkPath, FileMode.Open, FileAccess.Read);
            using var lReader = ExcelReaderFactory.CreateReader(lStream);

            var lDataSet = lReader.AsDataSet(new ExcelDataSetConfiguration
            {
                ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
            });

            foreach (DataRow row in lDataSet.Tables[0].Rows)
            {
                var name = row["Name"]?.ToString();
                var gallery = row["Gallery_Images"]?.ToString();

                var location = await context.Locations.FirstOrDefaultAsync(l => l.Name.Trim().ToLower() == name.Trim().ToLower());
                if (location != null && !string.IsNullOrWhiteSpace(gallery))
                {
                    var cleaned = gallery.Replace("[", "").Replace("]", "").Replace("'", "").Trim();
                    var images = cleaned.Split(',', StringSplitOptions.RemoveEmptyEntries);

                    foreach (var img in images)
                    {
                        context.LocationImages.Add(new LocationImage
                        {
                            LocationID = location.LocationID,
                            ImageURL = img.Trim()
                        });
                        addedImages++;
                    }
                }
            }

            // 🔹 Part 2: Hotels
            // 🔹 Part 2: Hotels
            var hotelPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "Cairo_Hotels_Updated_Addresses.xlsx");
            using var hStream = new FileStream(hotelPath, FileMode.Open, FileAccess.Read);
            using var hReader = ExcelReaderFactory.CreateReader(hStream);

            var hDataSet = hReader.AsDataSet(new ExcelDataSetConfiguration
            {
                ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
            });

            foreach (DataRow row in hDataSet.Tables[0].Rows)
            {
                var name = row["hotel_name"]?.ToString();
                if (string.IsNullOrWhiteSpace(name)) continue;

                var location = await context.Locations.FirstOrDefaultAsync(
                    l => l.Name.Trim().ToLower() == name.Trim().ToLower());

                if (location != null)
                {
                    // ✅ Update address if available
                    var updatedAddress = row["address"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(updatedAddress))
                    {
                        location.Address = updatedAddress.Trim();
                    }

                    var img1 = row["image_1"]?.ToString();
                    var img2 = row["image_2"]?.ToString();

                    if (!string.IsNullOrWhiteSpace(img1))
                    {
                        context.LocationImages.Add(new LocationImage
                        {
                            LocationID = location.LocationID,
                            ImageURL = img1.Trim()
                        });
                        addedImages++;
                    }

                    if (!string.IsNullOrWhiteSpace(img2))
                    {
                        context.LocationImages.Add(new LocationImage
                        {
                            LocationID = location.LocationID,
                            ImageURL = img2.Trim()
                        });
                        addedImages++;
                    }
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"🖼️ {addedImages} total images seeded.");
        }



        public static async Task SeedAdminUser(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            string email = "admin@example.com";
            string password = "Admin@123";

            if (await userManager.FindByEmailAsync(email) == null)
            {
                var user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    Console.WriteLine("✅ Admin user created successfully.");
                }
                else
                {
                    Console.WriteLine("❌ Failed to create admin user:");
                    foreach (var error in result.Errors)
                        Console.WriteLine($"- {error.Description}");
                }
            }
            else
            {
                Console.WriteLine("ℹ️ Admin user already exists.");
            }
        }

        private static (double lat, double lng) GetEstimatedCoordinates(Location location)
        {
            var address = location.Address?.ToLower() ?? "";
            var category = location.Category?.ToLower() ?? "";

            if (address.Contains("giza") || category.Contains("pyramid"))
                return (29.9773, 31.1325);
            if (address.Contains("zamalek"))
                return (30.0582, 31.2190);
            if (address.Contains("coptic") || category.Contains("church"))
                return (30.0061, 31.2306);
            if (address.Contains("khan") || category.Contains("market"))
                return (30.0478, 31.2625);
            if (category.Contains("mosque"))
                return (30.0444, 31.2357);
            if (category.Contains("museum"))
                return (30.0459, 31.2243);
            if (category.Contains("hotel"))
                return (30.0500, 31.2333);

            return (30.033, 31.233);
        }

        private static string ClassifyCategory(string name, string shortDesc, string fullDesc)
        {
            var text = $"{name ?? ""} {shortDesc ?? ""} {fullDesc ?? ""}".ToLower();

            if (text.Contains("mosque"))
                return "Mosque";
            if (text.Contains("church"))
                return "Church";
            if (text.Contains("palace"))
                return "Palace";
            if (text.Contains("museum"))
                return "Museum";
            if (text.Contains("shrine"))
                return "Shrine";
            if (text.Contains("castle") || text.Contains("citadel"))
                return "Fortress";
            if (text.Contains("school") || text.Contains("madrasa"))
                return "School";
            if (text.Contains("fountain") || text.Contains("sabil"))
                return "Fountain";
            if (text.Contains("bazaar") || text.Contains("market") || text.Contains("khan") || text.Contains("souq"))
                return "Market";

            return "Historical";
        }
    }
}
    