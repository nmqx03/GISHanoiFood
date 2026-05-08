package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.Post;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByStatus(String status);
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
}