using FinalProjectTest.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    // Define DbSet properties for each entity
    public DbSet<ApplicationUser> Users { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<Recommendation> Recommendations { get; set; }
    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<ChatbotInteraction> ChatbotInteractions { get; set; }
    public DbSet<Favorite> Favorites { get; set; }
    public DbSet<LocationImage> LocationImages { get; set; }
    public DbSet<UserInteraction> UserInteractions { get; set; }
    public DbSet<HotelDetails> HotelDetails { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HotelDetails>()
           .HasOne(h => h.Location)
           .WithMany()
           .HasForeignKey(h => h.LocationID)
           .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<HotelDetails>()
            .HasIndex(h => h.LocationID)
            .IsUnique(); // One hotel detail per location
        // User-Recommendation (1:Many)
        modelBuilder.Entity<Recommendation>()
            .HasOne(r => r.User)
            .WithMany(u => u.Recommendations)
            .HasForeignKey(r => r.UserID);
        // Recommendation-Location (Many:1)
        modelBuilder.Entity<Recommendation>()
            .HasOne(r => r.Location)
            .WithMany(l => l.Recommendations)
            .HasForeignKey(r => r.LocationID);
        // User-Feedback (1:Many)
        modelBuilder.Entity<Feedback>()
            .HasOne(f => f.User)
            .WithMany(u => u.Feedbacks)
            .HasForeignKey(f => f.UserID);
        // Feedback-Location (Many:1)
        modelBuilder.Entity<Feedback>()
            .HasOne(f => f.Location)
            .WithMany(l => l.Feedbacks)
            .HasForeignKey(f => f.LocationID);
        // User-ChatbotInteraction (1:Many)
        modelBuilder.Entity<ChatbotInteraction>()
            .HasOne(ci => ci.User)
            .WithMany(u => u.ChatbotInteractions)
            .HasForeignKey(ci => ci.UserID);
        modelBuilder.Entity<Favorite>()
        .HasKey(f => f.FavoriteID);
        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserID);
        modelBuilder.Entity<Favorite>()
            .HasOne(f => f.Location)
            .WithMany()
            .HasForeignKey(f => f.LocationID);

        base.OnModelCreating(modelBuilder);
    }
}