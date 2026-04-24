package com.ticops.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class DashboardSummaryDto {
    private long totalTickets;
    private long openTickets;
    private long overdueTickets;
    private long resolvedThisWeek;
    private double averageAgeHours;
    private double averageResolutionHours;
}
