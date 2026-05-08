package com.webgis.hanoifood.api;

import com.webgis.hanoifood.entity.SystemLog;
import com.webgis.hanoifood.security.JwtUtil;
import com.webgis.hanoifood.service.SystemLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")

public class SystemLogApi {

    @Autowired
    private SystemLogService systemLogService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<?> getAllLogs(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);

            if (!"ADMIN".equals(role)) {
                return ResponseEntity.status(403).body(Map.of("error", "Bạn không có quyền xem nhật ký hệ thống"));
            }

            return ResponseEntity.ok(systemLogService.getAllLogs());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}