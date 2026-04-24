package com.ticops.service;

import com.ticops.dto.NotificationDto;
import com.ticops.dto.NotificationPrefsDto;
import com.ticops.entity.Notification;
import com.ticops.entity.NotificationPreference;
import com.ticops.entity.User;
import com.ticops.repository.NotificationPreferenceRepository;
import com.ticops.repository.NotificationRepository;
import com.ticops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository prefsRepository;
    private final UserRepository userRepository;
    private final DtoMapper mapper;

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(mapper::toNotificationDto).toList();
    }

    @Transactional
    public void markRead(Long notifId) {
        Notification n = notificationRepository.findById(notifId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional
    public NotificationPrefsDto getPrefs(Long userId) {
        NotificationPreference pref = prefsRepository.findById(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            NotificationPreference newPref = NotificationPreference.builder().user(user).build();
            return prefsRepository.save(newPref);
        });
        NotificationPrefsDto dto = new NotificationPrefsDto();
        dto.setEmailOnAssign(pref.getEmailOnAssign());
        dto.setEmailOnStatusChange(pref.getEmailOnStatusChange());
        dto.setEmailOnComment(pref.getEmailOnComment());
        dto.setEmailOnResolved(pref.getEmailOnResolved());
        return dto;
    }

    @Transactional
    public NotificationPrefsDto savePrefs(Long userId, NotificationPrefsDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        NotificationPreference pref = prefsRepository.findById(userId)
                .orElseGet(() -> NotificationPreference.builder().user(user).build());
        pref.setEmailOnAssign(dto.getEmailOnAssign());
        pref.setEmailOnStatusChange(dto.getEmailOnStatusChange());
        pref.setEmailOnComment(dto.getEmailOnComment());
        pref.setEmailOnResolved(dto.getEmailOnResolved());
        prefsRepository.save(pref);
        return dto;
    }

    /** Utility for creating notifications from other services */
    public void createNotification(User user, String message, String link) {
        Notification n = Notification.builder()
                .user(user)
                .message(message)
                .link(link)
                .build();
        notificationRepository.save(n);
    }
}
