//Fixed how the page updates, now each update function will check if teh page has received any new values,
//if it has it will only update the portions that have the changes (won't reset text fields anymore)
if (!document.getElementById("loginPageIdent")) {
	setInterval(function() {
		console.log("CHECK UPDATES");
		if (localStorage.getItem("logStat") != "") {
			getNotifications();
		}
		if (document.getElementById("homePageIdent")) {
			getCurrDay();
			updateHomePage();
		} else if (document.getElementById("stockPageIdent")) {
			getCurrDay();
			updateStockPage();
		} else if (document.getElementById("profilePageIdent")) {
			updateProfileBal();
			updateOwnedStocks();
			updateProfileCurrTrans();
			updateProfileWatch();
			updateProfileNotifcations();
			updateHistory();
		}
	}, 5000);
}

//What type of initialization to do based on the page identification
function init() {
	let request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			localStorage.setItem("currHome", null);
			localStorage.setItem("currStockPage", null);
			localStorage.setItem("currBalance", null);
			localStorage.setItem("currOwned", null);
			localStorage.setItem("currWatched", null);
			localStorage.setItem("currTransactions", null);
			localStorage.setItem("currNotifications", null);
			localStorage.setItem("currHistory", null);

			localStorage.setItem("logStat", this.response); 
			if (localStorage.getItem("logStat") != "") {
				getNotifications();
			}
			if (document.getElementById("homePageIdent")) {
				getCurrDay();
				updateHomePage();
				//Check if we should give admin controls, note this is just a placeholder, it will be mada more secure later
				if (localStorage.getItem("logStat") === "admin") {
					console.log(localStorage.getItem("logStat"));
					let adminButton1 = document.createElement("button");
					adminButton1.id = "nextDayButton";
					adminButton1.innerHTML = "Click To Go To Next Day!";
					let adminButton2 = document.createElement("button");
					adminButton2.id = "resetServerState";
					adminButton2.innerHTML = "Click To Reset The Server State!";
					let lineBreak = document.createElement("br");
					document.body.appendChild(lineBreak);
					document.body.appendChild(adminButton1);
					document.body.appendChild(adminButton2);
					document.getElementById("nextDayButton").addEventListener("click", nextDay);
					document.getElementById("resetServerState").addEventListener("click", resetState);
				}
            }
			//If there is a user logged in, initialize their profile
			if (document.getElementById("profilePageIdent") && localStorage.getItem("logStat") != "") {
				console.log("Profile Page");
				document.getElementById("accName").innerHTML = localStorage.getItem("logStat");
				document.getElementById("cancelTrans").addEventListener("click", removePendingChecked);
				document.getElementById("removeStock").addEventListener("click", removeWatchChecked);
				document.getElementById("cancelNotification").addEventListener("click", removeNotificationChecked);
				document.getElementById("depositBalance").addEventListener("click", dBalance);
				document.getElementById("withdrawBalance").addEventListener("click", wBalance);
				document.getElementById("historySearch").addEventListener("input", updateHistory);
				updateProfileBal();
				updateOwnedStocks();
				updateProfileWatch();
				updateProfileCurrTrans();
				updateProfileNotifcations();
				updateHistory();
			}
			if (document.getElementById("loginPageIdent")) {
				console.log("Login Page");
				document.getElementById("loginButton").addEventListener("click", login);
				document.getElementById("createButton").addEventListener("click", createAccount);
			}
			if (document.getElementById("stockPageIdent")) {
				getCurrDay();
				updateStockPage();
				if (localStorage.getItem("logStat") != "") {
					document.getElementById("buyShares").addEventListener("click", function() {requestTransaction("BUY")});
					document.getElementById("sellShares").addEventListener("click", function() {requestTransaction("SELL")});
					document.getElementById("addWatch").addEventListener("click", addToStockWatch);
					document.getElementById("notifyMe").addEventListener("click", addToPNotifiction);
				}
			}
			if (localStorage.getItem("logStat") != "") {
				let modifiedNav = document.getElementById("login");
				if (modifiedNav) { 
					modifiedNav.id = "logout";
					modifiedNav.innerHTML = "Logout";
					modifiedNav.href = "home.html";
				}
				document.getElementById("logout").addEventListener("click", userLogout);
			}
		}
	}
	request.open("GET", "/init");
	request.send();

	console.log("Page Initialization Called");
}

