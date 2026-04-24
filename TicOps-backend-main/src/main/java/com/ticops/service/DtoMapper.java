package com.ticops.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticops.dto.*;
import com.ticops.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DtoMapper {

    private final ObjectMapper objectMapper;

    // ── User ────────────────────────────────────────────────────────────
    public UserDto toUserDto(User u) {
        if (u == null) return null;
        return UserDto.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole().name())
                .team(u.getTeam())
                .isActive(u.getIsActive())
                .build();
    }

    // ── Category ────────────────────────────────────────────────────────
    public CategoryDto toCategoryDto(Category c) {
        if (c == null) return null;
        return CategoryDto.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .build();
    }

    // ── Ticket list/detail ──────────────────────────────────────────────
    public TicketListDto toTicketListDto(Ticket t) {
        return TicketListDto.builder()
                .id(t.getId())
                .ticketNumber(t.getTicketNumber())
                .title(t.getTitle())
                .description(t.getDescription())
                .source(t.getSource().name())
                .requesterName(t.getRequesterName())
                .requesterEmail(t.getRequesterEmail())
                .status(t.getStatus().name())
                .priority(t.getPriority().name())
                .categoryId(t.getCategory() != null ? t.getCategory().getId() : null)
                .assignedTo(t.getAssignee() != null ? t.getAssignee().getId() : null)
                .createdAt(t.getCreatedAt().toString())
                .updatedAt(t.getUpdatedAt().toString())
                .resolvedAt(t.getResolvedAt() != null ? t.getResolvedAt().toString() : null)
                .closedAt(t.getClosedAt() != null ? t.getClosedAt().toString() : null)
                .dueAt(t.getDueAt() != null ? t.getDueAt().toString() : null)
                .isOverdue(t.getIsOverdue())
                .channelReference(t.getChannelReference())
                .satisfactionRating(t.getSatisfactionRating())
                .satisfactionComment(t.getSatisfactionComment())
                .category(toCategoryDto(t.getCategory()))
                .assignee(toUserDto(t.getAssignee()))
                .ageLabel(computeAgeLabel(t.getCreatedAt()))
                .build();
    }

    public TicketDetailDto toTicketDetailDto(Ticket t,
                                              List<TicketActivity> activities,
                                              List<TicketComment> comments,
                                              List<ChatMessage> chats) {
        return TicketDetailDto.builder()
                .id(t.getId())
                .ticketNumber(t.getTicketNumber())
                .title(t.getTitle())
                .description(t.getDescription())
                .source(t.getSource().name())
                .requesterName(t.getRequesterName())
                .requesterEmail(t.getRequesterEmail())
                .status(t.getStatus().name())
                .priority(t.getPriority().name())
                .categoryId(t.getCategory() != null ? t.getCategory().getId() : null)
                .assignedTo(t.getAssignee() != null ? t.getAssignee().getId() : null)
                .createdAt(t.getCreatedAt().toString())
                .updatedAt(t.getUpdatedAt().toString())
                .resolvedAt(t.getResolvedAt() != null ? t.getResolvedAt().toString() : null)
                .closedAt(t.getClosedAt() != null ? t.getClosedAt().toString() : null)
                .dueAt(t.getDueAt() != null ? t.getDueAt().toString() : null)
                .isOverdue(t.getIsOverdue())
                .channelReference(t.getChannelReference())
                .satisfactionRating(t.getSatisfactionRating())
                .satisfactionComment(t.getSatisfactionComment())
                .category(toCategoryDto(t.getCategory()))
                .assignee(toUserDto(t.getAssignee()))
                .activities(activities.stream().map(this::toActivityDto).toList())
                .comments(comments.stream().map(this::toCommentDto).toList())
                .chatMessages(chats.stream().map(this::toChatMessageDto).toList())
                .build();
    }

    // ── Activity ────────────────────────────────────────────────────────
    public ActivityDto toActivityDto(TicketActivity a) {
        return ActivityDto.builder()
                .id(a.getId())
                .ticketId(a.getTicket().getId())
                .activityType(a.getActivityType().name())
                .oldValue(a.getOldValue())
                .newValue(a.getNewValue())
                .commentText(a.getCommentText())
                .changedBy(a.getChangedBy() != null ? a.getChangedBy().getId() : null)
                .createdAt(a.getCreatedAt().toString())
                .build();
    }

    // ── Comment ─────────────────────────────────────────────────────────
    public CommentDto toCommentDto(TicketComment c) {
        return CommentDto.builder()
                .id(c.getId())
                .ticketId(c.getTicket().getId())
                .commentText(c.getCommentText())
                .visibility(c.getVisibility().name())
                .createdBy(c.getCreatedBy() != null ? c.getCreatedBy().getId() : null)
                .createdAt(c.getCreatedAt().toString())
                .build();
    }

    // ── Chat message ────────────────────────────────────────────────────
    public ChatMessageDto toChatMessageDto(ChatMessage m) {
        List<AttachmentDto> attachments = parseAttachments(m.getAttachmentsJson());
        return ChatMessageDto.builder()
                .id(m.getId())
                .ticketId(m.getTicket().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .senderRole(m.getSender().getRole().name())
                .text(m.getText())
                .attachments(attachments)
                .createdAt(m.getCreatedAt().toString())
                .build();
    }

    // ── Notification ────────────────────────────────────────────────────
    public NotificationDto toNotificationDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .userId(n.getUser().getId())
                .message(n.getMessage())
                .link(n.getLink())
                .read(n.getRead())
                .createdAt(n.getCreatedAt().toString())
                .build();
    }

    // ── KB Article ──────────────────────────────────────────────────────
    public KbArticleDto toKbArticleDto(KbArticle a) {
        List<String> tagList = (a.getTags() != null && !a.getTags().isBlank())
                ? Arrays.asList(a.getTags().split(","))
                : List.of();
        return KbArticleDto.builder()
                .id(a.getId())
                .categoryId(a.getCategory().getId())
                .title(a.getTitle())
                .body(a.getBody())
                .tags(tagList)
                .build();
    }

    // ── Helpers ─────────────────────────────────────────────────────────
    private List<AttachmentDto> parseAttachments(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    public String serializeAttachments(List<AttachmentDto> attachments) {
        if (attachments == null || attachments.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(attachments);
        } catch (Exception e) {
            return null;
        }
    }

    private String computeAgeLabel(Instant createdAt) {
        Duration duration = Duration.between(createdAt, Instant.now());
        long days = duration.toDays();
        if (days > 0) return days + "d ago";
        long hours = duration.toHours();
        if (hours > 0) return hours + "h ago";
        long minutes = duration.toMinutes();
        return Math.max(minutes, 1) + "m ago";
    }
}
