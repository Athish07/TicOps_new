package com.ticops.service;

import com.ticops.dto.CreateTicketRequest;
import com.ticops.dto.TicketListDto;
import com.ticops.entity.IngestedEmail;
import com.ticops.repository.IngestedEmailRepository;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMultipart;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailPollerService {

    private final IngestedEmailRepository ingestedEmailRepository;
    private final TicketService ticketService;

    @Value("${app.email.polling.enabled:false}")
    private boolean pollingEnabled;

    @Value("${app.email.imap.host:}")
    private String imapHost;

    @Value("${app.email.imap.port:993}")
    private int imapPort;

    @Value("${app.email.imap.username:}")
    private String imapUsername;

    @Value("${app.email.imap.password:}")
    private String imapPassword;

    @Value("${app.email.imap.folder:INBOX}")
    private String imapFolder;

    // Priority detection patterns
    private static final Pattern CRITICAL_PATTERN = Pattern.compile(
            "\\b(urgent|critical|emergency|down|outage|p1|sev1|asap|immediately)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern HIGH_PATTERN = Pattern.compile(
            "\\b(high priority|important|blocking|cannot work|broken|p2|sev2)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern LOW_PATTERN = Pattern.compile(
            "\\b(low priority|when possible|no rush|minor|cosmetic|nice to have)\\b",
            Pattern.CASE_INSENSITIVE);

    /** Scheduled poll — runs at the configured interval via IMAP */
    @Scheduled(fixedDelayString = "${app.email.polling.interval-ms:60000}")
    public void pollEmails() {
        if (!pollingEnabled) return;

        log.info("Polling emails via IMAP");
        try {
            if (imapHost.isBlank() || imapUsername.isBlank()) {
                log.warn("Email polling enabled but IMAP host/username not configured");
                return;
            }
            int count = fetchAndProcessImapEmails();
            if (count > 0) {
                log.info("Processed {} new email(s) into ingested_emails", count);
            }
        } catch (Exception e) {
            log.error("Email polling failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Connect to IMAP, read UNSEEN messages, persist as IngestedEmail records.
     * Returns number of new emails processed.
     */
    private int fetchAndProcessImapEmails() {
        Properties props = new Properties();
        props.put("mail.store.protocol", "imaps");
        props.put("mail.imaps.host", imapHost);
        props.put("mail.imaps.port", String.valueOf(imapPort));
        props.put("mail.imaps.ssl.enable", "true");
        props.put("mail.imaps.timeout", "10000");
        props.put("mail.imaps.connectiontimeout", "10000");

        Session session = Session.getInstance(props);
        int processed = 0;

        try (Store store = session.getStore("imaps")) {
            store.connect(imapHost, imapPort, imapUsername, imapPassword);

            try (Folder folder = store.getFolder(imapFolder)) {
                folder.open(Folder.READ_WRITE);

                // Get only UNSEEN messages
                Message[] messages = folder.search(
                        new jakarta.mail.search.FlagTerm(new Flags(Flags.Flag.SEEN), false));

                log.debug("Found {} unseen messages in {}", messages.length, imapFolder);

                for (Message msg : messages) {
                    try {
                        String uid = buildMessageUid(msg);
                        if (ingestedEmailRepository.existsByMessageUid(uid)) {
                            msg.setFlag(Flags.Flag.SEEN, true);
                            continue;
                        }
                        processMessage(msg, uid);
                        msg.setFlag(Flags.Flag.SEEN, true);
                        processed++;
                    } catch (Exception e) {
                        log.error("Failed to process message: {}", e.getMessage());
                    }
                }
            }
        } catch (MessagingException e) {
            throw new RuntimeException("IMAP connection failed: " + e.getMessage(), e);
        }
        return processed;
    }

    @Transactional
    protected void processMessage(Message msg, String uid) throws Exception {
        String from = "";
        String fromName = "";
        Address[] froms = msg.getFrom();
        if (froms != null && froms.length > 0) {
            InternetAddress addr = (InternetAddress) froms[0];
            from = addr.getAddress();
            fromName = addr.getPersonal() != null ? addr.getPersonal() : from.split("@")[0];
        }

        String subject = msg.getSubject() != null ? msg.getSubject() : "(No Subject)";
        String body = extractTextBody(msg);
        String bodyPreview = body.length() > 2000 ? body.substring(0, 2000) : body;

        Instant receivedAt = msg.getReceivedDate() != null
                ? msg.getReceivedDate().toInstant()
                : Instant.now();

        String priority = detectPriority(subject + " " + body);

        IngestedEmail ingested = IngestedEmail.builder()
                .messageUid(uid)
                .fromEmail(from)
                .fromName(fromName)
                .subject(subject)
                .bodyPreview(bodyPreview)
                .receivedAt(receivedAt)
                .processedAt(Instant.now())
                .status("PENDING")
                .detectedPriority(priority)
                .build();

        ingestedEmailRepository.save(ingested);
        log.debug("Ingested email: {} from {}", subject, from);
    }

    /** Auto-convert a pending ingested email into a ticket */
    @Transactional
    public TicketListDto convertToTicket(Long ingestedEmailId) {
        IngestedEmail ingested = ingestedEmailRepository.findById(ingestedEmailId)
                .orElseThrow(() -> new RuntimeException("Ingested email not found: " + ingestedEmailId));

        if ("CONVERTED".equals(ingested.getStatus())) {
            throw new RuntimeException("Email already converted to ticket");
        }

        CreateTicketRequest req = new CreateTicketRequest();
        req.setTitle(ingested.getSubject());
        req.setDescription(ingested.getBodyPreview());
        req.setSource("EMAIL");
        req.setRequesterName(ingested.getFromName());
        req.setRequesterEmail(ingested.getFromEmail());
        req.setStatus("OPEN");
        req.setPriority(ingested.getDetectedPriority() != null ? ingested.getDetectedPriority() : "MEDIUM");

        TicketListDto ticket = ticketService.createTicket(req);
        ingested.setTicketId(ticket.getId());
        ingested.setStatus("CONVERTED");
        ingestedEmailRepository.save(ingested);
        return ticket;
    }

    /** Discard an ingested email — won't create a ticket */
    @Transactional
    public void discardEmail(Long ingestedEmailId) {
        IngestedEmail ingested = ingestedEmailRepository.findById(ingestedEmailId)
                .orElseThrow(() -> new RuntimeException("Ingested email not found: " + ingestedEmailId));
        ingested.setStatus("DISCARDED");
        ingestedEmailRepository.save(ingested);
    }

    /** Build a unique ID from message headers to prevent duplicates */
    private String buildMessageUid(Message msg) throws MessagingException {
        String[] messageIds = msg.getHeader("Message-ID");
        if (messageIds != null && messageIds.length > 0) {
            return messageIds[0];
        }
        // Fallback: hash of date + subject + from
        String from = msg.getFrom() != null && msg.getFrom().length > 0
                ? msg.getFrom()[0].toString() : "unknown";
        String subject = msg.getSubject() != null ? msg.getSubject() : "";
        long date = msg.getSentDate() != null ? msg.getSentDate().getTime() : 0;
        return "uid-" + (from + subject + date).hashCode();
    }

    /** Extract plain text from a message (handles multipart) */
    private String extractTextBody(Message msg) throws Exception {
        Object content = msg.getContent();
        if (content instanceof String) {
            return (String) content;
        }
        if (content instanceof MimeMultipart multipart) {
            return extractFromMultipart(multipart);
        }
        return content.toString();
    }

    private String extractFromMultipart(MimeMultipart multipart) throws Exception {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart part = multipart.getBodyPart(i);
            if (part.isMimeType("text/plain")) {
                sb.append(part.getContent().toString());
            } else if (part.getContent() instanceof MimeMultipart nested) {
                sb.append(extractFromMultipart(nested));
            }
        }
        return sb.length() > 0 ? sb.toString() : "(No text content)";
    }

    /** Detect priority from subject + body keywords */
    private String detectPriority(String text) {
        if (CRITICAL_PATTERN.matcher(text).find()) return "CRITICAL";
        if (HIGH_PATTERN.matcher(text).find()) return "HIGH";
        if (LOW_PATTERN.matcher(text).find()) return "LOW";
        return "MEDIUM";
    }

    // ── Power Automate webhook ingest ────────────────────────────────────

    /**
     * Ingest an email pushed from Power Automate (or any external system).
     * This replaces the need for IMAP polling when admin access is unavailable.
     */
    @Transactional
    public IngestedEmail ingestFromExternal(com.ticops.dto.EmailIngestRequest req) {
        // Build a stable unique ID from sender + subject + timestamp to prevent duplicates
        String uid = "pa-" + (req.getFromEmail() + "|" + req.getSubject() + "|" + Instant.now().toEpochMilli()).hashCode();

        // If the caller provided a messageId, use it for better dedup
        if (req.getMessageId() != null && !req.getMessageId().isBlank()) {
            uid = "pa-" + req.getMessageId();
        }

        if (ingestedEmailRepository.existsByMessageUid(uid)) {
            log.info("Duplicate email skipped (uid={})", uid);
            return ingestedEmailRepository.findByMessageUid(uid).orElse(null);
        }

        String body = req.getBody() != null ? req.getBody() : "";
        String bodyPreview = body.length() > 2000 ? body.substring(0, 2000) : body;
        String priority = req.getPriority() != null && !req.getPriority().isBlank()
                ? req.getPriority()
                : detectPriority(req.getSubject() + " " + body);

        IngestedEmail ingested = IngestedEmail.builder()
                .messageUid(uid)
                .fromEmail(req.getFromEmail())
                .fromName(req.getFromName() != null ? req.getFromName() : req.getFromEmail().split("@")[0])
                .subject(req.getSubject())
                .bodyPreview(bodyPreview)
                .receivedAt(req.getReceivedAt() != null ? req.getReceivedAt() : Instant.now())
                .processedAt(Instant.now())
                .status("PENDING")
                .detectedPriority(priority)
                .build();

        ingestedEmailRepository.save(ingested);
        log.info("Ingested email from Power Automate: '{}' from {}", ingested.getSubject(), ingested.getFromEmail());
        return ingested;
    }
}
