package com.ticops.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class ChatMessageDto {
    private Long id;
    private Long ticketId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String text;
    private List<AttachmentDto> attachments;
    private String createdAt;
}
