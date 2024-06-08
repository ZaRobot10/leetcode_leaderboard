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
    max: 50, // limit each IP to 50 requests per windowMs
});

// Custom middleware to block HEAD requests from localhost
const customRateLimit = (req, res, next) => {
    if (req.ip === '::1' && req.method === 'HEAD') {
        // If the request is a HEAD request from localhost, send a 403 Forbidden response
        return res.status(403).send('Forbidden');
    }
    // If the request is not a HEAD request from localhost, allow it to proceed
    next();
};

// Apply custom rate limiter middleware to HEAD requests from localhost
app.use(customRateLimit);

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

const days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

var previousDate;

var daily_solved = [];

var daily_problem = await leetcode.daily();
daily_problem = daily_problem.question.titleSlug;

// Function to capture screenshot after clicking the "Weekly" button and push it to GitHub
async function captureScreenshotAndPushToGitHub(url, outputPath, repositoryOwner, repositoryName, commitMessage, accessToken) {
    // Launch headless browser
    const browser = await puppeteer.launch({
        args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--single-process",
          "--no-zygote",
        ],
        executablePath:
          process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
      });
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
            path: `public/screenshots/${outputPath_github}`, // Path where the screenshot will be stored in the repository
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
const url = 'https://leetcode-leaderboard-2.onrender.com/'; // Replace with your website's URL
const outputPath = 'weekly_standings_screenshot.png'; // Path to save the screenshot
const repositoryOwner = 'ZaRobot10'; // Replace with your GitHub username or organization name
const repositoryName = 'leetcode_leaderboard'; // Replace with your GitHub repository name
const commitMessage = 'Add weekly standings screenshot'; // Commit message
const accessToken =  process.env.GITHUB_ACCESS_TOKEN; // Replace with your GitHub personal access token


async function updateProblemsAndDateInUserNames(userNames) {
    const client = new MongoClient(uri);
  
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    
        const database = client.db("leaderboard");
        const weeklyRecordsCollection = database.collection("weekly_records");

        const daily_solved_collection = database.collection("daily_solved");

        const cursor = daily_solved_collection.find({});

        // Iterating through the cursor and pushing documents to daily_solved array
        await cursor.forEach(doc => {
            daily_solved.push({
                user: doc.user,
                daily_solved: doc.daily_solved
            });
        });

        // console.log('Retrieved data:', daily_solved);

        
    
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
    
    const client = new MongoClient(uri);
  
    try {
      await client.connect();
      console.log("Connected to MongoDB");
  
      const database = client.db("leaderboard");
      const weeklyRecordsCollection = database.collection("weekly_records");

      // Delete existing records
      const deleteResult = await weeklyRecordsCollection.deleteMany({});
      
      // Get current date
      var date = new Date(previousDate.format());
      date.setMinutes(date.getMinutes() + 330);

      // Insert new records
      for (let i = 0; i < userNames.length; i++) {
        const { user, problems } = userNames[i];
        
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

        var new_daily_problem = await leetcode.daily();
        new_daily_problem = new_daily_problem.question.titleSlug;

        if (daily_problem != new_daily_problem)
            {
                daily_problem = new_daily_problem;
                daily_solved = [];
                for (var i = 0; i < userNames.length; i++) {
                    daily_solved.push({
                        user: userNames[i].user,
                        daily_solved: false
                    });
                }
            }

        submissons = [];
        const user_solved = await Promise.all(userNames.map(username => fetchUserData(username.user, username.problems)));

      
        // console.log(daily_problem);

        // Sort the user_solved array in descending order of points

        var currentDate = moment().utcOffset("+05:30");
        console.log(currentDate);

        // Set hours, minutes, and seconds to zero
        currentDate.hours(0);
        currentDate.minutes(0);
        currentDate.seconds(0);
        currentDate.milliseconds(0);

        console.log(currentDate);
        
        var current_year = currentDate.year();
        var current_week = currentDate.isoWeek();
        
        
        previousDate = moment(previousDate);
        previousDate.utcOffset('+05:30');
        console.log(previousDate);
        // Set hours, minutes, and seconds to zero
        previousDate.hours(0);
        previousDate.minutes(0);
        previousDate.seconds(0);
        previousDate.milliseconds(0);
       
       
        // Calculate the difference in days
        var differenceInDays = currentDate.diff(previousDate, 'days');
        console.log(differenceInDays);
        
        console.log(previousDate);

        
        var day = days[currentDate.day()];
        console.log(day);
    
        
        // Check if the difference is 7 days or more
        if (differenceInDays >= 7) {
            // Update prev with today's date
            previousDate = currentDate;

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
        await updateDailySolvedTable();
       
        res.render('index', { user_solved : user_solved, submissions: submissons, previousDate: previousDate, day: day , current_year: current_year, current_week: current_week, daily_problem: daily_problem, daily_solved: daily_solved});
    } 
    catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Function to empty the daily_solved table and fill it with data from the array
async function updateDailySolvedTable() {
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const database = client.db('leaderboard');
        const dailySolvedCollection = database.collection('daily_solved');

        // Delete all documents in the daily_solved collection
        await dailySolvedCollection.deleteMany({});

        // Insert new data from the array into the daily_solved collection
        await dailySolvedCollection.insertMany(daily_solved);

        console.log('Daily solved table updated successfully.');
    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        await client.close();
    }
}

async function fetchUserData(username, problems) {
    const result = await leetcode.user(username);

    // console.log(result);
    var error = false;
    var user;
    try
    {
    user = {
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
}
catch (err)
{
    error = true;
    console.log('Error fetching user data for:', username);
    user = {
        name: username,
        easy: 0,
        medium: 0,
        hard: 0,
        total: 0,
        points: 0,
        problems: problems
    };
}

    if (!error)
    {

        
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
        
            if (result.recentSubmissionList[i].titleSlug == daily_problem && result.recentSubmissionList[i].statusDisplay == 'Accepted')
            {
                daily_solved.find(element => element.user == username).daily_solved = true;
                
            }

            
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

//         var date = new Date(previousDate.format());
//         date.setMinutes(date.getMinutes() + 330);

//         const record = {
//             id: 15,
//             user: "dabur",
//             problems: [182, 70, 94, 18],
//             date:  date// Add the current date
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

// const result = await leetcode.daily();

// console.log(result);


// Function to insert data into daily_solved collection
// async function insertData() {
//     const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     try {
//         await client.connect();

//         const database = client.db('leaderboard');
//         const collection = database.collection('daily_solved');

//         // Inserting data for each user
//         for (const user of userNames) {
//             const data = {
//                 user: user.user,
//                 daily_solved: false
//             };

//             // Inserting the data
//             const result = await collection.insertOne(data);
//             console.log(`Inserted user ${user.user} with _id: ${result.insertedId}`);
//         }
//     } catch (error) {
//         console.error('Error occurred:', error);
//     } finally {
//         await client.close();
//     }
// }

// // Calling the function to insert data
// await insertData();
