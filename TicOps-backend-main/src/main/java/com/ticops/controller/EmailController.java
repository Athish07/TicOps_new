package com.ticops.controller;

import com.ticops.dto.EmailIngestRequest;
import com.ticops.dto.IngestedEmailDto;
import com.ticops.dto.TicketListDto;
import com.ticops.entity.IngestedEmail;
import com.ticops.repository.IngestedEmailRepository;
import com.ticops.service.EmailPollerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailPollerService emailPollerService;
    private final IngestedEmailRepository ingestedEmailRepository;

    @Value("${app.email.ingest.api-key:}")
    private String ingestApiKey;

    /**
     * Webhook endpoint for Power Automate to push emails into TicOps.
     * Secured via API key header: X-Ingest-Key
     */
    @PostMapping("/ingest")
    public ResponseEntity<?> ingestEmail(
            @RequestHeader(value = "X-Ingest-Key", required = false) String apiKey,
            @RequestBody EmailIngestRequest request) {

        // Validate API key
        if (ingestApiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Email ingest API key not configured"));
        }
        if (apiKey == null || !apiKey.equals(ingestApiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or missing X-Ingest-Key header"));
        }

        // Validate required fields
        if (request.getFromEmail() == null || request.getFromEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "fromEmail is required"));
        }
        if (request.getSubject() == null || request.getSubject().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "subject is required"));
        }

        IngestedEmail saved = emailPollerService.ingestFromExternal(request);
        IngestedEmailDto dto = toDto(saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Webhook endpoint for Power Automate that ingests AND auto-converts to ticket.
     * Secured via API key header: X-Ingest-Key
     */
    @PostMapping("/ingest-and-convert")
    public ResponseEntity<?> ingestAndConvert(
            @RequestHeader(value = "X-Ingest-Key", required = false) String apiKey,
            @RequestBody EmailIngestRequest request) {

        // Validate API key
        if (ingestApiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Email ingest API key not configured"));
        }
        if (apiKey == null || !apiKey.equals(ingestApiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or missing X-Ingest-Key header"));
        }

        // Validate required fields
        if (request.getFromEmail() == null || request.getFromEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "fromEmail is required"));
        }
        if (request.getSubject() == null || request.getSubject().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "subject is required"));
        }

        // Ingest the email
        IngestedEmail saved = emailPollerService.ingestFromExternal(request);
        
        // Immediately convert to ticket
        TicketListDto ticket = emailPollerService.convertToTicket(saved.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "email", toDto(saved),
            "ticket", ticket
        ));
    }

    /** Get all ingested emails (newest first) */
    @GetMapping("/ingested")
    public ResponseEntity<List<IngestedEmailDto>> getIngested(
            @RequestParam(required = false) String status) {
        List<IngestedEmail> emails = status != null && !status.isBlank()
                ? ingestedEmailRepository.findByStatusOrderByReceivedAtDesc(status)
                : ingestedEmailRepository.findAllByOrderByReceivedAtDesc();
        return ResponseEntity.ok(emails.stream().map(this::toDto).toList());
    }

    /** Convert a pending email into a ticket */
    @PostMapping("/ingested/{id}/convert")
    public ResponseEntity<TicketListDto> convertToTicket(@PathVariable Long id) {
        TicketListDto ticket = emailPollerService.convertToTicket(id);
        return ResponseEntity.ok(ticket);
    }

    /** Discard an ingested email */
    @PostMapping("/ingested/{id}/discard")
    public ResponseEntity<Void> discardEmail(@PathVariable Long id) {
        emailPollerService.discardEmail(id);
        return ResponseEntity.ok().build();
    }

    private IngestedEmailDto toDto(IngestedEmail e) {
        IngestedEmailDto dto = new IngestedEmailDto();
        dto.setId(e.getId());
        dto.setMessageUid(e.getMessageUid());
        dto.setFromEmail(e.getFromEmail());
        dto.setFromName(e.getFromName());
        dto.setSubject(e.getSubject());
        dto.setBodyPreview(e.getBodyPreview());
        dto.setReceivedAt(e.getReceivedAt().toString());
        dto.setProcessedAt(e.getProcessedAt().toString());
        dto.setTicketId(e.getTicketId());
        dto.setStatus(e.getStatus());
        dto.setDetectedPriority(e.getDetectedPriority());
        return dto;
    }
}
