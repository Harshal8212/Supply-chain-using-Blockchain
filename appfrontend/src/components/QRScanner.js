"use client"

import { Component, createRef } from "react"
import { ethers } from "ethers"
import QrScanner from "qr-scanner"
import {
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Container,
  List,
  ListItem,
  ListItemText,
  styled,
} from "@mui/material"
import { QrCodeScannerOutlined, InfoOutlined } from "@mui/icons-material"
import { ThemeProvider, createTheme } from "@mui/material/styles"

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: "#7d5091",
    },
    secondary: {
      main: "#2ecc71",
    },
    error: {
      main: "#e74c3c",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      textAlign: "center",
      marginBottom: "1.5rem",
      color: "#2c3e50",
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 600,
      textAlign: "center",
      margin: "0 0 1.25rem 0",
      color: "#2c3e50",
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.9rem",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: "12px 0 20px",
        },
      },
    },
  },
})

const VideoContainer = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 500,
  margin: "0 auto 24px",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
}))

const DetailItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": {
    borderBottom: "none",
  },
}))

const DetailLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "1rem",
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(0.5),
}))

const DetailValue = styled(Typography)(({ theme }) => ({
  fontSize: "0.95rem",
  color: theme.palette.text.primary,
  wordBreak: "break-word",
}))

const AddressValue = styled(Typography)(({ theme }) => ({
  fontSize: "0.85rem",
  color: theme.palette.text.secondary,
  wordBreak: "break-all",
  fontFamily: "monospace",
  backgroundColor: theme.palette.grey[50],
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}))

const SpinnerContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  margin: theme.spacing(3, 0),
}))

const ScannerTitle = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& svg": {
    marginRight: theme.spacing(1),
    fontSize: "2rem",
  },
}))

const ProductTitle = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& svg": {
    marginRight: theme.spacing(1),
    fontSize: "1.5rem",
    color: theme.palette.primary.main,
  },
}))

class QRCodeScanner extends Component {
  constructor(props) {
    super(props)
    this.videoRef = createRef()
    this.state = {
      qrData: null,
      transactionDetails: null,
      receipt: null,
      productData: null,
      loading: false,
      error: null,
    }
  }

  componentDidMount() {
    this.scanner = new QrScanner(
      this.videoRef.current,
      (result) => {
        const qrData = JSON.parse(result.data)
        this.setState({ qrData, loading: true, error: null })
        this.fetchTransactionDetails(qrData.transactionHash)
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    )
    this.scanner.start()
  }

  componentWillUnmount() {
    if (this.scanner) {
      this.scanner.stop()
    }
  }

  fetchTransactionDetails = async (txHash) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
      const transaction = await provider.getTransaction(txHash)
      const receipt = await provider.getTransactionReceipt(txHash)

      if (!receipt) {
        this.setState({ productData: "NOT EXISTS", loading: false, error: "Product does not exist." })
        return
      }

      this.setState({ transactionDetails: transaction, receipt })

      if (this.state.qrData) {
        this.fetchProductDetails(this.state.qrData.ProductId - 1)
      }
    } catch (error) {
      console.error("Error fetching transaction:", error)
      this.setState({ loading: false, error: "Error fetching transaction. Please check the transaction hash." })
    }
  }

  fetchProductDetails = async (productId) => {
    try {
      if (productId < 0) {
        throw new Error("Invalid ProductId provided")
      }

      const productDataRaw = await this.props.contractName.getProductDetails(productId)

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
      }

      this.setState({ productData, loading: false, error: null })
    } catch (error) {
      console.error("Error fetching product details:", error)
      this.setState({ loading: false, error: "Error fetching product details." })
    }
  }

  getStatusLabel = (status) => {
    const statusMapping = {
      0: "Produced",
      1: "Ready for Pickup",
      2: "Picked Up",
      3: "Shipment Released",
      4: "Received Shipment",
      5: "Ready for Sale",
      6: "Paid",
      7: "Sold",
    }
    return statusMapping[Number.parseInt(status)] || "Unknown Status"
  }

  render() {
    const { loading, error, productData } = this.state

    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <ScannerTitle variant="h1">
            <QrCodeScannerOutlined />
            QR Code Scanner
          </ScannerTitle>

          <VideoContainer elevation={3}>
            <video ref={this.videoRef} style={{ width: "100%", display: "block" }} />
          </VideoContainer>

          {loading && (
            <SpinnerContainer>
              <CircularProgress color="primary" size={48} thickness={4} />
            </SpinnerContainer>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                fontSize: "1rem",
                "& .MuiAlert-icon": { fontSize: "1.5rem" },
              }}
            >
              {error}
            </Alert>
          )}

          {productData === "NOT EXISTS" ? (
            <></>
          ) : productData ? (
            <Card sx={{ maxWidth: 550, mx: "auto", overflow: "hidden" }}>
              <Box sx={{ bgcolor: "primary.main", color: "white", py: 2 }}>
                <ProductTitle variant="h2" sx={{ color: "white" }}>
                  <InfoOutlined />
                  Product Details
                </ProductTitle>
              </Box>

              <CardContent sx={{ p: 0 }}>
                <List disablePadding sx={{ px: 3, py: 2 }}>
                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>ID</DetailLabel>}
                      secondary={<DetailValue>{productData.productId}</DetailValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Name</DetailLabel>}
                      secondary={<DetailValue>{productData.productName}</DetailValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Description</DetailLabel>}
                      secondary={<DetailValue>{productData.productDesc}</DetailValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Price</DetailLabel>}
                      secondary={<DetailValue>{ethers.utils.formatEther(productData.productPrice)} ETH</DetailValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Quantity</DetailLabel>}
                      secondary={<DetailValue>{productData.productQuantity}</DetailValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Origin</DetailLabel>}
                      secondary={<DetailValue>{productData.origin}</DetailValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Status</DetailLabel>}
                      secondary={
                        <DetailValue sx={{ fontWeight: 500 }}>
                          {this.getStatusLabel(productData.productStatus)}
                        </DetailValue>
                      }
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Producer</DetailLabel>}
                      secondary={<AddressValue>{productData.producerAddress}</AddressValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Distributor</DetailLabel>}
                      secondary={<AddressValue>{productData.distributorAddress}</AddressValue>}
                    />
                  </DetailItem>

                  <DetailItem>
                    <ListItemText
                      disableTypography
                      primary={<DetailLabel>Consumer</DetailLabel>}
                      secondary={<AddressValue>{productData.consumerAddress}</AddressValue>}
                    />
                  </DetailItem>
                </List>
              </CardContent>
            </Card>
          ) : null}
        </Container>
      </ThemeProvider>
    )
  }
}

export default QRCodeScanner
