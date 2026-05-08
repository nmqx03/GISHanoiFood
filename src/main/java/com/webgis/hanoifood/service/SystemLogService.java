package com.webgis.hanoifood.service;

import com.webgis.hanoifood.entity.SystemLog;
import com.webgis.hanoifood.entity.User;
import com.webgis.hanoifood.repository.SystemLogRepository;
import com.webgis.hanoifood.repository.UserRepository;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemLogService {

    @Autowired
    private SystemLogRepository systemLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void saveLog(Long userId, String action, String description) {
        try {
            User user = null;
            if (userId != null) {
                user = userRepository.findById(userId).orElse(null);
            }

            SystemLog log = new SystemLog();
            log.setUser(user);
            log.setAction(action);
            log.setDescription(description);
            
          
            systemLogRepository.save(log);
        } catch (Exception e) {
          
            System.err.println("Không thể ghi log hệ thống: " + e.getMessage());
        }
    }
    public List<SystemLog> getAllLogs() {
       
        return systemLogRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }
}