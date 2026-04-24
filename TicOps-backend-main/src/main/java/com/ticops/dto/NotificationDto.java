package com.ticops.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class NotificationDto {
    private Long id;
    private Long userId;
    private String message;
    private String link;
    private Boolean read;
    private String createdAt;
}
