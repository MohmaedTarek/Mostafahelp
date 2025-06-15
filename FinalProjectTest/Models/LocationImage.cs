using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace FinalProjectTest.Models
{
    public class LocationImage
    {
        [Key]
        public int ImageID { get; set; }

        [Required]
        public string ImageURL { get; set; }

        [ForeignKey("Location")]
        public int LocationID { get; set; }

        [JsonIgnore]
        public Location Location { get; set; }
    }
}
