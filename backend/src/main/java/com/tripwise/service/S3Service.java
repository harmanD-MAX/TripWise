package com.tripwise.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class S3Service {

    @Value("${AWS_BUCKET_NAME:}")
    private String bucketName;

    public String uploadFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String uniqueFileName = UUID.randomUUID() + extension;

        if (bucketName == null || bucketName.isEmpty()) {
            Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            Path filePath = uploadDir.resolve(uniqueFileName);
            file.transferTo(filePath.toFile());
            return "/uploads/" + uniqueFileName;
        } else {
            S3Client s3 = S3Client.builder().build();
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(uniqueFileName)
                    .build();
            s3.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
            
            return "https://" + bucketName + ".s3.amazonaws.com/" + uniqueFileName;
        }
    }

    public void deleteFile(String url) {
        if (url == null || url.isEmpty()) return;
        
        try {
            if (bucketName == null || bucketName.isEmpty() || url.startsWith("/uploads/")) {
                String fileName = url.replace("/uploads/", "");
                Path filePath = Paths.get(System.getProperty("user.dir"), "uploads", fileName);
                Files.deleteIfExists(filePath);
            } else {
                String key = url.substring(url.lastIndexOf("/") + 1);
                S3Client s3 = S3Client.builder().build();
                DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();
                s3.deleteObject(deleteObjectRequest);
            }
        } catch (Exception e) {
            System.err.println("Failed to delete file: " + url);
            e.printStackTrace();
        }
    }
}
