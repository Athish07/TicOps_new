package com.ticops.controller;

import com.ticops.dto.DashboardMetricsDto;
import com.ticops.dto.DashboardSummaryDto;
import com.ticops.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> summary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDto> metrics() {
        return ResponseEntity.ok(dashboardService.getMetrics());
    }
}
