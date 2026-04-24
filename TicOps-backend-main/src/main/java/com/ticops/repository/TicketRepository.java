package com.ticops.repository;

import com.ticops.entity.Ticket;
import com.ticops.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    Optional<Ticket> findByTicketNumber(String ticketNumber);

    long countByStatusIn(List<TicketStatus> statuses);

    long countByIsOverdueTrue();

    long countByResolvedAtAfter(Instant since);

    @Query("SELECT t FROM Ticket t WHERE t.status <> 'CLOSED' AND LOWER(t.title) LIKE LOWER(CONCAT('%', :word, '%'))")
    List<Ticket> findByTitleContainingIgnoreCase(@Param("word") String word);

    @Query("SELECT COALESCE(MAX(t.id), 0) FROM Ticket t")
    long findMaxId();

    List<Ticket> findByAssigneeIdAndStatusIn(Long assigneeId, List<TicketStatus> statuses);

    @Query("SELECT t FROM Ticket t WHERE t.isOverdue = false AND t.dueAt IS NOT NULL AND t.dueAt < :now AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Ticket> findNewlyOverdue(@Param("now") Instant now);
}
