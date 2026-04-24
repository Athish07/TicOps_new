package com.ticops.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class DashboardMetricsDto {
    private List<DistItem> byStatus;
    private List<DistItem> byPriority;
    private List<DistItem> byOwner;
    private List<DistItem> sourceMix;

    @Data @AllArgsConstructor
    public static class DistItem {
        private String label;
        private long value;
    }
}
