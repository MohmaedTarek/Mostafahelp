namespace FinalProjectTest.Models
{
    public class Recommendation
    {
        public int RecommendationID { get; set; } // Primary Key
        public string Reason { get; set; }

        // Foreign Keys
        public string UserID { get; set; }
        public ApplicationUser? User { get; set; } // Navigation property

        public int LocationID { get; set; }
        public Location? Location { get; set; } // Navigation property
    }

}