//Display notifications 
//For all the update functions I am only checking log status here, since the getNotifications() is called on each page
//so this will automatically detect if the account has been logged into elsewhere whenever trying to update elements
//logStatusCheck() is also called whenever an action is performed, like buying/selling, adding to watch, etc.
function getNotifications()  {
	let request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				let notArray = JSON.parse(this.responseText);
				for (let i of notArray) {
					alert(i);
				}
			}
		}
	}
	request.open("GET", "/getNotifications");
	request.send();

	console.log("Notifications Called");
}

//Get the current day of the server
function getCurrDay() {
	let request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			document.getElementById("currDay").innerHTML = JSON.parse(this.responseText);
		}
	}
	request.open("GET", "/getCurrDay");
	request.send();

	console.log("Get Day Called");
}

//Add a new % change notification
function addToPNotifiction() {
	let newPChange = {
		symbol: "",
		pChange: "",
	};

	let newNoti = JSON.parse(JSON.stringify(newPChange));
	newNoti.symbol = localStorage.getItem("stockClicked");
	newNoti.pChange = document.getElementById("changeInPer").value;

	console.log(newNoti.pChange);
	if (isNaN(newNoti.pChange)) {
		alert("Please enter a valid decimal number!");
		return false;
	} else if (newNoti.pChange != parseFloat(newNoti.pChange, 10)) {
		alert("Please enter a valid decimal number!");
		return false;
	}

	let request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			logStatusCheck(this.responseText);
			document.getElementById("changeInPer").value = 0;
		}
	}
	request.open("POST", "/addToPNotifiction");
	request.setRequestHeader("Content-type", "application/json");
	request.send(JSON.stringify(newNoti));

	console.log("ADD % Notifications Called");
}

//Remove all checked items from the watch stock list
function removeWatchChecked() {
	//Iterate and check which check boxes are currently selected so that they can be removed
	let allWatchChk = document.querySelectorAll('*[id^=watchChk]');
	let chkToRemove = [];

	for (let i = 0; i < allWatchChk.length; i++) {
		if (allWatchChk[i].checked) {
			
			//Add only the stocks name to the array of watched stocks to be removed
			chkToRemove.push(allWatchChk[i].id.substring('watchChk'.length));
        }
	}

	let request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				emptyTable("watchStocks")
				updateProfileWatch();
			}
		}
	}
	request.open("POST", "/removeWatchChecked");
	request.setRequestHeader("Content-type", "application/json");
	request.send(JSON.stringify(chkToRemove));

	console.log("Remove Watch Checked Called");
}

//Remove all checked items from the pending transaction table
function removePendingChecked() {
	//Ask for cancellation confirmation
	if (confirm("Cancel The Selected Transactions?")) {
		//Iterate and check which check boxes are currently selected so that they can be removed
		let allPendingChk = document.querySelectorAll('*[id^=transChk]');
		let allToRemove = [];
		let toRemove = {
			symbol: "",
			type: "",
			price: "",
			filled: "",
			unfilled: "",
			orderId: "",
		};

		tempTable = document.getElementById("currentTransactions");
		for (let i = 0; i < allPendingChk.length; i++) {
			//If a row is checked add the relavent info so that it can be removed
			if (allPendingChk[i].checked) {
				let newToRemove = JSON.parse(JSON.stringify(toRemove));
				let currRow = tempTable.rows[i+1];
				newToRemove.symbol = currRow.cells[0].childNodes[0].outerText;
				newToRemove.type = currRow.cells[1].innerHTML;
				newToRemove.price = parseFloat(currRow.cells[2].innerHTML, 10);
				newToRemove.filled = parseInt(currRow.cells[3].innerHTML);
				newToRemove.unfilled = parseInt(currRow.cells[4].innerHTML);
				newToRemove.orderId = parseInt(currRow.cells[6].innerHTML);
				allToRemove.push(newToRemove);
			}
		}

		let request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				if (logStatusCheck(this.responseText)) {
					emptyTable("currentTransactions");
					updateProfileCurrTrans();
					updateOwnedStocks();
					updateProfileBal();
					updateHistory();
				}
			}
		}
		request.open("POST", "/removePendingChecked");
		request.setRequestHeader("Content-type", "application/json");
		request.send(JSON.stringify(allToRemove));
	}

	console.log("Remove Pending Checked Called");
}

