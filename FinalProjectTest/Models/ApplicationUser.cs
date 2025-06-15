using Microsoft.AspNetCore.Identity;
namespace FinalProjectTest.Models
{
    public class ApplicationUser : IdentityUser
    {

        public ICollection<Recommendation>? Recommendations { get; set; }
        public ICollection<Feedback>? Feedbacks { get; set; }
        public ICollection<ChatbotInteraction>? ChatbotInteractions { get; set; }
    }
}