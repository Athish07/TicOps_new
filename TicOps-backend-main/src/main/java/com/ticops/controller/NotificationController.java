package com.ticops.controller;

import com.ticops.dto.NotificationDto;
import com.ticops.dto.NotificationPrefsDto;
import com.ticops.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getAll(@RequestParam Long userId) {
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestBody Map<String, Long> body) {
        notificationService.markAllRead(body.get("userId"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/prefs/{userId}")
    public ResponseEntity<NotificationPrefsDto> getPrefs(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getPrefs(userId));
    }

    @PutMapping("/prefs/{userId}")
    public ResponseEntity<NotificationPrefsDto> savePrefs(@PathVariable Long userId,
                                                           @RequestBody NotificationPrefsDto prefs) {
        return ResponseEntity.ok(notificationService.savePrefs(userId, prefs));
    }
}