//Remove all checked items from the notification list
function removeNotificationChecked() {
	//Iterate and check which check boxes are currently selected so that they can be removed
	let allNotChk = document.querySelectorAll('*[id^=notChk]');
	let allToRemove = [];
		let toRemove = {
			symbol: "",
			targetP: "",
		};

	tempTable = document.getElementById("notifiedStocks");
	for (let i = 0; i < allNotChk.length; i++) {
		if (allNotChk[i].checked) {
			let newToRemove = JSON.parse(JSON.stringify(toRemove));
			let currRow = tempTable.rows[i+1];
			newToRemove.symbol = currRow.cells[0].childNodes[0].outerText;
			newToRemove.targetP = parseFloat(currRow.cells[5].innerHTML, 10);
			allToRemove.push(newToRemove);
        }
	}

	
	let request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				emptyTable("notifiedStocks");
				updateProfileNotifcations();
			}
		}
	}
	request.open("POST", "/removeNotificationChecked");
	request.setRequestHeader("Content-type", "application/json");
	request.send(JSON.stringify(allToRemove));

	console.log("Remove Notification Checked Called");
	
}

//Add to watchlist on button click
function addToStockWatch() {
	let toWatch = localStorage.getItem("stockClicked");
	//Call update on balance
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				if (this.responseText === "FAIL") {
					alert("Already watching this stock!");
				} else {
					alert("Added to watched list!");
				}
			}
		}
	}
	request.open("POST", "/addToStockWatch");
	request.setRequestHeader("Content-type", "text/plain");
	request.send(toWatch);

	console.log("Add Watch Function Called");
}

//For profile page
//Add balance
function dBalance() {
	balChange = document.getElementById("deposit/withdraw").value;
	document.getElementById("deposit/withdraw").value = "";
	if(checkValidFloat(balChange)){
		balChange =parseFloat(balChange, 10);
		//Call update on balance
		let request = new XMLHttpRequest();

		request.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				if (logStatusCheck(this.responseText)) {
					updateProfileBal();
					updateHistory();
				}
			}
		}
		request.open("POST", "/dBalance");
		request.setRequestHeader("Content-type", "text/plain");
		request.send(balChange);

		console.log("Add Function Called");
	}
}

//Withdraw Balance
function wBalance() {
	balChange = document.getElementById("deposit/withdraw").value;
	if (checkValidFloat(balChange)) {
		balChange = parseFloat(balChange, 10);
		if (balChange <= parseFloat(document.getElementById("currBal").innerHTML, 10)) {
			//Call update on balance
			let request = new XMLHttpRequest();
			request.onreadystatechange = function () {
				if (this.readyState == 4 && this.status == 200) {
					if (logStatusCheck(this.responseText)) {
						updateProfileBal();
						updateHistory();
					}
				}
			}
			request.open("POST", "/wBalance");
			request.setRequestHeader("Content-type", "text/plain");
			request.send(balChange);

			console.log("Remove Function Called");
		} else {
			alert("Not enough balance for withdrawal!");
        }
	}
	document.getElementById("deposit/withdraw").value = "";
}

//Check if input value is a decimal
function checkValidFloat(val) {
	if (val == null) {
		alert("Please enter a valid decimal number!");
		return false;
	} else if (val != parseFloat(val, 10)) {
		console.log(val);
		console.log(parseFloat(val, 10));
		alert("Please enter a valid decimal number!");
		return false;
    } else if (val <= 0) {
		alert("Please enter a valid decimal number GREATER than 0!");
		return false;
    }
	return true;
}

