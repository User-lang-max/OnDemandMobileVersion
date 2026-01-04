using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; 

namespace OnDemandApp.Core.Entities;

public class ProviderProfile
{
    public Guid UserId { get; set; }
    [ForeignKey("UserId")]
    public User User { get; set; } = default!;

    // Champs Métier
    public bool IsAvailable { get; set; } = false; 
    public decimal RayonKm { get; set; } = 20m;
    public decimal TarifKm { get; set; } = 2m;
    public decimal ObjectifMensuelCA { get; set; } = 0m;
    public decimal CAMoisCourant { get; set; } = 0m;

    // --- DOSSIER CANDIDATURE ---
    public string? Zones { get; set; }
    public string? Bio { get; set; }
    public string Address { get; set; } = string.Empty;
    public decimal Lat { get; set; } 
    public decimal Lng { get; set; }

    // --- FICHIERS ---
    public string? PhotoUrl { get; set; }
    public string? CvUrl { get; set; }

  
    public decimal? LastLat { get; set; }
    public decimal? LastLng { get; set; }
    public string? ScheduleJson { get; set; }

    // --- TRACKING LIVE (VOS CHAMPS) ---
    public decimal? CurrentLat { get; set; }
    public decimal? CurrentLng { get; set; }

    // --- AVIS ---
   
    public string? ReviewComment { get; set; }

    // --- ONBOARDING ---
    public DateTime? InterviewDate { get; set; }
    public bool IsOnboardingCompleted { get; set; } = false;

    // --- METADATA ---
    public DateTime? ScheduledAt { get; set; }

  
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ProviderCategory Category { get; set; }

    [JsonIgnore]
    public ICollection<ProviderService> Services { get; set; } = new List<ProviderService>();
}