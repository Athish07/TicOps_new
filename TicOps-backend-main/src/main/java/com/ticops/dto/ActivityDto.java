package com.ticops.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class ActivityDto {
    private Long id;
    private Long ticketId;
    private String activityType;
    private String oldValue;
    private String newValue;
    private String commentText;
    private Long changedBy;
    private String createdAt;
}
