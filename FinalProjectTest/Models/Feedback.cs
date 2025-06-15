namespace FinalProjectTest.Models
{
    public class Feedback
    {
        public int FeedbackID { get; set; } // Primary Key
        public string Description { get; set; }
        public DateTime Timestamp { get; set; }

        // Foreign Keys
        public string UserID { get; set; }
        public ApplicationUser? User { get; set; } // Navigation property

        public int LocationID { get; set; }
        public Location? Location { get; set; } // Navigation property
    }

}
