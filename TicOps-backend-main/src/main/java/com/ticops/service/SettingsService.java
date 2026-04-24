package com.ticops.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticops.dto.AutoAssignRuleDto;
import com.ticops.entity.AutoAssignRule;
import com.ticops.repository.AutoAssignRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final AutoAssignRuleRepository ruleRepository;
    private final ObjectMapper objectMapper;

    public AutoAssignRuleDto getAutoAssignRule() {
        AutoAssignRule rule = ruleRepository.findAll().stream().findFirst()
                .orElseGet(() -> ruleRepository.save(AutoAssignRule.builder().build()));

        AutoAssignRuleDto dto = new AutoAssignRuleDto();
        dto.setEnabled(rule.getEnabled());
        dto.setStrategy(rule.getStrategy());
        dto.setCategoryAgentMap(parseMap(rule.getCategoryAgentMapJson()));
        return dto;
    }

    @Transactional
    public AutoAssignRuleDto saveAutoAssignRule(AutoAssignRuleDto dto) {
        AutoAssignRule rule = ruleRepository.findAll().stream().findFirst()
                .orElseGet(() -> AutoAssignRule.builder().build());

        rule.setEnabled(dto.getEnabled());
        rule.setStrategy(dto.getStrategy());
        try {
            rule.setCategoryAgentMapJson(objectMapper.writeValueAsString(dto.getCategoryAgentMap()));
        } catch (Exception e) {
            rule.setCategoryAgentMapJson("{}");
        }
        ruleRepository.save(rule);
        return dto;
    }

    private Map<Long, List<Long>> parseMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}