//Check if input value is a integer
function checkValidInt(val) {
	if (isNaN(val)) {
		alert("Please enter an integer!");
		return false;
	} else if (val != parseInt(val)) {
		alert("Please enter an integer!");
		return false;
    } else if (val <= 0) {
		alert("Please enter an integer GREATER than 0!");
		return false;
	}
	return true;
}

//Update the home page of the website (list all the stocks)
function updateHomePage() {
	let tempAllStock;
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//only update if the page has change from previous
			if (localStorage.getItem("currHome") === null || localStorage.getItem("currHome") != this.responseText) {
				localStorage.setItem("currHome", this.responseText);
				tempAllStock = JSON.parse(this.responseText);
				emptyTable("allStocks");

				let currStock = document.getElementById("allStocks");
				for (let i = 0; i < tempAllStock.length; i++) {
					let newRow = currStock.insertRow(i + 1);
					newRow.id = "homePage" + tempAllStock[i].symbol;
					let pos = 0;
					//Iterate through the stock object
					Object.keys(tempAllStock[i]).forEach(key => {
						if (key == "buyOrders" || key == "sellOrders" || key == "soldTday" || key == "history") {
							return;
						} else {
							let newCell = newRow.insertCell(pos++);
							//If cell is for stock symbol, make it a link to the stock page
							if (key == "symbol") {
								let link = document.createElement("a");
								link.setAttribute("href", "stockPage.html");
								link.addEventListener("click", function() {
									stockJustClicked(tempAllStock[i][key]);
								});
								let linkText = document.createTextNode(tempAllStock[i][key]);
								link.appendChild(linkText);
								newCell.appendChild(link);
							} else {
								newCell.innerHTML = tempAllStock[i][key];
							}
						}
					});
				}
			}
		}
	}
	request.open("GET", "/updateHomePage");
	request.send();

	console.log("Update Home Function Called");
}

//Update the stock page for the requested stock
function updateStockPage() {
	console.log("Stock Page For -> " + localStorage.getItem("stockClicked"));
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				//only update if the page has change from previous
				if (localStorage.getItem("currStockPage") === null || localStorage.getItem("currStockPage") != this.responseText) {
					localStorage.setItem("currStockPage", this.responseText);
					tempStock = JSON.parse(this.responseText);

					emptyTable("selectedStocks");
					emptyTable("buyRequestTable");
					emptyTable("sellRequestTable");
					emptyTable("stockHistoryTable");

					let stockTable = document.getElementById("selectedStocks");
					let pos = 0;
					let newRow = stockTable.insertRow(1);
					newRow.id = "stockPage" + tempStock.symbol;
					//Iterate through the stock object
					Object.keys(tempStock).forEach(key => {
						//Iterate through the stock object
						if (key == "buyOrders" || key == "sellOrders" || key == "soldTday" || key == "history") {
							return;
						} else {
							let newCell = newRow.insertCell(pos++);
							newCell.innerHTML = tempStock[key];
						}
					});
					
					let unfilledRequests = document.getElementById("buyRequestTable");
					let buyR = tempStock.buyOrders;
					for (let t of buyR) {
						pos = 0;
						newRow = unfilledRequests.insertRow(1);
						let newCell = newRow.insertCell(pos++);
						newCell.innerHTML = t.accountName;
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = t.price;
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = t.unfilled;
					}

					unfilledRequests = document.getElementById("sellRequestTable");
					let sellR = tempStock.sellOrders;
					for (let t of sellR) {
						pos = 0;
						newRow = unfilledRequests.insertRow(1);
						let newCell = newRow.insertCell(pos++);
						newCell.innerHTML = t.accountName;
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = t.price;
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = t.unfilled;
					}

					let historyTable = document.getElementById("stockHistoryTable");
					let toDisplay = tempStock.history;
					console.log(toDisplay);
					let startPoint = 0;
					if (toDisplay.length > 30) {
						startPoint = toDisplay.length - 30;
					}
					for (let i = startPoint; i < toDisplay.length; i++) {
						pos = 0;
						newRow = historyTable.insertRow(1);
						let newCell = newRow.insertCell(pos++);
						newCell.innerHTML = toDisplay[i].timeOfHist;
						newCell = newRow.insertCell(pos++);
						console.log(parseFloat(toDisplay[i].avg, 10));
						if (!isNaN(parseFloat(toDisplay[i].avg, 10))) {
							newCell.innerHTML = toDisplay[i].avg.toFixed(3);
						} else {
							newCell.innerHTML = toDisplay[i].avg
						}
						newCell = newRow.insertCell(pos++);
						if (!isNaN(parseFloat(toDisplay[i].min, 10))) {
							newCell.innerHTML = toDisplay[i].min.toFixed(3);
						} else {
							newCell.innerHTML = toDisplay[i].min
						}
						newCell = newRow.insertCell(pos++);
						if (!isNaN(parseFloat(toDisplay[i].max, 10))) {
							newCell.innerHTML = toDisplay[i].max.toFixed(3);
						} else {
							newCell.innerHTML = toDisplay[i].max
						}
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = toDisplay[i].perChange.toFixed(2);
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = toDisplay[i].dayTrades;
					}
				}
			}
		}
	}
	request.open("POST", "/updateStockPage");
	request.setRequestHeader("Content-type", "text/plain");
	request.send(localStorage.getItem("stockClicked"));

	console.log("Update Stock Page Function Called");
}

