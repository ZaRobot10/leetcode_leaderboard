import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { LeetCode } from "leetcode-query";
import { MongoClient, ServerApiVersion } from 'mongodb';
import rateLimit from 'express-rate-limit';



dotenv.config(); // Load environment variables from .env file
const app = express();
const port = 3000;
const uri = process.env.MONGODB_URI;
const leetcode = new LeetCode();


// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });
  
  // Apply rate limiter to all requests
  app.use(limiter);

// middleware
app.use(express.static('public'));

app.set('view engine', 'ejs');
var count = 0;

var userNames = [
    { user: 'kalpit04', problems: [5, 1, 2, 2] },
    { user: '_Code_Shark', problems: [5, 1, 2, 2] },
    { user: '8178458001', problems: [5, 1, 2, 2] },
    { user: 'za_robot10', problems: [5, 1, 2, 2] },
    { user: 'dsharma02102004', problems: [5, 1, 2, 2] },
    { user: 'varun9904', problems: [5, 1, 2, 2] },
    { user: 'krishankant_nsut', problems: [5, 1, 2, 2] },
    { user: 'D-01000100', problems: [5, 1, 2, 2] },
    { user: 's1marjeet_singh', problems: [5, 1, 2, 2] },
    { user: 'aadichachra', problems: [5, 1, 2, 2] },
    { user: 'pranay_nsut8', problems: [5, 1, 2, 2] }
    
];

var previousDate =  "2024-3-25";


async function updateProblemsAndDateInUserNames(userNames) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    
        const database = client.db("leaderboard");
        const weeklyRecordsCollection = database.collection("weekly_records");
    
        for (let i = 0; i < userNames.length; i++) {
            const { user } = userNames[i];
            const record = await weeklyRecordsCollection.findOne({ user }); // Find record by user
            if (record) {
                // If record found, update problems array in userNames
                userNames[i].problems = record.problems;
                // Update previousDate with date from database record

                if (i == 0)
                {
                    previousDate = record.date;
                }
                
            } else {
                console.log(`Record for user ${user} not found.`);
            }
        }
    
        console.log("Updated userNames array with problems and previousDate from database.");
    } catch (error) {
        console.error("Error updating userNames array:", error);
    } finally {
        await client.close();
    }
}

await updateProblemsAndDateInUserNames(userNames);



async function insertWeeklyRecords(userNames) {
    
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
      await client.connect();
      console.log("Connected to MongoDB");
  
      const database = client.db("leaderboard");
      const weeklyRecordsCollection = database.collection("weekly_records");

      // Delete existing records
      const deleteResult = await weeklyRecordsCollection.deleteMany({});
  
      // Insert new records
      for (let i = 0; i < userNames.length; i++) {
        const { user, problems } = userNames[i];
        const date = new Date(); // Get current date
        await weeklyRecordsCollection.insertOne({ id: i + 1, user, problems, date });
      }
  
      console.log(`${userNames.length} records inserted successfully.`);
    } catch (error) {
      console.error("Error inserting records:", error);
    } finally {
      await client.close();
    }
}



app.get('/', async (req, res) => {

    console.log(`[${new Date().toISOString()}] Request from ${req.ip}: ${req.method} ${req.url}`);
        count++;
        console.log(count + '. Fetching user data...');

    try { 
        
        
        const user_solved = await Promise.all(userNames.map(username => fetchUserData(username.user, username.problems)));

        // Sort the user_solved array in descending order of points

        
        var currentDate = new Date();console.log(currentDate);
        var prevDate = new Date(previousDate);

        currentDate.setHours(0, 0, 0, 0);
        prevDate.setHours(0, 0, 0, 0);

        var differenceInMilliseconds = currentDate - prevDate;

        // Convert milliseconds to days
        var differenceInDays = differenceInMilliseconds / (1000 * 3600 * 24);
        console.log(differenceInDays);

        console.log(prevDate);
        console.log(currentDate);
        
        // Check if the difference is 7 days or more
        if (differenceInDays >= 7) {
            // Update prev with today's date
            previousDate = currentDate.toISOString().slice(0, 10);

            

            // update problems inside user_names with the new data && update the problems in userNames

            for (var i = 0; i < user_solved.length; i++) {
                user_solved[i].problems = [user_solved[i].total, user_solved[i].easy, user_solved[i].medium, user_solved[i].hard];
                userNames[i].problems = [user_solved[i].total, user_solved[i].easy, user_solved[i].medium, user_solved[i].hard];



            }
            await insertWeeklyRecords(userNames);

            
           
        }

               user_solved.sort((a, b) => b.points - a.points);
        

        console.log('User data fetched successfully.');

        res.render('index', { user_solved });
    } 
    catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function fetchUserData(username, problems) {
    const result = await leetcode.user(username);

    // console.log(result);
    const user = {
        name: username,
        easy: result.matchedUser.submitStats.acSubmissionNum[1].count,
        medium: result.matchedUser.submitStats.acSubmissionNum[2].count,
        hard: result.matchedUser.submitStats.acSubmissionNum[3].count,
        total: result.matchedUser.submitStats.acSubmissionNum[0].count,
        points: result.matchedUser.submitStats.acSubmissionNum[1].count + 
                2 * result.matchedUser.submitStats.acSubmissionNum[2].count + 
                4 * result.matchedUser.submitStats.acSubmissionNum[3].count,
        problems: problems
    };
    return user;
}


app.listen(port, () => {

    console.log(`Server is running on port http://localhost:${port}`);
});


