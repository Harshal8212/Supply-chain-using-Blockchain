// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.21 <0.9.0;
pragma experimental ABIEncoderV2;

import "./Producer.sol";
import "./Retailer.sol";
import "./Distributor.sol";

/**
 * @title SupplyChainLifecycle
 * @dev Deals with product life cycle statuses for all the parties involved.
 */
contract SupplyChainLifecycle is Producer, Retailer, Distributor {

    enum Status { 
        PRODUCED, 
        READY_FOR_PICKUP, 
        PICKED_UP, 
        SHIPMENT_RELEASED, 
        RECEIVED_SHIPMENT, 
        READY_FOR_SALE, 
        PAID,
        SOLD 
    }

    struct Product {
        Status productStatus;
        address currentStatusUser;
        uint productId;
        string productName;
        string productDesc;
        uint productPrice;
        uint productQuantity;
        string origin;        // New: Product origin (Country, City, etc.)
        uint shelfLife;       // New: Shelf life in days
        address producerAddress;
        address distributorAddress;
        address retailerAddress;
        address consumerAddress;
    }

    Status constant initialStatus = Status.PRODUCED;
    uint private productID;   // Private to prevent external modification

    Product[] public products;

    // Define events
    event Produced(uint productID);
    event ReadyForPickup(uint productID);
    event PickedUp(uint productID);
    event ShipmentReleased(uint productID);
    event ShipmentReceived(uint productID);
    event ReadyForSale(uint productID);
    event Paid(uint productID);
    event Sold(uint productID);

    constructor() {
        productID = 0;
    }

    /*** FUNCTIONS TO MANAGE PRODUCT STATUS ***/

    // Accessible by - Producer
    function produceProduct(
        string memory prodName, 
        string memory prodDesc,
        uint prodPrice, 
        uint prodQty, 
        string memory prodOrigin,  // New: Origin
        uint prodShelfLife,        // New: Shelf Life
        address producerAdd
    ) public {
        require(isProducer(), "Not a producer.");

        products.push(Product({
            productStatus: Status.PRODUCED,
            currentStatusUser: producerAdd,
            productId: productID,
            productName: prodName,
            productDesc: prodDesc,
            productPrice: prodPrice,
            productQuantity: prodQty,
            origin: prodOrigin,         // Store Origin
            shelfLife: prodShelfLife,   // Store Shelf Life
            producerAddress: producerAdd,
            distributorAddress: address(0),
            retailerAddress: address(0),
            consumerAddress: address(0)
        })); 

        emit Produced(productID);
        productID += 1; // Increment for next product
    }

    function getPreviousProductId() public view returns (uint) {
        require(productID > 0, "No products have been added yet.");
        return productID - 1; // Return last assigned product ID
    }

    function markProductReadyForPickup(uint prodId) public {
        require(isProducer(), "Not a producer.");
        products[prodId].productStatus = Status.READY_FOR_PICKUP;
        products[prodId].currentStatusUser = msg.sender;
        emit ReadyForPickup(prodId);
    }

    function pickUpProduct(uint prodId) public {
        require(isDistributor(), "Not a distributor.");
        products[prodId].productStatus = Status.PICKED_UP;
        products[prodId].currentStatusUser = msg.sender;
        products[prodId].distributorAddress = msg.sender;
        emit PickedUp(prodId);
    }

    function buyProduct(uint prodId) public payable {
        require(isRetailer() || isDistributor(), "Neither a retailer nor a distributor.");
        products[prodId].productStatus = Status.PAID;
        products[prodId].currentStatusUser = msg.sender;
        emit Paid(prodId);
    }

    function releaseProductShipment(uint prodId) public {
        require(isDistributor(), "Not a distributor.");
        products[prodId].productStatus = Status.SHIPMENT_RELEASED;
        products[prodId].currentStatusUser = msg.sender;
        emit ShipmentReleased(prodId);
    } 

    function receiveProductShipment(uint prodId) public {
        require(isRetailer(), "Not a retailer.");
        products[prodId].productStatus = Status.RECEIVED_SHIPMENT;
        products[prodId].currentStatusUser = msg.sender;
        products[prodId].retailerAddress = msg.sender;
        emit ShipmentReceived(prodId);
    }

    function markProductReadyForSale(uint prodId) public {
        require(isRetailer(), "Not a retailer.");
        products[prodId].productStatus = Status.READY_FOR_SALE;
        products[prodId].currentStatusUser = msg.sender;
        emit ReadyForSale(prodId);
    }

    function sellProductToConsumer(uint prodId) public payable {
        require(isRetailer(), "Not a retailer.");
        products[prodId].productStatus = Status.SOLD;
        products[prodId].currentStatusUser = msg.sender;
        emit Sold(prodId);
    }

    /*** GETTERS ***/

    function getProductDetails(uint prodId) public view returns (Product memory) {
        return products[prodId];
    } 

    function getAllProductDetails() public view returns (Product[] memory) {
        return products;
    } 
}
