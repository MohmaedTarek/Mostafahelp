using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Security.Claims;
using FinalProjectTest.Models;
using FinalProjectTest.Data;

[Route("AI")]
public class AIController : Controller
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AIController(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("Chat")]
    public IActionResult Chat()
    {
        return View();
    }

    // Enhanced Ask endpoint with smart routing
    [HttpPost("Ask")]
    public async Task<IActionResult> Ask([FromBody] ChatRequest request)
    {
        var apiKey = _config["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(request?.Question))
            return BadRequest("Question is empty.");

        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Analyze query type
            var queryAnalysis = AnalyzeQuery(request.Question);

            string aiResponse = "";
            List<object> databasePlaces = new List<object>();

            // Handle based on query type
            if (queryAnalysis.UseAIOnly)
            {
                // AI-only for directions, transportation, general questions
                aiResponse = await GetEnhancedAIResponse(request.Question, apiKey, "general");
            }
            else
            {
                // Place queries - get both AI response and database results
                aiResponse = await GetEnhancedAIResponse(request.Question, apiKey, "places");
                databasePlaces = await GetPlacesWithImages(request.Question, queryAnalysis.Category);
            }

            // Save interaction
            if (!string.IsNullOrEmpty(userId))
            {
                await SaveChatbotInteraction(userId, 5);
            }

            return Json(new
            {
                answer = aiResponse,
                places = databasePlaces,
                success = true,
                queryType = queryAnalysis
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Ask method: {ex.Message}");
            return Json(new
            {
                answer = "I'm having trouble right now, but I'm here to help with Cairo travel questions!",
                places = new List<object>(),
                success = false
            });
        }
    }

    // AI-only endpoint for smart queries
    [HttpPost("AskAI")]
    public async Task<IActionResult> AskAI([FromBody] AIOnlyRequest request)
    {
        var apiKey = _config["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(request?.Question))
            return BadRequest("Question is empty.");

        try
        {
            var aiResponse = await GetEnhancedAIResponse(request.Question, apiKey, "detailed");

            return Json(new
            {
                answer = aiResponse,
                success = true
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in AskAI: {ex.Message}");
            return Json(new
            {
                answer = GetSmartFallbackResponse(request.Question),
                success = true
            });
        }
    }

    // Strict category filtering endpoint
    [HttpPost("GetPlacesByCategory")]
    public async Task<IActionResult> GetPlacesByCategory([FromBody] CategoryRequest request)
    {
        try
        {
            var places = await GetPlacesByCategoryStrict(request.Category);

            return Json(new
            {
                places = places,
                success = true,
                category = request.Category
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting places by category: {ex.Message}");
            return Json(new
            {
                places = new List<object>(),
                success = false,
                error = ex.Message
            });
        }
    }

    // Analyze query to determine routing strategy - FIXED
    private QueryAnalysis AnalyzeQuery(string question)
    {
        var lowerQuestion = question.ToLower();

        // Place-related keywords that should ALWAYS show database results
        var placeKeywords = new[]
        {
            "restaurant", "restaurants", "food", "eat", "dining", "meal", "lunch", "dinner", "cuisine",
            "hotel", "hotels", "stay", "accommodation", "sleep", "lodge", "resort",
            "cafe", "cafes", "coffee", "cappuccino", "espresso", "latte", "tea",
            "monument", "monuments", "attraction", "attractions", "visit", "tourist", "sightseeing",
            "pyramid", "pyramids", "museum", "museums", "mosque", "mosques", "church", "churches",
            "show me", "find", "list", "places", "spots", "where can i", "i want", "looking for"
        };

        // Pure AI-only keywords (no places involved)
        var aiOnlyKeywords = new[]
        {
            "how to get", "direction", "how do i get", "how can i reach", "how to reach",
            "transportation", "transport", "taxi", "uber", "careem", "metro", "bus", "train",
            "airport", "flight", "parking", "traffic", "route", "travel time", "distance",
            "weather", "safety", "tips", "advice", "currency", "language", "customs", "tradition",
            "what time", "when does", "why", "what is", "tell me about", "explain", "culture", "history"
        };

        // Check if it's a place-related query first (priority)
        bool isPlaceQuery = placeKeywords.Any(keyword => lowerQuestion.Contains(keyword));

        if (isPlaceQuery)
        {
            // Determine specific category
            if (ContainsKeywords(lowerQuestion, new[] { "restaurant", "restaurants", "food", "eat", "dining", "meal", "lunch", "dinner", "cuisine" }))
            {
                return new QueryAnalysis { UseAIOnly = false, Category = "Restaurant" };
            }
            else if (ContainsKeywords(lowerQuestion, new[] { "hotel", "hotels", "stay", "accommodation", "sleep", "lodge", "resort" }))
            {
                return new QueryAnalysis { UseAIOnly = false, Category = "Hotel" };
            }
            else if (ContainsKeywords(lowerQuestion, new[] { "cafe", "cafes", "coffee", "cappuccino", "espresso", "latte", "tea" }))
            {
                return new QueryAnalysis { UseAIOnly = false, Category = "Cafe" };
            }
            else if (ContainsKeywords(lowerQuestion, new[] { "monument", "monuments", "attraction", "attractions", "visit", "tourist", "sightseeing", "pyramid", "pyramids", "museum", "museums", "mosque", "mosques", "church", "churches" }))
            {
                return new QueryAnalysis { UseAIOnly = false, Category = "Monument" };
            }
            else
            {
                // General place query - no specific category
                return new QueryAnalysis { UseAIOnly = false, Category = null };
            }
        }

        // Check for pure AI-only queries
        bool isAIOnly = aiOnlyKeywords.Any(keyword => lowerQuestion.Contains(keyword));

        if (isAIOnly)
        {
            return new QueryAnalysis { UseAIOnly = true, Category = null };
        }

        // Default to showing places for ambiguous queries
        return new QueryAnalysis { UseAIOnly = false, Category = null };
    }

    private bool ContainsKeywords(string text, string[] keywords)
    {
        return keywords.Any(keyword => text.Contains(keyword));
    }

    // Enhanced AI response with context-aware prompts
    private async Task<string> GetEnhancedAIResponse(string question, string apiKey, string responseType)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return GetSmartFallbackResponse(question);
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            string systemPrompt = GetSystemPrompt(responseType);
            int maxTokens = responseType == "detailed" ? 200 : 100;

            var payload = new
            {
                model = "gpt-3.5-turbo",
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = question }
                },
                max_tokens = maxTokens,
                temperature = 0.7
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://api.openai.com/v1/chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"AI API error: {response.StatusCode}");
            }

            var raw = await response.Content.ReadAsStringAsync();
            var jsonDoc = JsonDocument.Parse(raw);

            return jsonDoc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AI API Error: {ex.Message}");
            return GetSmartFallbackResponse(question);
        }
    }

    // Context-aware system prompts - FIXED
    private string GetSystemPrompt(string responseType)
    {
        return responseType switch
        {
            "general" => @"You are a Cairo travel expert assistant. Provide helpful, accurate information about:
                - Directions and transportation (taxis, Uber, Careem, Metro, buses)
                - Travel costs and budgeting
                - Cultural tips and local customs
                - Safety advice and best practices
                - Weather and timing recommendations
                Keep responses under 80 words and be specific to Cairo, Egypt.",

            "detailed" => @"You are an expert Cairo travel consultant. Provide detailed, practical advice about Cairo including:
                - Comprehensive transportation options and routes
                - Detailed cost breakdowns and budgeting tips  
                - Cultural insights and local customs
                - Safety recommendations and areas to avoid/embrace
                - Best times to visit attractions and navigate the city
                - Local etiquette and language tips
                Be specific, practical, and informative. Keep responses under 150 words.",

            "places" => @"You are a Cairo tourism assistant helping users find places. For place-related queries:
                - Give a very brief, helpful intro (1-2 sentences max)
                - ALWAYS end with: 'Here are some options from our database:'
                - DO NOT list specific place names or give detailed recommendations
                - DO NOT provide long descriptions about places
                - Keep total response under 30 words
                - Your job is to introduce the database results, not replace them
                Example responses:
                'Great choice! Here are some restaurants in that area from our database:'
                'I found several hotels for you. Here are some options from our database:'",

            _ => @"You are a helpful Cairo travel assistant. Provide concise, accurate information about Cairo, Egypt."
        };
    }

    // Get places with images from LocationImages table - FIXED
    private async Task<List<object>> GetPlacesWithImages(string question, string categoryFilter)
    {
        var places = new List<object>();

        try
        {
            var lowerQuestion = question.ToLower();

            // Query with proper LocationImages join
            var query = from location in _context.Locations
                        join image in _context.LocationImages
                        on location.LocationID equals image.LocationID into locationImages
                        from firstImage in locationImages.Take(1).DefaultIfEmpty()
                        select new { location, firstImage };

            // Apply strict category filtering
            if (!string.IsNullOrEmpty(categoryFilter))
            {
                query = query.Where(x => x.location.Category.ToLower() == categoryFilter.ToLower());
                Console.WriteLine($"Filtering for category: {categoryFilter}");
            }
            else
            {
                // Apply general filtering based on question content
                if (ContainsKeywords(lowerQuestion, new[] { "restaurant", "food", "eat", "dining" }))
                {
                    query = query.Where(x => x.location.Category.ToLower() == "restaurant");
                }
                else if (ContainsKeywords(lowerQuestion, new[] { "hotel", "stay", "accommodation" }))
                {
                    query = query.Where(x => x.location.Category.ToLower() == "hotel");
                }
                else if (ContainsKeywords(lowerQuestion, new[] { "cafe", "coffee" }))
                {
                    query = query.Where(x => x.location.Category.ToLower() == "cafe");
                }
                else if (ContainsKeywords(lowerQuestion, new[] { "monument", "attraction", "tourist" }))
                {
                    query = query.Where(x => x.location.Category.ToLower() != "restaurant" &&
                                           x.location.Category.ToLower() != "hotel" &&
                                           x.location.Category.ToLower() != "cafe");
                }
            }

            // Apply location filtering
            if (lowerQuestion.Contains("zamalek"))
            {
                query = query.Where(x => x.location.Address.ToLower().Contains("zamalek"));
            }
            else if (lowerQuestion.Contains("maadi"))
            {
                query = query.Where(x => x.location.Address.ToLower().Contains("maadi"));
            }
            else if (lowerQuestion.Contains("giza"))
            {
                query = query.Where(x => x.location.Address.ToLower().Contains("giza"));
            }
            else if (lowerQuestion.Contains("downtown"))
            {
                query = query.Where(x => x.location.Address.ToLower().Contains("downtown"));
            }

            // Get results with first image
            var results = await query
                .Where(x => !string.IsNullOrEmpty(x.location.Address))
                .Take(6)
                .ToListAsync();

            Console.WriteLine($"Found {results.Count} places matching criteria");

            // Transform results with first image
            places = results.Select(result => new
            {
                id = result.location.LocationID,
                name = result.location.Name ?? "Unnamed Place",
                address = result.location.Address ?? "Cairo, Egypt",
                category = GetFrontendCategory(result.location.Category),
                rating = TryParseRating(result.location.Attributes),
                visitingHours = result.location.VisitingHours ?? "Check locally for hours",
                googleMapsLink = result.location.GoogleMapsLink,
                shortDescription = result.location.ShortDescription ?? $"A wonderful {GetFrontendCategory(result.location.Category).TrimEnd('s')} in Cairo",
                fullDescription = result.location.FullDescription ?? $"Visit {result.location.Name}, located at {result.location.Address}. A great place to experience Cairo.",
                detailURL = result.location.DetailURL,
                // Get first image from LocationImages table
                imageUrl = result.firstImage?.ImageURL,
                firstImage = result.firstImage?.ImageURL,
                hasImage = result.firstImage != null
            }).Cast<object>().ToList();

            // Log results for debugging
            foreach (var place in places.Take(3))
            {
                var placeObj = place as dynamic;
                Console.WriteLine($"Place: {placeObj.name}, Category: {placeObj.category}, Has Image: {placeObj.hasImage}");
                if (placeObj.hasImage)
                {
                    Console.WriteLine($"Image URL: {placeObj.imageUrl}");
                }
            }

        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting places with images: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }

        return places;
    }

    // Strict category filtering with LocationImages - FIXED
    private async Task<List<object>> GetPlacesByCategoryStrict(string category)
    {
        try
        {
            // Query with proper LocationImages join
            var query = from location in _context.Locations
                        join image in _context.LocationImages
                        on location.LocationID equals image.LocationID into locationImages
                        from firstImage in locationImages.Take(1).DefaultIfEmpty()
                        where !string.IsNullOrEmpty(location.Address)
                        select new { location, firstImage };

            // Apply strict category filtering
            if (category.ToLower() == "monument")
            {
                query = query.Where(x => x.location.Category.ToLower() != "restaurant" &&
                                   x.location.Category.ToLower() != "hotel" &&
                                   x.location.Category.ToLower() != "cafe");
            }
            else
            {
                query = query.Where(x => x.location.Category.ToLower() == category.ToLower());
            }

            var results = await query.Take(6).ToListAsync();

            Console.WriteLine($"Strict filtering for {category}: Found {results.Count} places");

            return results.Select(result => new
            {
                id = result.location.LocationID,
                name = result.location.Name ?? "Unnamed Place",
                address = result.location.Address ?? "Cairo, Egypt",
                category = GetFrontendCategory(result.location.Category),
                rating = TryParseRating(result.location.Attributes),
                visitingHours = result.location.VisitingHours ?? "Check locally for hours",
                googleMapsLink = result.location.GoogleMapsLink,
                shortDescription = result.location.ShortDescription ?? $"A wonderful {GetFrontendCategory(result.location.Category).TrimEnd('s')} in Cairo",
                fullDescription = result.location.FullDescription ?? $"Visit {result.location.Name}, located at {result.location.Address}.",
                detailURL = result.location.DetailURL,
                imageUrl = result.firstImage?.ImageURL,
                firstImage = result.firstImage?.ImageURL,
                hasImage = result.firstImage != null
            }).Cast<object>().ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in strict category filtering: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return new List<object>();
        }
    }

    private string GetFrontendCategory(string backendCategory)
    {
        if (string.IsNullOrEmpty(backendCategory)) return "monuments";

        return backendCategory.ToLower() switch
        {
            "hotel" => "hotels",
            "restaurant" => "restaurants",
            "cafe" => "cafes",
            _ => "monuments"
        };
    }

    private double TryParseRating(string attributes)
    {
        if (double.TryParse(attributes, out var rating))
        {
            return Math.Round(Math.Max(1.0, Math.Min(5.0, rating)), 1);
        }
        return 4.5;
    }

    // Smart fallback responses - FIXED
    private string GetSmartFallbackResponse(string question)
    {
        var lowerQuestion = question.ToLower();

        // For place-related queries, always redirect to database
        if (ContainsKeywords(lowerQuestion, new[] { "restaurant", "restaurants", "food", "eat", "dining" }))
        {
            if (lowerQuestion.Contains("maadi"))
                return "Here are some restaurants in Maadi from our database:";
            else if (lowerQuestion.Contains("zamalek"))
                return "Here are some restaurants in Zamalek from our database:";
            else if (lowerQuestion.Contains("giza"))
                return "Here are some restaurants in Giza from our database:";
            else if (lowerQuestion.Contains("downtown"))
                return "Here are some restaurants in Downtown Cairo from our database:";
            else
                return "Here are some restaurants in Cairo from our database:";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "hotel", "hotels", "stay" }))
        {
            if (lowerQuestion.Contains("maadi"))
                return "Here are some hotels in Maadi from our database:";
            else if (lowerQuestion.Contains("zamalek"))
                return "Here are some hotels in Zamalek from our database:";
            else if (lowerQuestion.Contains("giza"))
                return "Here are some hotels in Giza from our database:";
            else
                return "Here are some hotels in Cairo from our database:";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "cafe", "cafes", "coffee" }))
        {
            if (lowerQuestion.Contains("maadi"))
                return "Here are some cafes in Maadi from our database:";
            else if (lowerQuestion.Contains("zamalek"))
                return "Here are some cafes in Zamalek from our database:";
            else
                return "Here are some cafes in Cairo from our database:";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "monument", "monuments", "attraction", "attractions" }))
        {
            return "Here are some attractions in Cairo from our database:";
        }

        // For non-place queries, provide helpful information
        else if (ContainsKeywords(lowerQuestion, new[] { "direction", "how to get", "reach" }))
        {
            return "For directions in Cairo, use Google Maps or ask locals. Traffic peaks 7-10 AM and 4-8 PM. Metro is often faster than cars. Allow extra time for travel.";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "transport", "taxi", "uber", "metro" }))
        {
            return "Cairo transport options: Regular taxis (negotiate fare), Uber/Careem (fixed pricing), Metro (3 lines, 5-7 EGP), buses, or walking. Metro is most reliable.";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "cost", "price", "expensive", "cheap" }))
        {
            return "Cairo costs: Budget meals 20-50 EGP, mid-range 100-200 EGP, luxury 300+ EGP. Short taxi rides 10-50 EGP. Metro 5-7 EGP. Hotels vary widely.";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "airport", "flight" }))
        {
            return "From Cairo Airport: Metro Line 3 to city center (cheapest), taxis 30-60 min (traffic dependent), or Uber/Careem. Airport Express bus also available.";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "safety", "safe", "dangerous" }))
        {
            return "Cairo is generally safe for tourists. Stay alert in crowded areas, keep valuables secure, use official taxis, and respect local customs. Tourist police are helpful.";
        }
        else if (ContainsKeywords(lowerQuestion, new[] { "tip", "advice", "recommend" }))
        {
            return "Cairo tips: Learn basic Arabic phrases, carry small bills, negotiate prices, dress modestly, stay hydrated, and be patient with traffic. Locals are friendly!";
        }
        else
        {
            return "I'm here to help with Cairo travel! Ask me about directions, transportation, costs, places to visit, or anything about exploring Cairo.";
        }
    }

    private async Task<int> SaveChatbotInteraction(string userId, int rating = 5)
    {
        try
        {
            var interaction = new ChatbotInteraction
            {
                UserID = userId,
                Timestamp = DateTime.UtcNow,
                Rating = rating
            };

            _context.ChatbotInteractions.Add(interaction);
            await _context.SaveChangesAsync();

            return interaction.ChatbotInteractionID;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving interaction: {ex.Message}");
            return 0;
        }
    }
}

// Request models
public class ChatRequest
{
    public string Question { get; set; }
    public string CategoryFilter { get; set; }
}

public class AIOnlyRequest
{
    public string Question { get; set; }
    public bool UseAIOnly { get; set; } = true;
}

public class CategoryRequest
{
    public string Category { get; set; }
    public bool StrictFiltering { get; set; } = true;
}

// Analysis model
public class QueryAnalysis
{
    public bool UseAIOnly { get; set; }
    public string Category { get; set; }
}