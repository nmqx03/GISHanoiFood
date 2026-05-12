export const BASE_URL = "http://localhost:8080";

// Placeholder dung data URI - khong can file img/placeholder.jpg
export const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Crect x='150' y='90' width='100' height='80' rx='8' fill='%23ccc'/%3E%3Ccircle cx='175' cy='115' r='12' fill='%23aaa'/%3E%3Cpolygon points='150,170 200,120 250,170' fill='%23bbb'/%3E%3Ctext x='200' y='210' text-anchor='middle' fill='%23999' font-size='14' font-family='sans-serif'%3EKhong co anh%3C/text%3E%3C/svg%3E";

/**
 * Tra ve URL day du cua anh upload.
 * FileStorageService luu DB dang: "images/places/uuid_abc.jpg"
 * WebConfig map: /uploads/** -> file:uploads/
 * -> URL dung: http://localhost:8080/uploads/images/places/uuid_abc.jpg
 */
export function getImageUrl(imagePath, fallback = PLACEHOLDER_IMG) {
    if (!imagePath) return fallback;

    // URL tuyet doi (http/https) -> giu nguyen
    if (imagePath.startsWith('http')) return imagePath;

    // Da co /uploads/ roi -> khong them nua
    if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
        const clean = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
        return `${BASE_URL}${clean}`;
    }

    // Duong dan tuong doi tu DB, vd: "images/places/abc.jpg"
    const clean = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    return `${BASE_URL}/uploads${clean}`;
}