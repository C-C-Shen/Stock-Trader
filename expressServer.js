//THIS IS THE EXPRESS VERSION
//THIS VERSION USES A MONGODB
//Some globals
//Note date is simply the number of "days" the admin has decided to end, not actual full day lengths
var date = 1;

var numberOfTransactions = 0;

var allAccounts;
var allStocks;

//this will be the database variable
var db;

//Array of all the accounts currently logged in
//var loggedIn;
//This will keep track of only have one session ID per logged in user
let currLogged = {
	logName: "",
	sessionID: "",
}

let userAccount = {
	userName: "",
	logName: "",
	logPass: "",
	currBalance: 0,
	stocksWatch: [],
	stocksOwned: [],
	stockAlert: [],
	pendingTrans: [],
	history: [],
	notification: [],
	stocksPChange: [],
};

let notificationForm = {
	symbol: "",
	name: "",
	prevP: 0,
	avgP: 0,
	currPChange: 0,
	targetP: 0,
};

let histMonitary = {
	//Deposit, Withdrawl
	type: "",
	price: 0,
	orderId: numberOfTransactions,
	timeOfHist: 0,
};

let histStock = {
	//SELL, BUY
	type: null,
	symbol: "",
	price: 0,
	moved: 0,
	filled: 0,
	unfilled: 0,
	complete: false,
	orderId: numberOfTransactions,
	timeOfHist: 0,
};

let order = {
	symbol: "",
	accountName: "",
	//SELL, BUY
	type: null,
	price: 0,
	filled: 0,
	unfilled: 0,
	complete: false,
	removeAtEndDay: false,
	orderId: numberOfTransactions,
};

let completedOrd = {
	b: "",
	s: "",
	price: 0,
	moved: 0,
}

let stock = {
	symbol: "",
	name: "",
	prevAvg: 0,
	//A value showing - means no transaction today so no data for calculation yet
	avg: "-",
	bid: "-",
	ask: "-",
	perChange: 0,
	dayTrades: 0,
	buyOrders: [],
	sellOrders: [],
	soldTday: [],
	history: [],
};

let pastStock = {
	timeOfHist: 0,
	avg: "-",
	min: 0,
	max: 0,
	perChange: 0,
	dayTrades: 0,
	transactions: [],
};

let owned = {
	stockObject: "",
	quantity: 0,
};

//represents 3 hours of session life
const SESS_LIFETIME = 1000 * 60 * 60 * 3;

const { query } = require('express');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const app = express();

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use(session({
	secret: 'ultra-secret-string-of-secrets',
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: SESS_LIFETIME,
		secure: false,
	}
}));

mongo.MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
	if(err) throw err;
	console.log("connected to data base");
	db = client.db('mainDB');
	resetDB();
});

function resetDB ()  {
	//reset the logged in database (ie, on a server restart no one should be logged in)
	db.collection("loggedIn").findOne({name: {$exists: true}, ident: {$exists: true}}, function(err,result) {
		if (err) throw err;
		if (result) {
			db.collection("loggedIn").drop();
		}
	});
}

