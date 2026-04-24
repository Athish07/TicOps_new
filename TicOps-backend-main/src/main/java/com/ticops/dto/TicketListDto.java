package com.ticops.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class TicketListDto {
    private Long id;
    private String ticketNumber;
    private String title;
    private String description;
    private String source;
    private String requesterName;
    private String requesterEmail;
    private String status;
    private String priority;
    private Long categoryId;
    private Long assignedTo;
    private String createdAt;
    private String updatedAt;
    private String resolvedAt;
    private String closedAt;
    private String dueAt;
    private Boolean isOverdue;
    private String channelReference;
    private Integer satisfactionRating;
    private String satisfactionComment;
    private CategoryDto category;
    private UserDto assignee;
    private String ageLabel;
}
