const axios = require("axios");

const FLW_PUBLIC_KEY = 'FLWPUBK_TEST-177407d9229e6ccbd1719a78d207d3a9-X'
const FLW_SECRET_KEY = 'FLWSECK_TEST-bd468ac0847a80fd8c461e88b5cc1b54-X'

const request = require("request");
const express = require('express');
const router = express.Router();
const flutterwave = require('flutterwave-node-v3');
const flw = new flutterwave(
    FLW_PUBLIC_KEY, 
    FLW_SECRET_KEY  );

const BASE_API_URL = "https://api.flutterwave.com/v3/payment-plans"

console.log(FLW_SECRET_KEY);
const Payment = async(req, res) => {

    const { plan, amount, email } = req.body;
    try {
      const response = await axios.post('https://api.flutterwave.com/v3/payments', {
        tx_ref: 'hooli-tx-1920bbtytt',
        amount, // The amount to charge in your currency
        customer: {
          email,
        },
        currency: 'NGN', // Currency code
        payment_type: 'both', // Allow both card and bank transfer payments
        redirect_url: 'http://localhost:3001/api/success', // Replace with your callback URL
      }, {
        headers: {
          Authorization: 'Bearer FLWSECK_TEST-bd468ac0847a80fd8c461e88b5cc1b54-X',
        },
      });
  
      res.json(response.data);
    console.log(response.data);
  
  } catch (err) {
      // console.log(err.code.body);
      console.log(err.response);
}
}

const Success = (req, res) => {
  res.status(200).json({"message": "Payment Successful"})
}


module.exports = {
    Payment,
    Success,
}