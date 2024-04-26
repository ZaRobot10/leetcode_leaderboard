import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { LeetCode } from "leetcode-query";
import { MongoClient, ServerApiVersion } from 'mongodb';
import rateLimit from 'express-rate-limit';
import puppeteer from 'puppeteer';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import moment from 'moment';

dotenv.config(); // Load environment variables from .env file
const app = express();
const port = 3000;
const uri = process.env.MONGODB_URI;
const leetcode = new LeetCode();

// Trust proxy headers
app.set('trust proxy', true);

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 100 requests per windowMs
  });
  
  // Apply rate limiter to all requests
  app.use(limiter);

  // Custom middleware to log blocked IP addresses
app.use((req, res, next) => {
    if (req.rateLimit && req.rateLimit.remaining === 0) {
        console.log(`IP Address ${req.ip} is blocked due to rate limiting.`);
    }
    next();
});
// middleware
app.use(express.static('public'));

app.set('view engine', 'ejs');
var count = 0;

var flag = true;

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
    { user: 'pranay_nsut8', problems: [5, 1, 2, 2] },
    { user: 'ananyak84', problems: [5, 1, 2, 2] },
    { user: 'harshitchawla335', problems: [5, 1, 2, 2] },
    { user: 'madhurbakshi', problems: [5, 1, 2, 2] }
    
];

var submissons = [];

var previousDate =  "2024-3-25";




// Function to capture screenshot after clicking the "Weekly" button and push it to GitHub
async function captureScreenshotAndPushToGitHub(url, outputPath, repositoryOwner, repositoryName, commitMessage, accessToken) {
    // Launch headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Click the "Weekly" button using evaluate
        await page.evaluate(() => {
            document.getElementById('weekly').click();
        });

        // Wait for the content to load after clicking the button
        await page.waitForSelector('#leaderboard tbody tr', { timeout: 10000 }); // Adjust the selector as needed

        // Capture screenshot

        await page.screenshot({ path: outputPath });

        console.log('Screenshot captured successfully after clicking the "Weekly" button!');

        const currentYear = moment().isoWeekYear(); // Get the current ISO week year
        const currentWeek = moment().isoWeek(); // Get the current ISO week number
        const outputPath_github = `${currentYear}_week${currentWeek}.png`; // Path for the screenshot using current year and week number

        // Push the screenshot to GitHub repository
        const octokit = new Octokit({ auth: accessToken });
        const fileContent = fs.readFileSync(outputPath);
        await octokit.repos.createOrUpdateFileContents({
            owner: repositoryOwner,
            repo: repositoryName,
            path: `screenshots/${outputPath_github}`, // Path where the screenshot will be stored in the repository
            message: commitMessage,
            content: fileContent.toString('base64'),
            branch: 'main' // Replace with the target branch
        });

        console.log('Screenshot pushed to GitHub successfully!');
    } catch (error) {
        console.error('Error capturing screenshot after clicking the "Weekly" button or pushing to GitHub:', error);
    } finally {
        // Close the browser
        await browser.close();
    }
}

// Example usage
const url = 'https://leetcode-leaderboard-fj91.onrender.com/'; // Replace with your website's URL
const outputPath = 'weekly_standings_screenshot.png'; // Path to save the screenshot
const repositoryOwner = 'ZaRobot10'; // Replace with your GitHub username or organization name
const repositoryName = 'leetcode_leaderboard'; // Replace with your GitHub repository name
const commitMessage = 'Add weekly standings screenshot'; // Commit message
const accessToken =  process.env.GITHUB_ACCESS_TOKEN; // Replace with your GitHub personal access token



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


