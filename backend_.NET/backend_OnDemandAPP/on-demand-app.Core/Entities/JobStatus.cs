namespace OnDemandApp.Core.Entities
{
    public enum JobStatus
    {
        Pending = 1,   
        Assigned = 2,   
        InProgress = 3, 
        Completed = 4,  
        Cancelled = 5,
        Rejected = 6,
        Confirmed = 7   
    }
}