# Be Aware:
This was my first time ever using Git and one of my first time programming. Please ignore the bad commit messages, bad file management, and other bad code. Take a look at my newer projects!

# Unicus Bot
Unicus is a Discord bot for Domicile, the Discord server. Link to the Discord Server: https://discord.gg/rZaSGqRQ4C. This server has aspects of economy and roleplaying but can also serve as entertainment with amazing Discord bot games.

## All Commands

### Company
Corporations are entities owned by an executive and classified by their title and ticker symbol. Executives of corporations could hire employees and create jobs. Each user could own a maximum of one corporation. Corporations are stored on an online private database.

#### Create
Creates a Domicile corporation. Must have a title and ticker symbol following the command, with $500 on the user's profile.

#### Update
Updates your Domicile corporation. This is a dynamic command that can adjust the company's ticker and title.

#### Delete
Deletes your Domicile corporation. Money is not redeemed on sale.

### Election
Elections are events that occur every 50 days for each state. There is always one election being started each day. Participants of elections could vote and run for governor. Elections cycle between stages during each season: Empty, Application, Voting, Results, and sometimes Cancelled.

#### Run
Signs the user up to participate as a governor. Candidates can formulate a speech that represents their actions as mayor. Each election must have at least one governor to start. There is a ten-day cooldown of running for governor.

#### Vote
Votes for the mentioned governor. Voters must state the user ID or the mention tag during the command. There is a five-day cooldown for voting.

#### Data
Presents election data for the current election. The data is presented in a vector graphic and an embed that lists the days left for each stage of election, requirements for elections, state's population, current governor, and the state.

#### Candidates
Returns information of a specific gubernatorial candidate. The information included are: The candidate's name, number of votes, percentage of votes, and speech.

### Fun
Fun commands are recreational commands that has no relations to other Unicus's features. Most fun commands allow the player to bet Domicile money with no house leaning.

#### Either
Gathers questions from http://either.io/. The command returns a hyperlink to the original article and adds a spoiler markup to the answers. Users add reactions, prepared by the bot, to the question to show their answer.

#### Riddle
Gathers riddles from https://fungenerators.com/random/riddle. The command returns the riddle and adds a spoiler markup to the answer to the riddle.

#### Pictionary
Starts a Pictionary game for 3 to 12 players. Players take turns drawing a picture by typing coordinates that changes the color of square emojis. The player drawing is drawing the prompt given. Other players participate in guessing what the prompt is by typing what they think the prompt is.

#### Deception
Starts a deception game for 3 to 8 players. A player is selected to be the spy. Everybody but the spy receives a prompt they must prove the know by selecting a coordinate on a coordinate grid. Available coordinates in the coordinate grid decreases with each round. After placing the coordinates, all players are shown the locations of the coordinates of other players and much justify why they put it in their location (example: A person may prove they know the prompt was "Tree" by saying "Trees are tall so I placed my coordinate high"). All players vote for who they think is the anomaly among them is.

#### Gamble
Gambles Domicile money in a one-person quick game. The gambler states the odds of the game and the amount of money they will gamble. Odds must be between 0 and 100 exclusives where 25% odds correlate to 25% chance of winning. Earnings and losses are always calculated to be approximately even for the house and player.

#### Chess
Starts a game of chess for 2 players. Players exchange messages of algebraic chess notation to move pieces on a chessboard of either emojis or a vector graphic. Players must checkmate their opponent's king by threatening to capture the king with no ways to prevent it. The user can accommodate themselves by selecting a custom style and starting layout.

### Governor
Governors are selected through elections and are responsible for managing their state. Governors are given exclusive admin powers only within the state's channels.

#### Ban
Bans a selected user from visiting and talking in the state's channels. Banned users still residing in their state still receive updates about local elections, however, now through private messages during application and voting stages.

#### Unban
Reverses the effect of a ban. Removes the name off the banned list.

#### Channel
Create, update, and delete channels. The state's public domain channels cannot be modified or deleted. Through a dynamic command governors can adjust the channel's name, topic, channel permissions, rate limit, nsfw tag, user limit, and bitrate. When creating a channel, the governor can choose between a text channel or a voice channel.

#### Welcome
Sets the welcome message of the state. The welcome message appears when people travel to the state.

#### Announce
Creates an embed message in a channel. The announce command is dynamic and can receive input on the Content, title, description, fields, color, footer, and image for an embed to be sent. The command may also make the bot repeat any lines or images sent to it.

### Help
Helps the user understand command fields and descriptions. When no arguments are added, the command will list all the commands.