//Reset the server state/initialize some starting values
function serverInit() {
	allAccounts = new Set();
	allStocks = new Set();

	let tsla = JSON.parse(JSON.stringify(stock));
	tsla.symbol = "TSLA";
	tsla.name = "Tesla";
	tsla.prevAvg = 420;
	tsla.avg = "-";
	tsla.bid = "-";
	tsla.ask = "-";
	tsla.dayTrades = 0;

	let appl = JSON.parse(JSON.stringify(stock));
	appl.symbol = "APPL";
	appl.name = "Apple";
	appl.prevAvg = 115
	appl.avg = "-";
	appl.bid = "-";
	appl.ask = "-";
	appl.dayTrades = 0;

	let amd = JSON.parse(JSON.stringify(stock));
	amd.symbol = "AMD";
	amd.name = "Advanced Mircro Devices";
	amd.prevAvg = 70;
	amd.avg = "-";
	amd.bid = "-";
	amd.ask = "-";
	amd.dayTrades = 0;

	let nvda = JSON.parse(JSON.stringify(stock));
	nvda.symbol = "NVDA";
	nvda.name = "NVIDIA Corporation";
	nvda.prevAvg = 522;
	nvda.avg = "-";
	nvda.bid = "-";
	nvda.ask = "-";
	nvda.dayTrades = 0;

	let intc = JSON.parse(JSON.stringify(stock));
	intc.symbol = "INTC";
	intc.name = "Intel Corporation";
	intc.prevAvg = 55;
	intc.avg = "-";
	intc.bid = "-";
	intc.ask = "-";
	intc.dayTrades = 0;

	let ba = JSON.parse(JSON.stringify(stock));
	ba.symbol = "BA";
	ba.name = "Boeing Company";
	ba.prevAvg = 165;
	ba.avg = "-";
	ba.bid = "-";
	ba.ask = "-";
	ba.dayTrades = 0;

	let air = JSON.parse(JSON.stringify(stock));
	air.symbol = "AIR";
	air.name = "Airbus SE";
	air.prevAvg = 80;
	air.avg = "-";
	air.bid = "-";
	air.ask = "-";
	air.dayTrades = 0;

	let brl = JSON.parse(JSON.stringify(stock));
	brl.symbol = "BRL";
	brl.name = "EMBRAER SA";
	brl.prevAvg = 6;
	brl.avg = "-";
	brl.bid = "-";
	brl.ask = "-";
	brl.dayTrades = 0;

	//Here is the admin account
	let user1 = JSON.parse(JSON.stringify(userAccount));
	allAccounts.add(user1);
	user1.userName = "admin";
	user1.logName = "admin";
	user1.logPass = "password";
	user1.currBalance = 0;

	//Some pre-made user accounts
	let user2 = JSON.parse(JSON.stringify(userAccount));
	allAccounts.add(user2);
	user2.userName = "Christopher Shen";
	user2.logName = "chris";
	user2.logPass = "password";
	user2.currBalance = 20000;

	//Place holder hard coded initialization
	user2.stocksWatch.push(tsla);
	user2.stocksWatch.push(appl);
	user2.stocksWatch.push(amd);
	user2.stocksWatch.push(nvda);

	let user3 = JSON.parse(JSON.stringify(userAccount));
	allAccounts.add(user3);
	user3.userName = "Harry Kuro";
	user3.logName = "harry";
	user3.logPass = "password";
	user3.currBalance = 10000;

	//Place holder hard coded initialization
	user3.stocksWatch.push(appl);
	user3.stocksWatch.push(amd);
	user3.stocksWatch.push(nvda);

	let user4 = JSON.parse(JSON.stringify(userAccount));
	allAccounts.add(user4);
	user4.userName = "Melissa Arslan";
	user4.logName = "melissa";
	user4.logPass = "password";
	user4.currBalance = 8000;

	//Place holder hard coded initialization
	user4.stocksWatch.push(air);
	user4.stocksWatch.push(nvda);

	//Giving some of the pre made accounts some owned stocks (so testing is easier)
	let newOwned1 = JSON.parse(JSON.stringify(owned));
	newOwned1.stockObject = appl;
	newOwned1.quantity = 25;

	let newOwned2 = JSON.parse(JSON.stringify(owned));
	newOwned2.stockObject = amd;
	newOwned2.quantity = 10;

	let newOwned3 = JSON.parse(JSON.stringify(owned));
	newOwned3.stockObject = nvda;
	newOwned3.quantity = 20;

	let newOwned4 = JSON.parse(JSON.stringify(owned));
	newOwned4.stockObject = brl;
	newOwned4.quantity = 12;

	user2.stocksOwned.push(newOwned1);
	user2.stocksOwned.push(newOwned2);

	user3.stocksOwned.push(newOwned3);

	user4.stocksOwned.push(newOwned4);

	//Add all stocks to one location
	allStocks.add(tsla);
	allStocks.add(appl);
	allStocks.add(amd);
	allStocks.add(nvda);
	allStocks.add(intc);
	allStocks.add(ba);
	allStocks.add(air);
	allStocks.add(brl);

	console.log("Server State Initialized/Reset");
}

//checks if the client requesting some action is logged in or not
const checkLogStatus = (req, res, next) => {
	if (req.session.userName != undefined) {
		db.collection("loggedIn").findOne({name: req.session.userName, ident: {$exists: true}}, function(err, result) {
			if (err) throw err;
			if (result) {
				if (result.ident === req.sessionID) {
					next();
				} else {
					req.session.destroy();
					console.log("ALT LOG");
					res.send("LOGGED_IN_AT_OTHER_LOC");
				}
			} else {
				req.session.destroy();
				res.send("ALREADY_LOGGED_OUT");
			}
		});
	} else {
		req.session.destroy();
		res.send("NOT_LOGGED_IN");
	}
};

//get requests using the API (JSON)
//return stock symbols matching query
app.get('/stocks', (req, res) => {
	let symbol = ""; 
	let minPrice = 0;
	let maxPrice = Infinity;
	let arr = [];
	//see if we should ovride the default values
	if (req.query.symbol != undefined) {
		symbol = req.query.symbol.toUpperCase();
	} 
	if (req.query.minprice != undefined) {
		minPrice = req.query.minprice;
	}
	if (req.query.symbol != undefined) {
		maxPrice = req.query.maxprice;
	} 
	for (let s of allStocks.values()) {
		//note, if a stock still has no transactions today, it will be return as its avg price is still unknown
		if ((s.avg === "-" || (s.avg >= minPrice && s.avg <= maxPrice)) && (s.symbol.includes(symbol) || s.symbol === symbol) ) {
			arr.push(s.symbol);
		}
	}
	res.status(200).json(arr);
});
//return stock object that matches symbol
app.get('/stocks/:symbol', (req, res) => {
	let startDay = 0;
	let endDay = Infinity;
	let arr = [];
	let stock = returnStockIfFound(allStocks.values(), req.params.symbol.toUpperCase());
	//see if we should ovride the default values
	if (req.query.startday != undefined) {
		startDay = req.query.startday;
		if (startDay < 1) {
			startDay = 0;
		}
	}
	if (req.query.endDay != undefined) {
		endDay = req.query.endDay;
	} 

	if (stock === "NONE") {
		res.status(404).send("Stock: " + req.params.symbol.toUpperCase() + " Does Not Exist");
	} else {
		let upper;
		if (endDay > stock.history.length) {
			upper = stock.history.length;
		} else {
			upper = endDay;
		}
		for (let i = startDay - 1; i < upper; i++) {
			arr.push(stock.history[i]);
		}
		//include current day if required
		if (endDay > stock.history.length) {
			let tempH = JSON.parse(JSON.stringify(pastStock));
			if (stock.soldTday.length != 0) {
				stock.soldTday.sort(function(a,b) {
					if (a.price < b.price) {
						return -1;
					} else if (a.price > b.price) {
						return 1;
					}
				});
				console.log(stock.soldTday);
				tempH.min = stock.soldTday[0].price;
				tempH.max = stock.soldTday[stock.soldTday.length - 1].price;
			} else {
				tempH.min = "-";
				tempH.max = "-";
			}
			tempH.timeOfHist = date + " (Current Day I  Progress)";
			tempH.avg = stock.avg;
			tempH.perChange = stock.perChange;
			tempH.dayTrades = stock.dayTrades;
			tempH.transactions.push(stock.soldTday);
			arr.push(tempH);
		}
		res.status(200).json(arr);
	}
});

