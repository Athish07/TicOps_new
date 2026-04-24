package com.ticops.repository;

import com.ticops.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