function unixTimeToNormal(unixTime) {
    // Convert Unix time (seconds since the Unix epoch) to milliseconds
    const milliseconds = unixTime * 1000;

    // Create a new Date object using the milliseconds
    const dateObject = new Date(milliseconds);

    // Adjust time for IST (UTC+5:30)
    const ISTOffset = 330 * 60000; // 5.5 hours in milliseconds
    const ISTTime = new Date(dateObject.getTime() + ISTOffset);

    // Extract the components of the date
    const year = ISTTime.getFullYear();
    const month = ('0' + (ISTTime.getMonth() + 1)).slice(-2); // Months are zero-based
    const day = ('0' + ISTTime.getDate()).slice(-2);
    let hours = ISTTime.getHours();
    const minutes = ('0' + ISTTime.getMinutes()).slice(-2);
    const seconds = ('0' + ISTTime.getSeconds()).slice(-2);
    let period = 'AM';

    // Convert hours to 12-hour clock format and determine AM/PM
    if (hours >= 12) {
        period = 'PM';
    }
    if (hours > 12) {
        hours -= 12;
    }
    if (hours === 0) {
        hours = 12;
    }

    // Construct the human-readable date and time format
    const normalTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${period}`;

    return normalTime;
}

  
  // Example usage:
  const unixTimestamp = 1712161200; // Unix timestamp (seconds since epoch)
  const normalTime = unixTimeToNormal(unixTimestamp);
  console.log(normalTime); // Output: 2021-03-31 12:00:00 AM
  

app.get('/', async (req, res) => {

    console.log(`[${new Date().toISOString()}] Request from ${req.ip}: ${req.method} ${req.url}`);
        count++;
        console.log(count + '. Fetching user data...');

    try { 
        
        submissons = [];
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

            await captureScreenshotAndPushToGitHub(url, outputPath, repositoryOwner, repositoryName, commitMessage, accessToken);

            // update problems inside user_names with the new data && update the problems in userNames

            for (var i = 0; i < user_solved.length; i++) {
                user_solved[i].problems = [user_solved[i].total, user_solved[i].easy, user_solved[i].medium, user_solved[i].hard];
                userNames[i].problems = [user_solved[i].total, user_solved[i].easy, user_solved[i].medium, user_solved[i].hard];



            }
            await insertWeeklyRecords(userNames);
            

            
           
        }
               user_solved.sort((a, b) => b.points - a.points);
               submissons.sort((a, b) => b.timestamp - a.timestamp);

        

        console.log('User data fetched successfully.');
        
        if (flag)
        {
            flag = false;
            await captureScreenshotAndPushToGitHub(url, outputPath, repositoryOwner, repositoryName, commitMessage, accessToken);
        }
        
        res.render('index', { user_solved : user_solved, submissions: submissons, previousDate: previousDate});
    } 
    catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});


async function fetchUserData(username, problems) {
    const result = await leetcode.user(username);

    // console.log(result);

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

    for (var i = 0; i < result.recentSubmissionList.length; i++) {
        const submissonsData = {
            user: username,
            title: result.recentSubmissionList[i].title,
            titleSlug: result.recentSubmissionList[i].titleSlug,
            statusDisplay: result.recentSubmissionList[i].statusDisplay,
            timestamp: result.recentSubmissionList[i].timestamp,
            time : unixTimeToNormal(result.recentSubmissionList[i].timestamp)
        };

        if (username != 'za_robot10')
        {
            submissons.push(submissonsData);
        
        }

        
    }

    return user;
}


app.listen(port, () => {

    console.log(`Server is running on port http://localhost:${port}`);
});


// async function insertOneRecord() {
//     const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     try {
//         await client.connect();
//         console.log("Connected to MongoDB");

//         const database = client.db("leaderboard");
//         const weeklyRecordsCollection = database.collection("weekly_records");

//         const record = {
//             id: 14,
//             user: "madhurbakshi",
//             problems: [182, 70, 94, 18],
//             date: new Date() // Add the current date
//         };

//         await weeklyRecordsCollection.insertOne(record);

//         console.log("Record inserted successfully:", record);
//     } catch (error) {
//         console.error("Error inserting record:", error);
//     } finally {
//         await client.close();
//     }
// }

// insertOneRecord();
