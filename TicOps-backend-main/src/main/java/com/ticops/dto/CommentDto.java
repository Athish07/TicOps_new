package com.ticops.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class CommentDto {
    private Long id;
    private Long ticketId;
    private String commentText;
    private String visibility;
    private Long createdBy;
    private String createdAt;
}
