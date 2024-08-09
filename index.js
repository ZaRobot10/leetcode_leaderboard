import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { LeetCode, Credential } from "leetcode-query1";
import { MongoClient, ServerApiVersion } from 'mongodb';
import rateLimit from 'express-rate-limit';
import puppeteer from 'puppeteer';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import moment from 'moment';
import bodyParser from 'body-parser';



dotenv.config(); // Load environment variables from .env file
const app = express();
const port = 3000;
const uri = process.env.MONGODB_URI;
const leetcode = new LeetCode();

const username = process.env.LEETCODE_USERNAME;
const password = process.env.LEETCODE_PASSWORD;
const cookie = process.env.COOKIE;

// Function to introduce a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to handle retry logic
const performLogin = async () => {
    let retries = 5;
    while (retries > 0) {
        try {
            const browser = await puppeteer.launch({
                defaultViewport: {
                    width: 1366,
                    height: 768
                },
                args: [
                    "--disable-setuid-sandbox",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--no-first-run",
                    "--no-err-dev",
                    "--disable-gpu",
                    "--disable-software-rasterizer",
                    "--disable-features=VizDisplayCompositor",
                ],
                executablePath: process.env.NODE_ENV === "production"
                    ? process.env.PUPPETEER_EXECUTABLE_PATH
                    : puppeteer.executablePath(),
            });

            const page = await browser.newPage();

            // Set a realistic user-agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // Add random delays to simulate human typing
            const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

            await page.goto('https://leetcode.com/accounts/login/', { waitUntil: 'networkidle0' });

            // Wait for the login form to be present on the page
            await page.waitForSelector('#id_login');
            await page.waitForSelector('#id_password');
            await page.waitForSelector('#signin_btn');

            // Type slowly like a human would
            await page.type('#id_login', username, { delay: getRandomDelay(300, 700) });
            await page.type('#id_password', password, { delay: getRandomDelay(300, 700) });

            // Wait for the Sign In button to be enabled and click it
            await page.waitForFunction(() => {
                const button = document.querySelector('#signin_btn');
                return button && !button.disabled;
            });

            // Add a slight delay before clicking to simulate a human action
            await delay(getRandomDelay(500, 1000));
            await page.click('#signin_btn');

            // Wait for navigation to complete after login
            await page.waitForNavigation({ waitUntil: 'networkidle0' });

            // Get cookies
            const cookies = await page.cookies();
            const session = cookies.find(cookie => cookie.name === 'LEETCODE_SESSION');

            console.log("found");

            if (session) {
                // Read the existing .env file content
                let envContent = '';
                try {
                    envContent = fs.readFileSync('.env', 'utf-8');
                } catch (error) {
                    console.error('Failed to read .env file:', error);
                }
                
                // Update the COOKIE value
                const updatedEnvContent = envContent
                    .split('\n')
                    .map(line => line.startsWith('COOKIE=') ? `COOKIE=${session.value}` : line)
                    .join('\n');

                // Write the updated content back to the .env file
                try {
                    fs.writeFileSync('.env', updatedEnvContent);
                } catch (error) {
                    console.error('Failed to write to .env file:', error);
                }
            } else {
                console.error('LEETCODE_SESSION cookie not found');
            }

            await browser.close();
            return; // Exit the function if successful
        } catch (error) {
            console.error('Error occurred:', error);
            retries--;
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                await delay(3000); // Wait before retrying (adjust delay as needed)
            } else {
                console.error('All retry attempts failed.');
            }
        }
    }
};

// Call the function with retry logic


const credential = new Credential(); // Create a new Credential instance
    await credential.init(cookie); // Initialize the credential with the session

    const leetcode_auth = new LeetCode(credential); 

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
app.use(bodyParser.json());
app.set('view engine', 'ejs');
var count = 0;

var flag = true;

const days = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

var userNames = [
    { user: 'kalpit04', problems: [5, 1, 2, 2] },
    { user: '_Code_Shark', problems: [5, 1, 2, 2] },
    { user: 'CipherSage05', problems: [5, 1, 2, 2] },
    { user: 'za_robot10', problems: [5, 1, 2, 2] },
    { user: 'dsharma02102004', problems: [5, 1, 2, 2] },
    { user: 'varun9904', problems: [5, 1, 2, 2] },
    { user: 'krishankant_nsut', problems: [5, 1, 2, 2] },
    { user: 'djKing-01000100', problems: [5, 1, 2, 2] },
    { user: 's1marjeet_singh', problems: [5, 1, 2, 2] },
    { user: 'aadichachra', problems: [5, 1, 2, 2] },
    { user: 'BinaryWizard_8', problems: [5, 1, 2, 2] },
    { user: 'ananyak84', problems: [5, 1, 2, 2] },
    { user: 'harshghai', problems: [5, 1, 2, 2] },
    { user: 'madhurbakshi', problems: [5, 1, 2, 2]},
    { user: 'Night_sky_delta', problems: [5, 1, 2, 2] }
    
];

