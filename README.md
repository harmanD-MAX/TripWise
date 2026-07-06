# TripWise

TripWise is a full-stack web application designed to simplify travel planning. Instead of manually mapping out destinations and calculating costs, users can input their preferences and let the system generate a complete day-by-day itinerary.

The project uses Next.js for the frontend and Java Spring Boot for the backend API.

## Core Features

- Itinerary Generation: Connects to Google Gemini to build detailed travel plans based on a user's budget, style, and location.
- Interactive Maps: Uses Leaflet to display the trip. The map updates dynamically when you select a specific day to show only the relevant routes and pins.
- Budget Planner: Tracks expenses and categorizes them (e.g., Food, Transport). It recalculates the remaining budget in real-time as new expenses are added.
- Media Storage: Allows users to upload tickets and photos. The files are securely stored in AWS S3 and linked to the trip via the database.
- Intelligence Report: A small feature that reads the generated itinerary and flags potential issues, like days with too much walking.

## Tech Stack

Frontend:
- Next.js 16
- React 19
- Tailwind CSS
- Leaflet Maps
- Clerk (Authentication)

Backend:
- Java Spring Boot 3
- Spring Security (JWT)
- Spring AI
- PostgreSQL (Supabase)
- AWS S3

## Local Setup

### Backend
1. Go into the backend directory.
2. Create a `.env` file with the following keys:
   SUPABASE_DB_URL, SUPABASE_DB_USERNAME, SUPABASE_DB_PASSWORD, CLERK_ISSUER_URL, GEMINI_API_KEY, AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
3. Run the application:
   ./mvnw clean package -DskipTests
   set -a && source .env && set +a
   ./mvnw spring-boot:run

### Frontend
1. Go into the frontend directory.
2. Copy `.env.local.example` to `.env.local`.
3. Add your Clerk keys and set `NEXT_PUBLIC_API_URL=http://localhost:8080`.
4. Install and run:
   npm install
   npm run dev

The app will be available at http://localhost:3000.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
