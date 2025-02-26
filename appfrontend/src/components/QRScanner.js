import React, { Component, createRef } from "react";
import { ethers } from "ethers";
import QrScanner from "qr-scanner";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 500,
  margin: 'auto',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  overflow: 'hidden',
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const VideoContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 500,
  margin: '0 auto 20px',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  boxShadow: theme.shadows[2],
}));

class QRCodeScanner extends Component {
  constructor(props) {
    super(props);
    this.videoRef = createRef();
    this.state = {
      qrData: null,
      transactionDetails: null,
      receipt: null,
      productData: null,
      loading: false,
      error: null,
    };
  }

  componentDidMount() {
    this.scanner = new QrScanner(
      this.videoRef.current,
      (result) => {
        const qrData = JSON.parse(result.data);
        this.setState({ qrData, loading: true, error: null });
        this.fetchTransactionDetails(qrData.transactionHash);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );
    this.scanner.start();
  }

  componentWillUnmount() {
    if (this.scanner) {
      this.scanner.stop();
    }
  }

  fetchTransactionDetails = async (txHash) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
      const transaction = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        this.setState({ productData: "NOT EXISTS", loading: false, error: "Product does not exist." });
        return;
      }

      this.setState({ transactionDetails: transaction, receipt });

      if (this.state.qrData) {
        this.fetchProductDetails(this.state.qrData.ProductId - 1);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      this.setState({ loading: false, error: "Error fetching transaction. Please check the transaction hash." });
    }
  };

  fetchProductDetails = async (productId) => {
    try {
      if (productId < 0) {
        throw new Error("Invalid ProductId provided");
      }

      const productDataRaw = await this.props.contractName.getProductDetails(productId);
      
      const productData = {
        productId: productDataRaw.productId.toString(),
        productName: productDataRaw.productName,
        productDesc: productDataRaw.productDesc,
        productPrice: ethers.utils.formatUnits(productDataRaw.productPrice, 0),
        productQuantity: productDataRaw.productQuantity.toString(),
        producerAddress: productDataRaw.producerAddress,
        distributorAddress: productDataRaw.distributorAddress,
        consumerAddress: productDataRaw.consumerAddress,
        origin: productDataRaw.origin,
        productStatus: productDataRaw.productStatus.toString(),
        currentStatusUser: productDataRaw.currentStatusUser,
      };

      this.setState({ productData, loading: false, error: null });
    } catch (error) {
      console.error("Error fetching product details:", error);
      this.setState({ loading: false, error: "Error fetching product details." });
    }
  };

  getStatusLabel = (status) => {
    const statusMapping = {
      0: "Produced",
      1: "Ready for Pickup",
      2: "Picked Up",
      3: "Shipment Released",
      4: "Received Shipment",
      5: "Ready for Sale",
      6: "Paid",
      7: "Sold"
    };
    return statusMapping[parseInt(status)] || "Unknown Status";
  };

  render() {
    const { loading, error, productData } = this.state;

    return (
      <Box sx={{ maxWidth: 600, margin: 'auto', p: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          QR Code Scanner
        </Typography>
        <VideoContainer>
          <video ref={this.videoRef} style={{ width: "100%" }} />
        </VideoContainer>

        {loading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

{productData === "NOT EXISTS" ? (
   <>
   </>
) : productData ? (
  <StyledCard>
    <StyledCardContent>
      <Typography variant="h6" gutterBottom align="center" fontWeight="bold">
        Product Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>ID:</strong> {productData.productId}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Name:</strong> {productData.productName}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            <strong>Description:</strong> {productData.productDesc}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Price:</strong> {ethers.utils.formatEther(productData.productPrice)} ETH
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Quantity:</strong> {productData.productQuantity}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            <strong>Producer:</strong> {productData.producerAddress}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            <strong>Distributor:</strong> {productData.distributorAddress}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            <strong>Consumer:</strong> {productData.consumerAddress}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Origin:</strong> {productData.origin}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Status:</strong> {this.getStatusLabel(productData.productStatus)}
          </Typography>
        </Grid>
      </Grid>
    </StyledCardContent>
  </StyledCard>
) : null}
      </Box>
    );
  }
}

export default QRCodeScanner;
