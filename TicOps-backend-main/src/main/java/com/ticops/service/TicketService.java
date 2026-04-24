package com.ticops.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticops.dto.*;
import com.ticops.entity.*;
import com.ticops.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketActivityRepository activityRepository;
    private final TicketCommentRepository commentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AutoAssignRuleRepository autoAssignRuleRepository;
    private final NotificationService notificationService;
    private final DtoMapper mapper;
    private final ObjectMapper objectMapper;

    // ── list with filters ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<TicketListDto> getTickets(String search, String status, String priority,
                                          String categoryId, String assignedTo, String source) {
        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                preds.add(cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("ticketNumber")), like),
                    cb.like(cb.lower(root.get("requesterName")), like),
                    cb.like(cb.lower(root.get("requesterEmail")), like)
                ));
            }
            if (status != null && !status.isBlank()) {
                preds.add(cb.equal(root.get("status"), TicketStatus.valueOf(status)));
            }
            if (priority != null && !priority.isBlank()) {
                preds.add(cb.equal(root.get("priority"), TicketPriority.valueOf(priority)));
            }
            if (categoryId != null && !categoryId.isBlank()) {
                preds.add(cb.equal(root.get("category").get("id"), Long.parseLong(categoryId)));
            }
            if (assignedTo != null && !assignedTo.isBlank()) {
                preds.add(cb.equal(root.get("assignee").get("id"), Long.parseLong(assignedTo)));
            }
            if (source != null && !source.isBlank()) {
                preds.add(cb.equal(root.get("source"), TicketSource.valueOf(source)));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };

        return ticketRepository.findAll(spec).stream()
                .map(mapper::toTicketListDto)
                .toList();
    }

    // ── detail ──────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public TicketDetailDto getTicketById(Long id) {
        Ticket ticket = findTicketOrThrow(id);
        List<TicketActivity> activities = activityRepository.findByTicketIdOrderByCreatedAtAsc(id);
        List<TicketComment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(id);
        List<ChatMessage> chats = chatMessageRepository.findByTicketIdOrderByCreatedAtAsc(id);
        return mapper.toTicketDetailDto(ticket, activities, comments, chats);
    }

    // ── create ──────────────────────────────────────────────────────────
    @Transactional
    public TicketListDto createTicket(CreateTicketRequest req) {
        long maxId = ticketRepository.findMaxId();
        String ticketNumber = "TIC-" + String.format("%05d", maxId + 1);

        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumber)
                .title(req.getTitle())
                .description(req.getDescription())
                .source(req.getSource() != null ? TicketSource.valueOf(req.getSource()) : TicketSource.WEB)
                .requesterName(req.getRequesterName())
                .requesterEmail(req.getRequesterEmail())
                .status(req.getStatus() != null ? TicketStatus.valueOf(req.getStatus()) : TicketStatus.OPEN)
                .priority(req.getPriority() != null ? TicketPriority.valueOf(req.getPriority()) : TicketPriority.MEDIUM)
                .build();

        if (req.getCategoryId() != null) {
            ticket.setCategory(categoryRepository.findById(req.getCategoryId()).orElse(null));
        }

        // Auto-assign if no explicit assignee
        if (req.getAssignedTo() != null) {
            ticket.setAssignee(userRepository.findById(req.getAssignedTo()).orElse(null));
            if (ticket.getAssignee() != null) {
                ticket.setStatus(TicketStatus.ASSIGNED);
            }
        } else {
            tryAutoAssign(ticket);
        }

        // SLA: due 24h from creation
        ticket.setDueAt(Instant.now().plusSeconds(86400));

        ticket = ticketRepository.save(ticket);

        // Activity log
        logActivity(ticket, ActivityType.CREATED, null, null, null, null);

        return mapper.toTicketListDto(ticket);
    }

    // ── update status ───────────────────────────────────────────────────
    @Transactional
    public TicketListDto updateStatus(Long id, String newStatus) {
        Ticket ticket = findTicketOrThrow(id);
        String oldStatus = ticket.getStatus().name();
        TicketStatus status = TicketStatus.valueOf(newStatus);
        ticket.setStatus(status);

        if (status == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(Instant.now());
        } else if (status == TicketStatus.CLOSED) {
            ticket.setClosedAt(Instant.now());
        }

        ticket = ticketRepository.save(ticket);
        logActivity(ticket, ActivityType.STATUS_CHANGED, oldStatus, newStatus, null, null);

        // Notify assignee and requester about status change
        final Ticket saved = ticket;
        String link = "/tickets/" + saved.getId();
        if (saved.getAssignee() != null) {
            notificationService.createNotification(saved.getAssignee(),
                    "Ticket " + saved.getTicketNumber() + " status changed to " + newStatus, link);
        }
        // Notify requester (find user by email)
        userRepository.findByEmail(saved.getRequesterEmail()).ifPresent(requester ->
                notificationService.createNotification(requester,
                        "Your ticket " + saved.getTicketNumber() + " is now " + newStatus, link));

        return mapper.toTicketListDto(ticket);
    }

    // ── assign ──────────────────────────────────────────────────────────
    @Transactional
    public TicketListDto assignTicket(Long id, Long assigneeId) {
        Ticket ticket = findTicketOrThrow(id);
        User agent = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String oldAssignee = ticket.getAssignee() != null ? ticket.getAssignee().getName() : "Unassigned";
        ticket.setAssignee(agent);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.ASSIGNED);
        }
        ticket = ticketRepository.save(ticket);
        logActivity(ticket, ActivityType.ASSIGNED, oldAssignee, agent.getName(), null, null);

        // Notify newly assigned agent
        notificationService.createNotification(agent,
                "Ticket " + ticket.getTicketNumber() + " has been assigned to you", "/tickets/" + ticket.getId());

        return mapper.toTicketListDto(ticket);
    }

    // ── add comment ─────────────────────────────────────────────────────
    @Transactional
    public CommentDto addComment(Long ticketId, String commentText, User actor) {
        Ticket ticket = findTicketOrThrow(ticketId);
        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .commentText(commentText)
                .createdBy(actor)
                .build();
        comment = commentRepository.save(comment);
        logActivity(ticket, ActivityType.COMMENT_ADDED, null, null, commentText, actor);

        // Notify assignee and requester about new comment
        String link = "/tickets/" + ticket.getId();
        if (ticket.getAssignee() != null && !ticket.getAssignee().getId().equals(actor.getId())) {
            notificationService.createNotification(ticket.getAssignee(),
                    "New comment on " + ticket.getTicketNumber() + " by " + actor.getName(), link);
        }
        userRepository.findByEmail(ticket.getRequesterEmail()).ifPresent(requester -> {
            if (!requester.getId().equals(actor.getId())) {
                notificationService.createNotification(requester,
                        "New comment on your ticket " + ticket.getTicketNumber(), link);
            }
        });

        return mapper.toCommentDto(comment);
    }

    // ── send chat ───────────────────────────────────────────────────────
    @Transactional
    public ChatMessageDto sendChat(Long ticketId, User sender, SendChatRequest req) {
        Ticket ticket = findTicketOrThrow(ticketId);
        ChatMessage msg = ChatMessage.builder()
                .ticket(ticket)
                .sender(sender)
                .text(req.getText())
                .attachmentsJson(mapper.serializeAttachments(req.getAttachments()))
                .build();
        msg = chatMessageRepository.save(msg);
        return mapper.toChatMessageDto(msg);
    }

    // ── submit rating ───────────────────────────────────────────────────
    @Transactional
    public void submitRating(Long ticketId, Integer rating, String comment) {
        Ticket ticket = findTicketOrThrow(ticketId);
        ticket.setSatisfactionRating(rating);
        ticket.setSatisfactionComment(comment);
        ticketRepository.save(ticket);
    }

    // ── bulk status ─────────────────────────────────────────────────────
    @Transactional
    public void bulkUpdateStatus(BulkStatusRequest req) {
        for (Long id : req.getIds()) {
            updateStatus(id, req.getStatus());
        }
    }

    // ── bulk assign ─────────────────────────────────────────────────────
    @Transactional
    public void bulkAssign(BulkAssignRequest req) {
        for (Long id : req.getIds()) {
            assignTicket(id, req.getAssignedTo());
        }
    }

    // ── similar tickets (duplicate detection) ───────────────────────────
    @Transactional(readOnly = true)
    public List<TicketListDto> findSimilar(String title) {
        if (title == null || title.isBlank()) return List.of();
        String[] words = title.trim().split("\\s+");
        Set<Long> seen = new HashSet<>();
        List<TicketListDto> results = new ArrayList<>();
        for (String w : words) {
            if (w.length() < 3) continue;
            for (Ticket t : ticketRepository.findByTitleContainingIgnoreCase(w)) {
                if (seen.add(t.getId())) {
                    results.add(mapper.toTicketListDto(t));
                }
            }
        }
        return results;
    }

    // ── auto-assign logic ───────────────────────────────────────────────
    private void tryAutoAssign(Ticket ticket) {
        AutoAssignRule rule = autoAssignRuleRepository.findAll().stream().findFirst().orElse(null);
        if (rule == null || !Boolean.TRUE.equals(rule.getEnabled())) return;
        if (ticket.getCategory() == null) return;

        Map<Long, List<Long>> catMap = parseCatAgentMap(rule.getCategoryAgentMapJson());
        List<Long> eligible = catMap.get(ticket.getCategory().getId());
        if (eligible == null || eligible.isEmpty()) return;

        Map<Long, Integer> rr = parseRoundRobinIndex(rule.getRoundRobinIndexJson());

        if ("LOAD_BALANCED".equals(rule.getStrategy())) {
            // Pick agent with fewest active tickets
            Long best = null;
            int minLoad = Integer.MAX_VALUE;
            for (Long agentId : eligible) {
                int load = ticketRepository.findByAssigneeIdAndStatusIn(agentId,
                        List.of(TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS)).size();
                if (load < minLoad) {
                    minLoad = load;
                    best = agentId;
                }
            }
            if (best != null) {
                userRepository.findById(best).ifPresent(agent -> {
                    ticket.setAssignee(agent);
                    ticket.setStatus(TicketStatus.ASSIGNED);
                });
            }
        } else {
            // ROUND_ROBIN
            Long catId = ticket.getCategory().getId();
            int idx = rr.getOrDefault(catId, 0) % eligible.size();
            Long agentId = eligible.get(idx);
            userRepository.findById(agentId).ifPresent(agent -> {
                ticket.setAssignee(agent);
                ticket.setStatus(TicketStatus.ASSIGNED);
            });
            rr.put(catId, idx + 1);
            try {
                rule.setRoundRobinIndexJson(objectMapper.writeValueAsString(rr));
                autoAssignRuleRepository.save(rule);
            } catch (Exception ignored) {}
        }
    }

    private Map<Long, List<Long>> parseCatAgentMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private Map<Long, Integer> parseRoundRobinIndex(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────
    private Ticket findTicketOrThrow(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
    }

    private void logActivity(Ticket ticket, ActivityType type,
                             String oldVal, String newVal, String comment, User actor) {
        TicketActivity activity = TicketActivity.builder()
                .ticket(ticket)
                .activityType(type)
                .oldValue(oldVal)
                .newValue(newVal)
                .commentText(comment)
                .changedBy(actor)
                .build();
        activityRepository.save(activity);
    }
}
