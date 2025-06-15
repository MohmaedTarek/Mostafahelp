using CsvHelper.Configuration.Attributes;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace FinalProjectTest.Models
{
    public class Location
    {
        public int LocationID { get; set; }
        
        [Name("Name")]
        public string Name { get; set; }

        [Name("Location")]
        public string Address { get; set; }
        public string Category { get; set; }

        [Display(Name = "Rating")]
        public string Attributes { get; set; }
        public double ProximityScore { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? GoogleMapsLink { get; set; }
        [NotMapped]
        public double? DistanceInKm { get; set; }




        [Name("Image_Url")]
        public string? ImageURL { get; set; }
        
        [Name("Detail_Url")]
        public string? DetailURL { get; set; }

        [Name("Visiting_Hours")]
        public string? VisitingHours { get; set; }

        [Name("Short_Description")]
        public string? ShortDescription { get; set; }

        [Name("Full_Description")]
        public string? FullDescription { get; set; }
        public ICollection<LocationImage> Images { get; set; }

        public ICollection<Recommendation>? Recommendations { get; set; }
        public ICollection<Feedback>? Feedbacks { get; set; }
    }

}