//Gets the current user balance from server and displays the value to the page
function updateProfileBal() {	
	let tempUser;
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//only update if the page has change from previous
			if (localStorage.getItem("currBalance") === null || localStorage.getItem("currBalance") != this.responseText) {
				localStorage.setItem("currBalance", this.responseText);
				tempUser = JSON.parse(this.responseText);
				document.getElementById("currBal").innerHTML = tempUser.currBalance;
			}
		}
	}
	request.open("GET", "/updateProfileBal");
	request.send();

	console.log("Update Bal Function Called");
}

//Update owned stocks
function updateOwnedStocks() {
	let ownedStocks;
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//only update if the page has change from previous
			if (localStorage.getItem("currOwned") === null || localStorage.getItem("currOwned") != this.responseText) {
				localStorage.setItem("currOwned", this.responseText);
				ownedStocks = JSON.parse(this.responseText);

				emptyTable("currStocks");

				let currStock = document.getElementById("currStocks");
				while (currStocks.rows[1] != null) {
					currStocks.deleteRow(1);
				}
				for (let i = 0; i < ownedStocks.length; i++) {
					let newRow = currStock.insertRow(i + 1);
					newRow.id = "currRow" + ownedStocks[i].stockObject.symbol;
					let pos = 0;
					//Iterate through the stock object
					Object.keys(ownedStocks[i].stockObject).forEach(key => {
						if (key == "buyOrders" || key == "sellOrders" || key == "soldTday" || key == "history") {
							return;
						} else {
							let newCell = newRow.insertCell(pos++);
							//If cell is for stock symbol, make it a link to the stock page
							if (key == "symbol") {
								let link = document.createElement("a");
								link.setAttribute("href", "stockPage.html");
								link.addEventListener("click", function() {
									stockJustClicked(ownedStocks[i].stockObject[key]);
								});
								let linkText = document.createTextNode(ownedStocks[i].stockObject[key]);
								link.appendChild(linkText);
								newCell.appendChild(link);
							} else {
								newCell.innerHTML = ownedStocks[i].stockObject[key];
							}
						}
					});
					if (ownedStocks != null) {
						newRow.insertCell(pos++).innerHTML = ownedStocks[i].quantity;
					}
				}
			}
		}
	}
	request.open("GET", "/updateOwnedStocks");
	request.send();

	console.log("Update Owned Function Called");
}