//all get requests (using client)
app.get('/', (req, res) => {
    res.status(200).sendFile('/home.html', {root: __dirname});
});
app.get('/init', (req, res) => {
	if (req.session && req.session.userName != null) {
		res.status(200).send(returnUserAccount(req.session.userName).userName);
	} else {
		res.status(200).send("");
	}
});
app.get('/getNotifications', checkLogStatus, (req, res) => {
	res.status(200).json(returnUserAccount(req.session.userName).notification);
	returnUserAccount(req.session.userName).notification = [];
});
app.get('/getCurrDay', (req, res) => {
	res.status(200).json(date);
});
app.get('/updateHomePage', (req, res) => {
    res.status(200).json(Array.from(allStocks));
});
app.get('/updateProfileBal', checkLogStatus, (req, res) => {
    res.status(200).json(returnUserAccount(req.session.userName));
});
app.get('/updateOwnedStocks', checkLogStatus, (req, res) => {
    res.status(200).json(returnUserAccount(req.session.userName).stocksOwned);
});
app.get('/updateProfileWatch', checkLogStatus, (req, res) => {
    res.status(200).json(returnUserAccount(req.session.userName).stocksWatch);
});
app.get('/updateProfileCurrTrans', checkLogStatus, (req, res) => {
    res.status(200).json(returnUserAccount(req.session.userName).pendingTrans);
});
app.get('/updateProfileNotifcations', checkLogStatus, (req, res) => {
    res.status(200).json(returnUserAccount(req.session.userName).stocksPChange);
});
app.get('/updateHistory/:search', checkLogStatus, (req, res) => {
	let toSearch = req.params.search.toLowerCase();
	if (toSearch === "default") {
		res.status(200).json(returnUserAccount(req.session.userName).history);
	} else {
		let toReturn = [];
		for (let h of returnUserAccount(req.session.userName).history) {
			let keys = Object.values(h);
			if (h.type === "Deposit" || h.type === "Withdraw") {
				for (let k of keys) {
					if (k.toString().toLowerCase().includes(toSearch)) {
						toReturn.push(h);
						break;
					}
				}
			} else {
				for (let k of keys) {
					if (k.toString().toLowerCase().includes(toSearch)) {
						toReturn.push(h);
						break;
					}
				}
			}
		}
		res.status(200).json(toReturn);
	}
});
app.get('/userLogout', checkLogStatus, (req, res) => {
	removeLog(req.session.userName, req.sessionID);
	//show which accounts are still logged in
	db.collection("loggedIn").find().toArray(function(err, result) {
		if (err) throw err;
		console.log(result);
	});
	req.session.destroy();
	res.redirect('/');
});
app.get('/nextDay', checkLogStatus, (req, res) => {
	res.status(200).json('Next Day');
	endTradeDay();
});
app.get('/resetState', checkLogStatus, (req, res) => {
	res.status(200).json('State Reset');
	serverInit();
});

