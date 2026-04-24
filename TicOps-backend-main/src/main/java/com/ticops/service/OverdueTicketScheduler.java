package com.ticops.service;

import com.ticops.entity.Ticket;
import com.ticops.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueTicketScheduler {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    /** Runs every 5 minutes — flags overdue tickets and notifies assignees. */
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void flagOverdueTickets() {
        List<Ticket> overdue = ticketRepository.findNewlyOverdue(Instant.now());
        for (Ticket ticket : overdue) {
            ticket.setIsOverdue(true);
            ticketRepository.save(ticket);

            if (ticket.getAssignee() != null) {
                notificationService.createNotification(ticket.getAssignee(),
                        "Ticket " + ticket.getTicketNumber() + " is now overdue",
                        "/tickets/" + ticket.getId());
            }

            log.info("Flagged ticket {} as overdue", ticket.getTicketNumber());
        }
        if (!overdue.isEmpty()) {
            log.info("Flagged {} ticket(s) as overdue", overdue.size());
        }
    }
}
