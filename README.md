# TripWise ✈️

TripWise is a modern, full-stack travel planning application designed to take the stress out of building itineraries. It uses AI to generate highly personalized, day-by-day travel routes based on your budget, style, and destination.

## Tech Stack
- **Frontend:** Next.js 16 (React 19), Tailwind CSS, Leaflet Maps
- **Backend:** Java Spring Boot 3, Spring AI, Spring Security
- **Database:** PostgreSQL (Supabase)
- **Cloud/Auth:** Clerk (Authentication), AWS S3 (Media Storage), Google Gemini (AI Engine)

## Key Features
- **AI Itineraries:** Generates structured day-by-day travel plans using Gemini.
- **Interactive Maps:** View your routes on dynamic Leaflet maps that filter automatically by day.
- **Budget Tracking:** Real-time expense categorization and budget calculations.
- **Media Gallery:** Securely upload your flight tickets and hotel reservations directly to AWS S3.
- **Intelligence Report:** Get automated optimization tips (like adjusting heavy walking days).

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/harmanD-MAX/TripWise.git
   cd TripWise
   ```

2. **Backend Setup:**
   Navigate to `/backend`, set up your `.env` (Supabase, Clerk, AWS, Gemini), and run:
   ```bash
   ./mvnw clean package -DskipTests
   set -a && source .env && set +a
   ./mvnw spring-boot:run
   ```

3. **Frontend Setup:**
   Navigate to `/frontend`, set up your `.env.local` (Clerk, API URL), and run:
   ```bash
   npm install
   npm run dev
   ```
   *TripWise will be live at `http://localhost:3000`!*

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