//All post requests
app.post('/addToPNotifiction', checkLogStatus, (req, res) => {
	newPNotification(returnUserAccount(req.session.userName), returnStockIfFound(allStocks.values(), req.body.symbol), req.body);
	res.status(200).send("");
});
app.post('/removeWatchChecked', checkLogStatus, (req, res) => {
	removeWatched(returnUserAccount(req.session.userName), req.body);
	res.status(200).send("");
});
app.post('/removePendingChecked', checkLogStatus, (req, res) => {
	removePendingTransactions(returnUserAccount(req.session.userName), req.body);
	res.status(200).send("");
});
app.post('/removeNotificationChecked', checkLogStatus, (req, res) => {
	removeNotification(returnUserAccount(req.session.userName), req.body);
	res.status(200).send("");
});
app.post('/addToStockWatch', checkLogStatus, (req, res) => {
	let newWatch = returnStockIfFound(allStocks.values(), req.body);
	res.send(addToWatch(returnUserAccount(req.session.userName), newWatch));
	res.status(200);
});
app.post('/dBalance', checkLogStatus, (req, res) => {
	let amountC = parseFloat(req.body, 10);
	changeBalance(returnUserAccount(req.session.userName), amountC, "Deposit");
	res.status(200).send("");
});
app.post('/wBalance', checkLogStatus, (req, res) => {
	let amountC = parseFloat(req.body, 10);
	changeBalance(returnUserAccount(req.session.userName), amountC, "Withdraw");
	res.status(200).send("");
});
app.post('/updateStockPage', (req, res) => {
	for (let stock of allStocks.values()) {
		//Iterate through the stock object
		if (stock.symbol === req.body) {
			res.status(200).json(stock);
			break;
		}
	}
});
app.post('/login', (req, res) => {
	let checkUserLogName = req.body.requestLogName;
	let checkPass = req.body.requestPass;
	console.log(checkUserLogName);
	console.log(checkPass);
	//Check if username and password match an existing account
	let success = false;
	for (let temp of allAccounts.values()) {
		if (temp.logName === checkUserLogName && temp.logPass === checkPass) {
			quryUserName(checkUserLogName, req.sessionID);
			qurySessID(checkUserLogName, req.sessionID);
			addNewLog(checkUserLogName, req.sessionID);

			req.session.userName = checkUserLogName;
			req.session.save();
			
			//console.log(loggedIn);	
			success = true;
			break;		
		}
	}
	if (success) {
		res.status(200).send("PASS");
	} else {
		res.status(200).send("FAIL");
	}
});
app.post('/createAccount', (req, res) => {
	let newName = req.body.newName;
	let newUserLogName = req.body.newLogName;
	let newPass = req.body.newPass;
	let error = false;
	//Check if the new username already exists
	for (let temp of allAccounts.values()) {
		if (temp.logName === newUserLogName) {
			console.log("User Laready Exists!");
			error = true;
			break;
		}
	}
	if (!error) {
		let newAcc = JSON.parse(JSON.stringify(userAccount));
		allAccounts.add(newAcc);
		newAcc.userName = newName;
		newAcc.logName = newUserLogName;
		newAcc.logPass = newPass;
		newAcc.currBalance = 0;
		res.send("PASS");
	} else {
		res.send("FAIL");
	}
	res.status(200);
});
app.post('/requestTransaction', checkLogStatus, (req, res) => {
	if (validateOrder(returnUserAccount(req.session.userName), req.body)) {
		res.send("PASS");
	} else {
		res.send("FAIL");
	}
	res.status(200);
});

app.listen(3000, serverInit());
console.log("Server listening at http://localhost:3000");

//The following are all the helper functions (later may be put into a seperate file for easier readability)

//Requested watch stocks are removed from a users account
function removeWatched(user, toRemove) {
	for (let i = 0; i < toRemove.length; i++) {
		for (let j = 0; j < user.stocksWatch.length; j++) {
			if (user.stocksWatch[j].symbol === toRemove[i]) {
				user.stocksWatch.splice(j, 1);
			}
		}
	}
}

//Given info on what pending transactions are to be removed, remove them
function removePendingTransactions(user, toRemove) {
	//Remove every single pending transaction that is requested for removal
	for (let tR of toRemove) {
		//Compare to each transaction currently ongoing on the users account
		if (removePendingFromAcc(user, tR.orderId) === "PASS") {
			//If a buy order remove from the buy array, if sell remove from the sell side
			if (tR.type === "BUY") {
				user.currBalance += (tR.price * tR.unfilled);
				console.log("Return $" + tR.price * tR.unfilled + " to " + user.logName);
				user.history.push(newOrderHistory(tR, 0, true, null));
			} else {
				let index = returnStockIfOwned(user.stocksOwned, tR.symbol);
				if (index != "NONE") {
					user.stocksOwned[index].quantity += tR.unfilled;
				} else {
					let tempStock = returnStockIfFound(allStocks.values(), tR.symbol);
					let tempOrder = JSON.parse(JSON.stringify(order));
					tempOrder.stockObject = tempStock;
					tempOrder.quantity = tR.unfilled;
					user.stocksOwned.push(tempOrder);
				}
				console.log("Return " + tR.unfilled  + " shares of " + tR.symbol + " to " + user.logName);
				user.history.push(newOrderHistory(tR, 0, true, null));
			}
		}
		//Compare to each stock
		for (let stock of allStocks.values()) {
			//If the symbol matches find the exact transaction to remove
			if (stock.symbol == tR.symbol) {
				//If a buy order remove from the buy array, if sell remove from the sell side
				if (tR.type === "BUY") {
					//Buy side
					for (let i = 0; stock.buyOrders.length; i++) {
						//Remove the order that has a matching order ID (each order has a unique integer)
						if (tR.orderId == stock.buyOrders[i].orderId) {
							stock.buyOrders.splice(i, 1);
							updateAskBid(stock);
							break;
						}
					}
				} else {
					//Sell side
					for (let i = 0; stock.sellOrders.length; i++) {
						//Remove the order that has a matching order ID (each order has a unique integer)
						if (tR.orderId == stock.sellOrders[i].orderId) {
							stock.sellOrders.splice(i, 1);
							updateAskBid(stock);
							break;
						}
					}
				}
			}
		}
	}
}

