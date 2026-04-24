package com.ticops.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "ticket_comments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Lob
    @Column(nullable = false)
    private String commentText;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private CommentVisibility visibility = CommentVisibility.INTERNAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum CommentVisibility {
        INTERNAL, PUBLIC
    }
}
