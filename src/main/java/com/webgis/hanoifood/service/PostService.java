package com.webgis.hanoifood.service;

import com.webgis.hanoifood.entity.Place;
import com.webgis.hanoifood.entity.Post;
import com.webgis.hanoifood.entity.User;
import com.webgis.hanoifood.repository.PlaceRepository;
import com.webgis.hanoifood.repository.PostRepository;
import com.webgis.hanoifood.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private FileStorageService fileStorageService; 

    @Autowired
    private SystemLogService systemLogService; 
    
    @Autowired
    private StatsService statsService;

    public List<Post> getAllPosts() {
        return postRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    @Transactional
    public Post createPost(Post post, MultipartFile imageFile, List<Long> placeIds, Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
        post.setUser(user);

        if ("ADMIN".equals(role) || "EDITOR".equals(role)) {
            post.setOfficial(true);
            post.setStatus("APPROVED");
        } else {
            post.setOfficial(false);
            post.setStatus("PENDING");
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            String filePath = fileStorageService.saveFile(imageFile, "images/posts");
            post.setImageUrl(filePath);
        }

        if (placeIds != null && !placeIds.isEmpty()) {
            List<Place> places = placeRepository.findAllById(placeIds);
            post.setRelatedPlaces(new HashSet<>(places));
            for (Long pid : placeIds) {
                statsService.increasePost(pid);
            }
           
        }

        Post savedPost = postRepository.save(post);

        if ("ADMIN".equals(role) || "EDITOR".equals(role)) {
            systemLogService.saveLog(userId, "CREATE_POST", "Đăng tin tức: " + savedPost.getTitle());
        }

        return savedPost;
    }

    @Transactional
    public Post updatePostStatus(Long postId, String newStatus, Long userId, String role) {
 
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền duyệt bài viết");
        }
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));
                
        post.setStatus(newStatus);
        Post saved = postRepository.save(post);
        systemLogService.saveLog(userId, "REVIEW_POST", "Đổi trạng thái bài viết ID " + postId + " -> " + newStatus);
        return saved;
    }
    
    @Transactional
    public Post updatePost(Long postId, Post newData, MultipartFile imageFile,
                           List<Long> placeIds, Long userId, String role) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post không tồn tại"));

     
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            if (!post.getUser().getId().equals(userId)) {
                throw new RuntimeException("Không có quyền sửa bài viết của người khác");
            }
        }

        post.setTitle(newData.getTitle());
        post.setContent(newData.getContent());
        
        if ("ADMIN".equals(role) || "EDITOR".equals(role)) {
            post.setStatus("APPROVED");
        } else {
            post.setOfficial(false);
            post.setStatus("PENDING");
        }
        if (imageFile != null && !imageFile.isEmpty()) {
            String filePath = fileStorageService.saveFile(imageFile, "images/posts");
            post.setImageUrl(filePath);
        }

        if (placeIds != null) {
            post.setRelatedPlaces(new HashSet<>(placeRepository.findAllById(placeIds)));
        }

        Post saved = postRepository.save(post);

        systemLogService.saveLog(
                userId,
                "EDIT_POST",
                "Chỉnh sửa bài viết: " + saved.getTitle()
        );

        return saved;
    }
    
 
    @Transactional
    public void deletePost(Long postId, Long userId, String role) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));
                
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            if (!post.getUser().getId().equals(userId)) {
                throw new RuntimeException("Bạn không có quyền xóa bài viết của người khác");
            }
        }
        
        String title = post.getTitle();
        postRepository.delete(post);
        systemLogService.saveLog(userId, "DELETE_POST", "Xóa bài viết: " + title);
    }
    
    public List<Post> getPostsByUserId(Long userId) {    
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Người dùng không tồn tại");
        }
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}