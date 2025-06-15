namespace FinalProjectTest.Models
{
    public class UserInteraction
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int LocationID { get; set; }
        public Location Location { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Type { get; set; } // e.g., "view", "favorite"
    }

}
