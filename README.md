# TripWise: Intelligent Travel Architecture

TripWise is a modern, full-stack travel planning application that leverages artificial intelligence to architect highly optimized, personalized itineraries. By analyzing travel constraints—such as budget, season, duration, and personal travel styles—TripWise autonomously constructs comprehensive day-by-day routes and interactive map visualizations to eliminate the stress of manual trip planning.

## Tech Stack Overview

### Frontend Architecture
- **Next.js 16 (React 19)**: Framework for dynamic rendering and routing.
- **Tailwind CSS**: Utility-first CSS framework for rapid, responsive UI development.
- **Lucide React**: Modern iconography system.
- **Leaflet & React-Leaflet**: Geospatial mapping and routing visualizations.
- **Clerk**: Secure, drop-in user authentication.

### Backend Architecture
- **Java Spring Boot 3**: High-performance backend REST API.
- **Spring AI**: Direct integration with Large Language Models (Google Gemini) for structured itinerary generation.
- **Spring Security**: JWT-based authentication bridging Clerk tokens to backend resource access.
- **PostgreSQL (Supabase)**: Relational database for persistent storage of trips, activities, and media.
- **AWS S3**: Scalable cloud object storage for user-uploaded travel documents and media.

---

## Complete Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- Java Development Kit (JDK 21)
- Maven
- An active Supabase project (PostgreSQL)
- Clerk account for authentication
- Google Gemini API key
- AWS account (for S3 bucket access)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/TripWise.git
cd TripWise
```

### 2. Backend Setup
Navigate to the `backend` directory and configure your environment variables.

```bash
cd backend
cp .env.example .env
```

Open the `.env` file and populate it with your cloud credentials:
```env
# Supabase PostgreSQL connection details
SUPABASE_DB_URL=jdbc:postgresql://<DB_HOST>:5432/postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=<YOUR_SUPABASE_PASSWORD>

# Clerk Authentication
CLERK_ISSUER_URL=https://<YOUR_CLERK_FRONTEND_API_URL>

# Gemini AI (used with Spring AI)
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>

# AWS S3 Settings
AWS_BUCKET_NAME=<YOUR_S3_BUCKET_NAME>
AWS_REGION=<YOUR_AWS_REGION>
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
```

Build and run the Spring Boot server:
```bash
./mvnw clean package -DskipTests
set -a && source .env && set +a
./mvnw spring-boot:run
```
The backend will launch on `http://localhost:8080`.

### 3. Frontend Setup
Open a new terminal window, navigate to the `frontend` directory, and install dependencies.

```bash
cd frontend
npm install
```

Set up the frontend environment variables:
```bash
cp .env.local.example .env.local
```

Open `.env.local` and populate your Clerk publishable and secret keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Start the Next.js development server:
```bash
npm run dev
```
The frontend application is now accessible at `http://localhost:3000`.

---

## Core System Architecture

TripWise follows a decoupled, client-server architecture:

1. **Authentication Flow**: The user authenticates against the Clerk service on the Next.js frontend. Upon successful login, Clerk issues a JWT. The frontend intercepts all subsequent Axios requests and attaches this JWT to the Authorization header.
2. **Authorization & Security**: The Spring Boot backend uses `Spring Security OAuth2 Resource Server` to decode and validate the incoming JWT against the `CLERK_ISSUER_URL`. Valid requests are permitted to interact with the protected API routes.
3. **AI Generation Pipeline**: 
   - Users prompt the intelligence engine via the frontend.
   - The Spring Boot backend accepts the parameters and constructs a highly specific, constrained prompt.
   - `Spring AI` interfaces with the Google Gemini API to return a structured JSON response.
   - The backend passes the JSON blueprint to the frontend, which parses it, renders the initial preview, and securely stores the finalized Itinerary objects into the Supabase PostgreSQL database.
4. **Media Processing**: Media files (e.g., flight tickets, hotel reservations) are uploaded through the frontend via `multipart/form-data`. The backend `S3Service` processes the multipart payload and synchronizes it directly to an AWS S3 bucket, returning a permanent CDN URL for the database to track.
