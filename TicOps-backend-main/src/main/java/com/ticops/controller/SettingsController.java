package com.ticops.controller;

import com.ticops.dto.AutoAssignRuleDto;
import com.ticops.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/auto-assign")
    public ResponseEntity<AutoAssignRuleDto> getAutoAssign() {
        return ResponseEntity.ok(settingsService.getAutoAssignRule());
    }

    @PutMapping("/auto-assign")
    public ResponseEntity<AutoAssignRuleDto> saveAutoAssign(@RequestBody AutoAssignRuleDto dto) {
        return ResponseEntity.ok(settingsService.saveAutoAssignRule(dto));
    }
}
