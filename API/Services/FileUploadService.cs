using Microsoft.AspNetCore.Http;
using System.Text.RegularExpressions;

namespace API.Services;

public interface IFileUploadService
{
    Task<string> UploadProductImageAsync(IFormFile file);
    Task<string> UploadProductImageFromDataUrlAsync(string dataUrl);
    void DeleteProductImageAsync(string fileName);
}

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _environment;
    private readonly string _productImagesPath;

    public FileUploadService(IWebHostEnvironment environment)
    {
        _environment = environment;
        
        // Use relative path to client/public/images/products from API project root
        // This works for any environment (local, server, friend's machine)
        var apiProjectRoot = _environment.ContentRootPath; // API project root
        var solutionRoot = Directory.GetParent(apiProjectRoot)?.FullName; // Solution root
        var clientPublicImagesPath = Path.Combine(solutionRoot ?? apiProjectRoot, "client", "public", "images", "products");
        
        _productImagesPath = clientPublicImagesPath;
        
        // Ensure the directory exists
        if (!Directory.Exists(_productImagesPath))
        {
            Directory.CreateDirectory(_productImagesPath);
        }
    }

    public async Task<string> UploadProductImageAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty or null");

        // Validate file type
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(fileExtension))
            throw new ArgumentException("Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.");

        // Validate file size (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
            throw new ArgumentException("File size too large. Maximum size is 10MB.");

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(_productImagesPath, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return the relative path for database storage (this will be served by the client)
        return $"/images/products/{fileName}";
    }

    public async Task<string> UploadProductImageFromDataUrlAsync(string dataUrl)
    {
        if (string.IsNullOrEmpty(dataUrl))
            throw new ArgumentException("Data URL is empty or null");

        // Parse data URL to extract MIME type and base64 data
        var match = Regex.Match(dataUrl, @"^data:([^;]+);base64,(.+)$");
        if (!match.Success)
            throw new ArgumentException("Invalid data URL format");

        var mimeType = match.Groups[1].Value;
        var base64Data = match.Groups[2].Value;

        // Validate MIME type
        var allowedMimeTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
        if (!allowedMimeTypes.Contains(mimeType.ToLower()))
            throw new ArgumentException("Invalid image type. Only JPG, PNG, GIF, and WebP are allowed.");

        // Convert base64 to bytes
        var imageBytes = Convert.FromBase64String(base64Data);

        // Validate file size (max 10MB)
        if (imageBytes.Length > 10 * 1024 * 1024)
            throw new ArgumentException("File size too large. Maximum size is 10MB.");

        // Determine file extension from MIME type
        var extension = mimeType.ToLower() switch
        {
            "image/jpeg" or "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            _ => ".jpg"
        };

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(_productImagesPath, fileName);

        // Save file
        await File.WriteAllBytesAsync(filePath, imageBytes);

        // Return the relative path for database storage
        return $"/images/products/{fileName}";
    }

    public void DeleteProductImageAsync(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
            return;

        // Extract just the filename from the path
        var fileNameOnly = Path.GetFileName(fileName);
        if (string.IsNullOrEmpty(fileNameOnly))
            return;

        var filePath = Path.Combine(_productImagesPath, fileNameOnly);
        
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
}
