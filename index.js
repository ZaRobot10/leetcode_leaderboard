import express from 'express';
import axios from 'axios';

import { LeetCode } from "leetcode-query";

const leetcode = new LeetCode();


const app = express();
const port = 3000;


// middleware
app.use(express.static('public'));



var userNames = ['kalpit04', '_Code_Shark', '8178458001' , 'za_robot10', 'dsharma02102004', 'varun9904', 'krishankant_nsut', 'D-01000100'];

var user_solved = [];

for (var i = 0; i < userNames.length; i++) {
    var result =  await leetcode.user(userNames[i]);
   


    var user = {
        name: userNames[i],
        easy: result.matchedUser.submitStats.acSubmissionNum[1].count,
        medium: result.matchedUser.submitStats.acSubmissionNum[2].count,
        hard: result.matchedUser.submitStats.acSubmissionNum[3].count,
        total: result.matchedUser.submitStats.acSubmissionNum[0].count,
        points : result.matchedUser.submitStats.acSubmissionNum[1].count + 2 * result.matchedUser.submitStats.acSubmissionNum[2].count + 4 * result.matchedUser.submitStats.acSubmissionNum[3].count
    }


    console.log(user);

    user_solved.push(user);
}


// sort the user_solved array in descending order of points
user_solved.sort(function(a, b) {
    return b.points - a.points;
});


app.get('/', async(req, res) => {


    // for (var i = 0; i < userNames.length; i++) {
        // const result = await axios.get(`https://alfa-leetcode-api.onrender.com/${userNames[i]}/solved`);

        // var user = {
        //     name: userNames[i],
        //     easy: result.data.easySolved,
        //     medium: result.data.mediumSolved,
        //     hard: result.data.hardSolved,
        //     total: result.data.totalSolved,
        //     points : easy + 2 * medium + 4 * hard
        // }

        // user_solved.push(user);

       
    // }
   

       res.render('index.ejs', { user_solved: user_solved });
});



app.listen(port, () => {

    console.log(`Server is running on port http://localhost:${port}`);
});