//Remove notifications from a specific user (notification related to % change)
function removeNotification(user, toRemove) {
	//Remove every single notification that is requested for removal
	for (let tR of toRemove) {
		for (let i = 0; i < user.stocksPChange.length; i++) {
			console.log(tR);
			if (tR.symbol === user.stocksPChange[i].symbol && tR.targetP === parseFloat(user.stocksPChange[i].targetP, 10)) {
				user.stocksPChange.splice(i, 1);
				break;
			}
		}
	}
}

//Adds a stock to a users watch array
function addToWatch(user, stock) {
	if (returnStockIfFound(user.stocksWatch, stock.symbol) === "NONE") {
		console.log("Adding: " + stock.symbol + " to " + user.logName + " watchlist");
		user.stocksWatch.push(stock);
		return "PASS";
	} else {
		console.log("Already watching: not adding");
		return "FAIL";
	}
}

//Given info on new order, and checks if the user can actually complete the requested order
function validateOrder(user, tempOrderInput) {
	let newOrder = JSON.parse(JSON.stringify(order));
	newOrder.symbol = tempOrderInput.symbol.toUpperCase();
	newOrder.accountName = user.logName;
	newOrder.price = parseFloat(tempOrderInput.price, 10);
	newOrder.type = tempOrderInput.type;
	newOrder.filled = 0;
	newOrder.unfilled = parseInt(tempOrderInput.shares);
	newOrder.removeAtEndDay = tempOrderInput.removeAtEnd;
	newOrder.orderId = ++numberOfTransactions;

	let transAcc = user;

	//Decide what do do based on what the order type is, buy or sell
	if (newOrder.type === "BUY") {
		console.log("BUY");
		//Check if the user has sufficient funds in their account
		if (transAcc.currBalance >= (newOrder.price * newOrder.unfilled)) {
			transAcc.currBalance -= (newOrder.price * newOrder.unfilled);

			//Add the pending transaction to the appropriate stock
			for (let stock of allStocks.values()) {
				//Add the unfilled order to the appropriate stock
				if (stock.symbol === newOrder.symbol) {
					stock.buyOrders.push(newOrder);
					stock.buyOrders.sort(function(a,b){
						if (a.price < b.price) {
							return -1;
						} else if (a.price > b.price) {
							return 1;
						}
						if (a.orderId < b.orderId) {
							return -1;
						} else {
							return 1;
						}
					});
					
					if (checkCanComplete(user, newOrder) === "COMPLETE") {
						removeStockOrder(stock, "BUY", newOrder.orderId);
					} else {
						transAcc.pendingTrans.push(newOrder);
					}
					updateAskBid(stock);
					break;
				}
			};
			return true;
		} else {
			//If insufficient funds return false for the error message and cancellation
			numberOfTransactions--;
			console.log("Balance Insufficient");
			return false;
		}
	} else {
		console.log("SELL");
		let isOwned = false;
		//Check if the user has the stock they want to sell
		let index = returnStockIfOwned(transAcc.stocksOwned, newOrder.symbol);
		if (index != "NONE") {
			isOwned = true;
		}
		if (isOwned) {
			//Check if the user has equal or more shares of the amount they want to sell
			if (transAcc.stocksOwned[index].quantity >= newOrder.unfilled) {
				if (transAcc.stocksOwned[index].quantity === newOrder.unfilled) {
					transAcc.stocksOwned.splice(index, 1);
				} else {
					transAcc.stocksOwned[index].quantity -= newOrder.unfilled;
				}
				//Add the unfilled order to the appropriate stock
				let tempSellStock = returnStockIfFound(allStocks.values(), newOrder.symbol);
				if (tempSellStock != "NONE") {
					tempSellStock.sellOrders.push(newOrder);
					//sort the requested transactions so they appear most expensive to cheapest (for the way I decide which request gets filled first)
					tempSellStock.sellOrders.sort(function(a,b) {
						if (a.price < b.price) {
							return -1;
						} else if (a.price > b.price) {
							return 1;
						}
						//if same price then go by ID (smaller ID means it wis an older request)
						if (a.orderId < b.orderId) {
							return -1;
						} else {
							return 1;
						}
					});

					if (checkCanComplete(user, newOrder) === "COMPLETE") {
						removeStockOrder(tempSellStock, "SELL", newOrder.orderId);
					} else {
						transAcc.pendingTrans.push(newOrder);
					}
				}
				updateAskBid(tempSellStock);
				return true;
			}
		}
		numberOfTransactions--;
		console.log("Shares Insufficient");
		return false;
	}
}

