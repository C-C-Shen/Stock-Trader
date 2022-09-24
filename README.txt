*Since this check-in has a server component, I have included the package.json file for the automated npm installation as shown on slides*
INTALL AND RUN:

**Remember to npm install
**Remember to have MongoDB installed (should already be on the OpenStack)

1)mongod --port 27017 --dbpath /*repo location*/stock-trader/db
2)cd /*repo location*/stock-trader/
3)npm install			
4)node expressServer	


**Following modules used**
-- express
-- express-sessions
-- body-parser
-- mongodb

Files included:
- home.html *basic home page layout, same layout as check-in 3, updates every 5 seconds (stock info and notifications if logged-in)
- login.html *basic login page, has the ability to create new accounts as long as they are new username (unique) and have valid inputs for password, name, username
- profile.html same as the check-in 3, with dynamic history search, updates every 5 seconds (stock info and notifications)
- stockPage.html *basic stock information page, same as in check in 3, but now (stock info and notifications if logged-in)
- stockScript.js *the main script used by the pages, exact same as check in 3, cleaned up how the pages are updated, ie only update elements that have actually changed every 5 seconds
- stockStyle.ccs *basic styling for all the .html pages
- expressServer.js *this is all the node server code, all the functions present on this .js file works with the client (through sending/recieving JSONs) all major buisness logic functions work, such as: buying, selling, add
		  -ing to the watchlist, login, logout, creating new accounts, adding/withdrawing balance, all pages being linked, adding new target % change target, tracking account activity history aswell as 
		   session authentication and verification has been included. All the required functionality is present, makes use of express, express-sessions, body-parser, mongoDB

		  **NOTE** primary change from check-in 3 -> FINAL: improved page updating, so now it is every 5 seconds, and it will only update the elements that have changed from the previous update, added MongoDB for
		  						         tracking which account userNames and sessionID's are currently logged in, implemented the use of body-parser
		  
- package.json *this is the file that the npm automatic installation will use (express and express-sessions)

*Note all points of user input have error and validity checking on them*

All required objects are now present, and all the functionality (except history search on profile) is present and working as intended with multiple users on at once (logged into different accounts) for testing here
are some pre-made accounts, although you can always make a new one: username: chris	->	password: password
								    username: harry	->	password: password	
								    username: melissa	->	password: password
					**NEW** admin account	    username: admin	->	password: password
					**The admin account has the ability to go to next day and reset server state from the home page**
							
						*These preloaded accounts come with a few watch list items, owned stock, and account balance*
						*You should be able test buying and selling with the two test accounts + 1 amind account*

FOR JSON REST API (tested with postman), no change to this part since check-in 3
GET /stocks -> simply returns the stock symbols that match with the optional queries of: symbol=, non case sensitive check if a symbol contains the requested letters
										       : minprice=, include to define a minimum requested average price
										       : maxprice=, include to define a maximum requested average price

GET /stocks/:symbol -> input as /stocks/APPL for example contains the following optional queries: startday=, oldest day you would like to have returned
		       this will return the entire history of a stock within a time period	: endday=, newest day you like to have returned, (if endday >= current day just display current day aswell)

GET /stocks/:symbol/history -> i simply made the /stocks/:symbol method do the history part as from what I could tell they were asking for essentially the same thing, so instead
			       of calling /stocks/:symbol/history, just use /stocks/:symbol to get the same information with the 1 or 2 extra bits of info asked for by the /history

expressServer.js: All of my functions included in this check-in work as intended while also interacting with the client everything is dynamic (ie, client requests, server responds, client updates), so as for the AXAJ/server interactions
		For my REST API it is all laid out for the core website functionality in the expressServer.js file, 
	      **I have now changed how the page updates, it will only update the individual elements that have changed meaning that on a page update it should not reset the text boxes anymore 
		(unlike before where I just forced a page refresh).
		
express-sessions: I am using the express-sessions module to perform my user sessions and I am doing some basic authentication, like if a user logs in from a different pc while already being logged in, it will automatically
		  log that user off, also checking if a user is logged in already before they perform a task

body-parser: small change, I changed all my post-requests to use body-parser, .json() and.text() (to slightly shorten the server code)

mongoDB: currently I am only using MongoDB to keep track of which accounts are currently logged in, ie the sessionID's assosiated with a userName at the time of login