var submissons = [];

var previousDate;

var daily_solved = [];

var daily_problem = await leetcode.daily();
daily_problem = daily_problem.question.titleSlug;

var contest = [];
const getUserContestRecords = async (username) => {
    try {
      // Fetch user contest records
      const data = await leetcode.user_contest_info(username);
  
      // Default userContestRanking object
      const defaultUserContestRanking = {
        attendedContestsCount: 0,
        rating: 0,
        globalRanking: "NA",
        totalParticipants: 573899,
        topPercentage: "NA",
        badge: null
      };
  
      // Use default if userContestRanking is null
      const userContestRanking = data.userContestRanking || defaultUserContestRanking;
  
      // Access and filter the userContestRankingHistory array
      const userContestRankingHistory = data.userContestRankingHistory || [];
      const attendedContests = userContestRankingHistory.filter(record => record.attended);
  
      // Helper functions
      const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`;
      };
  
      const pad = (number) => {
        return number.toString().padStart(2, '0');
      };
  
      // Add formatted time and rounded rating change to each contest
      let previousRating = 1500; // Initial rating
      const updatedAttendedContests = attendedContests.map(contest => {
        const formattedFinishTime = formatTime(contest.finishTimeInSeconds);
        const roundedContestRating = Math.round(contest.rating);
        const ratingChange = roundedContestRating - previousRating;
        previousRating = roundedContestRating; // Update previous rating
        return {
          ...contest,
          formattedFinishTime,
          ratingChange,
          roundedContestRating
        };
      });

       // Reverse the contests array to show from latest to oldest
    updatedAttendedContests.reverse();

      // Use Math.round to round overall user contest rating
      const roundedRating = Math.round(userContestRanking.rating);
  
      // Return the relevant fields with rounded rating
      return {
        username,
        userContestRanking: {
          ...userContestRanking,
          rating: roundedRating
        },
        attendedContests: updatedAttendedContests,
        rating: roundedRating
      };
    } catch (error) {
      console.error(`Error fetching user contest records for ${username}:`, error);
      return null; // Return null in case of an error
    }
  };
  

  const getAllUsersContestRecords = async () => {
    
    for (const user of userNames) {
      const record = await getUserContestRecords(user.user);
      if (record) {
        contest.push(record);
      }
    }
  
    // Sort contest by rating in descending order
    contest.sort((a, b) => b.rating - a.rating);
  
    return contest;
  };
  
  await getAllUsersContestRecords().then(results => {
  });
  
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

const client = new MongoClient(uri);
await client.connect();
const database = client.db("leaderboard");

async function updateProblemsAndDateInUserNames(userNames) {

    try {
        
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
    } 
}

await updateProblemsAndDateInUserNames(userNames);



async function insertWeeklyRecords(userNames) {
    
    
  
    try {
      
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
       
        res.render('index', { user_solved : user_solved, submissions: submissons, previousDate: previousDate, day: day , current_year: current_year, current_week: current_week, daily_problem: daily_problem, daily_solved: daily_solved, contests : contest});
    } 
    catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Function to empty the daily_solved table and fill it with data from the array
async function updateDailySolvedTable() {
    

    try {
        

        const database = client.db('leaderboard');
        const dailySolvedCollection = database.collection('daily_solved');

        // Delete all documents in the daily_solved collection
        await dailySolvedCollection.deleteMany({});

        // Insert new data from the array into the daily_solved collection
        await dailySolvedCollection.insertMany(daily_solved);

        console.log('Daily solved table updated successfully.');
    } catch (error) {
        console.error('Error occurred:', error);
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
                time : unixTimeToNormal(result.recentSubmissionList[i].timestamp),
                id : result.recentSubmissionList[i].id
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

// await performLogin();
app.post('/process-submission', async(req, res) => {

    try {
    const submissionId = req.body.id;

    var result =  await leetcode_auth.submission(submissionId);
    var code = result.code;


    res.json({ success: true, code: code });
    }

    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }


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
//             user: "Night_sky_delta",
//             problems: [402, 138, 224, 40],
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