//Gets the current user watch list from server and displays them to the page
//This will only be change by the users themsleves, so this won't need to be updated every 5 seconds
function updateProfileWatch() {
	let watchArray;
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//only update if the page has change from previous
			if (localStorage.getItem("currWatched") === null || localStorage.getItem("currWatched") != this.responseText) {
				localStorage.setItem("currWatched", this.responseText);
				watchArray = JSON.parse(this.responseText);

				emptyTable("watchStocks");

				let currStock = document.getElementById("watchStocks");
				for (let i = 0; i < watchArray.length; i++) {
					let newCheck = document.createElement("input");
					let newRow = currStock.insertRow(i + 1);
					newRow.id = "watchRow" + watchArray[i].symbol;
					let pos = 0;
					//Iterate through the stock object
					Object.keys(watchArray[i]).forEach(key => {
						if (key == "buyOrders" || key == "sellOrders" || key == "soldTday" || key == "history") {
							return;
						} else {
							let newCell = newRow.insertCell(pos++);
							//If cell is for stock symbol, make it a link to the stock page
							if (key == "symbol") {
								let link = document.createElement("a");
								link.setAttribute("href", "stockPage.html");
								link.addEventListener("click", function() {
									stockJustClicked(watchArray[i][key]);
								});
								let linkText = document.createTextNode(watchArray[i][key]);
								link.appendChild(linkText);
								newCell.appendChild(link);
							} else {
								newCell.innerHTML = watchArray[i][key];
							}
						}
					});
					let newCell = newRow.insertCell(pos++);
					newCheck.type = "checkbox";
					newCheck.value = false;
					newCheck.id = "watchChk" + watchArray[i].symbol;
					newCell.appendChild(newCheck);
				}
			}
		}
	}
	request.open("GET", "/updateProfileWatch");
	request.send();

	console.log("Update Watch Function Called");
}

//Gets the current user transactions list from server and displays them to the page
function updateProfileCurrTrans() {
	let pendArray;
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//only update if the page has change from previous
			if (localStorage.getItem("currTransactions") === null || localStorage.getItem("currTransactions") != this.responseText) {
				localStorage.setItem("currTransactions", this.responseText);
				pendArray = JSON.parse(this.responseText);

				emptyTable("currentTransactions");

				let outstanding = document.getElementById("currentTransactions");
				for (let i = 0; i < pendArray.length; i++) {
					let newCheck = document.createElement("input");
					let newRow = outstanding.insertRow(i + 1);
					newRow.id = "pendingRow" + pendArray[i].symbol;
					let pos = 0;
					//Iterate through the order object
					Object.keys(pendArray[i]).forEach(key => {
						if (key == "accountName" || key == "complete") {
							return;
						} else {
							let newCell = newRow.insertCell(pos++);
							//If cell is for stock symbol, make it a link to the stock page
							if (key == "symbol") {
								let link = document.createElement("a");
								link.setAttribute("href", "stockPage.html");
								link.addEventListener("click", function() {
									stockJustClicked(pendArray[i][key]);
								});
								let linkText = document.createTextNode(pendArray[i][key]);
								link.appendChild(linkText);
								newCell.appendChild(link);
							} else {
								newCell.innerHTML = pendArray[i][key];
							}
						}
					});
					let newCell = newRow.insertCell(pos++);
					newCheck.type = "checkbox";
					newCheck.value = false;
					newCheck.id = "transChk" + pendArray[i].orderId;
					newCell.appendChild(newCheck);
				}
			}
		}
	}
	request.open("GET", "/updateProfileCurrTrans");
	request.send();

	console.log("Update Curr Function Called");
}

//Update stocks to be notified about
function updateProfileNotifcations() {
	let notArray;
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//only update if the page has change from previous
			if (localStorage.getItem("currNotifications") === null || localStorage.getItem("currNotifications") != this.responseText) {
				localStorage.setItem("currNotifications", this.responseText);
				notArray = JSON.parse(this.responseText);

				if (notArray.length > 0) {
					emptyTable("notifiedStocks");

					let interested = document.getElementById("notifiedStocks");
					for (let i = 0; i < notArray.length; i++) {
						let newCheck = document.createElement("input");
						let newRow = interested.insertRow(i + 1);
						let pos = 0;
						//Iterate through the order object
						Object.keys(notArray[i]).forEach(key => {
							let newCell = newRow.insertCell(pos++);
							//If cell is for stock symbol, make it a link to the stock page
							if (key == "symbol") {
								let link = document.createElement("a");
								link.setAttribute("href", "stockPage.html");
								link.addEventListener("click", function() {
									stockJustClicked(notArray[i][key]);
								});
								let linkText = document.createTextNode(notArray[i][key]);
								link.appendChild(linkText);
								newCell.appendChild(link);
							} else {
								newCell.innerHTML = notArray[i][key];
							}
						});
						let newCell = newRow.insertCell(pos++);
						newCheck.type = "checkbox";
						newCheck.value = false;
						newCheck.id = "notChk" + notArray[i].symbol + notArray[i].targetP;
						newCell.appendChild(newCheck);
					}
				}
			}
		}
	}
	request.open("GET", "/updateProfileNotifcations");
	request.send();

	console.log("Update Interested Function Called");
}