//Whenever there is a new buy or sell order, check if it can be fulfilled
function checkCanComplete(user, inputOrder) {
	let tempStock = returnStockIfFound(allStocks.values(), inputOrder.symbol);
	if (tempStock != "NONE") {
		//Buy side check
		if (inputOrder.type === "BUY") {
			let i = 0;
			while (i < tempStock.sellOrders.length) {
				//check if the price is less than or equal to the price the user wants to buy for
				if (tempStock.sellOrders[i].price <= inputOrder.price) {
					let buyer = returnUserAccount(user.logName);
					let seller = returnUserAccount(tempStock.sellOrders[i].accountName);
					let newComplete = JSON.parse(JSON.stringify(completedOrd));
					newComplete.b = buyer.logName;
					newComplete.s = seller.logName;
					
					console.log("From " + seller.logName + " To " + buyer.logName);

					let p = tempStock.sellOrders[i].price;
					let available = tempStock.sellOrders[i].unfilled;
					let wanted = inputOrder.unfilled;
					if (available >= wanted) {
						tempStock.sellOrders[i].filled += wanted;
						tempStock.sellOrders[i].unfilled -= wanted;
						inputOrder.filled = wanted;
						inputOrder.unfilled = 0;
						inputOrder.complete = true;

						addNewOwned(buyer.logName, tempStock, wanted);
						seller.currBalance += (wanted * p);
						//Adjust for the fact that they initially put asside a potentially higher
						//amount of money for the purchase
						buyer.currBalance += (wanted * inputOrder.price);
						buyer.currBalance -= (wanted * p);
						buyer.history.push(newOrderHistory(inputOrder, wanted, false, p));
						seller.history.push(newOrderHistory(tempStock.sellOrders[i], wanted, false, p));

						createNot(buyer, inputOrder.symbol, "BUY", inputOrder.orderId, null);
						createNot(seller, inputOrder.symbol, "SELL", tempStock.sellOrders[i].orderId, null);

						if (available === wanted) {
							removePendingFromAcc(seller, tempStock.sellOrders[i].orderId);
							tempStock.sellOrders.splice(i, 1);
						}

						//update appropriate fields related to the histories
						newComplete.moved = wanted;
						tempStock.dayTrades += wanted;
						newComplete.price = p;
						tempStock.soldTday.push(newComplete);
						calcAvg(tempStock);
						return "COMPLETE";
					} else {
						tempStock.sellOrders[i].filled += available;
						tempStock.sellOrders[i].unfilled -= available;
						inputOrder.filled = available;
						inputOrder.unfilled -= available;

						addNewOwned(buyer.logName, tempStock, available);
						seller.currBalance += (available * p);
						//Adjust for the fact that they initially put asside a potentially higher
						//amount of money for the purchase
						buyer.currBalance += (available * inputOrder.price);
						buyer.currBalance -= (available * p);
						buyer.history.push(newOrderHistory(inputOrder, available, false, p));

						tempStock.sellOrders[i].complete = true;
						seller.history.push(newOrderHistory(tempStock.sellOrders[i], available, false, p));
						removePendingFromAcc(seller, tempStock.sellOrders[i].orderId);

						//update appropriate fields related to the histories
						newComplete.moved = available;
						tempStock.dayTrades += available;
						newComplete.price = p;
						tempStock.soldTday.push(newComplete);
						calcAvg(tempStock);
						tempStock.sellOrders.splice(i, 1);
					}
				} else {
					i++;
				}
			}
		//Sell side check
		} else {
			let i = 0;
			while (i < tempStock.buyOrders.length) {
				//check if the price is greater than or equal to the price the user wants to sell for
				if (tempStock.buyOrders[i].price >= inputOrder.price) {
					let buyer = returnUserAccount(tempStock.buyOrders[i].accountName);
					let seller = returnUserAccount(user.logName);
					let newComplete = JSON.parse(JSON.stringify(completedOrd));
					newComplete.b = buyer.logName;
					newComplete.s = seller.logName;
					
					console.log("From " + seller.logName + " To " + buyer.logName);

					let p = inputOrder.price;
					let available = inputOrder.unfilled;
					let wanted = tempStock.buyOrders[i].unfilled;
					if (available <= wanted) {
						tempStock.buyOrders[i].filled += available;
						tempStock.buyOrders[i].unfilled -= available;
						inputOrder.filled = available;
						inputOrder.unfilled = 0;
						inputOrder.complete = true;

						addNewOwned(buyer.logName, tempStock, available);
						seller.currBalance += (available * p);
						//Adjust for the fact that they initially put asside a potentially higher
						//amount of money for the purchase
						buyer.currBalance += (available * tempStock.buyOrders[i].price);
						buyer.currBalance -= (available * p);
						buyer.history.push(newOrderHistory(tempStock.buyOrders[i], available, false, p));
						seller.history.push(newOrderHistory(inputOrder, available, false, p));

						createNot(buyer, inputOrder.symbol, "BUY", tempStock.buyOrders[i].orderId, null);
						createNot(seller, inputOrder.symbol, "BUY", inputOrder.orderId, null);

						if (available === wanted) {
							removePendingFromAcc(buyer, tempStock.buyOrders[i].orderId);
							tempStock.buyOrders.splice(i, 1);
						}

						//update appropriate fields related to the histories
						newComplete.moved = available;
						tempStock.dayTrades += available;
						newComplete.price = p;
						tempStock.soldTday.push(newComplete);
						calcAvg(tempStock);
						tempStock.buyOrders.splice(i, 1);
						return "COMPLETE";
					} else {
						tempStock.buyOrders[i].filled += wanted;
						tempStock.buyOrders[i].unfilled -= wanted;
						inputOrder.filled = wanted;
						inputOrder.unfilled -= wanted;

						addNewOwned(buyer.logName, tempStock, wanted);
						seller.currBalance += (wanted * p);
						//Adjust for the fact that they initially put asside a potentially higher
						//amount of money for the purchase
						buyer.currBalance += (wanted * tempStock.buyOrders[i].price);
						buyer.currBalance -= (wanted * p);
						buyer.history.push(newOrderHistory(tempStock.buyOrders[i], wanted, false, p));

						tempStock.buyOrders[i].complete = true;
						seller.history.push(newOrderHistory(inputOrder, wanted, false, p));
						removePendingFromAcc(buyer, tempStock.buyOrders[i].orderId);

						//update appropriate fields related to the histories
						tempStock.dayTrades += wanted;
						newComplete.price = p;
						tempStock.soldTday.push(newComplete);
						calcAvg(tempStock);
						tempStock.buyOrders.splice(i, 1);
					}
				} else {
					i++;
				}
			}
		}
	}
	return "INCOMPLETE";
}

