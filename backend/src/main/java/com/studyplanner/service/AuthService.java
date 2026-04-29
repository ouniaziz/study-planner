package com.studyplanner.service;

import com.studyplanner.dto.request.LoginRequest;
import com.studyplanner.dto.request.RegisterRequest;
import com.studyplanner.dto.response.AuthResponse;
import com.studyplanner.exception.StudyPlannerException;
import com.studyplanner.model.User;
import com.studyplanner.repository.UserRepository;
import com.studyplanner.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw StudyPlannerException.conflict("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .expiresIn(jwtUtil.getExpiration() / 1000)
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> StudyPlannerException.notFound("User not found"));

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .expiresIn(jwtUtil.getExpiration() / 1000)
                .email(user.getEmail())
                .build();
    }
}
