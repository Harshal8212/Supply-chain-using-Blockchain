import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Grid from "@mui/material/Grid";
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import "../css/PopUpModal.css";
import { v4 as uuidv4 } from 'uuid';

import {setDefaults, fromLatLng} from 'react-geocode'
setDefaults({
  key: "YOUR_GOOGLE_MAP_API_KEY", // Your API key here.
  language: "en", // Default language for responses.
  region: "es", // Default region for responses.
});
export default class ProductBatchForm extends React.Component {

     

    state = { 
        prodName: "",
        prodDesc: "",
        prodPrice: "",
        prodQty: "",
        prodOrigin: "",
        prodShelfLife: "",
        qrData: null,
        showQRDialog: false
    };

    addZeroesForDecimals(productPrice) {
        // Convert productPrice to number before multiplication
        return Number(productPrice) * 100;
    }

    async getCoordinates() {

        if (navigator.geolocation) {
          const options = {
              enableHighAccuracy: true,
              timeout: Infinity,
              maximumAge: 0,
          };
          
      

          const watchId = navigator.geolocation.watchPosition(
              (position) => {
                if (!position.coords) {
                  alert("Fetching your location...");
                  return;
                }
                  const { latitude, longitude } = position.coords;
                   fromLatLng(latitude, longitude)
                    .then(({ results }) => {
                        const { lat, lng } = results[0].geometry.location;
                        console.log(lat, lng);
                        console.log(results[0].formatted_address);
                         this.setState({ prodOrigin: results[0].formatted_address});
                    })
                    .catch(console.error);

              },
              (err) => console.log(err.message),
              options
          );
          return () => navigator.geolocation.clearWatch(watchId);
      } else {
          alert('Geolocation is not supported by your browser.');
      }
       
    
}

    async createProductBatch(event) {
        event.preventDefault();
        this.props.showLoaderScreen();
        let formData = this.state;
        let updatedPrice = this.addZeroesForDecimals(formData.prodPrice);
        let uniqueId = uuidv4();
    
        let productPrice = Number(updatedPrice);
        let productQuantity = Number(formData.prodQty);
        let productShelfLife = Number(formData.prodShelfLife);
        if (isNaN(productPrice) || isNaN(productQuantity) || isNaN(productShelfLife)) {
            console.error("Invalid price, quantity, or shelf life");
            this.props.hideLoaderScreen();
            return;
        }
    
        let previousProductId = 0; // Default to 0 in case fetching fails
        try {
            previousProductId = await this.props.contractName.getPreviousProductId();
        } catch (error) {
            console.warn("No previous products found. Starting from Product ID 1.");
        }
    
        this.props.contractName.produceProduct(
            formData.prodName,
            formData.prodDesc,
            productPrice,
            productQuantity,
            formData.prodOrigin,
            productShelfLife,
            this.props.currentAddress
        )
        .then((receipt) => {
            this.props.setTransactionSuccess(true);
            console.log(receipt);
            this.props.hideLoaderScreen();
    
            // Generate QR Data
            const qrData = JSON.stringify({
                id: uniqueId,
                ProductId: Number(previousProductId) + 1, // If first product, it becomes 1
                name: formData.prodName,
                description: formData.prodDesc,
                price: formData.prodPrice,
                quantity: formData.prodQty,
                origin: formData.prodOrigin,
                shelfLife: formData.prodShelfLife,
                transactionHash: receipt.hash,
            });
    
            this.setState({ qrData, showQRDialog: true });
        })
        .catch((error) => {
            this.props.setTransactionSuccess(false);
            console.error(error);
            this.props.hideLoaderScreen();
            this.props.closePopup();
        });
    }
    
    

    handleInput(event) {
        const name = event.target.name;
        const newValue = event.target.value;
        this.setState({ [name]: newValue });
    }

    downloadQRCode = () => {
        const canvas = document.querySelector("canvas");
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "product_qr.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    render() {
        return (
            <>
                <Dialog open={this.props.open} fullWidth onClose={this.props.closePopup} className="popup-modal">
                    <DialogTitle>Enter Batch Details</DialogTitle>
                    <form onSubmit={(event) => this.createProductBatch(event)} className="modern-form"
                    style={{ 
                        padding: '20px', 
                        maxWidth: '600px', 
                        margin: 'auto', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '8px', 
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', 
                        border: '1px solid #ddd' 
                    }}>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <label>Product Name</label>
                                <TextField required fullWidth name="prodName" placeholder="Enter the product name"
                                    onChange={(event) => this.handleInput(event)} variant="filled"
                                    InputProps={{ style: { backgroundColor: '#fff', borderRadius: '5px' } }} />
                            </Grid>
                            <Grid item xs={12}>
                                <label>Product Description</label>
                                <TextField required fullWidth multiline name="prodDesc" placeholder="Provide details about the product"
                                    onChange={(event) => this.handleInput(event)} variant="filled" rows={3}
                                    InputProps={{ style: { backgroundColor: '#fff', borderRadius: '5px' } }} />
                            </Grid>
                            <Grid item xs={6}>
                                <label>Price (₹)</label>
                                <TextField required type="number" name="prodPrice" placeholder="Enter price"
                                    onChange={(event) => this.handleInput(event)} variant="filled"
                                    InputProps={{ style: { backgroundColor: '#fff', borderRadius: '5px' } }} />
                            </Grid>
                            <Grid item xs={6}>
                                <label>Quantity</label>
                                <TextField required type="number" name="prodQty" placeholder="Enter quantity"
                                    onChange={(event) => this.handleInput(event)} variant="filled"
                                    InputProps={{ style: { backgroundColor: '#fff', borderRadius: '5px' } }} />
                            </Grid>
                            <Grid item xs={6}>
                                <label>Origin</label>
                                 <TextField required type="text" name="prodOrigin" placeholder="Origin"
                                        value={this.state.prodOrigin} onChange={(event) => this.handleInput(event)} variant="filled"
                                        InputProps={{
                                            readOnly: true,    // 👈 This makes it non-editable
                                            style: { backgroundColor: '#f5f5f5' } // Optional: Greyed-out look
                                        }} />
                                <Button variant="outlined"  onClick={() => this.getCoordinates()}  style={{ padding: '10px 25px',color: 'white',  backgroundColor: '#7d5091', marginTop:'20px'}}>
                                        Get Current Origin
                                    </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <label>Shelf Life (Months)</label>
                                <TextField required type="number" name="prodShelfLife" placeholder="Enter duration"
                                    onChange={(event) => this.handleInput(event)} variant="filled"
                                    InputProps={{ style: { backgroundColor: '#fff', borderRadius: '5px' } }} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="text" onClick={this.props.closePopup} style={{ padding: '10px 25px', color: '#555' }}>Close</Button>
                        <Button variant="contained" color="secondary" type="submit" style={{ padding: '10px 25px', backgroundColor: '#7d5091' }}>Submit</Button>
                    </DialogActions>
                </form>

                </Dialog>
                
                {/* QR Code Dialog */}
                <Dialog open={this.state.showQRDialog} onClose={() => this.setState({ showQRDialog: false })}>
                    <DialogTitle>Generated QR Code</DialogTitle>
                    <DialogContent>
                        {this.state.qrData && <QRCodeCanvas value={this.state.qrData} size={200} />}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.downloadQRCode} variant="contained" color="primary">Download QR Code</Button>
                        <Button onClick={() => this.setState({ showQRDialog: false })}>Close</Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}
