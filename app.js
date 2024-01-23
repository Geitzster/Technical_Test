const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;



// Get poll information from json file
// Count set to 0 initially - subject to change
// Catchs error if it fails to parse the the poll information
// Throws error if poll information is missing options to vote on or question
let pollOptions;
let options;
try {
    pollOptions = JSON.parse(fs.readFileSync('pollOptions.json', 'utf-8'));
    if (!pollOptions.options) {
        throw new Error('Invalid poll information: Missing options')
    }
    if (!pollOptions.question) {
        throw new Error('Invalid poll information: Missing question')
    }
    options = pollOptions.options.reduce((acc, option) => {
        acc[option.optionId] = { text: option.optionText, count: 0 };
        return acc;
    }, {});
} catch (error) {
    console.error('Error reading poll information', error.message);
    process.exit(1);
}


// BodyParser used as middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Render index page
app.get('/', (req, res) => {
    res.render('index', { pollOptions, options });
});

// Posts vote of option selected by user 
// Add vote to count for option
// Checks if option exists, if not sends invalid option status
app.post('/vote', (req, res) => {
    const selectedOptionId = parseInt(req.body.option, 10);
    if (options[selectedOptionId] !== undefined) {
        options[selectedOptionId].count++;
        res.redirect('/results');
    } else {
        res.status.send('Invalid option selected');
    }
   
});

// Render the results page
// Get total votes and calculates percentage for each option
// Sorts options by percentage to be displayed
app.get('/results', (req, res) => {
    const totalVotes = Object.values(options).reduce((acc, { count }) => acc + count, 0);
    const percentages = {};
    for (const optionId in options) {
        const { text, count } = options[optionId];
        percentages[text] = ((count / totalVotes) * 100).toFixed(0);
    }
    const optionsArray = Object.values(options).map(option => ({
        text: option.text,
        percentage: percentages[option.text]
    }))
    const sortedOptions = optionsArray.sort((a, b) => b.percentage - a.percentage)
    res.render('results', { sortedOptions, percentages });
});

// Starts server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
