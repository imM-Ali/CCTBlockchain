// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Taxi {
    
    constructor()  {
        name = "CCT Taxi App";
            }

 struct Request {
        uint id;      
        string fromLocation;
        string toLocation;
        address rider;       
    }    

    struct Ride {
        uint id;
        Request req;
        uint price;
        address payable driver;       
    }       

    string private name;
    uint private rideCount = 0;
    uint private requestCount = 0;
    mapping(uint => Request) public requests;
    mapping(uint => Ride) public rides;
    event reqCreated (uint id, string fromLocation, string toLocation, address rider);
    event rideCreated (uint id, Request req, uint price, address driver);
    event rideStarted(uint id, uint price);

//Customer will first request a ride by giving current location and destination, which will create a request object public to everyone
    function requestRide(string memory _fromLocation, string memory _toLocation) public {   
    require(bytes(_fromLocation).length > 0);
    require(bytes(_toLocation).length > 0);  
    requestCount ++; 
    //  requests[index] = Request(index, current location, destination, customer crypto account address)
    requests[requestCount] = Request(requestCount, _fromLocation, _toLocation, msg.sender);   
    //event
    emit reqCreated(requestCount, _fromLocation,_toLocation, msg.sender);
}

//Driver will be able to see pending requests and make an offer on anyone of them by ID
function createRide(uint _id , uint _price) public {
    //Wei price converted to Ether    
    _price = _price*1e18;
    //Grab the request object against the given id
    Request memory _request = requests[_id];
    require(_request.rider!=msg.sender , "A Rider cannot offer himself a ride");
    rideCount ++; 
    //rides[index] = Ride(index, request object, offered price, driver cryto address)  
    rides[rideCount] = Ride(rideCount, _request, _price, payable(msg.sender));
    //event
    emit rideCreated(rideCount,_request, _price, msg.sender);
}

//Customer will then be able to see the offered made to his request (as soon as a ride is created with his request in the offerRide function), as he starts ride, ether will be transferred from his wallet to driver
function startRide(uint _id) public payable {       
    
    //grab the ride by the given ID
    Ride memory _ride = rides[_id]; 
    //grab the driver from above ride   
    address _driver = _ride.driver;   
    require(_ride.id > 0 && _ride.id <= rideCount, "No rides");    
    require(msg.value >= _ride.price, "Ether not enough"); 
    require(_ride.driver!=msg.sender, "The Driver cannot start the ride");
    //transfer ether from customer to driver     
    payable(_driver).transfer(msg.value);   
    //event 
    emit rideStarted(rideCount, _ride.price);
}

  

}