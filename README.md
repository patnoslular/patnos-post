# The Patnos Post - Vercel Dağıtım Rehberi

Bu proje, **The Patnos Post** haber sitesinin Vercel üzerinde sorunsuz çalışması için optimize edilmiştir.

## 🚀 Kurulum Adımları

1.  **GitHub'a Yükleyin:**
    -   AI Studio'dan indirdiğiniz tüm dosyaları yeni bir GitHub deposuna (Private/Gizli olması önerilir) yükleyin.

2.  **Vercel'e Bağlayın:**
    -   [Vercel.com](https://vercel.com) adresine gidin.
    -   **"Add New" > "Project"** diyerek GitHub deponuzu seçin.

3.  **Çevre Değişkenlerini (Environment Variables) Ekleyin:**
    -   Vercel'de projenizi kurarken **"Environment Variables"** bölümüne AI Studio'daki şu değerleri ekleyin:
        -   `SUPABASE_URL`
        -   `SUPABASE_SERVICE_ROLE_KEY`
        -   `ADMIN_PASSWORD`
        -   `APP_URL` (Vercel'in size vereceği adresi buraya yazın, örn: `https://patnos-post.vercel.app`)
        -   `GEMINI_API_KEY` (Eğer kullanıyorsanız)

4.  **Yayınlayın (Deploy):**
    -   "Deploy" butonuna basın. Saniyeler içinde siteniz yayına girecek!

## 🛠 Teknik Detaylar
-   **Frontend:** React + Vite + Tailwind CSS
-   **Backend:** Express (Meta tag enjeksiyonu için)
-   **Veritabanı:** Supabase
