package com.ticops.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "ingested_emails", indexes = {
    @Index(name = "idx_ingested_email_uid", columnList = "messageUid", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IngestedEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** IMAP message UID — used to prevent duplicate processing */
    @Column(nullable = false, unique = true)
    private String messageUid;

    @Column(nullable = false)
    private String fromEmail;

    private String fromName;

    @Column(nullable = false)
    private String subject;

    @Lob
    private String bodyPreview;

    @Column(nullable = false)
    private Instant receivedAt;

    @Column(nullable = false)
    private Instant processedAt;

    /** The ticket ID created from this email, null if conversion is pending */
    private Long ticketId;

    /** PENDING, CONVERTED, DISCARDED */
    @Column(nullable = false, length = 20)
    private String status;

    /** Auto-detected priority keyword */
    private String detectedPriority;
}
