package com.ticops.controller;

import com.ticops.dto.*;
import com.ticops.entity.User;
import com.ticops.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketListDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) String source) {
        return ResponseEntity.ok(ticketService.getTickets(search, status, priority, categoryId, assignedTo, source));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDetailDto> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PostMapping
    public ResponseEntity<TicketListDto> create(@Valid @RequestBody CreateTicketRequest req) {
        return ResponseEntity.ok(ticketService.createTicket(req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketListDto> updateStatus(@PathVariable Long id,
                                                       @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ticketService.updateStatus(id, body.get("status")));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketListDto> assign(@PathVariable Long id,
                                                 @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(ticketService.assignTicket(id, body.get("assignedTo")));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(@PathVariable Long id,
                                                  @RequestBody Map<String, String> body,
                                                  @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(ticketService.addComment(id, body.get("commentText"), actor));
    }

    @PostMapping("/{id}/chat")
    public ResponseEntity<ChatMessageDto> sendChat(@PathVariable Long id,
                                                    @RequestBody SendChatRequest req,
                                                    @AuthenticationPrincipal User sender) {
        return ResponseEntity.ok(ticketService.sendChat(id, sender, req));
    }

    @PostMapping("/{id}/rating")
    public ResponseEntity<Void> submitRating(@PathVariable Long id,
                                              @RequestBody Map<String, Object> body) {
        Integer rating = (Integer) body.get("rating");
        String comment = (String) body.get("comment");
        ticketService.submitRating(id, rating, comment);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/bulk/status")
    public ResponseEntity<Void> bulkStatus(@RequestBody BulkStatusRequest req) {
        ticketService.bulkUpdateStatus(req);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/bulk/assign")
    public ResponseEntity<Void> bulkAssign(@RequestBody BulkAssignRequest req) {
        ticketService.bulkAssign(req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/similar")
    public ResponseEntity<List<TicketListDto>> findSimilar(@RequestParam String title) {
        return ResponseEntity.ok(ticketService.findSimilar(title));
    }
}
