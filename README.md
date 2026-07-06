The goal of this project was to create a clean, full-stack travel planning application that you could actually use to architect highly optimized, personalized itineraries. It handles everything from generating structured day-by-day routes using AI, to tracking budgets and visualizing interactive maps.

## How it works (The Architecture
The whole thing is built using Next.js 16 for the frontend and Java Spring Boot 3 for the backend. I used Spring Security and Clerk because I wanted to handle JWT-based authentication without building a massive custom auth framework.

When the web client talks to the server, it sends standard REST API requests, securely attaching the Clerk JWT to the Authorization header so the backend can validate who is making the request.

For storing data, I split things into two places:

- **PostgreSQL (Supabase):** This holds all the permanent stuff—user accounts, saved trips, activities, expenses, and media metadata. 
- **AWS S3:** This acts as a highly scalable object store. It handles all the heavy lifting for the actual travel documents, tickets, and photos users upload to their trips.

All the different AI generation tasks (like prompting Google Gemini) live in the backend using Spring AI. To keep things clean and responsive, the server constructs constrained JSON blueprints and passes them back to the Next.js client, which handles the UI state and map rendering in the browser.

## Features

### Intelligent Itinerary Generation
If you don't want to manually plan your trip, you shouldn't have to. The backend handles this by taking your budget, destination, and travel style, and passing it through Google Gemini. The server then returns a highly structured, day-by-day itinerary complete with estimated costs, coordinate data, and local insights.

### Interactive Map Routing
Players... I mean, travelers, can view their entire trip on an interactive Leaflet map. The frontend remembers the geographical coordinates of every activity. I added client-side filtering so that when you expand a specific day in your itinerary, the map instantly updates to show only the pins and routes for that exact day.

### Dynamic Budget Tracking
You can set a total budget for your trip. As you generate activities or manually log expenses in the Budget Planner, the frontend calculates your remaining budget in real-time. Everything is categorized (Food, Transport, Lodging) so you know exactly where your money is going.

### Trip Media Gallery
You can also upload your tickets and confirmation documents directly to the trip. The server securely streams your files straight into an AWS S3 bucket and saves the permanent CDN link to Postgres. 

### Intelligence Report
The system analyzes your itinerary and provides a smart "Intelligence Report." This gives you high-impact, global optimization suggestions—like warning you about heavy walking days or suggesting cheaper transport alternatives—so you don't make rookie travel mistakes.

## Testing it out (Local Setup)
I built this to be run locally if you want to test the entire backend without having to deploy it to AWS every time. If you want to try it out locally on macOS, here is how you set it up.

First, install the backend dependencies using Homebrew:
```bash
brew install openjdk@21 maven
```

Make sure you have Node.js installed for the frontend:
```bash
brew install node
```

Set up the database and services (You will need Supabase, Clerk, AWS, and Gemini keys):
In the backend folder, create your `.env`:
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

Compile and run the server:
```bash
cd backend
./mvnw clean package -DskipTests
set -a && source .env && set +a
./mvnw spring-boot:run
```

Run the frontend:
```bash
cd frontend
cp .env.local.example .env.local
# Add your Clerk keys and set NEXT_PUBLIC_API_URL=http://localhost:8080
npm install
npm run dev
```

## Step-by-Step Test Guide
Once the server is running on `localhost:8080` and the frontend is on `localhost:3000`, open your browser to `http://localhost:3000`.

**Register & Login**
1. Click Sign In and use the Clerk popup to create an account.
2. You'll be redirected to your personal dashboard.

**AI Generation**
1. Click "New Trip". 
2. Type in a destination (e.g., Tokyo), select a travel style, and set a budget.
3. Click "Generate Trip". After a few seconds, the AI will build your entire itinerary and the UI will transition to the Trip Dashboard.

**Map & Itinerary System**
1. Scroll down to the itinerary list.
2. Click on "Day 1". Notice how the interactive map on the right collapses all other routes and zooms in perfectly on Day 1's activities.

**Media & Budgeting**
1. Scroll down to the Media Gallery and click "Upload File". Select a picture from your computer. It will upload to AWS S3 and appear in the grid!
2. Go to the Budget section and add a manual expense (e.g., "$50 for Sushi"). Watch the progress bar instantly recalculate your remaining trip budget.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
