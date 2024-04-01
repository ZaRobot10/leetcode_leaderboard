// This file is used to test the graphql query and response
import { query } from "express";


  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: query,
        variables: {
          username: 'za_robot10', //username required
          limit: 5, //only for submission
        },
      }),
    });

    

    console.log(response);

}

catch (err) {
    console.error(err);
}