### Job
Jobs is one of the most profitable ways an individual could generate Domicile money. Jobs are formed and managed by corporations, including a few default GOV jobs. Jobs are characterized by their name, accessibility, operation, frequency, and cooldown.

#### Apply
Send an application to a job. Private jobs require both parties to accept the job before the applicant is hired. Applicants could take jobs from the government or from corporations that are listing their jobs.

#### Work
Gives money as a reward for completing an operation. Profit is dependent on how quick an operation can be performed. Operations take different amount of time to complete on average, however, all operations have been equated to equal the same amount when adjusted for time. Higher frequency and cooldown on operations result in less individual task profits.

#### Catalog
Lists the available jobs from the government or a corporation in a two-column list.

#### Create
Creates a job from the user's corporation. The user must specify an operation and name of the job. The job is created with the default frequency and cooldown of 4 and 18 respectively.

#### Update
Updates the specified job. The command is dynamic and can receive the values of name, accessibility, operation, frequency, and cooldown. The job's properties will change upon input.

#### Delete
Deletes the specified job. The job will be removed from use and all current employees with the job will be suspended from duty.

#### Info
Obtains info about a job. The command returns the company's ticker, company's executive, name, operation, frequency, cooldown, accessibility, and total workers. Attached is also a vector graphic of the some of the aforementioned information.

### Money
Domicile money is separated by Discord servers or guilds (production server, and debug server). Users can acquire money from a variety of sources, namely jobs. Money could be used to purchase a corporation, travel to other states, or use the purchase command.

#### Balance
Returns the amount of money from an account. Unless a user ID or mention tag is added, it will return the user's own balance. These only measures liquid assets in exclusion of purchases.

#### Assets
Returns the amount of money and assets from an account. Unless a user ID or mention tag is added, it will return the user's own assets. All long-term assets are listed.

#### Pay
Transfers money from one account to another account. Both parties must confirm the transaction before it is processed. The party transffering the money must have an adequate account balance.

#### Admit
Adds, sets, or removes money to an account. The receiver must confirm the transaction before it is processed. This command is only accessible from administrators.

### Purchase
Assets that could be purchased to help the player with certain things that may help them reduce long-term expenses, save time, or other reasons. A player can gift money to charity for redistribution to people with lower account balances.

### Security
Moderator tools for managing the server's members. Moderators must provide an accusation, target, and explanation. Moderators can view the actions of other moderators to punish corruption. Warnings for wrongful actions increase in punishment over time while also lowering the user's experience.

### Travel
Members can travel from state to state using many different modes of transport. Different transportation method comes with pros and cons of cost, time, and availability. A vector graphic is shared showing the state's location.

## Other Stuff

### Error
The error handler returns the solutions to problems in a format understandable to the reader. If the error needs to describe that the wrong command syntax was used, the error handler will search the configuration file for the correct syntax.

### Log
Lists events that have occurred in the Discord. To prevent spamming Discord's API, most events output only what is required until requested more information. Emoji reactions show up under log messages that act us buttons to retrieve information about the event.

### Statistic
All seven days of the week a statistic is shown that could summarize the week.

#### Currency
Displays a candlestick graph of a random currency from the last seven days. It also provides the currency's name, exchange, market, rate, volume, capitalization, and change. The currency information is acquired from Yahoo Finance and all currency values are relative the United States Dollar.

#### Stock
Displays a line graph of a random stock or index from the last seven days. It also provides the company's or index's name, ticker, market, stock, volume, capitalization, and change. The stock information is acquired from Yahoo Finance and used units of United States Dollar.

#### Polling
Displays a poll graph for a topic. It also displays the topic, voter count, time left, and question. The graph displays emoji reactions that can be used to vote for their topic. For 24 hours, members of the server can vote reflecting their opinions or qualities. When the voting is completed, a vector graphic is published showing the percentages of people that voted for each choice in a pie chart.

#### Guild
Displays a doubled line graph corresponding to the server's player growth and player count. Information also shown is the server's name, region, creation date, members, channels, and roles.

#### Astronomy
Displays an image of the calculated locations of planet's locations. All eight planet's coordinates are calculations based on the planet's orbital properties. Information also shown includes the random planet's name, rotation, revolution, gravity, distance, and coordinates.

#### News
Displays an image of the headline and thumbnail for a recent news article on Google News. It also provides the article's publication, age, leaning, headline, and hyperlink.

## Contact
For any questions, contact Kyle Smith on his personal Discord: FiNS Flexin#6193.
