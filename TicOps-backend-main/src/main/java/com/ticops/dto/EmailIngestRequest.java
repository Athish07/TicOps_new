package com.ticops.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class EmailIngestRequest {
    private String fromName;
    private String fromEmail;
    private String subject;
    private String body;
    private String priority;
    private Long categoryId;
    /** Original message ID from Outlook — used for duplicate prevention */
    private String messageId;
    /** When the email was received in the mailbox */
    private Instant receivedAt;
}
