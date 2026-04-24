package com.ticops.service;

import com.ticops.dto.AuthResponse;
import com.ticops.dto.LoginRequest;
import com.ticops.entity.User;
import com.ticops.entity.UserRole;
import com.ticops.repository.UserRepository;
import com.ticops.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // If a role was sent, verify it matches
        if (req.getRole() != null && !req.getRole().isBlank()) {
            UserRole requestedRole = UserRole.valueOf(req.getRole());
            if (user.getRole() != requestedRole) {
                throw new RuntimeException("Role mismatch for this account");
            }
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .team(user.getTeam())
                .isActive(user.getIsActive())
                .token(token)
                .build();
    }
}
