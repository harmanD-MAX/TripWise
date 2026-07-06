# TripWise

TripWise is a full-stack web application designed to simplify travel planning. Instead of manually mapping out destinations and calculating costs, users can input their preferences and let the system generate a complete day-by-day itinerary.

The project uses Next.js for the frontend and Java Spring Boot for the backend API, and is fully deployed on AWS (Frontend on AWS Amplify, Backend on AWS EC2).

## Features

- **Itinerary Generation**: Connects to Google Gemini to build detailed travel plans based on a user's budget, travel style, and destination. The backend takes the AI's response and structures it into specific days and activities before saving it to the database.
- **Route Optimization (TSP)**: Features a Traveling Salesperson Problem (TSP) algorithm powered by the OSRM API. Users can click "Optimize Route" on any day's itinerary to automatically reorder activities and minimize overall travel distance.
- **Interactive Maps**: Uses Leaflet to display the trip visually. The map updates dynamically when you select a specific day in the UI, filtering out other days to show only the relevant routes and coordinate pins. It now features a dynamic **Map Layer Control** allowing users to seamlessly toggle between Satellite, Street Map, Topographic, and Dark Mode styles.
- **AI Budget Planner**: The system predicts your total expected spend using AI along with generating the itinerary, intelligently displaying the correct local currency based on the destination. It tracks expenses categorized into groups like Food, Transport, and Lodging, calculating the remaining budget in real-time.
- **Media Storage**: Allows users to upload flight tickets, hotel reservations, and trip photos directly to their itinerary. The files are securely streamed and stored in an AWS S3 bucket.
- **Intelligence Report & AI Assistant**: A smart analysis feature that reads the generated itinerary and flags potential issues. Includes an interactive AI chat assistant for asking real-time travel questions about the destination.
- **Live Weather**: Integrated weather widget that pulls real-time climate data for the trip destination.
- **Trip Templates**: Allows users to save favorite trips as templates and instantly duplicate them for future travel plans.

## Tech Stack

Frontend:
- Next.js 16
- React 19
- Tailwind CSS
- Leaflet Maps
- Clerk (Authentication)
- AWS Amplify (Deployment)

Backend:
- Java Spring Boot 3
- Spring Security (JWT)
- Spring AI
- PostgreSQL (Supabase)
- AWS S3
- AWS EC2 (Deployment)



## Local Setup

### Backend

1. Navigate into the backend directory:
```bash
cd backend
```

2. Create a `.env` file in the root of the backend directory with the following keys. You will need to get these values from Supabase, Clerk, Google Gemini, and AWS:
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

3. Compile the Java application and start the Spring Boot server:
```bash
./mvnw clean package -DskipTests
set -a && source .env && set +a
./mvnw spring-boot:run
```
The backend API will start running on port 8080.

### Frontend

1. Open a new terminal and navigate into the frontend directory:
```bash
cd frontend
```

2. Copy the example environment file to create your local config:
```bash
cp .env.local.example .env.local
```

3. Open `.env.local` and add your Clerk public/secret keys. Also make sure the API URL points to your local backend:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<YOUR_CLERK_SECRET_KEY>
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Install the Node dependencies and start the Next.js development server:
```bash
npm install
npm run dev
```

The web application will now be available in your browser at http://localhost:3000.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
