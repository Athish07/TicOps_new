package com.ticops.controller;

import com.ticops.dto.CreateUserRequest;
import com.ticops.dto.UpdateUserRequest;
import com.ticops.dto.UserDto;
import com.ticops.entity.User;
import com.ticops.entity.UserRole;
import com.ticops.repository.UserRepository;
import com.ticops.service.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DtoMapper mapper;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAll() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(mapper::toUserDto)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> create(@RequestBody CreateUserRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Name is required");
        }
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");
        }
        if (req.getRole() == null || req.getRole().isBlank()) {
            return ResponseEntity.badRequest().body("Role is required");
        }

        if (userRepository.existsByEmail(req.getEmail().trim())) {
            return ResponseEntity.badRequest().body("A user with this email already exists");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(req.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role: " + req.getRole());
        }

        User user = User.builder()
                .name(req.getName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(role)
                .team(req.getTeam() != null ? req.getTeam().trim() : null)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        return ResponseEntity.ok(mapper.toUserDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        User existing = userRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (req.getName() != null && !req.getName().isBlank()) {
            existing.setName(req.getName().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String newEmail = req.getEmail().trim().toLowerCase();
            if (!newEmail.equals(existing.getEmail()) && userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body("A user with this email already exists");
            }
            existing.setEmail(newEmail);
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            if (req.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Password must be at least 6 characters");
            }
            existing.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRole() != null && !req.getRole().isBlank()) {
            try {
                existing.setRole(UserRole.valueOf(req.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid role: " + req.getRole());
            }
        }
        if (req.getTeam() != null) {
            existing.setTeam(req.getTeam().trim().isEmpty() ? null : req.getTeam().trim());
        }
        if (req.getIsActive() != null) {
            existing.setIsActive(req.getIsActive());
        }

        User updated = userRepository.save(existing);
        return ResponseEntity.ok(mapper.toUserDto(updated));
    }
}
