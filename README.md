# Welcome, Here you have everything related to the project! 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

To Get started:

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).



Link for project books, video, and presentation:

https://drive.google.com/drive/folders/1WqcwNxWiOL9w0j0sRL9UUgYrVzqS3zNI?usp=sharing


########## IMPORTANT ##########

to start the server:

inside VSCode terminal:

cd server

npm install (just for the first time)

npm start dev

then to start the the app:

inside computer tterminal:

cd SportEvents

npx expo start

then...

Change the IP inside constants -> api.ts to make sure that server will start fully functional.

Expo versions:

expo@54.0.30

expo-constants@18.0.12
 
expo-font@14.0.10
 
expo-router@6.0.21
 

Packages:

├── @react-native-async-storage/async-storage@2.2.0

├── @tensorflow/tfjs-backend-cpu@4.22.0

├── @tensorflow/tfjs@4.22.0

├── axios@1.13.2

├── cors@2.8.5

├── dotenv@17.2.3

├── express@5.1.0

├── mongoose@8.19.4

########## IMPORTANT ##########



===========================================
ENVIRONMENT VARIABLES FOR SPORTS APP
===========================================

Copy this content into server/.env file:

PORT=4000
MONGODB_URI=mongodb+srv://AhmadAJ:abojablahmad123@cluster0.blbrqyj.mongodb.net/Sports_Events?retryWrites=true&w=majority&appName=Cluster0
NEWS_API_KEY=c0a55249c74348468efca15bba7a8ce6
API_FOOTBALL_KEY=bf6d4b2c793f19ead3494a046d3df7ce
SPORTMONKS_API_KEY=0Dp1wAE5lGy9hCRlENVZD3ZM5KYKfDoaZsk5awK0K9FVJMZ5gPtqkgufoKlp

===========================================
SETUP INSTRUCTIONS:
1. Navigate to server folder
2. Create a file named .env
3. Paste the above content
4. Save the file
5. Run: npm install
6. Run: npm run dev
===========================================

------------------------------------------------------------------------------------------------------------------------

In case the above variables did not work for you,
then here is how you can get your personal required variables that need to be set in `server/.env`:

### Required Variables:

**MONGODB_URI**
- Description: MongoDB Atlas connection string
- Format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
- How to obtain: 
  1. Go to MongoDB Atlas (mongodb.com)
  2. Clusters → Connect → Drivers
  3. Copy connection string
  4. Replace <password> with your database password

**API_FOOTBALL_KEY**
- Description: API key for football match data
- Format: 32-character alphanumeric string
- How to obtain:
  1. Go to api-football.com
  2. Sign up for Pro plan
  3. Copy API key from dashboard

**NEWS_API_KEY**
- Description: API key for sports news articles
- Format: 32-character alphanumeric string
- How to obtain:
  1. Go to newsapi.org
  2. Sign up for free account
  3. Copy API key from dashboard

**PORT**
- Description: Server port number
- Default: 4000

---------------------------------------------------------------
### Example .env File:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sports-events
API_FOOTBALL_KEY=abc123...
NEWS_API_KEY=xyz789...
PORT=4000