//Returns index of a stock if it is owned
function returnStockIfOwned(group, symbol) {
	let i = 0;
	for (let stock of group) {
		if (stock.stockObject.symbol.toUpperCase() === symbol) {
			return i;
		}
		i++;
	}
	return "NONE";
}

//Returns stock if it is found in the a given group
function returnStockIfFound(group, symbol) {
	for (let stock of group) {
		if (stock.symbol.toUpperCase() === symbol.toUpperCase()) {
			return stock;
		}
	}
	return "NONE";
}

//Returns the user account with a matching name
function returnUserAccount(accName) {
	for (let user of allAccounts.values()) {
		if (accName === user.logName) {
			return user;
		}
	}
	return "NONE";
}

//Adds an order to the current users history array
function newOrderHistory(inputOrder, shares, wasCancelled, actualP) {
	let newHist = JSON.parse(JSON.stringify(histStock));
	newHist.symbol = inputOrder.symbol;
	newHist.type = inputOrder.type; 
	newHist.filled = inputOrder.filled;
	newHist.unfilled = inputOrder.unfilled;
	newHist.timeOfHist = date;

	if (actualP != null) {
		newHist.price = inputOrder.price + " actual==(" + actualP + ")";
	} else {
		newHist.price = inputOrder.price;
	}

	if (wasCancelled) {
		newHist.complete = false;
		newHist.moved = "-";
	} else {
		newHist.complete = true;
		newHist.moved = shares;
	}
	console.log(newHist.moved);
	newHist.orderId = inputOrder.orderId;
	return newHist;
}

//Adds owned stock to user account
function addNewOwned(accName, stockToAdd, shares) {
	let giveTo = returnUserAccount(accName);
	let alreadyHave = returnStockIfOwned(giveTo.stocksOwned, stockToAdd.symbol);

	if (alreadyHave != "NONE") {
		giveTo.stocksOwned[alreadyHave].quantity += shares;
	} else {
		let newO = JSON.parse(JSON.stringify(owned));
		newO.stockObject = stockToAdd;
		newO.quantity = shares;
		giveTo.stocksOwned.push(newO);
	}
}

//Remove order from stock
function removeStockOrder(stock, type, id) {
	if (type === "BUY") {
		for (let i = 0; i < stock.buyOrders.length; i++) {
			if (stock.buyOrders[i].orderId === id) {
				stock.buyOrders.splice(i, 1);
				return "PASS";
			}
		}
	} else {
		for (let i = 0; i < stock.sellOrders.length; i++) {
			if (stock.sellOrders[i].orderId === id) {
				stock.sellOrders.splice(i, 1);
				return "PASS";
			}
		}
	}
	return "NONE";
}

//Remove a pending from a users account
function removePendingFromAcc(acc, id) {
	for (let i = 0; i < acc.pendingTrans.length; i++) {
		if (acc.pendingTrans[i].orderId === id) {
			acc.pendingTrans.splice(i, 1);
			return "PASS";
		}
	}
	return "NONE";
}

//Create and add notification for a user account
function createNot(user, symb, type, id, change) {
	let newStr;
	if (type != null && change == null) {
		newStr = "[" + type + "] " + symb + " " + " ID -- " + id + " has been completed/partially completed";
	} else {
		newStr = symb + " " + "has experienced a change of -- (" + change + "%)";
	}
	user.notification.push(newStr);
	console.log("Created new Notification");
}

//Checks if any of user set up notifications should be triggered (not yet in use)
function checkPChanges(stock) {
	for (let user of allAccounts.values()) {
		for (let i = 0; i < user.stocksPChange.length; i++) {
			if (user.stocksPChange[i].symbol === stock.symbol) {
				if (user.stocksPChange[i].targetP >= 0 && user.stocksPChange[i].targetP <= stock.perChange) {
					createNot(user, user.stocksPChange[i].symbol, null, null, user.stocksPChange[i].targetP);
					user.stocksPChange.splice(i, 1);
				} else if (user.stocksPChange[i].targetP < 0 && user.stocksPChange[i].targetP >= stock.perChange) {
					createNot(user, user.stocksPChange[i].symbol, null, null, user.stocksPChange[i].targetP);
					user.stocksPChange.splice(i, 1);
				}
			}
		}
	}
}

