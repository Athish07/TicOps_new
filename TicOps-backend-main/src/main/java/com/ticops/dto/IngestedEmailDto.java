package com.ticops.dto;

import lombok.Data;

@Data
public class IngestedEmailDto {
    private Long id;
    private String messageUid;
    private String fromEmail;
    private String fromName;
    private String subject;
    private String bodyPreview;
    private String receivedAt;
    private String processedAt;
    private Long ticketId;
    private String status; // PENDING, CONVERTED, DISCARDED
    private String detectedPriority;
}
