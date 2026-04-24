package com.ticops.service;

import com.ticops.dto.DashboardMetricsDto;
import com.ticops.dto.DashboardMetricsDto.DistItem;
import com.ticops.dto.DashboardSummaryDto;
import com.ticops.entity.Ticket;
import com.ticops.entity.TicketStatus;
import com.ticops.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        List<Ticket> all = ticketRepository.findAll();

        long total = all.size();
        long open = all.stream().filter(t ->
                t.getStatus() == TicketStatus.OPEN ||
                t.getStatus() == TicketStatus.ASSIGNED ||
                t.getStatus() == TicketStatus.IN_PROGRESS ||
                t.getStatus() == TicketStatus.ON_HOLD ||
                t.getStatus() == TicketStatus.REOPENED).count();
        long overdue = all.stream().filter(t -> Boolean.TRUE.equals(t.getIsOverdue())).count();

        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long resolvedThisWeek = all.stream()
                .filter(t -> t.getResolvedAt() != null && t.getResolvedAt().isAfter(weekAgo))
                .count();

        double avgAge = all.stream()
                .mapToLong(t -> Duration.between(t.getCreatedAt(), Instant.now()).toHours())
                .average().orElse(0);

        double avgResolution = all.stream()
                .filter(t -> t.getResolvedAt() != null)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toHours())
                .average().orElse(0);

        return DashboardSummaryDto.builder()
                .totalTickets(total)
                .openTickets(open)
                .overdueTickets(overdue)
                .resolvedThisWeek(resolvedThisWeek)
                .averageAgeHours(Math.round(avgAge * 10.0) / 10.0)
                .averageResolutionHours(Math.round(avgResolution * 10.0) / 10.0)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardMetricsDto getMetrics() {
        List<Ticket> all = ticketRepository.findAll();

        List<DistItem> byStatus = Arrays.stream(TicketStatus.values())
                .map(s -> new DistItem(s.name(), all.stream().filter(t -> t.getStatus() == s).count()))
                .filter(d -> d.getValue() > 0)
                .collect(Collectors.toList());

        List<DistItem> byPriority = all.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new DistItem(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        List<DistItem> byOwner = all.stream()
                .filter(t -> t.getAssignee() != null)
                .collect(Collectors.groupingBy(t -> t.getAssignee().getName(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new DistItem(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        List<DistItem> sourceMix = all.stream()
                .collect(Collectors.groupingBy(t -> t.getSource().name(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new DistItem(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return DashboardMetricsDto.builder()
                .byStatus(byStatus)
                .byPriority(byPriority)
                .byOwner(byOwner)
                .sourceMix(sourceMix)
                .build();
    }
}
