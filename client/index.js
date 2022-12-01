import Web3 from "web3";
import "bootstrap/dist/css/bootstrap.css";
import configuration from "../build/contracts/Taxi.json";

const CONTRACT_ADDRESS = configuration.networks[5777].address; //"";
const CONTRACT_ABI = configuration.abi;
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const createElFromString = (string) => {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstChild;
};

const web3 = new Web3(Web3.givenProvider || "http://127.0.0.7545");
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

let account;
const accountEl = document.getElementById("account");
const requestsEl = document.getElementById("requests");
const ridesEl = document.getElementById("rides");
const TOTAL_REQUESTS = 6;

const submitOffer = async (requestId, offeredAmount) => {
  await contract.methods.createRide(requestId, offeredAmount).send({
    from: account,
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
    return `<h6 class="card-title text-danger">You cannot make an offer on your own request</h6>`;
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

  requestsEl.querySelectorAll("button").forEach((button) => {
    button.onclick = async (e) => {
      e.preventDefault();
      const requestId = e.target.form[1].value;
      const amount = e.target.form[0].value;
      submitOffer(requestId, amount);      
    };
  });
};

function checkAccount(a) {
  if (a[3] != account && a[1][3] == account) {
    return ` <h6 id="currentRider" class="card-subtitle mb-2 text-danger">Offered to: ${a[1][3]}</h6>
    <h6 class="card-subtitle mb-2 text-muted">From: ${a[1][1]} To:${a[1][2]}</h6> 
    <button id="startBtn_${a[0]}" class="mt-2 btn btn-primary" data-id="${a[0]}">Accept</button>
    <p>This will transfer the funds to the driver</p>    
   `;
  } else {
    return `<h6 id="currentRider" class="card-subtitle mb-2 text-muted">Offered to: ${a[1][3]}</h6>
    <h6 class="card-title text-danger">You cannot start this ride</h6>`;
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
             
            <h5 class="card-text">Fare offered: ${ride[2] / 1e18} Ether</h5>` +
          checkAccount(ride) +
          `           
            </div>
            </div>            
            `
      );
      ridesEl.appendChild(rideEl);      
    }
  }

  ridesEl.querySelectorAll("button").forEach((button) => {
    button.onclick = async (e) => {
      e.preventDefault();     
      const ride = await contract.methods.rides(e.target.dataset.id).call();     
    await contract.methods.startRide(ride[0]).send({
    from: account,
    to: ride[3],
    value: ride[2],
    });     
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

const createRequest = async (cLocation, dLocation) => {
  await contract.methods.requestRide(cLocation, dLocation).send({
    from: account,
  });
};

document.getElementById("requestBtn").onclick = (e) => {
  document.getElementById("backdrop").style.display = "block";
  document.getElementById("exampleModal").style.display = "block";
  document.getElementById("exampleModal").classList.add("show");
};

function closeModal() {
  document.getElementById("backdrop").style.display = "none";
  document.getElementById("exampleModal").style.display = "none";
  document.getElementById("exampleModal").classList.remove("show");
}
document.getElementById("closeBtn").onclick = (e) => {
  const currentLocation = document.getElementById("cLocation").value;
  const destinationLocation = document.getElementById("dLocation").value;
  createRequest(currentLocation, destinationLocation);
  closeModal();
  location.reload();  
};
var modal = document.getElementById("exampleModal");
window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};
