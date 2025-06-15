using System.ComponentModel.DataAnnotations;

namespace FinalProjectTest.Models
{
    public class Favorite
    {
        public int FavoriteID { get; set; }

        public string UserID { get; set; }
        public ApplicationUser User { get; set; }

        public int LocationID { get; set; }
        public Location Location { get; set; }
    }
}
