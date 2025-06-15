namespace FinalProjectTest.Models
{
    public class ChatbotInteraction
    {
        public int ChatbotInteractionID { get; set; } // Primary Key
        public DateTime Timestamp { get; set; }
        public int Rating { get; set; } // Rating of the interaction, if applicable

        // Foreign Key
        public string UserID { get; set; }
        public ApplicationUser? User { get; set; } // Navigation property
    }

}
