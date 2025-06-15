using FinalProjectTest.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinalProjectTest.Models
{
    public class HotelDetails
    {
        [Key]
        public int HotelDetailID { get; set; }

        [ForeignKey("Location")]
        public int LocationID { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? PricePerNight { get; set; }

        public string Currency { get; set; } = "EGP";

        public int PriceLevel { get; set; } = 2; // 1-4 scale

        [Column(TypeName = "decimal(3,1)")]
        public decimal? Rating { get; set; } // 0-10 scale

        public int? ReviewCount { get; set; }

        public string? RoomType { get; set; }

        public string? Amenities { get; set; }

        public string? BookingLink { get; set; }

        public string OpenStatus { get; set; } = "Open Now";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual Location Location { get; set; }
    }
}
