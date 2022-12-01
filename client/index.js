import Web3 from "web3";
import "bootstrap/dist/css/bootstrap.css";
import configuration from "../build/contracts/Taxi.json";

const CONTRACT_ADDRESS = configuration.networks[5777].address; //"";
const CONTRACT_ABI = configuration.abi;
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const createElFromString = string => {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstChild;
};

const web3 = new Web3(Web3.givenProvider || "http://127.0.0.7545");
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

let account;
const accountEl = document.getElementById("account");
const requestsEl = document.getElementById("requests");
const ridesEl = document.getElementById("rides")
const TOTAL_REQUESTS = 6;

const submitOffer = async (requestId, offeredAmount) => {
  await contract.methods.createRide(requestId, offeredAmount).send({
    from: account
  });
};

function checkAccountReq(a) {
  if (a[3] != account) {
    return `<form id="offer" class="form-inline">
        <div class="form-group">
        <label for="offerAmount">Make Offer:</label>
        <input type="number" class="form-control" id="offeredAmount" placeholder="Enter amount in Ether">
        </div>
        <input id="requestIdHolder" value="${a[0]}" hidden>   
        <button id="offerBtn_${a[0]}" class="mt-2 btn btn-primary">Offer</button>
        </form>`;
  } else {
    return `<h6 class="card-title text-danger">You cannot make on offer on your request</h6>`;
  }
}

const viewRequests = async () => {
  requestsEl.innerHTML = "";
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const request = await contract.methods.requests(i).call();    
    //mapping guide - 0:Request ID 1:FromLocation 2:ToLocation 3:riderAccount
    if (request[3] != EMPTY_ADDRESS) {
      const requestEl = createElFromString(
        `
            <div class="card request" style="width: 18rem;">
            <div class="card-body">
            <h6 class="card-title">${request[3]}</h6>
            <h6 class="card-subtitle mb-2 text-muted">${request[1]}</h6>
            <p class="card-text">To: ${request[2]}</p>` +
          checkAccountReq(request) +
          `           
            </div>
            </div>            
            `
      );
      requestsEl.appendChild(requestEl);
    }
  }

  requestsEl.querySelectorAll("button").forEach(button => {
    button.onclick = async e => {
      e.preventDefault();
      const requestId = e.target.form[1].value;
      const amount = e.target.form[0].value;
      submitOffer(requestId, amount);
    };
  });
};


const startRide = async (rideId) => {
  
  const ride = await contract.methods.rides(rideId).call(); 
  
  await contract.methods.startRide(ride[0]).send({
    from: account,
    to: ride[3],
    value: ride[2]
  });
};
function checkAccount(a){
if(a[3]!=account && a[1][3]==account){
    return `<button id="startBtn_${a[0]}" class="mt-2 btn btn-primary">Accept</button>
    <p>This will transfer the funds to the driver</p>
    <input id="rideIdHolder" value="${a[0]}" hidden>
   `
}else{
    return `<h6 class="card-title text-danger">You cannot start this ride</h6>`;
}

}
const viewRides = async () => {
  ridesEl.innerHTML = "";
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const ride = await contract.methods.rides(i).call();    
    //mapping guide - 0:Request ID 1:FromLocation 2:ToLocation 3:riderAccount
    if (ride[3] != EMPTY_ADDRESS) {
      const rideEl = createElFromString(
        `
            <div class="card request" style="width: 18rem;">
            <div class="card-body">
            <h6 class="card-title">Offer from Driver: ${ride[3]}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Offered to: ${ride[1][3]}</h6>
            <p class="card-text">Fare offered: ${ride[2]/1e18} Ether</p>` +
          checkAccount(ride) +
          `           
            </div>
            </div>            
            `
      );
      ridesEl.appendChild(rideEl);
    }
  }

  ridesEl.querySelectorAll("button").forEach(button => {
    button.onclick = async e => {
      e.preventDefault();
      startRide(document.getElementById('rideIdHolder').value);
    };
  });
};


const main = async () => {
  const accounts = await web3.eth.requestAccounts();
  account = accounts[0];
  accountEl.innerText = account;
  await viewRequests();
  await viewRides();
};
main();