//Calculate the current stocks average (for completed transactions)
function calcAvg(stock) {
	totalVal = 0;
	for (let val of stock.soldTday) {
		totalVal += (val.price*val.moved);
	}
	stock.avg = totalVal/stock.dayTrades;
	calcPChange(stock);
	checkPChanges(stock);
}

//Calculate the change in avg prive for a stock
function calcPChange(stock) {
	let diff = stock.prevAvg - stock.avg;
	if (diff > 0) {
		stock.perChange = -(diff/stock.prevAvg)*100;
	} else if (diff < 0) {
		stock.perChange = -(diff/stock.prevAvg)*100;
	} else {
		stock.perChange = 0;
	}
}

//Update a stocks ask and bid values
function updateAskBid(stock) {
	if (stock.buyOrders.length != 0) {
		stock.bid = stock.buyOrders[0].price;
	} else {
		stock.bid = "-";
	}
	if (stock.sellOrders.length != 0) {
		stock.ask = stock.sellOrders[0].price;
	} else {
		stock.ask = "-";
	}
}

//Move the server to the next day (ie, ends the prev trading day, starts a new one)
function endTradeDay() {
	removeEndDay();
	updateStockState();
	
	date++;
	console.log("Date Is Now: " + date);
	console.log("Ended Trade Day, Moved To Next");
}

//Remove pending transactions at end of day if they are flag as such
function removeEndDay() {
	for (let u of allAccounts.values()) {
		let toRemove = [];
		for (let t of u.pendingTrans) {
			if (t.removeAtEndDay) {
				toRemove.push(t);
			}
		}
		removePendingTransactions(u, toRemove);
	}
}

//Update stock state after moving on to next day
function updateStockState() {
	for (let stock of allStocks.values()) {
		let newH = JSON.parse(JSON.stringify(pastStock));
		if (stock.soldTday.length != 0) {
			stock.soldTday.sort(function(a,b) {
				if (a.price < b.price) {
					return -1;
				} else if (a.price > b.price) {
					return 1;
				}
			});
			console.log(stock.soldTday);
			newH.min = stock.soldTday[0].price;
			newH.max = stock.soldTday[stock.soldTday.length - 1].price;
		} else {
			newH.min = "-";
			newH.max = "-";
		}
		newH.timeOfHist = date;
		newH.avg = stock.avg;
		newH.perChange = stock.perChange;
		newH.dayTrades = stock.dayTrades;
		newH.transactions.push(stock.soldTday);
		stock.history.push(newH);

		if (stock.avg != "-") {
			stock.prevAvg = stock.avg
		}
		stock.avg = "-";
		stock.perChange = 0;
		stock.dayTrades = 0;
		stock.soldTday = [];
	}
}

//Adds a new P change notification to a users account
function newPNotification(user, stock, body) {
	let newTargetP = JSON.parse(JSON.stringify(notificationForm));
	newTargetP.symbol = body.symbol;
	newTargetP.name = stock.name;
	newTargetP.prevP = stock.prevAvg;
	newTargetP.avgP = stock.avg;
	newTargetP.currPChange = stock.perChange;
	newTargetP.targetP = body.pChange;

	let alreadyExists = false;
	for (let t of user.stocksPChange) {
		if (t.symbol === body.symbol && t.targetP === body.pChange) {
			alreadyExists = true;
			console.log("Duplicate detected, not adding a new notification!");
			break;
		}
	}
	if (!alreadyExists) {
		user.stocksPChange.push(newTargetP);
	}
	checkPChanges(stock);
}

//Change in a users account balance withdraw/deposit
function changeBalance(user, amount, type) {
	if (type == "Deposit") {
		user.currBalance += amount;
	} else {
		user.currBalance -= amount;
	}
	let newHist = JSON.parse(JSON.stringify(histMonitary));
	newHist.type = type;
	newHist.price = amount;
	newHist.orderId = ++numberOfTransactions;
	newHist.timeOfHist = date;
	user.history.push(newHist);
}

//checks if the requested userName is already logged in
function quryUserName(userN, id) {
	db.collection("loggedIn").findOne({name: userN, ident: {$exists: true}}, function(err, result) {
		if (err) throw err;
		if (result) {
			removeLog(userN, result.ident);
		} else {
			console.log("OK USERNAME");
		}
	});
}

//checks if the sessionID is already logged in with the same or different userName
function qurySessID(userN, id) {
	db.collection("loggedIn").findOne({name: {$exists: true}, ident: id}, function(err, result) {
		if (err) throw err;
		if (result) {
			removeLog(result.name, id);
		} else {
			console.log("OK SESSION ID");
		}
	});
}

//add a userName and sessionID pair to the active logged in database
function addNewLog(userN, id) {
	console.log("ID " + id + " ADDED TO LOGGED IN");
	db.collection("loggedIn").insertOne({name: userN, ident: id});
}

//remove a userName and sessionID pair from the active logged in database
//also server to unpair previous login ID
function removeLog(userN, id) {
	console.log("ID " + id + " REMOVED FROM LOGGIN");
	db.collection("loggedIn").deleteOne({name: userN, ident: id});
}