//Update profile history, this is based of if the user has specified a search parameter or not (by default is it "" and returns all)
//the history search will update as the user is typing into the search field
function updateHistory() {
	let histArray;
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			//only update if the page has change from previous
			if (localStorage.getItem("currHistory") === null || localStorage.getItem("currHistory") != this.responseText) {
				localStorage.setItem("currHistory", this.responseText);
				histArray = JSON.parse(this.responseText);

				emptyTable("historyTable");

				//Go newest to oldest
				histArray.reverse();

				let hist = document.getElementById("historyTable");
				for (let i = 0; i < histArray.length; i++) {
					let newRow = hist.insertRow(i + 1);
					let pos = 0;
					
					if (histArray[i].type === "Deposit" || histArray[i].type === "Withdraw") {
						let newCell = newRow.insertCell(pos++);
						newCell.innerHTML = histArray[i].type;
						newCell = newRow.insertCell(pos++);
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = histArray[i].price;
						newCell = newRow.insertCell(pos++);
						newCell = newRow.insertCell(pos++);
						newCell = newRow.insertCell(pos++);
						newCell = newRow.insertCell(pos++);
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = histArray[i].orderId;
						newCell = newRow.insertCell(pos++);
						newCell.innerHTML = histArray[i].timeOfHist;
					} else {
						//Iterate through the order object
						Object.keys(histArray[i]).forEach(key => {
							let newCell = newRow.insertCell(pos++);
							//If cell is for stock symbol, make it a link to the stock page
							if (key == "symbol") {
								let link = document.createElement("a");
								link.setAttribute("href", "stockPage.html");
								link.addEventListener("click", function() {
									stockJustClicked(histArray[i][key]);
								});
								let linkText = document.createTextNode(histArray[i][key]);
								link.appendChild(linkText);
								newCell.appendChild(link);
							} else {
								newCell.innerHTML = histArray[i][key];
							}
						});
					}
				}
			}
		}
	}
	let toSearch = document.getElementById("historySearch").value;
	if (toSearch.length === 0) {
		toSearch = "DEFAULT";
	}
	request.open("GET", "/updateHistory/" + toSearch);
	request.send();

	console.log("Update History Function Called");
}

//For login page
//Requests the server for login
function login() {
	let requestedLogin = {
		requestLogName: "",
		requestPass: "",
	};
	let tempLog = JSON.parse(JSON.stringify(requestedLogin));
	tempLog.requestLogName = document.getElementById("loginUser").value;
	tempLog.requestPass = document.getElementById("loginPassword").value;
	
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			document.getElementById("loginUser").value = "";
			document.getElementById("loginPassword").value = "";
			if (this.response === "PASS") {
				//Redirects to user profile page if the login was successful
				location.href = "/profile.html";
            } else {
				alert("Incorrect Username/Password Try Again!");
			}
		}
	}
	request.open("POST", "/login");
	request.setRequestHeader("Content-type", "application/json");
	request.send(JSON.stringify(tempLog));

	console.log("Login Function Called");
}

