import express from 'express';
import axios from 'axios';

import { LeetCode } from "leetcode-query";

const leetcode = new LeetCode();


const app = express();
const port = 3000;


// middleware
app.use(express.static('public'));

app.set('view engine', 'ejs');


var userNames = [
    { user: 'kalpit04', problems: [5, 1, 2, 2] },
    { user: '_Code_Shark', problems: [5, 1, 2, 2] },
    { user: '8178458001', problems: [5, 1, 2, 2] },
    { user: 'za_robot10', problems: [5, 1, 2, 2] },
    { user: 'dsharma02102004', problems: [5, 1, 2, 2] },
    { user: 'varun9904', problems: [5, 1, 2, 2] },
    { user: 'krishankant_nsut', problems: [5, 1, 2, 2] },
    { user: 'D-01000100', problems: [5, 1, 2, 2] },
    { user: 's1marjeet_singh', problems: [5, 1, 2, 2] }
];

var previousDate =  "2024-3-25";

app.get('/', async (req, res) => {


        console.log('Fetching user data...');

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

            
           
        }

               user_solved.sort((a, b) => b.points - a.points);

        res.render('index', { user_solved });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function fetchUserData(username, problems) {
    const result = await leetcode.user(username);

    console.log(result);
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


// var user_solved = [];

// for (var i = 0; i < userNames.length; i++) {
//     var result =  await leetcode.user(userNames[i]);
   


//     var user = {
//         name: userNames[i],
//         easy: result.matchedUser.submitStats.acSubmissionNum[1].count,
//         medium: result.matchedUser.submitStats.acSubmissionNum[2].count,
//         hard: result.matchedUser.submitStats.acSubmissionNum[3].count,
//         total: result.matchedUser.submitStats.acSubmissionNum[0].count,
//         points : result.matchedUser.submitStats.acSubmissionNum[1].count + 2 * result.matchedUser.submitStats.acSubmissionNum[2].count + 4 * result.matchedUser.submitStats.acSubmissionNum[3].count
//     }


//     console.log(user);

//     user_solved.push(user);
// }


// // sort the user_solved array in descending order of points
// user_solved.sort(function(a, b) {
//     return b.points - a.points;
// });


// app.get('/', async(req, res) => {


//     // for (var i = 0; i < userNames.length; i++) {
//         // const result = await axios.get(`https://alfa-leetcode-api.onrender.com/${userNames[i]}/solved`);

//         // var user = {
//         //     name: userNames[i],
//         //     easy: result.data.easySolved,
//         //     medium: result.data.mediumSolved,
//         //     hard: result.data.hardSolved,
//         //     total: result.data.totalSolved,
//         //     points : easy + 2 * medium + 4 * hard
//         // }

//         // user_solved.push(user);

       
//     // }

//     var user_solved = [];

// for (var i = 0; i < userNames.length; i++) {
//     var result =  await leetcode.user(userNames[i]);
   


//     var user = {
//         name: userNames[i],
//         easy: result.matchedUser.submitStats.acSubmissionNum[1].count,
//         medium: result.matchedUser.submitStats.acSubmissionNum[2].count,
//         hard: result.matchedUser.submitStats.acSubmissionNum[3].count,
//         total: result.matchedUser.submitStats.acSubmissionNum[0].count,
//         points : result.matchedUser.submitStats.acSubmissionNum[1].count + 2 * result.matchedUser.submitStats.acSubmissionNum[2].count + 4 * result.matchedUser.submitStats.acSubmissionNum[3].count
//     }


//     console.log(user);

//     user_solved.push(user);
// }


// // sort the user_solved array in descending order of points
// user_solved.sort(function(a, b) {
//     return b.points - a.points;
// });
   

//     res.render('index.ejs', { user_solved: user_solved });
// });

