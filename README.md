# TripWise ✈️

TripWise is a comprehensive, full-stack travel planning platform that leverages artificial intelligence to architect highly optimized, personalized itineraries. By analyzing travel constraints such as budget, destination, and personal travel styles, TripWise autonomously constructs structured day-by-day routes and interactive map visualizations to streamline the travel planning process.

## 🚀 Key Features

*   **Intelligent Itinerary Generation:** Utilizes Google Gemini to automatically generate structured, day-by-day travel plans tailored to user preferences and budgets.
*   **Interactive Geospatial Mapping:** Features dynamic Leaflet maps with client-side routing and day-specific marker filtering for precise geographical planning.
*   **Dynamic Budget Management:** Real-time expense categorization (Food, Transport, Lodging) and remaining budget calculations to ensure financial control during the trip.
*   **Cloud Media Gallery:** Secure, scalable document and image storage integrated directly with AWS S3 for flight tickets, reservations, and travel memories.
*   **AI Intelligence Report:** Provides automated, high-impact global optimization suggestions (e.g., identifying heavily scheduled days or suggesting transport alternatives).
*   **Secure Authentication:** Robust JWT-based authentication bridging Clerk on the frontend with Spring Security on the backend.

## 💻 Tech Stack

### Frontend Architecture
*   **Framework:** Next.js 16 (React 19)
*   **Styling:** Tailwind CSS & Glassmorphism UI
*   **Mapping:** Leaflet & React-Leaflet
*   **Authentication:** Clerk (Next.js SDK)

### Backend Architecture
*   **Framework:** Java Spring Boot 3
*   **AI Integration:** Spring AI (Google Gemini integration)
*   **Security:** Spring Security (JWT Validation)
*   **Database:** PostgreSQL (Hosted via Supabase)
*   **Storage:** AWS S3 (Media & Documents)

## 🏗 Architecture Overview

TripWise operates on a decoupled client-server architecture. 
1.  **Client:** The Next.js web application manages the user interface, interactive map state, and client-side routing.
2.  **API Gateway & Auth:** The client authenticates via Clerk. Standard REST API requests are dispatched to the backend, securely attaching the Clerk JWT in the `Authorization` header.
3.  **Server:** The Spring Boot backend validates the token, processes business logic, and interacts with external services (AWS S3 for object storage, Gemini for AI generation).
4.  **Persistence:** Structured relational data (users, itineraries, expenses, media metadata) is persisted in a remote PostgreSQL database hosted on Supabase.

## ⚙️ Local Development Setup

### Prerequisites
*   Node.js (v18+)
*   Java JDK 21
*   Maven
*   PostgreSQL (or a Supabase account)
*   AWS Account (S3 Bucket)
*   Clerk Account
*   Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the root of the `backend` directory:
   ```env
   SUPABASE_DB_URL=jdbc:postgresql://<DB_HOST>:5432/postgres
   SUPABASE_DB_USERNAME=postgres
   SUPABASE_DB_PASSWORD=<YOUR_PASSWORD>
   CLERK_ISSUER_URL=https://<YOUR_CLERK_URL>
   GEMINI_API_KEY=<YOUR_GEMINI_KEY>
   AWS_BUCKET_NAME=<YOUR_BUCKET>
   AWS_REGION=<YOUR_REGION>
   AWS_ACCESS_KEY_ID=<YOUR_KEY>
   AWS_SECRET_ACCESS_KEY=<YOUR_SECRET>
   ```
3. Compile and start the Spring Boot application:
   ```bash
   ./mvnw clean package -DskipTests
   set -a && source .env && set +a
   ./mvnw spring-boot:run
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the environment variables template:
   ```bash
   cp .env.local.example .env.local
   ```
3. Populate `.env.local` with your Clerk credentials and set the local API URL:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<YOUR_KEY>
   CLERK_SECRET_KEY=<YOUR_SECRET>
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```
4. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
5. Access the application at `http://localhost:3000`.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