//Create new user account call
function createAccount() {
	let requestedNew = {
		newName: "",
		newLogName: "",
		newPass: "",
	};
	let tempNew = JSON.parse(JSON.stringify(requestedNew));
	tempNew.newName = document.getElementById("createName").value;
	tempNew.newLogName = document.getElementById("createUserN").value;
	tempNew.newPass = document.getElementById("createPassword").value;

	//Check if info to create new account is valid (not empty and no spaces)
	if (tempNew.newName.length === 0 || tempNew.newLogName === 0 || tempNew.newPass === 0) {
		alert("You must not leave any of the fields blank!");
		return 0;
	} else if (tempNew.newName.indexOf(" ") !== -1 || tempNew.newLogName.indexOf(" ") !== -1 || tempNew.newPass.indexOf(" ") !== -1) {
		alert("No spaces allowed!");
		return 0;
	}
	
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			document.getElementById("createName").value = "";
			document.getElementById("createUserN").value = "";
			document.getElementById("createPassword").value = "";
			if (this.response === "PASS") {
				alert("Please login to the new account!");
            } else {
				alert("The user: " + tempNew.newLogName + " already exists!");
			}
		}
	}
	request.open("POST", "/createAccount");
	request.setRequestHeader("Content-type", "application/json");
	request.send(JSON.stringify(tempNew));

	console.log("Create User Function Called");
}

//Log the current user out of their account
function userLogout() {
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			console.log("Logout Complete");
		}
	}
	request.open("GET", "/userLogout");
	request.send();

	console.log("Logout Function Called");
}

//Stock link just clicked
function stockJustClicked(tempStockName) {
	//Saves the name of the stock link just clicked on so the stockPage knows what stock to request from the server
	localStorage.setItem("stockClicked", tempStockName);
	console.log("Just Clicked Function Called");
}

//Call server to request buying shares
function requestTransaction(requestType) {
	let requestB = {
		symbol: "",
		shares: "",
		price: "",
		type: requestType,
		removeAtEnd: false,
	};

	let temp = JSON.parse(JSON.stringify(requestB));

	temp.symbol = localStorage.getItem("stockClicked").toLowerCase();
	temp.shares = document.getElementById("numShare").value;
	temp.price = document.getElementById("costPerShare").value;
	temp.removeAtEnd = document.getElementById("endDayChk").checked;

	if (!checkValidInt(temp.shares) || !checkValidFloat(temp.price)) {
		console.log("ERROR");
		return 0;
	}

	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				if (this.response == "FAIL") {
					if (temp.type === "BUY") {
						alert("You do not have enough balance for this request!");
					} else {
						alert("You do not have enough shares for this request!");
					}
				}
				document.getElementById("numShare").value = 0;
				document.getElementById("costPerShare").value = 0.00;
				updateStockPage();
			}
		}
	}
	request.open("POST", "/requestTransaction");
	request.setRequestHeader("Content-type", "application/json");
	request.send(JSON.stringify(temp));

	console.log("Request Buy Function Called");
}

//Tells the server that the admin would like to advance the day (log in as admin for this option)
function nextDay() {
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				alert("Day Has Been Advanced!");
				getCurrDay();
				updateHomePage();
			}
		}
	}
	request.open("GET", "/nextDay");
	request.send();

	console.log("Request Buy Function Called");
}

//Reset to starting state if anything breaks (log in as admin for this option)
function resetState() {
	let request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (logStatusCheck(this.responseText)) {
				alert("Server Reset!");
				getCurrDay();
				updateHomePage();
			}
		}
	}
	request.open("GET", "/resetState");
	request.send();

	console.log("Request Buy Function Called");
}

//Clears elements within a table
function emptyTable(tableId) {
	let clear = document.getElementById(tableId);
	while (clear.rows[1] != null) {
		clear.deleteRow(1);
	}
}

//Check if the account is logged out or if it has been logged in elsewhere
function logStatusCheck(response) {
	if (response === "NOT_LOGGED_IN" || response === "ALREADY_LOGGED_OUT") {
		console.log("NOT_LOGGED_IN, ACTION FAILED");
		location.href = "/login.html";
		return false;
	} else if (response === "LOGGED_IN_AT_OTHER_LOC") {
		alert("LOGGED_IN_AT_OTHER_LOC: LOGGED-OUT, ACTION FAILED");
		location.href = "/login.html";
		return false;
	}
	return true;
}

